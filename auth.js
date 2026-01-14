/**
 * TRADEPILOT AUTHENTICATION & SESSION MANAGER
 * Handles session validation, protection, and user persistence.
 */
const Auth = {
    check() {
        if (window.location.pathname.includes('login.html')) return;

        try {
            const session = JSON.parse(localStorage.getItem('tp_session'));
            // Check if session exists and is less than 24 hours old
            if (!session || !session.token || (Date.now() - session.loginTime > 86400000)) {
                this.logout();
            } else {
                console.log("Session Validated:", session.id);
            }
        } catch (e) {
            this.logout();
        }
    },

    logout() {
        localStorage.removeItem('tp_session');
        window.location.href = 'login.html';
    },

    getUser() {
        return JSON.parse(localStorage.getItem('tp_session'));
    }
};

// Auto-run check on load
Auth.check();
