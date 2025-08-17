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
3. Add the following variables:
   - `GOOGLE_API_KEY`: Your Google API key
   - `GOOGLE_SEARCH_ENGINE_ID`: Your search engine ID
   - `GEMINI_API_KEY`: Your Gemini API key

### 6. Production Deployment

When you're ready for production:

```bash
vercel --prod
```

This creates a production deployment and assigns it to your production domain.

## Connecting the Frontend

### Option 1: Update API Base URL

Modify the frontend to point to your Vercel deployment:

```typescript
// In web-react/src/services/api.ts
constructor(baseUrl = 'https://your-vercel-app.vercel.app/api') {
  this.baseUrl = baseUrl;
}
```

### Option 2: Configure Proxy in Vite

Alternatively, update your vite.config.ts to proxy API requests to Vercel:

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://your-vercel-app.vercel.app',
        changeOrigin: true,
        rewrite: (path) => path,
      },
    },
  },
});
```

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
   - Add your frontend domain to the CORS allowed origins in your Vercel functions

3. **File Upload Errors**:
   - Ensure file size is below limits (default 4MB, can be increased in Pro plan)
   - Configure Vercel Blob storage for proper file handling

## Going Further

1. **CI/CD Pipeline**: Set up GitHub integration for automatic deployments
2. **Custom Domain**: Configure a custom domain in Vercel settings
3. **Analytics**: Enable Vercel Analytics to monitor performance and usage
4. **Edge Functions**: Consider using Vercel Edge Functions for global performance
