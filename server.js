const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const OPENCODE_API_KEY = process.env.OPENCODE_API_KEY || 'sk-j51u0FF40AqiZdEhF4xHWY7kDTE8tjqcZiolbvQ5vEPAYPLgAAg8JFs010F99M5X';
const OPENCODE_API_URL = 'https://opencode.ai/zen/v1/chat/completions';
const MODEL = process.env.OPENCODE_MODEL || 'deepseek-v4-flash-free';

app.use(cors());
app.use(express.json());

const LEVEL_SYSTEM_PROMPTS = {
  A1: `You are a patient English teacher for A1 (Beginner) level students.
Rules:
- Use ONLY the 500 most common English words
- Speak in simple present tense
- Use very short sentences (3-5 words)
- Repeat key vocabulary often
- Speak slowly and clearly
- One topic per message
- Always include a simple question
- Correct mistakes gently
- Example: "I am a teacher. You are a student. I like apples. Do you like apples?"`,

  A2: `You are an English teacher for A2 (Elementary) level students.
Rules:
- Use common everyday vocabulary
- Use simple present and simple past tense
- Short to medium sentences (5-8 words)
- Introduce new words with explanations
- Ask simple questions
- Talk about daily life, family, hobbies
- Example: "Yesterday I went to the park. I played football. Did you play yesterday?"`,

  B1: `You are an English teacher for B1 (Intermediate) level students.
Rules:
- Use moderate vocabulary with some idioms
- Use various tenses (present, past, future, present perfect)
- Medium length sentences
- Discuss opinions, plans, experiences
- Encourage detailed responses
- Ask "why" and "how" questions
- Example: "I think traveling is a great way to learn. Have you ever traveled to another country? What did you learn?"`,

  B2: `You are an English teacher for B2 (Upper Intermediate) level students.
Rules:
- Use rich vocabulary and common idioms
- Use all tenses naturally
- Complex sentences with connectors
- Discuss abstract topics, news, culture
- Use persuasive and descriptive language
- Ask for opinions and arguments
- Example: "While technology has brought us closer together, some argue it creates new forms of isolation. What's your perspective on this?"`,

  C1: `You are an English teacher for C1 (Advanced) level students.
Rules:
- Use sophisticated vocabulary and complex idioms
- Use all grammatical structures fluently
- Use nuanced expressions and subtext
- Discuss complex topics: philosophy, science, society
- Use rhetorical questions
- Challenge the student's thinking
- Near-native conversational style
- Example: "One might argue that the very nature of consciousness eludes empirical scrutiny. To what extent do you believe subjective experience can be quantified?"`,
};

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'english-tutor.html'));
});

app.post('/api/chat', async (req, res) => {
  try {
    const { messages, level } = req.body;
    const systemPrompt = LEVEL_SYSTEM_PROMPTS[level] || LEVEL_SYSTEM_PROMPTS.A1;
    const lastMsg = messages[messages.length - 1]?.content || '';

    if (!OPENCODE_API_KEY) {
      return res.status(500).json({ error: 'AI service not configured. Set OPENCODE_API_KEY.' });
    }

    const response = await fetch(OPENCODE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENCODE_API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: lastMsg },
        ],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      throw new Error(`AI API error (${response.status}): ${errBody}`);
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || '...';

    res.json({ reply });
  } catch (error) {
    console.error('Chat error:', error);
    const msg = error.message?.includes('AI API error')
      ? 'AI service unavailable. Check your API key and model access.'
      : 'Something went wrong. Please try again.';
    res.status(500).json({ error: msg });
  }
});

app.get('/api/health', (req, res) => {
  if (!OPENCODE_API_KEY) {
    return res.json({ healthy: false, opencode_server: false, error: 'No API key set' });
  }
  res.json({ healthy: true, opencode_server: true });
});

app.listen(PORT, () => {
  console.log(`English Tutor AI running at http://localhost:${PORT}`);
  console.log(`Using model: ${MODEL} (free) via OpenCode Zen`);
});
