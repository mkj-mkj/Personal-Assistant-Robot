// --- Router ---
// --- Router ---
window.Router = {
    init() {
        const navContainer = $('nav-buttons-desktop');
        const items = [
            { id: 'dashboard', icon: 'layout-dashboard', label: '首頁總覽' },
            { id: 'weather', icon: 'sun', label: '天氣預報' },
            { id: 'expense', icon: 'wallet', label: '記帳管理' },
            { id: 'search', icon: 'search', label: 'AI 搜尋' }
        ];

        items.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'nav-btn';
            btn.dataset.view = item.id;
            btn.innerHTML = `<i data-lucide="${item.icon}" width="18"></i> ${item.label}`;
            btn.onclick = () => this.navigate(item.id);
            navContainer.appendChild(btn);
        });

        if (window.lucide) lucide.createIcons();
    },

    navigate(viewId) {
        console.log(`Router: navigating to ${viewId}`);
        state.view = viewId;

        // Toggle sections
        ['dashboard', 'weather', 'expense', 'search'].forEach(id => {
            const el = $(`${id}-section`);
            if (id === viewId) {
                el.classList.remove('hidden');
                el.style.opacity = '1'; // Ensure opacity is 1
                // Force display property to override any potential CSS conflicts
                if (id === 'search') {
                    el.style.display = 'flex';
                } else {
                    el.style.display = 'block';
                }
            } else {
                el.classList.add('hidden');
                el.style.display = 'none';
                el.style.opacity = '0'; // Reset opacity
            }
        });

        // Update Active State
        document.querySelectorAll('.nav-btn').forEach(btn => {
            if (btn.dataset.view === viewId) btn.classList.add('active');
            else btn.classList.remove('active');
        });

        if (viewId === 'weather' && !state.weather && window.WeatherManager) WeatherManager.fetchWeather();
        if (window.lucide) lucide.createIcons();
    }
};
