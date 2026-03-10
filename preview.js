const http = require('http');
const fs = require('fs').promises;
const path = require('path');

const args = process.argv.slice(2);
const portIndex = args.findIndex((arg) => arg === '--port' || arg === '-p');
const port = portIndex >= 0 ? Number(args[portIndex + 1]) : 4173;

if (!Number.isInteger(port) || port < 1 || port > 65535) {
    console.error('Invalid port. Use --port <1-65535>.');
    process.exit(1);
}

const distDir = path.join(__dirname, 'dist');
const mimeTypes = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.txt': 'text/plain; charset=utf-8',
};

function getSafeFilePath(requestUrl) {
    const parsedUrl = new URL(requestUrl, 'http://localhost');
    const decodedPath = decodeURIComponent(parsedUrl.pathname);
    const relativePath = decodedPath === '/' ? '/index.html' : decodedPath;
    const normalizedPath = path.normalize(relativePath).replace(/^([.][.][\\/])+/, '');
    return path.join(distDir, normalizedPath);
}

async function requestHandler(req, res) {
    const filePath = getSafeFilePath(req.url || '/');

    if (!filePath.startsWith(distDir)) {
        res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Forbidden');
        return;
    }

    try {
        const file = await fs.readFile(filePath);
        const extension = path.extname(filePath).toLowerCase();
        const contentType = mimeTypes[extension] || 'application/octet-stream';

        res.writeHead(200, { 'Content-Type': contentType });
        res.end(file);
    } catch (error) {
        if (error.code === 'ENOENT') {
            res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
            res.end('Not found');
            return;
        }

        console.error('Preview server error:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Internal server error');
    }
}

fs.access(distDir)
    .then(() => {
        const server = http.createServer(requestHandler);
        server.listen(port, () => {
            console.log(`Preview server: http://localhost:${port}`);
            console.log('Press Ctrl+C to stop.');
        });
    })
    .catch(() => {
        console.error('Missing dist directory. Run "node build.js" first.');
        process.exit(1);
    });
