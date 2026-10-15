/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';
import { computeRiskMetrics, computeRebalanceTrades, runMonteCarloProjection, registerPortfolioRoutes } from './src/quant/portfolioEngine.mjs';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Body parsing
app.use(express.json());

// Initialize GoogleGenAI lazy-safely or handle empty keys gracefully
let aiClient: GoogleGenAI | null = null;
const API_KEY = process.env.GEMINI_API_KEY;

function getAiClient(): GoogleGenAI | null {
  if (!API_KEY || API_KEY.trim() === 'MY_GEMINI_API_KEY' || API_KEY.trim() === '') {
    return null;
  }
  if (!aiClient) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
      console.log('GoogleGenAI client initialized successfully.');
    } catch (err) {
      console.error('Failed to initialize GoogleGenAI client:', err);
      return null;
    }
  }
  return aiClient;
}

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    aiEnabled: !!getAiClient(),
    time: new Date().toISOString(),
  });
});

// AI Yearly Progress Recap generator
app.post('/api/ai/recap', async (req, res) => {
  const { year, startValue, endValue, percentChange, riskProfile, holdings, cashBalance, eventsThisYear } = req.body;

  const client = getAiClient();
  if (!client) {
    // Generate deterministic rich rule-based recap
    const performanceWord = percentChange >= 15 ? 'spectacular' : percentChange > 0 ? 'steady' : 'difficult';
    const isLoss = percentChange < 0;
    const portfolioBreakdownStr = Object.entries(holdings || {})
      .map(([t, h]: any) => `${t} (Avg Cost: $${h.averageCost}, Share count: ${h.shares})`)
      .join(', ');

    const fallbackRecap = `### Year Recap: ${year} (${performanceWord.toUpperCase()}!)\n\n` +
      `Your portfolio ended ${year} at **$${parseFloat(endValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}** starting from $${parseFloat(startValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} (a **${percentChange}%** return).\n\n` +
      `**Analysis & Advice:** Under your **${riskProfile}** profile, your reliance on cash ($${parseFloat(cashBalance).toLocaleString()}) and holdings like [ ${portfolioBreakdownStr || 'No active stock shares'} ] played a major role. ` +
      (isLoss
        ? `Recessions and contractions are uncomfortable, but long-term investors realize that paper volatility is not permanent. Avoid emotional panic-selling.`
        : `Compound growth is demonstrating its strength. By staying invested and diversifying, you shield your capital from quick sector corrections.`) +
      `\n\n*Note: FinSim is an educational simulation. Past performance is no guarantee of future returns.*`;

    return res.json({ recap: fallbackRecap, fallback: true });
  }

  try {
    const prompt = `You are FinSim's AI Robo-Advisor inside an educational stock market simulator game.
The player has just progressed through simulated year: ${year}.
Here is their financial performance data:
- Starting wealth this year: $${startValue}
- Closing wealth this year: $${endValue}
- Year net percentage return: ${percentChange}%
- Risk profile selected: ${riskProfile}
- Cash balance retained: $${cashBalance}
- Active stock holdings: ${JSON.stringify(holdings)}
- Events experienced this year: ${JSON.stringify(eventsThisYear || [])}

Tasks:
1. Generate an engaging, high-energy BitLife-style year recap. Summarize their performance in a slightly playful, witty tone.
2. Explain how their holdings performed (e.g. if they holds tech during tech booms or indexes during recession bottoms).
3. Offer 1 clear, accessible educational investing principle (like compound growth, diversification, or risk tolerance) tailored directly to their current behavior.
4. Keep the entire response under 150 words. Do NOT provide real financial advice. Use strict markdown.`;

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
    });

    const recapText = response.text || '';
    res.json({ recap: recapText, fallback: false });
  } catch (err: any) {
    console.error('Gemini Recap generation failed:', err);
    res.status(500).json({ error: 'Recap generation failed', details: err.message });
  }
});

