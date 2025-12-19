// AWS Transcribe Streaming Integration
// Configuration
const AWS_CONFIG = {
    region: 'ap-southeast-2',
    identityPoolId: 'ap-southeast-2:e17481f0-db4e-4077-8a86-c508587545e6', // Replace with your Cognito Identity Pool ID
};

// Initialize AWS SDK
AWS.config.region = AWS_CONFIG.region;
AWS.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: AWS_CONFIG.identityPoolId
});

window.AWSTranscribeStreaming = {
    transcribeClient: null,
    
    async initialize() {
        // Refresh credentials
        return new Promise((resolve, reject) => {
            AWS.config.credentials.get((err) => {
                if (err) {
                    console.error('Failed to get credentials:', err);
                    reject(err);
                } else {
                    console.log('AWS credentials loaded');
                    this.transcribeClient = new AWS.TranscribeService();
                    resolve();
                }
            });
        });
    },
    
    async startStreaming(audioStream, callback, errorCallback) {
        try {
            await this.initialize();
            
            // Create WebSocket connection for streaming
            const endpoint = await this.getTranscribeEndpoint();
            const ws = new WebSocket(endpoint);
            
            ws.onopen = () => {
                console.log('Transcribe WebSocket connected');
                
                // Start streaming audio chunks
                for (const chunk of audioStream) {
                    if (ws.readyState === WebSocket.OPEN) {
                        ws.send(chunk);
                    }
                }
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                
                if (data.Transcript && data.Transcript.Results) {
                    const results = data.Transcript.Results;
                    
                    for (const result of results) {
                        if (!result.IsPartial && result.Alternatives) {
                            const transcript = result.Alternatives[0].Transcript;
                            console.log('Transcription:', transcript);
                            callback(transcript);
                        }
                    }
                }
            };
            
            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                errorCallback(error);
            };
            
            ws.onclose = () => {
                console.log('Transcribe WebSocket closed');
            };
            
        } catch (error) {
            console.error('Transcribe streaming error:', error);
            errorCallback(error);
        }
    },
    
    async getTranscribeEndpoint() {
        // Build WebSocket endpoint for Transcribe Streaming
        const region = AWS_CONFIG.region;
        const languageCode = 'zh-TW';
        const sampleRate = 16000;
        const mediaEncoding = 'pcm';
        
        // Note: This is a simplified version
        // Real implementation requires signed WebSocket connection
        const endpoint = `wss://transcribestreaming.${region}.amazonaws.com:8443/stream-transcription-websocket`;
        
        return endpoint;
    }
};
