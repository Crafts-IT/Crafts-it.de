const fs = require('fs').promises;
const path = require('path');

const INJECTION_MARKER = '<!-- Page-specific content will be injected here -->';

const paths = {
    root: __dirname,
    dist: path.join(__dirname, 'dist'),
    layout: path.join(__dirname, 'layout.html'),
    assets: path.join(__dirname, 'assets'),
    styles: path.join(__dirname, 'styles'),
    scripts: path.join(__dirname, 'scripts'),
    cname: path.join(__dirname, 'cname'),
};

const pages = [
    'index.html',
    'services.html',
    'about.html',
    'contact.html',
    'imprint.html',
    'datenschutz.html',
    'index-en.html',
    'services-en.html',
    'about-en.html',
    'contact-en.html',
    'imprint-en.html',
    'privacy.html',
];

async function pathExists(targetPath) {
    try {
        await fs.access(targetPath);
        return true;
    } catch {
        return false;
    }
}

async function ensureCleanDist(distPath) {
    await fs.rm(distPath, { recursive: true, force: true });
    await fs.mkdir(distPath, { recursive: true });
}

async function renderPage(layoutHtml, pageName) {
    const sourcePath = path.join(paths.root, pageName);
    const content = await fs.readFile(sourcePath, 'utf8');
    const html = layoutHtml.replace(INJECTION_MARKER, content);
    await fs.writeFile(path.join(paths.dist, pageName), html, 'utf8');
}

async function copyDirIfExists(sourceDir, targetDir) {
    if (!(await pathExists(sourceDir))) {
        return;
    }

    await fs.mkdir(targetDir, { recursive: true });
    const entries = await fs.readdir(sourceDir, { withFileTypes: true });

    await Promise.all(entries.map(async (entry) => {
        const src = path.join(sourceDir, entry.name);
        const dest = path.join(targetDir, entry.name);

        if (entry.isDirectory()) {
            await copyDirIfExists(src, dest);
            return;
        }

        await fs.copyFile(src, dest);
    }));
}

async function copyFileIfExists(sourceFile, targetFile) {
    if (await pathExists(sourceFile)) {
        await fs.copyFile(sourceFile, targetFile);
    }
}

async function build() {
    try {
        await ensureCleanDist(paths.dist);

        const layoutHtml = await fs.readFile(paths.layout, 'utf8');
        if (!layoutHtml.includes(INJECTION_MARKER)) {
            throw new Error(`Missing template marker: ${INJECTION_MARKER}`);
        }

        await Promise.all(pages.map((pageName) => renderPage(layoutHtml, pageName)));

        await Promise.all([
            copyDirIfExists(paths.assets, path.join(paths.dist, 'assets')),
            copyDirIfExists(paths.styles, path.join(paths.dist, 'styles')),
            copyDirIfExists(paths.scripts, path.join(paths.dist, 'scripts')),
            copyFileIfExists(paths.cname, path.join(paths.dist, 'cname')),
        ]);

        console.log('Build completed: dist is ready for GitHub Pages.');
    } catch (error) {
        console.error('Build failed:', error);
        process.exitCode = 1;
    }
}

build();
