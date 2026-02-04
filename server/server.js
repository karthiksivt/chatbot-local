require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Middleware ----------
app.use(cors());
app.use(express.json());

// ---------- Load CV text once ----------
const cvText = fs.readFileSync(path.join(__dirname, "cv.txt"), "utf-8");

// ---------- OpenAI client (key stays in .env) ----------
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ---------- Smart in-memory limits (safe for local demo) ----------
const LIMITS = {
  maxPerDay: 30,     // total OpenAI calls per day
  maxPerMinute: 8,   // OpenAI calls per minute
};

let dailyCount = 0;
let currentDay = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

let minuteCount = 0;
let minuteWindowStart = Date.now();

function resetIfNewDay() {
  const today = new Date().toISOString().slice(0, 10);
  if (today !== currentDay) {
    currentDay = today;
    dailyCount = 0;
  }
}

function resetIfNewMinuteWindow() {
  const now = Date.now();
  if (now - minuteWindowStart >= 60 * 1000) {
    minuteWindowStart = now;
    minuteCount = 0;
  }
}

// ---------- Routes ----------
app.get("/", (req, res) => {
  res.send("Backend is running ✅");
});

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    // Basic validation
    if (!message || message.trim() === "") {
      return res.status(400).json({ reply: "Please ask a question about my CV." });
    }

    // Limits reset + checks
    resetIfNewDay();
    resetIfNewMinuteWindow();

    if (dailyCount >= LIMITS.maxPerDay) {
      return res.status(429).json({
        reply: "Daily usage limit reached for this demo. Please try again tomorrow.",
      });
    }

    if (minuteCount >= LIMITS.maxPerMinute) {
      return res.status(429).json({
        reply: "Too many requests in a short time. Please wait 1 minute and try again.",
      });
    }

    // Increment only when about to call OpenAI (saves money)
    dailyCount++;
    minuteCount++;

    const systemInstruction = `
You are a CV-only assistant for Karthik.
Answer ONLY using the CV text provided.
If the answer is not in the CV text, reply exactly:
"I can answer only using Karthik’s CV. That information is not in the CV."
Keep answers short, clear, and structured with bullet points if helpful.
`.trim();

    const response = await client.responses.create({
      model: "gpt-4.1-mini",
      input: [
        { role: "system", content: systemInstruction },
        { role: "user", content: `CV TEXT:\n${cvText}\n\nQUESTION:\n${message}` },
      ],
      max_output_tokens: 250, // cost control
    });

    // Send response back to frontend
    return res.json({
      reply: response.output_text || "No reply received.",
    });
  } catch (error) {
    console.error("OpenAI error:", error);

    return res.status(500).json({
      reply: "Server error while generating response. Please try again in a minute.",
    });
  }
});

// ---------- Start server ----------
app.listen(PORT, () => {
  console.log(`Server started on http://localhost:${PORT}`);
});
