// --- State ---
window.state = {
    user: null,
    view: 'dashboard',
    expenses: [],
    weather: null
};

// --- Helper ---
window.$ = (id) => document.getElementById(id);
