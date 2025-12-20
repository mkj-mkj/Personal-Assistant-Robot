// --- Voice ---
window.VoiceManager = {
    mediaRecorder: null,
    mediaStream: null,
    
    async startVoice(cb, btn) {
        btn.classList.add('listening');
        
        try {
            // Get microphone access using MediaRecorder API (modern approach)
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                    sampleRate: 16000
                }
            });
            
            // Collect audio data
            const audioChunks = [];
            
            // Create MediaRecorder
            this.mediaRecorder = new MediaRecorder(this.mediaStream, {
                mimeType: 'audio/webm'
            });
            
            this.mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    audioChunks.push(e.data);
                }
            };
            
            this.mediaRecorder.onstop = async () => {
                console.log(`Audio captured: ${audioChunks.length} chunks`);
                
                // Try AWS Transcribe first, fallback to Web Speech API
                if (window.AWSTranscribeStreaming && audioChunks.length > 0) {
                    try {
                        console.log('Using AWS Transcribe Streaming...');
                        // Convert audio blob to PCM format for AWS
                        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
                        const arrayBuffer = await audioBlob.arrayBuffer();
                        
                        await window.AWSTranscribeStreaming.startStreaming(
                            arrayBuffer,
                            (transcript) => {
                                console.log('AWS Transcribe result:', transcript);
                                cb(transcript);
                                btn.classList.remove('listening');
                            },
                            (error) => {
                                console.error('AWS Transcribe failed, falling back to Web Speech API:', error);
                                this.transcribeWithWebSpeech(cb, btn);
                            }
                        );
                    } catch (error) {
                        console.error('AWS Transcribe error:', error);
                        this.transcribeWithWebSpeech(cb, btn);
                    }
                } else {
                    console.log('AWS Transcribe not available, using Web Speech API');
                    this.transcribeWithWebSpeech(cb, btn);
                }
            };
            
            this.mediaRecorder.start(100); // Collect data every 100ms
            console.log('Recording started with MediaRecorder API...');
            
            // Record for 5 seconds then stop
            setTimeout(() => {
                this.stopVoice();
            }, 5000);
            
        } catch (error) {
            console.error('MediaRecorder error:', error);
            btn.classList.remove('listening');
            
            if (error.name === 'NotAllowedError') {
                alert('麥克風權限被拒絕\n請在瀏覽器設定中允許麥克風存取');
            } else if (error.name === 'NotFoundError') {
                alert('找不到麥克風設備');
            } else {
                alert('無法啟動麥克風: ' + error.message);
            }
        }
    },
    
    stopVoice() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            this.mediaRecorder.stop();
        }
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        console.log('Recording stopped');
    },
    
    transcribeWithWebSpeech(cb, btn) {
        // Fallback to Web Speech API for transcription
        if (!('webkitSpeechRecognition' in window)) {
            alert("不支援語音 API，請使用 Chrome 或 Edge 瀏覽器");
            btn.classList.remove('listening');
            return;
        }
        
        const recognition = new webkitSpeechRecognition();
        recognition.lang = 'zh-TW';
        
        recognition.onresult = (e) => {
            cb(e.results[0][0].transcript);
            btn.classList.remove('listening');
        };
        
        recognition.onerror = (e) => {
            console.error('Speech recognition error:', e.error);
            btn.classList.remove('listening');
            
            // Don't show error for abort (user stopped speaking)
            if (e.error !== 'aborted' && e.error !== 'no-speech') {
                alert(`語音識別錯誤: ${e.error}`);
            }
        };
        
        recognition.onend = () => {
            btn.classList.remove('listening');
        };
        
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