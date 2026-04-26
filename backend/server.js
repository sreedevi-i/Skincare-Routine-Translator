import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🔥 THIS is your /translate route
app.post("/translate", async (req, res) => {
  try {
    const { routine } = req.body;

    const prompt = `
You are an accessibility assistant.

Convert this skincare routine into very simple step-by-step instructions.

Rules:
- One action per step
- Use simple language
- Remove confusion (e.g., "maybe", "??")
- Mark optional steps clearly

Return STRICT JSON:
{
  "steps": [
    {
      "step": 1,
      "title": "",
      "instruction": "",
      "emoji": ""
    }
  ]
}

Routine:
${routine}
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    });

    const output = JSON.parse(response.choices[0].message.content);

    res.json(output);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error processing routine");
  }
});

app.listen(5000, () => {
  console.log("Server running on http://localhost:5000");
});