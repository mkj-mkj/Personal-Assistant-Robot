// --- Search ---
const GEMINI_API_KEY = '*******************'; //Replace with your actual Gemini API Key

window.SearchManager = {
    init() {
        $('chat-form').onsubmit = (e) => {
            e.preventDefault();
            this.handleSearch();
        };
        $('btn-chat-voice').onclick = () => VoiceManager.startVoice((txt) => $('chat-input').value = txt, $('btn-chat-voice'));
        $('btn-voice-main').onclick = () => VoiceManager.startVoice((txt) => VoiceManager.processCommand(txt), $('btn-voice-main'));
    },

    async handleSearch() {
        const input = $('chat-input');
        const query = input.value;
        if (!query) return;

        if (GEMINI_API_KEY === 'YOUR_API_KEY_HERE') {
            this.addMessage('system', '請在 scripts/search.js 中設定您的 Gemini API Key');
            return;
        }

        this.addMessage('user', query);
        input.value = '';
        $('chat-placeholder').classList.add('hidden');

        this.addMessage('system', 'AI 正在思考...', true);

        try {
            const response = await this.callGeminiAPI(query, GEMINI_API_KEY);
            const loader = document.getElementById('chat-loading');
            if (loader) loader.remove();

            const text = response.candidates[0].content.parts[0].text;
            this.addMessage('ai', text);
        } catch (e) {
            console.error(e);
            const loader = document.getElementById('chat-loading');
            if (loader) loader.remove();
            this.addMessage('system', 'API 呼叫失敗: ' + e.message);
        }
    },

    async callGeminiAPI(prompt, apiKey) {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
        const payload = {
            contents: [{
                parts: [{ text: prompt }]
            }]
        };

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error?.message || 'Unknown error');
        }

        return await res.json();
    },

    addMessage(type, text, isLoading = false) {
        const container = $('chat-container');
        const div = document.createElement('div');
        div.className = `msg ${type}`;
        if (isLoading) div.id = 'chat-loading';

        if (type === 'ai' && window.marked) {
            div.innerHTML = marked.parse(text);
        } else {
            div.innerText = text;
        }

        container.appendChild(div);
        container.scrollTop = container.scrollHeight;
    },
};
