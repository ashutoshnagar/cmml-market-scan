# Deploying CMML Market Scan to Vercel

This document provides instructions for deploying the Node.js backend to Vercel and connecting it to your frontend.

## Deployment Steps

### 1. Install Dependencies

First, install the dependencies in the Node.js backend:

```bash
cd nodejs-backend
npm install
```

### 2. Install Vercel CLI

If you haven't already, install the Vercel CLI:

```bash
npm install -g vercel
```

### 3. Login to Vercel

Login to your Vercel account:

```bash
vercel login
```

### 4. Deploy to Vercel

Deploy the project:

```bash
vercel
```

This will prompt you to configure your project. Use the following settings:
- Set up and deploy: Yes
- Which scope: [Select your account or team]
- Link to existing project: No
- Project name: cmml-market-scan (or any name you prefer)
- Directory: ./
- Override settings: No

### 5. Set Environment Variables

Set your environment variables in the Vercel dashboard:
1. Go to your project settings
2. Navigate to the Environment Variables section
3. Add any necessary variables for your implementation

**Note:** The Node.js backend uses console logging for tracking API calls and workflow execution. These logs will be visible in the Vercel dashboard under the "Logs" section of your deployment.

### 6. Production Deployment

When you're ready for production:

```bash
vercel --prod
```

This creates a production deployment and assigns it to your production domain.

## Connecting the Frontend

After deploying the Node.js backend to Vercel, deploy the React frontend as a separate project:

### 1. Deploy the React Frontend

1. Navigate to the `web-react` directory
2. Deploy to Vercel using the same method:
   ```bash
   cd web-react
   vercel
   ```

### 2. Configure Environment Variables

In your React frontend project on Vercel, set the following environment variables:

- `VITE_NODEJS_BACKEND_URL`: URL to your deployed Node.js backend (e.g., 'https://your-backend.vercel.app/api')
- `VITE_PYTHON_BACKEND_URL`: URL to your Python backend (if applicable)

The frontend is already configured to use these environment variables through our updated API service.

## Verifying Deployment

After deployment, verify your API endpoints are working:

1. **Check Workflow Nodes**:
   ```
   curl https://your-vercel-app.vercel.app/api/workflow/nodes
   ```

2. **Test Analysis Result** (replace [id] with a valid analysis ID):
   ```
   curl https://your-vercel-app.vercel.app/api/result/[id]
   ```

## Troubleshooting

1. **Function Timeout**:
   - If you encounter timeouts, consider upgrading to Vercel Pro for longer function execution time

2. **CORS Issues**:
   - The `vercel.json` file already includes CORS headers allowing requests from any origin
   - If you need to restrict access to specific domains, update the `Access-Control-Allow-Origin` header

3. **File Upload Errors**:
   - Ensure file size is below limits (default 4MB, can be increased in Pro plan)
   - Configure Vercel Blob storage for proper file handling

4. **Environment Variable Issues**:
   - If the frontend isn't connecting to the backend, verify that environment variables are set correctly
   - Check browser console for connection errors

## Going Further

1. **CI/CD Pipeline**: Set up GitHub integration for automatic deployments
2. **Custom Domain**: Configure a custom domain in Vercel settings
3. **Analytics**: Enable Vercel Analytics to monitor performance and usage
4. **Edge Functions**: Consider using Vercel Edge Functions for global performance
