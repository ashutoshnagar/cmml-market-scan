// Basic Next.js page for the Node.js backend
// This is just to make the Next.js server run properly
// The actual API endpoints are in the /api directory

export default function Home() {
  return (
    <div style={{ 
      padding: '2rem', 
      fontFamily: 'system-ui, sans-serif',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <h1>CMML Market Scan Node.js Backend</h1>
      <p>This is the backend service for the CMML Market Scan application.</p>
      <p>The API endpoints are available at /api/*</p>
      
      <h2>Available Endpoints:</h2>
      <ul>
        <li><strong>POST /api/analyze</strong> - Start a company analysis</li>
        <li><strong>GET /api/result/{id}</strong> - Get analysis results</li>
        <li><strong>GET /api/workflow/nodes</strong> - Get all workflow nodes</li>
        <li><strong>PUT /api/workflow/nodes/{id}</strong> - Update a node configuration</li>
      </ul>
      
      <h2>Testing</h2>
      <p>You can test the API using the <code>test_api.sh</code> script in the root directory.</p>
      
      <div style={{ marginTop: '2rem', padding: '1rem', background: '#f0f0f0', borderRadius: '4px' }}>
        <p>Status: Server is running</p>
      </div>
    </div>
  );
}