// AI custom Event Generator (creates bespoke BitLife style scenario)
app.post('/api/ai/event', async (req, res) => {
  const { year, playerMoney, riskProfile, currentHoldings } = req.body;

  const client = getAiClient();
  if (!client) {
    // Return deterministic elegant custom event
    return res.json({
      fallback: true,
      event: {
        category: 'opportunity',
        title: 'Emergency Freelancing Gig',
        description: `It is the year ${year}. A college roommate reaches out on LinkedIn. They need urgent assistance configuring an asset database for an upcoming launch. They offer $1,200 up front, but it will consume your free weekend.`,
        cashImpact: 0,
        educationalTip: 'Human capital—your earning potential—is your primary wealth generator in your early career. Side-gig cash streams provide excellent investment dry powder.',
        choiceOptions: [
          {
            id: 'ai_fallback_gig_accept',
            text: 'Accept the weekend grind. Trade leisure time for asset dry powder!',
            descriptionOutcome: 'You spend 16 hours drinking coffee and coding. Your roommate is thrilled and deposits $1,200 cash into your FinSim balance.',
            cashImpact: 1200,
          },
          {
            id: 'ai_fallback_gig_decline',
            text: 'Decline. Safeguard your mental state and rest.',
            descriptionOutcome: 'You watch movies all weekend. Your mental battery is fully recharged, but your cash balance remains unchanged.',
            cashImpact: 0,
          },
        ],
      },
    });
  }

  try {
    const prompt = `You are FinSim's AI Storyteller. It is the year ${year}. Direct the player's life.
Context:
- Player Cash: $${playerMoney}
- Core Investor Risk Profile: ${riskProfile}
- Portfolio holdings: ${JSON.stringify(currentHoldings)}

Task: Create an interactive BitLife-style random situation event.
It must fall into one of these categories: 'life', 'career', 'market', 'company', 'economic', 'opportunity', 'badluck'.
It should have exactly 2 choices for the player to select from. One choice must offer a clear trade-off (e.g. risking cash for portfolio multipliers, or trading emergency cash).

Generate the event in strict JSON format. Do not use markdown backticks around the json, reply ONLY with a parsed JSON string carrying this schema:
{
  "category": "life" | "career" | "market" | "company" | "opportunity" | "badluck",
  "title": "A witty short title (under 5 words)",
  "description": "Engaging description under 40 words",
  "cashImpact": number,
  "educationalTip": "Under 25 words high utility investing advice",
  "choiceOptions": [
    {
      "id": "opt_1",
      "text": "Short option 1 button text",
      "descriptionOutcome": "Outcome descriptive text under 15 words if they make this choice",
      "cashImpact": number
    },
    {
      "id": "opt_2",
      "text": "Short option 2 button text",
      "descriptionOutcome": "Outcome descriptive text under 15 words if they make this choice",
      "cashImpact": number
    }
  ]
}`;

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          required: ['category', 'title', 'description', 'cashImpact', 'educationalTip', 'choiceOptions'],
          properties: {
            category: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            cashImpact: { type: Type.INTEGER },
            educationalTip: { type: Type.STRING },
            choiceOptions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                required: ['id', 'text', 'descriptionOutcome', 'cashImpact'],
                properties: {
                  id: { type: Type.STRING },
                  text: { type: Type.STRING },
                  descriptionOutcome: { type: Type.STRING },
                  cashImpact: { type: Type.INTEGER },
                },
              },
            },
          },
        },
      },
    });

    const bodyText = response.text || '{}';
    const parsedEvent = JSON.parse(bodyText.trim());
    res.json({ event: parsedEvent, fallback: false });
  } catch (err: any) {
    console.error('Gemini Event generation failed:', err);
    // send elegant fallback structured index to client
    res.status(500).json({ error: 'Failed to generate event', details: err.message });
  }
});

// Quantitative Risk Metrics, Rebalancing, and Monte Carlo Endpoints
registerPortfolioRoutes(app);

// Vite & Static file serving coordinate middleware
async function bootstrap() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite routing middleware loaded in development mode.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Static routing active in production mode pointing to /dist.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`FinSim Fullstack Server running on http://0.0.0.0:${PORT}`);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to bootstrap fullstack server:', err);
});
