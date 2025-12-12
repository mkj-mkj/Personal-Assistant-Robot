// --- Bootstrap (Main) ---
// Run immediately when script loads
window.onload = function () {
    console.log("App: window.onload fired");

    try {
        console.log("App: Initializing Router...");
        if (window.Router) window.Router.init();

        console.log("App: Initializing AuthManager...");
        if (window.AuthManager) window.AuthManager.init();

        console.log("App: Initializing WeatherManager...");
        if (window.WeatherManager) window.WeatherManager.init();

        console.log("App: Initializing ExpenseManager...");
        if (window.ExpenseManager) window.ExpenseManager.init();

        console.log("App: Initializing SearchManager...");
        if (window.SearchManager) window.SearchManager.init();

    } catch (e) {
        console.error("App Initialization Error:", e);
    }

    window.app = { router: window.Router, expense: window.ExpenseManager };
    console.log("Core App Initialized Successfully");
};
