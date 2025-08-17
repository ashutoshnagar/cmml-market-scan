/**
 * Local development server for the Node.js backend
 * This script allows running the backend locally for testing
 */

const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');

const dev = process.env.NODE_ENV !== 'production';
const port = parseInt(process.env.PORT || '3001', 10);
const app = next({ dev, dir: __dirname });
const handle = app.getRequestHandler();

console.log(`> Starting local development server...`);
console.log(`> Using environment: ${dev ? 'development' : 'production'}`);

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }).listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
    console.log(`> API endpoints available at http://localhost:${port}/api/*`);
  });
});
