# CMML Market Scan Vercel Deployment Guide

This guide provides the steps to deploy both the Node.js backend and React frontend to Vercel as a single project.

## Prerequisites

- A Vercel account (https://vercel.com)
- Vercel CLI installed (`npm install -g vercel`)
- Git repository pushed to GitHub

## Files Already Prepared

We've made the following changes to prepare for deployment:

1. **Root-level vercel.json**
   - Combined configuration for both frontend and backend
   - Set up build commands and routes
   - Configured CORS headers

2. **API Service Configuration** (`web-react/src/services/api.ts`)
   - Updated to use environment variables for backend URLs
   - Added support for both development and production environments

3. **Environment Variables Type Definitions** (`web-react/src/vite-env.d.ts`)
   - Added TypeScript definitions for Vite environment variables

## Deployment Process (Single Project Approach)

### Step 1: Deploy to Vercel

1. Go to the Vercel dashboard
2. Create a new project
3. Import from Git repository
4. Configure the project:
   - Use the root directory (/) of your repository
   - Vercel will automatically detect the configuration in vercel.json
   - No need to set custom build commands
5. Set the following environment variables (if needed):
   - Any environment variables required by the Python backend
6. Deploy

## Testing Your Deployment

1. Visit your deployed application
2. Use the backend toggle to switch between Python and Node.js backends
3. Verify functionality:
   - Check workflow nodes display correctly
   - Test file uploads if applicable
   - Verify that the correct backend is being used

## How It Works

With the single-project approach:

1. **Frontend**: Your React app is served from the root domain (e.g., `https://your-app.vercel.app/`)
2. **Backend**: The Node.js API functions are available at `/api/*` paths (e.g., `https://your-app.vercel.app/api/workflow/nodes`)
3. **Backend Toggle**: Still works as expected - when toggled to Node.js backend, it uses the `/api` endpoints on the same domain

## Troubleshooting

If you encounter issues:

1. **Build Errors**: Check the build logs in Vercel dashboard
2. **API Errors**: Verify the API routes are correctly mapped in vercel.json
3. **Environment Variables**: Make sure any required environment variables are set

## Logs and Monitoring

- Node.js backend logs will be available in the Vercel dashboard
- Navigate to your project > Deployments > [Latest Deployment] > Functions
- Click on any function to view its logs and execution details
- You'll see the structured logs with timestamps and log levels we implemented

## Advantages of the Single Project Approach

1. **Simplified Deployment**: One project to manage instead of two
2. **No CORS Issues**: Frontend and backend are on the same domain
3. **Simpler URL Structure**: API endpoints are at `/api/*` on the same domain
4. **Cost Effective**: Only one Vercel project needed
5. **Easier Maintenance**: Single deployment process

## Next Steps

After successful deployment:
1. Configure a custom domain if needed
2. Set up automatic deployments from Git
3. Consider enabling Vercel Analytics for monitoring
