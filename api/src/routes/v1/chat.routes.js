import { GoogleGenerativeAI } from '@google/generative-ai';
import { Router } from 'express';

const r = Router();

r.post('/', async (req, res, next) => {
  try {
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'messages array is required' });
    }

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    if (!GEMINI_API_KEY) {
      return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server' });
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

    const modelName = process.env.GEMINI_MODEL;
    if (!modelName) {
      console.error('GEMINI_MODEL is not set. Set GEMINI_MODEL to a supported model name.');
      return res.status(500).json({ error: 'GEMINI_MODEL not configured on server. Run api/scripts/list_models.js to discover available models.' });
    }

    const model = genAI.getGenerativeModel({ model: modelName });

    const response = await model.generateContent({
      contents: messages.map((m) => ({
        role: m.role,
        parts: [{ text: m.text }],
      })),
    });

    const replyText = response.response.text();

    if (replyText) {
      return res.json({ reply: replyText });
    }

    return res.status(500).json({ error: 'Unexpected response from Gemini API' });
  } catch (error) {
    console.error('Chat API Error:', error);
    if (error.status) {
      return res.status(error.status).json({ error: error.message });
    }
    next(error);
  }
});

export default r;
