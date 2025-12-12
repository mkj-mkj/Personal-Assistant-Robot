// --- Voice ---
window.VoiceManager = {
    startVoice(cb, btn) {
        if (!('webkitSpeechRecognition' in window)) {
            alert("不支援語音 API，模擬輸入");
            cb("記帳");
            return;
        }
        const recognition = new webkitSpeechRecognition();
        recognition.lang = 'zh-TW';
        btn.classList.add('listening'); // Add visual cue
        recognition.onresult = (e) => cb(e.results[0][0].transcript);
        recognition.onend = () => btn.classList.remove('listening');
        recognition.start();
    },

    processCommand(cmd) {
        const statusEl = $('voice-status-text');
        statusEl.textContent = `收到指令: "${cmd}"`;
        statusEl.style.color = '#a7f3d0'; // Greenish for success

        setTimeout(() => {
            statusEl.textContent = "點擊麥克風，開始語音指令";
            statusEl.style.color = '#c7d2fe'; // Reset color
        }, 5000);

        if (cmd.includes('天氣')) {
            Router.navigate('weather');
            // Extract city: Remove "天氣" and trim
            const city = cmd.replace('天氣', '').trim();
            if (city && city.length > 0) {
                // Wait for view to switch then search
                setTimeout(() => {
                    if (window.WeatherManager) window.WeatherManager.searchCity(city);
                }, 500);
            }
        }
        else if (cmd.includes('記帳') || cmd.includes('錢') || cmd.includes('花費')) {
            Router.navigate('expense');

            // 1. Extract Amount (find numbers)
            const amountMatch = cmd.match(/\d+/);
            const amount = amountMatch ? parseInt(amountMatch[0]) : null;

            // 2. Extract Category
            let category = '其他';
            if (cmd.includes('吃') || cmd.includes('餐') || cmd.includes('喝') || cmd.includes('飲料')) category = '餐飲';
            else if (cmd.includes('車') || cmd.includes('油') || cmd.includes('交通') || cmd.includes('捷運')) category = '交通';
            else if (cmd.includes('買') || cmd.includes('購') || cmd.includes('衣') || cmd.includes('鞋')) category = '購物';
            else if (cmd.includes('玩') || cmd.includes('樂') || cmd.includes('電影')) category = '娛樂';

            // 3. Extract Description (remove keywords)
            let desc = cmd.replace('記帳', '').replace('錢', '').replace('花費', '').replace(/\d+/g, '').trim();
            if (!desc) desc = category;

            if (amount) {
                // Wait for view to switch then fill and submit
                setTimeout(() => {
                    const amtInput = $('expense-amount');
                    const catInput = $('expense-category');
                    const descInput = $('expense-desc');

                    if (amtInput && catInput && descInput && window.ExpenseManager) {
                        amtInput.value = amount;
                        catInput.value = category;
                        descInput.value = desc;
                        window.ExpenseManager.addExpense();

                        // Feedback
                        const statusEl = $('voice-status-text');
                        if (statusEl) statusEl.textContent = `已記帳: ${category} $${amount}`;
                    }
                }, 500);
            }
        }
        else if (cmd.includes('搜尋')) Router.navigate('search');
    }
};