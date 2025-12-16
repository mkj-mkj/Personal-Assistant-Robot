export const handler = async (event) => {
    // Default to Taipei if no parameters provided
    const lat = event.queryStringParameters?.lat || 25.0330;
    const lon = event.queryStringParameters?.lon || 121.5654;

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error("Weather API Error");
        const data = await response.json();

        return {
            statusCode: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*" // Enable CORS
            },
            body: JSON.stringify(data),
        };
    } catch (error) {
        return {
            statusCode: 500,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            body: JSON.stringify({ error: error.message }),
        };
    }
};
