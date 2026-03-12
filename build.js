const fs = require('fs').promises;
const path = require('path');

const INJECTION_MARKER = '<!-- Page-specific content will be injected here -->';
const BASE_URL = 'https://www.crafts-it.de';

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

const pageMeta = {
    'index.html': {
        title: 'Crafts IT | IT Support in Fuerth, Nuernberg und Erlangen',
        description: 'Vor-Ort-IT-Support fuer Unternehmen: Server, Netzwerke und Telefonsysteme in Windows- und Linux-Umgebungen.',
        lang: 'de',
    },
    'services.html': {
        title: 'Leistungen | Crafts IT',
        description: 'IT Vor-Ort-Service, Server-Management, Netzwerkinfrastruktur und Telefonsysteme fuer Unternehmen in der Region.',
        lang: 'de',
    },
    'about.html': {
        title: 'Ueber mich | Crafts IT',
        description: 'Daniel Crafts: IT-Dienstleistungen seit 2011 fuer Unternehmen mit Fokus auf stabile Infrastruktur und Support.',
        lang: 'de',
    },
    'contact.html': {
        title: 'Kontakt | Crafts IT',
        description: 'Kontaktieren Sie Crafts IT fuer IT Support in Fuerth, Nuernberg und Erlangen.',
        lang: 'de',
    },
    'imprint.html': {
        title: 'Impressum | Crafts IT',
        description: 'Impressum und Anbieterangaben von Crafts IT.',
        lang: 'de',
    },
    'datenschutz.html': {
        title: 'Datenschutz | Crafts IT',
        description: 'Datenschutzerklaerung von Crafts IT gemaess DSGVO.',
        lang: 'de',
    },
    'index-en.html': {
        title: 'Crafts IT | IT Support in Fuerth, Nuremberg and Erlangen',
        description: 'Onsite IT support for businesses: servers, networks and telephony in Windows and Linux environments.',
        lang: 'en',
    },
    'services-en.html': {
        title: 'Services | Crafts IT',
        description: 'Onsite IT service, server management, network infrastructure and telephone systems for businesses.',
        lang: 'en',
    },
    'about-en.html': {
        title: 'About | Crafts IT',
        description: 'Daniel Crafts: IT services since 2011 focused on stable infrastructure and reliable onsite support.',
        lang: 'en',
    },
    'contact-en.html': {
        title: 'Contact | Crafts IT',
        description: 'Contact Crafts IT for onsite IT support in Fuerth, Nuremberg and Erlangen.',
        lang: 'en',
    },
    'imprint-en.html': {
        title: 'Imprint | Crafts IT',
        description: 'Legal notice and provider information for Crafts IT.',
        lang: 'en',
    },
    'privacy.html': {
        title: 'Privacy Policy | Crafts IT',
        description: 'Privacy information for Crafts IT website visitors.',
        lang: 'en',
    },
};

const languagePairs = {
    'index.html': 'index-en.html',
    'services.html': 'services-en.html',
    'about.html': 'about-en.html',
    'contact.html': 'contact-en.html',
    'imprint.html': 'imprint-en.html',
    'datenschutz.html': 'privacy.html',
};

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
    const meta = pageMeta[pageName];
    if (!meta) {
        throw new Error(`Missing metadata for page: ${pageName}`);
    }

    const canonicalUrl = `${BASE_URL}/${pageName}`;
    const counterpart = languagePairs[pageName] || Object.entries(languagePairs).find(([, en]) => en === pageName)?.[0];
    const counterpartLang = meta.lang === 'de' ? 'en' : 'de';
    const counterpartUrl = counterpart ? `${BASE_URL}/${counterpart}` : canonicalUrl;
    const hreflangs = [
        `<link rel="alternate" hreflang="${meta.lang}" href="${canonicalUrl}">`,
        `<link rel="alternate" hreflang="${counterpartLang}" href="${counterpartUrl}">`,
        `<link rel="alternate" hreflang="x-default" href="${BASE_URL}/index.html">`,
    ].join('\n    ');

    const html = layoutHtml
        .replace('{{HTML_LANG}}', meta.lang)
        .replaceAll('{{PAGE_TITLE}}', meta.title)
        .replaceAll('{{PAGE_DESCRIPTION}}', meta.description)
        .replaceAll('{{CANONICAL_URL}}', canonicalUrl)
        .replace('{{HREFLANG_LINKS}}', hreflangs)
        .replace('{{OG_LOCALE}}', meta.lang === 'de' ? 'de_DE' : 'en_US')
        .replace(INJECTION_MARKER, content);

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
            copyFileIfExists(path.join(paths.root, 'robots.txt'), path.join(paths.dist, 'robots.txt')),
            copyFileIfExists(path.join(paths.root, 'sitemap.xml'), path.join(paths.dist, 'sitemap.xml')),
        ]);

        console.log('Build completed: dist is ready for GitHub Pages.');
    } catch (error) {
        console.error('Build failed:', error);
        process.exitCode = 1;
    }
}

build();
