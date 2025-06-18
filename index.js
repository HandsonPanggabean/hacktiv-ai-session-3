require("dotenv").config();

const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.AI_ASSISTANT_API_KEY);
const model = genAI.getGenerativeModel({
  model: process.env.AI_ASSISTANT_MODEL,
  temperature: 0.5,
});

const upload = multer({ dest: "uploads/" });

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.post("/generate-text", async (req, res) => {
  const { prompt } = req.body;

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required." });
  }

  try {
    const result = await model.generateContent(prompt);

    const response = await result.response.text();
    res.status(200).send({ success: true, text: response });
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).json({ error: "Failed to generate content." });
  }
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
