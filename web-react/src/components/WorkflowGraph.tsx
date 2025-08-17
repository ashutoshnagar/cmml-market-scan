import React, { useRef, useEffect, useState } from 'react';
import { Node, NodeResult } from '../services/workflowService';

interface WorkflowGraphProps {
  nodes: Node[];
  nodeResults: NodeResult[];
  onNodeClick: (node: Node) => void;
}

// LangGraph structure: Node positions in the graph (adjusted for even larger canvas and better spacing)
const NODE_POSITIONS = {
  'init': { x: 650, y: 80 },
  'pdf_processor': { x: 250, y: 200 },
  'company_overview': { x: 450, y: 200 },
  'industry_overview': { x: 650, y: 200 },
  'compliance_checks': { x: 850, y: 200 },
  'news_checks': { x: 1050, y: 200 },
  // Spread out the bottom row to prevent overlapping
  'promoters_directors': { x: 100, y: 320 },
  'credit_rating': { x: 250, y: 320 },
  'financials': { x: 400, y: 320 },
  'writer': { x: 650, y: 450 },
  'end': { x: 650, y: 580 },
};

// Color palette as requested by user
const COLORS = {
  ENABLED_NODE: '#4ade80',   // Light green for enabled nodes
  DISABLED_NODE: '#fecaca',  // Very light red for disabled nodes
  SYSTEM_NODE: '#e5e7eb',    // Light gray for system nodes
  SPECIAL_NODE: '#93c5fd',   // Light blue for special nodes (like Report Writer)
  NODE_BORDER: '#94a3b8',    // Light gray for borders
  CONNECTION: '#9ca3af',     // Soft gray for connections
  ARROW: '#9ca3af',          // Soft gray for arrows
  TEXT: '#1f2937',           // Dark text color for light backgrounds
  TEXT_LIGHT: '#ffffff',     // White text for dark backgrounds
  HOVER_BORDER: '#2563eb',   // Highlight color for hover
};

// Node radius (increased further for better visibility)
const NODE_RADIUS = 45;

// Actual LangGraph workflow connections
const NODE_CONNECTIONS = [
  // Init to parallel nodes
  { from: 'init', to: 'pdf_processor' },
  { from: 'init', to: 'company_overview' },
  { from: 'init', to: 'industry_overview' },
  { from: 'init', to: 'compliance_checks' },
  { from: 'init', to: 'news_checks' },
  
  // PDF-dependent nodes
  { from: 'pdf_processor', to: 'promoters_directors' },
  { from: 'pdf_processor', to: 'credit_rating' },
  { from: 'pdf_processor', to: 'financials' },
  
  // All nodes to report writer
  { from: 'company_overview', to: 'writer' },
  { from: 'industry_overview', to: 'writer' },
  { from: 'promoters_directors', to: 'writer' },
  { from: 'credit_rating', to: 'writer' },
  { from: 'financials', to: 'writer' },
  { from: 'compliance_checks', to: 'writer' },
  { from: 'news_checks', to: 'writer' },
  
  // Writer to end
  { from: 'writer', to: 'end' },
];

