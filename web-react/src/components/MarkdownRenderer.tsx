import React, { useId } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import DocumentActions from './DocumentActions';

interface MarkdownRendererProps {
  content: string;
  className?: string;
  companyName?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '', companyName = 'Unknown Company' }) => {
  // Generate a unique ID for this instance
  const contentId = useId().replace(/:/g, '');
  const elementId = `markdown-content-${contentId}`;
  
  // Extract title from content (first h1 heading)
  const titleMatch = content.match(/^# (.+)$/m);
  const title = titleMatch ? titleMatch[1] : 'Market Scan Report';
  
  return (
    <div className={`markdown-content ${className}`}>
      <div id={elementId}>
        <ReactMarkdown 
          remarkPlugins={[remarkGfm]}
          components={{
            // Customize heading elements to match your styling
            h1: ({ node, ...props }) => <h1 className="text-2xl font-bold text-piramal-blue my-4" {...props} />,
            h2: ({ node, ...props }) => <h2 className="text-xl font-bold text-piramal-blue my-3" {...props} />,
            h3: ({ node, ...props }) => <h3 className="text-lg font-bold text-piramal-blue my-2" {...props} />,
            
            // Customize table elements for better financial data display
            table: ({ node, ...props }) => <table className="w-full border-collapse my-4" {...props} />,
            thead: ({ node, ...props }) => <thead className="bg-piramal-blue-lighter" {...props} />,
            th: ({ node, ...props }) => <th className="border p-2 text-left font-semibold" {...props} />,
            td: ({ node, ...props }) => <td className="border p-2" {...props} />,
            
            // Other element customizations
            a: ({ node, ...props }) => <a className="text-piramal-blue hover:underline" {...props} />,
            blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-piramal-blue-light pl-4 my-2 text-gray-600" {...props} />,
            // Simplified code component to avoid TypeScript errors
            code: ({ node, ...props }) => <code className="bg-gray-100 p-2 rounded" {...props} />,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
      
      {/* Document Actions */}
      <DocumentActions 
        content={content}
        title={title}
        companyName={companyName}
        elementId={elementId}
      />
    </div>
  );
};

export default MarkdownRenderer;
