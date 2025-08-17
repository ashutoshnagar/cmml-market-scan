# CMML Market Scan Node.js Backend for Vercel

This is a parallel Node.js implementation of the CMML Market Scan backend API, designed for deployment to Vercel. It implements the exact same API contract as the Python backend, allowing for a seamless migration path.

## Project Structure

```
nodejs-backend/
├── api/                      # Vercel API functions
│   ├── analyze.ts            # POST /api/analyze - Start company analysis
│   ├── result/
│   │   └── [id].ts           # GET /api/result/{id} - Get analysis results
│   └── workflow/
│       ├── nodes.ts          # GET /api/workflow/nodes - Get all workflow nodes
│       └── nodes/
│           └── [id].ts       # PUT /api/workflow/nodes/{id} - Update node
├── lib/                      # Shared utilities and types
│   ├── types.ts              # TypeScript interfaces matching Python API
│   └── sessionManager.ts     # Session management for analysis
├── package.json              # Node.js dependencies
├── tsconfig.json             # TypeScript configuration
└── vercel.json               # Vercel deployment configuration
```

## API Endpoints

This backend implements the same API endpoints as the Python backend:

- `POST /api/analyze` - Start a new company analysis with file upload
- `GET /api/result/{id}` - Get the result of an analysis by ID
- `GET /api/workflow/nodes` - Get all workflow nodes and configurations
- `PUT /api/workflow/nodes/{id}` - Update a workflow node configuration

## Implementation Notes

- **Zero Frontend Changes**: This backend is designed to be a drop-in replacement for the Python backend, requiring no changes to the frontend.
- **Identical API Contract**: All endpoints use the exact same request/response formats as the Python backend.
- **Vercel Optimized**: Built specifically for deployment to Vercel's serverless environment.
- **Type Safety**: Full TypeScript implementation with interfaces matching the Python models.
- **Consistent Logging**: Simple, structured logging implementation matching the Python backend's pattern.

## Logging

The backend includes a simple structured logging system similar to the Python implementation:

- API endpoint entry/exit logging
- Workflow node execution tracking
- Third-party API call tracing
- Session management events

To test the logging implementation:

```bash
# Make the test script executable
chmod +x test_logging.sh

# Run the test script (requires the Node.js backend to be running)
./test_logging.sh
```

This will send a series of API requests to test all logging aspects.

## Development

1. Install dependencies:
   ```
   cd nodejs-backend
   npm install
   ```

2. Run development server:
   ```
   npm run dev
   ```

3. Test the API:
   ```
   curl -X GET http://localhost:3000/api/workflow/nodes
   ```

## Deployment to Vercel

1. Install Vercel CLI:
   ```
   npm install -g vercel
   ```

2. Deploy to Vercel:
   ```
   cd nodejs-backend
   vercel
   ```

3. For production deployment:
   ```
   vercel --prod
   ```

## Usage with Existing Frontend

Once deployed to Vercel, you can update the frontend API service to point to the new backend:

```typescript
// In web-react/src/services/api.ts
// Change this line:
constructor(baseUrl = '/api') {
// To:
constructor(baseUrl = 'https://your-vercel-app.vercel.app/api') {
```

## Migration Strategy

This implementation allows for a gradual migration:

1. Deploy this Node.js backend to Vercel
2. Test it independently with the same API requests
3. When ready, update the frontend to point to the Vercel deployment
4. Keep the Python backend running as a backup

This approach ensures zero downtime and risk-free migration.

## Future Enhancements

- Replace mock data with actual business logic implementation
- Add proper LangChain.js workflow implementation
- Implement Vercel Blob storage for file uploads
- Add authentication and rate limiting
- Enhance logging with structured JSON logging
- Add log level configuration
- Implement log persistence with a service like Vercel Logs
