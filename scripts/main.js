const COOKIE_ACCEPTED_KEY = 'cookieAccepted';

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

document.addEventListener('DOMContentLoaded', () => {
    setCurrentYear();
    initCookieBanner();
});