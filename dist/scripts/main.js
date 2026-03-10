const COOKIE_ACCEPTED_KEY = 'cookieAccepted';
const LANGUAGE_PAIRS = {
    'index.html': 'index-en.html',
    'services.html': 'services-en.html',
    'about.html': 'about-en.html',
    'contact.html': 'contact-en.html',
    'imprint.html': 'imprint-en.html',
    'datenschutz.html': 'privacy.html',
};

function setCurrentYear() {
    const yearElement = document.getElementById('year');
    if (yearElement) {
        yearElement.textContent = String(new Date().getFullYear());
    }
}

function getCookieConsent() {
    try {
        return localStorage.getItem(COOKIE_ACCEPTED_KEY) === 'true';
    } catch {
        return false;
    }
}

function setCookieConsent() {
    try {
        localStorage.setItem(COOKIE_ACCEPTED_KEY, 'true');
    } catch {
        // Ignore storage errors: banner state will not persist.
    }
}

function initCookieBanner() {
    const banner = document.getElementById('cookie-banner');
    const acceptButton = document.getElementById('cookie-accept');

    if (!banner || !acceptButton) {
        return;
    }

    if (!getCookieConsent()) {
        banner.style.display = 'block';
    }

    acceptButton.addEventListener('click', () => {
        setCookieConsent();
        banner.style.display = 'none';
    });
}

function getCurrentPageName() {
    const path = window.location.pathname;
    const filename = path.substring(path.lastIndexOf('/') + 1);
    return filename || 'index.html';
}

function getCurrentLanguage(pageName) {
    if (Object.values(LANGUAGE_PAIRS).includes(pageName)) {
        return 'en';
    }

    return 'de';
}

function getCounterpartPage(pageName) {
    if (LANGUAGE_PAIRS[pageName]) {
        return LANGUAGE_PAIRS[pageName];
    }

    const reverseEntry = Object.entries(LANGUAGE_PAIRS).find(([, enPage]) => enPage === pageName);
    return reverseEntry ? reverseEntry[0] : 'index.html';
}

function applyLanguageUi(language) {
    const navLinks = document.querySelectorAll('.nav-links a');
    const remoteSupportLink = document.getElementById('remote-support-link');
    const imprintLink = document.getElementById('footer-imprint');
    const privacyLink = document.getElementById('footer-privacy');
    const cookieText = document.querySelector('#cookie-banner .cookie-content p');
    const cookieButton = document.getElementById('cookie-accept');

    if (navLinks.length >= 4) {
        if (language === 'en') {
            navLinks[0].textContent = 'Home';
            navLinks[0].href = 'index-en.html';
            navLinks[1].textContent = 'Services';
            navLinks[1].href = 'services-en.html';
            navLinks[2].textContent = 'About';
            navLinks[2].href = 'about-en.html';
            navLinks[3].textContent = 'Contact';
            navLinks[3].href = 'contact-en.html';
        } else {
            navLinks[0].textContent = 'Startseite';
            navLinks[0].href = 'index.html';
            navLinks[1].textContent = 'Leistungen';
            navLinks[1].href = 'services.html';
            navLinks[2].textContent = 'Über mich';
            navLinks[2].href = 'about.html';
            navLinks[3].textContent = 'Kontakt';
            navLinks[3].href = 'contact.html';
        }
    }

    if (imprintLink && privacyLink) {
        if (language === 'en') {
            imprintLink.textContent = 'Imprint';
            imprintLink.href = 'imprint-en.html';
            privacyLink.textContent = 'Privacy';
            privacyLink.href = 'privacy.html';
        } else {
            imprintLink.textContent = 'Impressum';
            imprintLink.href = 'imprint.html';
            privacyLink.textContent = 'Datenschutz';
            privacyLink.href = 'datenschutz.html';
        }
    }

    if (remoteSupportLink) {
        remoteSupportLink.textContent = language === 'en' ? 'Remote Support' : 'Remote Support';
    }

    if (cookieText && cookieButton) {
        if (language === 'en') {
            cookieText.textContent = 'We use cookies to improve your experience on our website.';
            cookieButton.textContent = 'Accept';
        } else {
            cookieText.textContent = 'Wir verwenden Cookies, um Ihre Erfahrung auf unserer Website zu verbessern.';
            cookieButton.textContent = 'Akzeptieren';
        }
    }

    document.documentElement.lang = language;
}

function initLanguageSwitcher() {
    const button = document.getElementById('lang-toggle');
    if (!button) {
        return;
    }

    const currentPage = getCurrentPageName();
    const currentLanguage = getCurrentLanguage(currentPage);
    const nextLanguage = currentLanguage === 'de' ? 'en' : 'de';

    applyLanguageUi(currentLanguage);

    button.textContent = nextLanguage.toUpperCase();
    button.setAttribute(
        'aria-label',
        currentLanguage === 'de' ? 'Switch to English' : 'Auf Deutsch wechseln',
    );

    button.addEventListener('click', () => {
        window.location.href = getCounterpartPage(currentPage);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    setCurrentYear();
    initLanguageSwitcher();
    initCookieBanner();
});