// --- Voice ---
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
        $('voice-status-text').textContent = `指令: "${cmd}"`;
        setTimeout(() => $('voice-status-text').textContent = "點擊麥克風，開始語音指令", 2000);
        if (cmd.includes('天氣')) Router.navigate('weather');
        else if (cmd.includes('記帳') || cmd.includes('錢')) Router.navigate('expense');
        else if (cmd.includes('搜尋')) Router.navigate('search');
    }
};