const WorkflowGraph: React.FC<WorkflowGraphProps> = ({ nodes, nodeResults, onNodeClick }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  
  // Draw the workflow graph
  useEffect(() => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas with background color matching parent container
    ctx.fillStyle = '#f9fafb';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw connections
    drawConnections(ctx);
    
    // Draw nodes
    drawNodes(ctx, nodes, nodeResults, hoveredNode);
    
  }, [nodes, nodeResults, hoveredNode]);
  
  // Helper function to get node enabled status
  const isNodeEnabled = (nodeId: string): boolean => {
    // System nodes are always enabled
    if (['init', 'writer', 'end'].includes(nodeId)) return true;
    
    // Special case for pdf_processor (always enabled)
    if (nodeId === 'pdf_processor') return true;
    
    // For regular nodes, check the nodes array
    const node = nodes.find(n => n.id === nodeId);
    return node ? node.enabled : true;
  };
  
  const drawConnections = (ctx: CanvasRenderingContext2D) => {
    ctx.lineWidth = 2;
    
    NODE_CONNECTIONS.forEach(conn => {
      const fromPos = NODE_POSITIONS[conn.from as keyof typeof NODE_POSITIONS];
      const toPos = NODE_POSITIONS[conn.to as keyof typeof NODE_POSITIONS];
      
      if (fromPos && toPos) {
        // Get enabled status
        const fromEnabled = isNodeEnabled(conn.from);
        const toEnabled = isNodeEnabled(conn.to);
        
        // Set line style based on enabled status
        ctx.strokeStyle = COLORS.CONNECTION;
        
        ctx.beginPath();
        ctx.moveTo(fromPos.x, fromPos.y);
        ctx.lineTo(toPos.x, toPos.y);
        
        // If either node is disabled, draw a dashed line
        if (!fromEnabled || !toEnabled) {
          ctx.setLineDash([5, 5]);
        } else {
          ctx.setLineDash([]);
        }
        
        ctx.stroke();
        ctx.setLineDash([]);
        
        // Draw arrow
        drawArrow(ctx, fromPos.x, fromPos.y, toPos.x, toPos.y);
      }
    });
  };
  
  const drawArrow = (ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number) => {
    const headLength = 12; // Length of arrow head (slightly larger)
    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);
    
    // Calculate distance between points
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Calculate position of arrow tip (slightly before the end point)
    // Make sure it's positioned correctly considering the larger node radius
    const tipX = x1 + (distance - NODE_RADIUS - 5) * Math.cos(angle);
    const tipY = y1 + (distance - NODE_RADIUS - 5) * Math.sin(angle);
    
    // Draw arrow head
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(
      tipX - headLength * Math.cos(angle - Math.PI / 6),
      tipY - headLength * Math.sin(angle - Math.PI / 6)
    );
    ctx.lineTo(
      tipX - headLength * Math.cos(angle + Math.PI / 6),
      tipY - headLength * Math.sin(angle + Math.PI / 6)
    );
    ctx.closePath();
    ctx.fillStyle = COLORS.ARROW;
    ctx.fill();
  };
  
  const drawNodes = (ctx: CanvasRenderingContext2D, nodes: Node[], results: NodeResult[], hoveredNodeId: string | null) => {
    // Draw the workflow structure nodes
    const drawWorkflowNode = (id: string, name: string, isSpecial = false) => {
      const pos = NODE_POSITIONS[id as keyof typeof NODE_POSITIONS];
      if (!pos) return;
      
      const isHovered = id === hoveredNodeId;
      
      // Draw node circle with shadow for depth
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, NODE_RADIUS, 0, 2 * Math.PI);
      
      // Special nodes (init, writer, end) get a different style
      if (isSpecial) {
        ctx.fillStyle = COLORS.SYSTEM_NODE; // Dark gray for system nodes
      } else {
        ctx.fillStyle = COLORS.DISABLED_NODE; // Default light gray for placeholder
      }
      
      ctx.fill();
      
      // Draw border with hover effect
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      if (isHovered) {
        ctx.strokeStyle = COLORS.HOVER_BORDER;
        ctx.lineWidth = 3;
      } else {
        ctx.strokeStyle = COLORS.NODE_BORDER;
        ctx.lineWidth = 2;
      }
      
      ctx.stroke();
      
      // Draw node label
      ctx.fillStyle = COLORS.TEXT;
      ctx.font = '13px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(name, pos.x, pos.y);
    };
    
    // Draw the pdf_processor node
    const pdfPos = NODE_POSITIONS['pdf_processor'];
    if (pdfPos) {
      // Special handling for PDF processor node
      const isHovered = 'pdf_processor' === hoveredNodeId;
      
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      ctx.beginPath();
      ctx.arc(pdfPos.x, pdfPos.y, NODE_RADIUS, 0, 2 * Math.PI);
      ctx.fillStyle = COLORS.ENABLED_NODE;
      ctx.fill();
      
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      if (isHovered) {
        ctx.strokeStyle = COLORS.HOVER_BORDER;
        ctx.lineWidth = 3;
      } else {
        ctx.strokeStyle = COLORS.NODE_BORDER;
        ctx.lineWidth = 2;
      }
      ctx.setLineDash([]);
      ctx.stroke();
      
      ctx.fillStyle = COLORS.TEXT; // Use dark text for better readability on light green
      ctx.font = '13px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('PDF Processor', pdfPos.x, pdfPos.y);
    }
    
    // Draw system nodes (Init and End)
    drawWorkflowNode('init', 'Init', true);
    drawWorkflowNode('end', 'End', true);
    
    // Draw Report Writer node with special styling
    const writerPos = NODE_POSITIONS['writer'];
    if (writerPos) {
      const isHovered = 'writer' === hoveredNodeId;
      
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      ctx.beginPath();
      ctx.arc(writerPos.x, writerPos.y, NODE_RADIUS, 0, 2 * Math.PI);
      ctx.fillStyle = COLORS.SPECIAL_NODE;  // Special light blue color for Report Writer
      ctx.fill();
      
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      if (isHovered) {
        ctx.strokeStyle = COLORS.HOVER_BORDER;
        ctx.lineWidth = 3;
      } else {
        ctx.strokeStyle = COLORS.NODE_BORDER;
        ctx.lineWidth = 2;
      }
      ctx.setLineDash([]);
      ctx.stroke();
      
      ctx.fillStyle = COLORS.TEXT;
      ctx.font = '13px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Report Writer', writerPos.x, writerPos.y);
    }
    
    // Draw actual processing nodes
    nodes.forEach(node => {
      const pos = NODE_POSITIONS[node.id as keyof typeof NODE_POSITIONS];
      if (!pos) return;
      
      // Skip if this is a system node or pdf_processor (we drew these already)
      if (['init', 'writer', 'end', 'pdf_processor'].includes(node.id)) return;
      
      const isHovered = node.id === hoveredNodeId;
      
      // Draw node circle with shadow for depth
      ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
      ctx.shadowBlur = 5;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;
      
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, NODE_RADIUS, 0, 2 * Math.PI);
      
      // Set node color based on enabled state only
      if (!node.enabled) {
        ctx.fillStyle = COLORS.DISABLED_NODE; // Disabled node - light gray
      } else {
        ctx.fillStyle = COLORS.ENABLED_NODE; // Enabled node - deep blue
      }
      
      ctx.fill();
      
      // Reset shadow for border
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      
      // Draw border
      if (isHovered) {
        ctx.strokeStyle = COLORS.HOVER_BORDER;
        ctx.lineWidth = 3;
      } else {
        ctx.strokeStyle = COLORS.NODE_BORDER;
        ctx.lineWidth = 2;
      }
      
      // Dashed border for disabled nodes
      if (!node.enabled) {
        ctx.setLineDash([5, 5]);
      } else {
        ctx.setLineDash([]);
      }
      
      ctx.stroke();
      ctx.setLineDash([]);
      
      // Draw node label
      ctx.fillStyle = node.enabled ? COLORS.TEXT : COLORS.TEXT; // Use dark text for both (green is light enough)
      ctx.font = '13px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      // Split node name into two lines if needed
      const name = node.name;
      if (name.length > 15) {
        const words = name.split(' ');
        let line1 = '';
        let line2 = '';
        
        let currentLength = 0;
        for (const word of words) {
          if (currentLength + word.length <= 15) {
            line1 += (line1 ? ' ' : '') + word;
            currentLength += word.length + 1;
          } else {
            line2 += (line2 ? ' ' : '') + word;
          }
        }
        
        ctx.fillText(line1, pos.x, pos.y - 6);
        ctx.fillText(line2, pos.x, pos.y + 8);
      } else {
        ctx.fillText(name, pos.x, pos.y);
      }
    });
  };
  
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if any node was clicked
    for (const node of nodes) {
      const pos = NODE_POSITIONS[node.id as keyof typeof NODE_POSITIONS];
      if (!pos) continue;
      
      // Check if click is within node circle (using the larger radius)
      const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
      if (distance <= NODE_RADIUS) {
        onNodeClick(node);
        break;
      }
    }
    
    // Also check system nodes (which aren't in the nodes array)
    for (const sysNodeId of ['init', 'writer', 'end', 'pdf_processor']) {
      const pos = NODE_POSITIONS[sysNodeId as keyof typeof NODE_POSITIONS];
      if (!pos) continue;
      
      const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
      if (distance <= NODE_RADIUS) {
        // For system nodes, we need to create a temporary node object
        if (sysNodeId === 'pdf_processor') {
          onNodeClick({
            id: 'pdf_processor',
            name: 'PDF Processor',
            type: 'system',
            description: 'Processes uploaded PDF documents',
            prompt_template: '',
            enabled: true
          });
        }
        break;
      }
    }
  };
  
  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    let hoveredNodeId: string | null = null;
    
    // Check regular nodes
    for (const node of nodes) {
      const pos = NODE_POSITIONS[node.id as keyof typeof NODE_POSITIONS];
      if (!pos) continue;
      
      const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
      if (distance <= NODE_RADIUS) {
        hoveredNodeId = node.id;
        break;
      }
    }
    
    // Check system nodes
    if (!hoveredNodeId) {
      for (const sysNodeId of ['init', 'writer', 'end', 'pdf_processor']) {
        const pos = NODE_POSITIONS[sysNodeId as keyof typeof NODE_POSITIONS];
        if (!pos) continue;
        
        const distance = Math.sqrt(Math.pow(x - pos.x, 2) + Math.pow(y - pos.y, 2));
        if (distance <= NODE_RADIUS) {
          hoveredNodeId = sysNodeId;
          break;
        }
      }
    }
    
    // Only update state if it's changed
    if (hoveredNodeId !== hoveredNode) {
      setHoveredNode(hoveredNodeId);
      
      // Change cursor to pointer if over a node
      canvas.style.cursor = hoveredNodeId ? 'pointer' : 'default';
    }
  };
  
  const handleCanvasMouseLeave = () => {
    setHoveredNode(null);
    if (canvasRef.current) {
      canvasRef.current.style.cursor = 'default';
    }
  };
  
  return (
    <div className="workflow-graph-container">
      <canvas 
        ref={canvasRef}
        width={1300}
        height={700}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMouseMove}
        onMouseLeave={handleCanvasMouseLeave}
        className="workflow-graph-canvas"
      />
      <div className="graph-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: COLORS.ENABLED_NODE }}></span>
          <span>Enabled Node</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: COLORS.DISABLED_NODE }}></span>
          <span>Disabled Node</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: COLORS.SPECIAL_NODE }}></span>
          <span>Report Writer</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: COLORS.SYSTEM_NODE }}></span>
          <span>System Node</span>
        </div>
      </div>
      <div className="graph-info">
        This graph shows the LangGraph workflow structure with nodes that can be enabled or disabled.
        Disabled nodes will be skipped during workflow execution. Click on any node to edit its settings.
      </div>
    </div>
  );
};

export default WorkflowGraph;
