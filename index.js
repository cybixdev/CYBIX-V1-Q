// J.AFRIX AI - DeepSeek-powered API by Jaden Afrix

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(cors());

const PORT = process.env.PORT || 10000;
const DEEPSEEK_KEY = process.env.DEEPSEEK_API_KEY;
const API_NAME = "J.AFRIX AI";
const API_VERSION = "1.0.0";
const API_AUTHOR = "Jaden Afrix";

const GENERATE_URL = "https://api.deepseek.com/v1/chat/completions";
const SENTIMENT_URL = "https://api.deepseek.com/v1/sentiment-analysis";

// DeepSeek AI Generation
async function dsGenerate(prompt) {
  const response = await axios.post(
    GENERATE_URL,
    {
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 100,
      temperature: 0.7
    },
    { headers: { Authorization: `Bearer ${DEEPSEEK_KEY}` } }
  );
  if (
    !response.data ||
    !response.data.choices ||
    !Array.isArray(response.data.choices) ||
    !response.data.choices[0] ||
    !response.data.choices[0].message ||
    typeof response.data.choices[0].message.content !== 'string'
  ) {
    throw new Error('AI generation failed: Unexpected DeepSeek response format');
  }
  return response.data.choices[0].message.content.trim();
}

// DeepSeek Sentiment
async function dsSentiment(text) {
  const response = await axios.post(
    SENTIMENT_URL,
    { text },
    { headers: { Authorization: `Bearer ${DEEPSEEK_KEY}` } }
  );
  if (!response.data || typeof response.data !== 'object' || !('label' in response.data) || !('score' in response.data)) {
    throw new Error('Sentiment analysis failed: Unexpected DeepSeek response format');
  }
  return response.data;
}

// POST /api/ai-test
app.post('/api/ai-test', async (req, res) => {
  try {
    const { prompt } = req.body;
    const id = uuidv4();
    const timestamp = new Date().toISOString();

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({
        id,
        status: 'error',
        prompt,
        ai_answer: '',
        ai_sentiment: {},
        confidence: 0,
        author: API_AUTHOR,
        api: API_NAME,
        version: API_VERSION,
        timestamp,
        error: 'Missing or invalid prompt.'
      });
    }

    if (!DEEPSEEK_KEY) {
      return res.status(500).json({
        id,
        status: 'error',
        prompt,
        ai_answer: '',
        ai_sentiment: {},
        confidence: 0,
        author: API_AUTHOR,
        api: API_NAME,
        version: API_VERSION,
        timestamp,
        error: 'DEEPSEEK_API_KEY not set.'
      });
    }

    const ai_answer = await dsGenerate(prompt);
    const sentiment = await dsSentiment(ai_answer.slice(0, 500));
    const confidence = typeof sentiment.score === 'number'
      ? Math.round(sentiment.score * 1000) / 1000
      : 0.9;

    return res.json({
      id,
      status: 'success',
      prompt,
      ai_answer,
      ai_sentiment: sentiment,
      confidence,
      author: API_AUTHOR,
      api: API_NAME,
      version: API_VERSION,
      timestamp
    });
  } catch (error) {
    const id = uuidv4();
    const timestamp = new Date().toISOString();
    return res.status(500).json({
      id,
      status: 'error',
      prompt: req.body?.prompt ?? '',
      ai_answer: '',
      ai_sentiment: {},
      confidence: 0,
      author: API_AUTHOR,
      api: API_NAME,
      version: API_VERSION,
      timestamp,
      error: error?.message || 'AI service failed.'
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    api: API_NAME,
    version: API_VERSION,
    author: API_AUTHOR
  });
});

if (require.main === module) {
  app.listen(PORT, () => console.log(`${API_NAME} running on port ${PORT}`));
}
module.exports = app;