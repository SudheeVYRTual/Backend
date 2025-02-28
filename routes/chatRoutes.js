const express = require("express");
const axios = require("axios");
const Chat = require("../models/Chat");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const router = express.Router();

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

// Chat API
router.post("/message", auth, async (req, res) => {
    console.log("reached")
    console.log(req.body)
  const { message,userId } = req.body;

  try {
    // Get User Preferences
    const user = await User.findById(userId);
    console.log("hi"+user.name)
    if (!user) return res.status(404).json({ message: "User not found" });

    // Get chat history
    let chat = await Chat.findOne({ userId });
    if (!chat) {
      chat = new Chat({ userId, messages: [] });
    }

    // Short Summary of last 5 messages
    const allMessages = chat.messages.map((msg) => msg.content).join(" ");
    const summaryPrompt = `Summarize this if it is not empty. If there is nothing given in summary just send "no summary"": ${allMessages}`;
    console.log("hi")
    const summaryRes = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [{ text: summaryPrompt }],
              role: "user",
            }
          ]
        },
        {
          headers: { "Content-Type": "application/json" }
        }
      );
    console.log(summaryRes.data.candidates[0].content.parts[0].text);
    const summary = summaryRes.data.candidates[0].content.parts[0].text;
    console.log(summary)
    let aiPrompt;

    if (summary === "no summary") {
        aiPrompt = `User Preferences: ${JSON.stringify(user.preferences)}\nUser: ${message} These are the details of the user. Respond to their latest message in a friendly way. You are their AI therapist. Think of yourself as a friend of the user. User name is ${user.name}.`;
    } else {
        aiPrompt = `User Preferences: ${JSON.stringify(user.preferences)}\nPrevious Chat Summary: ${summary}\nUser: ${message} These are the details of the user. Respond to their latest message in a friendly way. You are their AI therapist.Think of yourself as a friend of the user.Dont use user details unnecessarily everytime.Use if necessary. User name is ${user.name} Use it only when user needs more affection or when you are talking affectionately,like when user wants consoling, otherwise strictly dont use it.`;
    }
    
    const aiRes = await axios.post(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          contents: [
            {
              parts: [{ text: aiPrompt }]
            }
          ]
        },
        {
          headers: { "Content-Type": "application/json" }
        }
      );

    const aiMessage = aiRes.data.candidates[0].content.parts[0].text;

    // Save Messages
    chat.messages.push({ role: "user", content: message });
    chat.messages.push({ role: "ai", content: aiMessage });
    await chat.save();

    res.json({ message: aiMessage });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

module.exports = router;
