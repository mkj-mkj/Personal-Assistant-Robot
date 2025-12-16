// --- Search ---
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

        this.addMessage('user', query);
        input.value = '';
        $('chat-placeholder').classList.add('hidden');

        this.addMessage('system', 'AI 正在思考...', true);

        try {
            const response = await this.callBackendAPI(query);
            const loader = document.getElementById('chat-loading');
            if (loader) loader.remove();

            if (response.answer) {
                this.addMessage('ai', response.answer);
            } else {
                throw new Error("Invalid response from server");
            }
        } catch (e) {
            console.error(e);
            const loader = document.getElementById('chat-loading');
            if (loader) loader.remove();
            this.addMessage('system', 'API 呼叫失敗: ' + e.message);
        }
    },

    async callBackendAPI(prompt) {
        // Use the backend API which calls Bedrock
        const url = `${CONFIG.API_BASE_URL}/search`;

        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: prompt })
        });

        if (!res.ok) {
            const errText = await res.text();
            console.error("SearchManager: Backend Error Details", errText);
            throw new Error(`Search API Error: ${res.status} - ${errText}`);
        }

        let data = await res.json();

        // Handle Lambda Proxy Integration response if it wasn't unwrapped by API Gateway
        if (data.body && typeof data.body === 'string') {
            try {
                data = JSON.parse(data.body);
            } catch (e) {
                console.error("Failed to parse inner body", e);
            }
        }

        if (data.error) {
            throw new Error(data.error);
        }

        return data;
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
