const express = require('express');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 8080;

// Initialize Google Gen AI client with the system environment variable
// Azure App Service will inject this automatically once configured
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Secure Proxy Route for Gemini Chat Queries
app.post('/api/chat', async (req, res) => {
    try {
        const { prompt, context, imageData, mimeType } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required.' });
        }

        // Construct structural context prompt
        const textPrompt = `Context/Selected Metric: ${context || 'None'}\n\nUser Question: ${prompt}`;

        // Initialize the multimodal contents array
        const contentsArray = [];

        // If an image payload is detected, pack it into Gemini's official inlineData structure
        if (imageData && mimeType) {
            contentsArray.push({
                inlineData: {
                    mimeType: mimeType, // e.g., 'image/png' or 'image/jpeg'
                    data: imageData     // raw base64 data string
                }
            });
        }

        // Always push the text instruction parts last
        contentsArray.push({ text: textPrompt });

        // Call your Node 24 compatible Gemini model
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: contentsArray
        });

        res.json({ text: response.text });
    } catch (error) {
        console.error('Gemini Multimodal Processing Error:', error);
        res.status(500).json({ error: 'Failed to evaluate image/text combination.' });
    }
});

// Fallback to send the dashboard file for any other requests
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} with Node 24 LTS compatibility.`);
});
