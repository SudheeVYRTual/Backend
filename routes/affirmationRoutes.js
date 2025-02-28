const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");

const Affirmations = require("../models/Affirmation");

// Middleware to verify JWT
const auth = (req, res, next) => {
  const token = req.header("Authorization");
  if (!token) return res.status(401).json({ message: "No token, authorization denied" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

// fetch affirmations by mood: neutral, positive, negative
router.get("/:mood", auth, async (req, res) => {
    try{
        const { mood } = req.params;
        const affirmation = await Affirmations.findOne({ mood }).select("affirmations");
        res.status(200).json({ affirmations: affirmation.affirmations });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

// text mood analysis by gemini
router.post("/gemini-mood", auth, async (req, res) => {
    try{
        const { text } = req.body;
        const requestBody = {
            contents: [{ role: "user", parts: [{ text: `Analyze sentiment: ${text}` }] }],
            generationConfig: { temperature: 1, maxOutputTokens: 100 }
        };
        const response = await fetch(`${process.env.GOOGLE_AI_STUDIO_BASE_URL}/gemini-1.5-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
          });
  
          const result = await response.json();
          const sentiment = result.candidates?.[0]?.content?.parts?.[0]?.text?.toLowerCase() || "neutral";
          const mood = sentiment.includes("positive") ? "positive" : sentiment.includes("negative") ? "negative" : "neutral";
          res.status(200).json({ mood });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

// cosine similarity of the text embeddings of spoken and expected affirmations using gemini text-embedding-004 model
router.post("/gemini-text-similarity", auth, async (req, res) => {
    try {
        const { spokenText, expectedText } = req.body;
        const response = await fetch(`${process.env.GOOGLE_AI_STUDIO_BASE_URL}/text-embedding-004:embedContent?key=${process.env.GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "models/text-embedding-004",
                content: { parts: [{ text: spokenText }] }
            })
        });

        const responseExpected = await fetch(`${process.env.GOOGLE_AI_STUDIO_BASE_URL}/text-embedding-004:embedContent?key=${process.env.GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "models/text-embedding-004",
                content: { parts: [{ text: expectedText }] }
            })
        });

        if (!response.ok || !responseExpected.ok) throw new Error(`API request failed with status: ${response.status}`);

        const resultSpoken = await response.json();
        const resultExpected = await responseExpected.json();
        const embeddingSpoken = resultSpoken.embedding.values;
        const embeddingExpected = resultExpected.embedding.values;
        const cosineSimilarity = calculateCosineSimilarity(embeddingSpoken, embeddingExpected);

        res.status(200).json({ cosineSimilarity });
    } catch (error) {
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

module.exports = router;
    
const calculateCosineSimilarity = (vec1, vec2) => {
    const dotProduct = vec1.reduce((sum, val, i) => sum + val * vec2[i], 0);
    const magnitude1 = Math.sqrt(vec1.reduce((sum, val) => sum + val * val, 0));
    const magnitude2 = Math.sqrt(vec2.reduce((sum, val) => sum + val * val, 0));
    return magnitude1 && magnitude2 ? dotProduct / (magnitude1 * magnitude2) : 0;
};
