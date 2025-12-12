// --- Auth ---
window.AuthManager = {
    init() {
        console.log("AuthManager: init called");
        const guestBtn = $('btn-guest-login');
        if (guestBtn) {
            console.log("AuthManager: Guest button found, attaching listener");
            guestBtn.onclick = () => {
                console.log("AuthManager: Guest button clicked");
                this.setMockUser();
            };
        } else {
            console.error("AuthManager: Guest button NOT found");
        }

        const logoutBtn = $('btn-logout');
        if (logoutBtn) logoutBtn.onclick = () => this.logout();

        const logoutMobileBtn = $('btn-logout-mobile');
        if (logoutMobileBtn) logoutMobileBtn.onclick = () => this.logout();

        const googleBtn = $('btn-google-login');
        if (googleBtn) {
            googleBtn.onclick = () => this.loginWithGoogle();
        }
    },

    async loginWithGoogle() {
        if (!window.firebaseServices || !window.firebaseServices.signInWithPopup || !window.firebaseServices.GoogleAuthProvider) {
            console.error("Firebase Auth not available");
            alert("Google Login is not available (Firebase not loaded).");
            return;
        }

        try {
            const provider = new window.firebaseServices.GoogleAuthProvider();
            const result = await window.firebaseServices.signInWithPopup(window.firebaseServices.auth, provider);
            const user = result.user;
            console.log("Google Login Success:", user);
            // handleUser will be called by onAuthStateChanged listener in firebase-init.js
        } catch (error) {
            console.error("Google Login Error:", error);
            alert("Login failed: " + error.message);
        }
    },

    setMockUser() {
        console.log("AuthManager: Setting mock user");
        this.handleUser({ uid: 'mock-user', email: 'guest@demo.com', isMock: true });
    },

    handleUser(user) {
        console.log("AuthManager: handleUser called", user);
        window.state.user = user;

        const loginView = $('login-view');
        const appView = $('app-view');

        if (user) {
            console.log("AuthManager: User logged in, switching views");

            if (loginView) {
                loginView.classList.add('hidden');
                loginView.style.display = 'none'; // Force hide
            } else console.error("Login View not found");

            if (appView) {
                appView.classList.remove('hidden');
                appView.style.display = 'flex'; // Force show
            } else console.error("App View not found");

            $('user-email').textContent = user.email || 'Guest User';
            if (user.photoURL) {
                $('user-avatar').src = user.photoURL;
                $('user-avatar').classList.remove('hidden');
                $('user-icon').classList.add('hidden');
            }

            if (window.ExpenseManager) window.ExpenseManager.initListener();
            console.log("AuthManager: Navigating to dashboard");
            window.Router.navigate('dashboard');
        } else {
            console.log("AuthManager: User logged out");

            if (loginView) {
                loginView.classList.remove('hidden');
                loginView.style.display = 'flex'; // Restore flex
            }

            if (appView) {
                appView.classList.add('hidden');
                appView.style.display = 'none';
            }
        }
    },

    logout() {
        // If firebase auth is available, sign out
        if (window.firebaseServices && window.firebaseServices.auth && !window.state.user?.isMock) {
            window.firebaseServices.signOut(window.firebaseServices.auth);
        } else {
            // Local logout
            window.state.user = null;
            this.handleUser(null);
        }
    }
};
