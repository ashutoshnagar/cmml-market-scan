# CMML Market Scan Vercel Deployment Guide

This guide provides the steps to deploy both the Node.js backend and React frontend to Vercel.

## Prerequisites

- A Vercel account (https://vercel.com)
- Vercel CLI installed (`npm install -g vercel`)
- Git repository pushed to GitHub

## Files Already Prepared

We've made the following changes to prepare for deployment:

1. **API Service Configuration** (`web-react/src/services/api.ts`)
   - Updated to use environment variables for backend URLs
   - Added support for both development and production environments

2. **Environment Variables Type Definitions** (`web-react/src/vite-env.d.ts`)
   - Added TypeScript definitions for Vite environment variables

3. **CORS Configuration** (`nodejs-backend/vercel.json`)
   - Added CORS headers to allow cross-origin requests
   - Set up proper API routes for serverless functions

4. **Deployment Documentation** (`nodejs-backend/DEPLOYMENT.md`)
   - Updated with detailed instructions for both backend and frontend

## Deployment Process

### Step 1: Deploy Node.js Backend

1. Go to the Vercel dashboard
2. Create a new project
3. Import from Git repository
4. Configure the project:
   - Set root directory to `/nodejs-backend`
   - Build command should be detected automatically
   - Set environment variables as needed
5. Deploy

### Step 2: Get Backend URL

After deploying the Node.js backend:
1. Note the deployment URL from Vercel (e.g., `https://your-backend.vercel.app`)
2. You'll use this URL in the next step

### Step 3: Deploy React Frontend

1. Create another new project in Vercel
2. Import from the same Git repository
3. Configure the project:
   - Set root directory to `/web-react`
   - Set the following environment variables:
     - `VITE_NODEJS_BACKEND_URL`: Your Node.js backend URL + '/api'
       (e.g., `https://your-backend.vercel.app/api`)
     - `VITE_PYTHON_BACKEND_URL`: Your Python backend URL if applicable
4. Deploy

## Testing Your Deployment

1. Visit your deployed React frontend
2. Use the backend toggle to switch between Python and Node.js backends
3. Verify functionality:
   - Check workflow nodes display correctly
   - Test file uploads if applicable
   - Verify that the correct backend is being used

## Troubleshooting

See `nodejs-backend/DEPLOYMENT.md` for detailed troubleshooting steps.

## Logs and Monitoring

- Node.js backend logs will be available in the Vercel dashboard
- Navigate to your backend project > Deployments > [Latest Deployment] > Functions
- Click on any function to view its logs and execution details
- You'll see the structured logs with timestamps and log levels we implemented

## Next Steps

After successful deployment:
1. Configure a custom domain if needed
2. Set up automatic deployments from Git
3. Consider enabling Vercel Analytics for monitoring
