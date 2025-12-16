// --- Weather ---
window.WeatherManager = {
    init() {
        $('weather-search-form').onsubmit = (e) => {
            e.preventDefault();
            const city = $('weather-search-input').value;
            if (city) this.searchCity(city);
        };
    },

    async fetchWeather(lat = 25.0330, lon = 121.5654, name = "Taipei") {
        console.log(`WeatherManager: Fetching weather for ${name}...`);
        const loader = $('weather-loading');
        const content = $('weather-content');
        const errorDiv = $('weather-error');

        if (loader) loader.classList.remove('hidden');
        if (content) content.innerHTML = '';
        if (errorDiv) errorDiv.classList.add('hidden');

        try {
            // Call Backend API instead of Open-Meteo directly
            const res = await fetch(`${CONFIG.API_BASE_URL}/weather?lat=${lat}&lon=${lon}`);

            if (!res.ok) {
                const errText = await res.text();
                console.error("WeatherManager: Backend Error Details", errText);
                throw new Error(`Weather API Error: ${res.status} - ${errText}`);
            }
            let data = await res.json();
            console.log("WeatherManager: Raw data received", data);

            // Handle Lambda Proxy Integration response if it wasn't unwrapped by API Gateway
            if (data.body && typeof data.body === 'string') {
                console.log("WeatherManager: Parsing inner body...");
                try {
                    data = JSON.parse(data.body);
                } catch (e) {
                    console.error("Failed to parse inner body", e);
                }
            }

            // Validate Data
            if (!data.current || !data.daily) {
                console.error("WeatherManager: Invalid data structure", data);
                throw new Error("Invalid weather data received");
            }

            // Update State
            if (window.state) window.state.weather = data;

            this.render(data, name);
        } catch (e) {
            console.error("WeatherManager Error:", e);
            if (errorDiv) {
                errorDiv.textContent = "無法取得天氣資訊: " + e.message;
                errorDiv.classList.remove('hidden');
            }
        } finally {
            if (loader) loader.classList.add('hidden');
        }
    },

    async searchCity(city) {
        const loader = $('weather-loading');
        const errorDiv = $('weather-error');

        loader.classList.remove('hidden');
        errorDiv.classList.add('hidden');

        try {
            // Geocoding still uses Open-Meteo public API (Client side)
            // Because backend doesn't have a geocoding handler yet
            const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh&format=json`);
            const data = await res.json();

            if (data.results && data.results.length > 0) {
                const { latitude, longitude, name } = data.results[0];
                this.fetchWeather(latitude, longitude, name);
                $('weather-search-input').value = '';
            } else {
                errorDiv.textContent = `找不到 "${city}"，請嘗試英文名稱。`;
                errorDiv.classList.remove('hidden');
                loader.classList.add('hidden');
            }
        } catch (e) {
            errorDiv.textContent = "搜尋服務連線失敗";
            errorDiv.classList.remove('hidden');
            loader.classList.add('hidden');
        }
    },

    render(data, locationName) {
        console.log("WeatherManager: Rendering weather...");
        const current = data.current;
        const daily = data.daily;
        const container = $('weather-content');

        if (!container) {
            console.error("WeatherManager: Container #weather-content not found!");
            return;
        }

        // Force visibility
        container.classList.remove('hidden');
        container.style.display = 'grid';
        container.style.opacity = '1';

        const getIcon = (code) => {
            if (code <= 3) return 'sun';
            if (code <= 67) return 'cloud-rain';
            return 'cloud';
        };

        let forecastHtml = '';
        for (let i = 1; i < 4; i++) {
            forecastHtml += `
                <div class="forecast-item">
                    <span style="font-family: monospace; color: var(--text-muted);">${daily.time[i]}</span>
                    <div style="display:flex; align-items:center; gap: 1rem;">
                        <i data-lucide="${getIcon(daily.weather_code[i])}" width="20"></i>
                        <div style="text-align: right;">
                            <div style="font-weight: bold;">${Math.round(daily.temperature_2m_max[i])}°</div>
                            <div style="font-size: 0.8rem; color: #94a3b8;">${Math.round(daily.temperature_2m_min[i])}°</div>
                        </div>
                    </div>
                </div>
            `;
        }

        container.innerHTML = `
            <div class="card weather-main">
                <div>
                    <h2 style="font-size: 2rem; display: flex; align-items: center; gap: 0.5rem;"><i data-lucide="map-pin"></i> ${locationName}</h2>
                    <div class="temp-display">${Math.round(current.temperature_2m)}°</div>
                    <div style="font-size: 1.2rem; opacity: 0.9;">Open-Meteo 即時氣象</div>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 2rem; background: rgba(0,0,0,0.2); padding: 1rem; border-radius: var(--radius);">
                    <div>
                        <p style="font-size: 0.8rem; opacity: 0.7;">風速</p>
                        <p style="font-weight: bold; font-size: 1.2rem;">${current.wind_speed_10m} km/h</p>
                    </div>
                    <div>
                        <p style="font-size: 0.8rem; opacity: 0.7;">濕度</p>
                        <p style="font-weight: bold; font-size: 1.2rem;">${current.relative_humidity_2m}%</p>
                    </div>
                </div>
            </div>
            <div class="card">
                <h3 style="margin-bottom: 1rem; color: var(--text-muted);">未來預報</h3>
                ${forecastHtml}
            </div>
        `;
        if (window.lucide) lucide.createIcons();
    }
};
