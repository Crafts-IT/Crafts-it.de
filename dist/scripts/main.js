document.addEventListener('DOMContentLoaded', () => {
    // Set current year in footer
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // Cookie Banner Logic
    const cookieBanner = document.getElementById('cookie-banner');
    const acceptButton = document.getElementById('cookie-accept');

    if (cookieBanner && acceptButton) {
        // Check if cookie has already been accepted
        try {
            if (!localStorage.getItem('cookieAccepted')) {
                cookieBanner.style.display = 'block';
            }
        } catch (e) {
            // localStorage unavailable (e.g. private browsing); show banner by default
            cookieBanner.style.display = 'block';
        }

        acceptButton.addEventListener('click', () => {
            try {
                localStorage.setItem('cookieAccepted', 'true');
            } catch (e) {
                // localStorage unavailable; banner will reappear on next visit
            }
            cookieBanner.style.display = 'none';
        });
    }
});