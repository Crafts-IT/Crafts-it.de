const fs = require('fs').promises;
const path = require('path');

async function build() {
    try {
        const distPath = path.join(__dirname, 'dist');
        const layoutPath = path.join(__dirname, 'layout.html');
        const contentPath = __dirname;
        const assetsPath = path.join(__dirname, 'assets');
        const stylesPath = path.join(__dirname, 'styles');
        const scriptsPath = path.join(__dirname, 'scripts');
        const distAssetsPath = path.join(distPath, 'assets');
        const distStylesPath = path.join(distPath, 'styles');
        const distScriptsPath = path.join(distPath, 'scripts');

        // Create dist subdirectories if they don't exist
        await fs.mkdir(distAssetsPath, { recursive: true });
        await fs.mkdir(distStylesPath, { recursive: true });
        await fs.mkdir(distScriptsPath, { recursive: true });

        // Read layout template
        const layout = await fs.readFile(layoutPath, 'utf-8');

        // Process content pages
        const pages = ['index.html', 'imprint.html', 'datenschutz.html'];
        for (const page of pages) {
            const pageContent = await fs.readFile(path.join(contentPath, page), 'utf-8');
            const finalHtml = layout.replace('<!-- Page-specific content will be injected here -->', pageContent);
            await fs.writeFile(path.join(distPath, page), finalHtml);
        }

        // Copy assets, styles and scripts
        await copyDir(assetsPath, distAssetsPath);
        await copyDir(stylesPath, distStylesPath);
        await copyDir(scriptsPath, distScriptsPath);
        
        // Copy other files
        await fs.copyFile(path.join(__dirname, 'cname'), path.join(distPath, 'cname'));


        console.log('Website built successfully!');
    } catch (error) {
        console.error('Error building website:', error);
    }
}

async function copyDir(src, dest) {
    const entries = await fs.readdir(src, { withFileTypes: true });
    for (const entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);
        if (entry.isDirectory()) {
            await fs.mkdir(destPath, { recursive: true });
            await copyDir(srcPath, destPath);
        } else {
            await fs.copyFile(srcPath, destPath);
        }
    }
}

build();
