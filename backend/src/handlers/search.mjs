import { BedrockRuntimeClient, InvokeModelCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({ region: "us-east-1" }); // Ensure region matches your Bedrock availability

export const handler = async (event) => {
    const headers = {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
    };

    try {
        const body = JSON.parse(event.body);
        const prompt = body.prompt;

        if (!prompt) {
            return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing prompt" }) };
        }

        // Prepare payload for Claude 3 Sonnet (or Haiku)
        const payload = {
            anthropic_version: "bedrock-2023-05-31",
            max_tokens: 1000,
            messages: [
                {
                    role: "user",
                    content: [
                        {
                            type: "text",
                            text: prompt + " (請用繁體中文回答)"
                        }
                    ]
                }
            ]
        };

        const command = new InvokeModelCommand({
            modelId: "anthropic.claude-3-haiku-20240307-v1:0", // Use Haiku for speed/cost, or change to Sonnet
            contentType: "application/json",
            accept: "application/json",
            body: JSON.stringify(payload)
        });

        const response = await client.send(command);
        const responseBody = JSON.parse(new TextDecoder().decode(response.body));
        const answer = responseBody.content[0].text;

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ answer })
        };

    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
