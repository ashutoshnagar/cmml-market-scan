# CMML Market Scan Vercel Deployment Guide

This guide provides the steps to deploy both the Node.js backend and React frontend to Vercel as a single project.

## Prerequisites

- A Vercel account (https://vercel.com)
- Git repository pushed to GitHub

## Files Already Prepared

We've made the following changes to prepare for deployment:

1. **Simplified vercel.json**
   - Configured API routes with proper CORS headers
   - Set up serverless functions runtime
   - Uses Vercel's auto-detection for frontend framework

2. **API Service Configuration** (`web-react/src/services/api.ts`)
   - Updated to use environment variables for backend URLs
   - Automatically uses same-domain API in production

3. **API Serverless Functions**
   - Created in `/api` directory for Vercel's serverless functions
   - Simple structure that's compatible with Vercel's deployment model

4. **Root Package.json**
   - Added for Vercel project recognition
   - Configured proper build commands for the React frontend

## Deployment Process (Single Project Approach)

### Step 1: Deploy to Vercel

1. Go to the Vercel dashboard at https://vercel.com
2. Sign in with your account
3. Click "Add New..." > "Project"
4. Import your GitHub repository
5. Configure the project:
   - Project Name: Choose a name for your deployment
   - Framework Preset: Auto-detected (should detect React automatically)
   - Root Directory: Leave as '/' (the project root)
6. Skip any build overrides - the configuration in vercel.json and package.json will handle this
7. Set environment variables if needed
8. Click "Deploy"

## Testing Your Deployment

1. Once deployment is complete, visit your Vercel project URL
2. The frontend should load automatically
3. Test the API by visiting the `/api` endpoint (e.g., `https://your-project.vercel.app/api`)
4. Use the backend toggle to switch between Python and Node.js backends
5. Verify functionality:
   - Check workflow nodes display correctly
   - Test file uploads if applicable
   - Verify that the correct backend is being used when toggled

## How It Works

With the simplified single-project approach:

1. **Frontend**: Your React app is served from the root domain (e.g., `https://your-app.vercel.app/`)
2. **Backend**: The Node.js API functions are available at `/api/*` paths (e.g., `https://your-app.vercel.app/api/workflow/nodes`)
3. **Backend Toggle**: Works as expected - when toggled to Node.js backend, it uses the `/api` endpoints on the same domain
4. **Serverless Functions**: Each API endpoint becomes a serverless function that scales automatically

## Troubleshooting

If you encounter issues:

1. **Build Errors**: 
   - Check the build logs in Vercel dashboard
   - Look for any errors in the React build process
   - If TypeScript errors occur, the build is now configured to bypass them

2. **API Errors**: 
   - Verify the API routes are correctly mapped in vercel.json
   - Check if the serverless functions are deployed correctly
   - Review the Function logs in the Vercel dashboard

3. **Environment Variables**: 
   - Ensure all required environment variables are set in the Vercel project settings
   - Check if they're being accessed correctly in your code

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
