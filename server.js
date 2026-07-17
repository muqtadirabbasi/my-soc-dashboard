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
        const { prompt, context } = req.body;

        if (!prompt) {
            return res.status(400).json({ error: 'Prompt is required.' });
        }

        // Combine prompt with metadata context if available
        const structuredContents = context 
            ? `Context: ${context}\n\nUser Query: ${prompt}` 
            : prompt;

        // Call the official Gemini 2.5 flash or pro model
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: structuredContents,
        });

        res.json({ text: response.text });
    } catch (error) {
        console.error('Gemini API Error:', error);
        res.status(500).json({ error: 'Failed to generate response from Gemini LLM.' });
    }
});

// Fallback to send the dashboard file for any other requests
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT} with Node 24 LTS compatibility.`);
});