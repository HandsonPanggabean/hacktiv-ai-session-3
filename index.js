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

    const response = result.response.text();
    res.status(200).send({ success: true, text: response });
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).json({ error: "Failed to generate content." });
  }
});

const imageToGenerativePart = (filePath) => ({
  inlineData: {
    data: fs.readFileSync(filePath).toString("base64"),
    mimeType: "image/png",
  },
});

app.post("/generate-from-image", upload.single("image"), async (req, res) => {
  const prompt = req.body.prompt || "Describe this image";
  const image = imageToGenerativePart(req.file.path);

  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required." });
  }

  if (!image) {
    return res.status(400).json({ error: "Image is required." });
  }

  try {
    const result = await model.generateContent(prompt, image);

    const response = result.response.text();
    res.status(200).send({ success: true, text: response });
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).json({ error: "Failed to generate content." });
  }
});

app.post(
  "/generate-from-document",
  upload.single("document"),
  async (req, res) => {
    const filePath = req.file.path;
    const buffer = fs.readFileSync(filePath);
    const base64Data = buffer.toString("base64");
    const mimeType = req.file.mimetype;

    try {
      const documentPart = {
        inlineData: { data: base64Data, mimeType },
      };
      const result = await model.generateContent([
        "Analyze this document:",
        documentPart,
      ]);

      const response = result.response.text();
      res.status(200).send({ success: true, text: response });
    } catch (error) {
      console.error("Error generating content:", error);
      res.status(500).json({ error: "Failed to generate content." });
    } finally {
      fs.unlinkSync(filePath);
    }
  }
);

app.post("/generate-from-audio", upload.single("audio"), async (req, res) => {
  const filePath = req.file.path;
  const audioBuffer = fs.readFileSync(filePath);
  const base64Data = audioBuffer.toString("base64");
  const mimeType = req.file.mimetype;

  try {
    const audioPart = {
      inlineData: { data: base64Data, mimeType },
    };
    const result = await model.generateContent([
      "Transcribe or analyze the following audio:",
      audioPart,
    ]);

    const response = result.response.text();
    res.status(200).send({ success: true, text: response });
  } catch (error) {
    console.error("Error generating content:", error);
    res.status(500).json({ error: "Failed to generate content." });
  } finally {
    fs.unlinkSync(filePath);
  }
});

const PORT = 3000;

app.listen(PORT, () => {
  console.log(`Server running on port: ${PORT}`);
});
