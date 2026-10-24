/**
 * MediAssist AI — Secure Backend Server
 * 
 * Provides:
 * 1. Static file serving for the frontend website (runs on single port)
 * 2. POST /api/chat — Educational health assistant proxy using Google Gemini AI
 * 3. GET /api/status — Honest AI configuration & health check endpoint
 * 4. Privacy protection: zero database or disk logging of personal health questions
 * 5. Input validation, request size limits, and emergency red-flag pre-screening
 */

require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const { GoogleGenAI } = require('@google/genai');

const app = express();
const PORT = process.env.PORT || 3000;
const PROJECT_ROOT = path.join(__dirname, '..');

// =============================================================================
// 1. SECURITY & REQUEST CONFIGURATION
// =============================================================================

// Enable CORS for flexibility during development
app.use(cors());

// Strict body parsing limit (50 KB) to prevent oversized payloads / DoS
app.use(express.json({ limit: '50kb' }));
app.use(express.urlencoded({ extended: true, limit: '50kb' }));

// =============================================================================
// 2. AI PROVIDER CONFIGURATION & CREDENTIAL DETECTION
// =============================================================================

const PLACEHOLDER_KEYS = [
  'your_gemini_api_key_here',
  'your_api_key_here',
  'your_key_here',
  'api_key',
  ''
];

function getActiveAiProvider() {
  // 1. Check NVIDIA API Key
  const nvidiaKey = (process.env.NVIDIA_API_KEY || '').trim();
  if (nvidiaKey && !PLACEHOLDER_KEYS.includes(nvidiaKey.toLowerCase())) {
    let model = (process.env.NVIDIA_MODEL || '').trim() || 'meta/llama-3.2-11b-vision-instruct';
    if (model.includes('3.3-70b') || model.includes('3.1-8b') || model.includes('3.1-70b')) {
      model = 'meta/llama-3.2-11b-vision-instruct';
    }
    return {
      type: 'nvidia',
      name: 'NVIDIA NIM',
      apiKey: nvidiaKey,
      model: model
    };
  }

  // 2. Check Google Gemini API Key
  const geminiKey = (process.env.GEMINI_API_KEY || '').trim();
  if (geminiKey && !PLACEHOLDER_KEYS.includes(geminiKey.toLowerCase())) {
    // If user put an NVIDIA key (nvapi-...) in GEMINI_API_KEY, detect and route to NVIDIA
    if (geminiKey.startsWith('nvapi-')) {
      let model = (process.env.NVIDIA_MODEL || '').trim() || 'meta/llama-3.2-11b-vision-instruct';
      if (model.includes('3.3-70b') || model.includes('3.1-8b') || model.includes('3.1-70b')) {
        model = 'meta/llama-3.2-11b-vision-instruct';
      }
      return {
        type: 'nvidia',
        name: 'NVIDIA NIM',
        apiKey: geminiKey,
        model: model
      };
    }
    return {
      type: 'gemini',
      name: 'Google Gemini',
      apiKey: geminiKey,
      model: process.env.GEMINI_MODEL || 'gemini-2.5-flash'
    };
  }

  // 3. Check OpenAI API Key
  const openaiKey = (process.env.OPENAI_API_KEY || '').trim();
  if (openaiKey && !PLACEHOLDER_KEYS.includes(openaiKey.toLowerCase())) {
    return {
      type: 'openai',
      name: 'OpenAI',
      apiKey: openaiKey,
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini'
    };
  }

  return null;
}


function isAiConfigured() {
  return getActiveAiProvider() !== null;
}


// Clinical System Prompt for Health Education & Non-Diagnostic Safety
const HEALTH_SYSTEM_INSTRUCTION = `You are MediAssist AI, a compassionate, professional healthcare education and patient-preparedness assistant.

CRITICAL SAFETY & MEDICAL POLICIES:
1. STRICTLY EDUCATIONAL & NON-DIAGNOSTIC: You do NOT diagnose illnesses, prescribe medications, or recommend specific drug dosages. Never say "You have X" or "Take X mg of Y".
2. PATIENT PREPAREDNESS: Help users understand health terminology, lab test preparations, and lifestyle concepts so they can have better, informed conversations with their licensed physician.
3. EMERGENCY RED FLAGS: If a user mentions potential life-threatening symptoms (such as chest pain radiating to the jaw/arm, severe difficulty breathing, face drooping, sudden severe thunderclap headache, heavy bleeding, or thoughts of self-harm), IMMEDIATELY instruct them to call 911, 112, or their local emergency services right away.
4. STRUCTURE & TONE: Keep explanations clear, empathetic, accessible to non-medical individuals, and formatted with bullet points for readability. Avoid overwhelming medical jargon without defining it.
5. PREPARED QUESTIONS: Conclude with 1 to 2 specific questions the user can ask their doctor during their next appointment.
6. MANDATORY DISCLAIMER: Always remind the user that this educational information does not replace consultation with a qualified doctor.`;

// Emergency red flag terms for rapid server-side pre-screening
const EMERGENCY_KEYWORDS = [
  'chest pain',
  'heart attack',
  'stroke',
  'cant breathe',
  "can't breathe",
  'shortness of breath',
  'severe breathlessness',
  'bleeding heavily',
  'coughing blood',
  'thunderclap headache',
  'loss of consciousness',
  'passed out',
  'unconscious',
  'seizure',
  'anaphylaxis',
  'suicide',
  'kill myself'
];

function detectEmergency(text) {
  const lower = text.toLowerCase();
  return EMERGENCY_KEYWORDS.some(kw => lower.includes(kw));
}

// =============================================================================
// 3. API ENDPOINTS
// =============================================================================

/**
 * GET /api/status
 * Returns honest configuration status of the AI service.
 * Requirement 11: Never falsely claim an AI service is connected if keys are missing.
 */
app.get('/api/status', (req, res) => {
  const activeProvider = getActiveAiProvider();
  res.json({
    ok: true,
    status: 'online',
    configured: activeProvider !== null,
    provider: activeProvider ? activeProvider.name : null,
    model: activeProvider ? activeProvider.model : null,
    message: activeProvider
      ? `Live AI service connected and ready via ${activeProvider.name} (${activeProvider.model}).`
      : 'AI API key not configured. Add your GEMINI_API_KEY in the server .env file.'
  });
});

/**
 * POST /api/chat
 * Accepts a health education question and returns an AI educational response.
 * Includes validation, emergency screening, and safe error handling.
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message, question } = req.body || {};
    const userQuery = (message || question || '').trim();

    // 1. Input Validation
    if (!userQuery || typeof userQuery !== 'string') {
      return res.status(400).json({
        ok: false,
        error: 'INVALID_INPUT',
        message: 'A valid question string is required.'
      });
    }

    if (userQuery.length < 2) {
      return res.status(400).json({
        ok: false,
        error: 'QUERY_TOO_SHORT',
        message: 'Please enter a question with at least 2 characters.'
      });
    }

    if (userQuery.length > 1000) {
      return res.status(400).json({
        ok: false,
        error: 'QUERY_TOO_LONG',
        message: 'Questions must be 1,000 characters or fewer.'
      });
    }

    // 2. Immediate Emergency Red-Flag Intercept (Zero-latency safety)
    if (detectEmergency(userQuery)) {
      return res.json({
        ok: true,
        emergency: true,
        source: 'emergency_guardrail',
        reply: `### 🚨 Urgent Medical Emergency Warning\n\nThe symptoms or terms mentioned in your message may indicate an acute, life-threatening emergency.\n\n**Please take immediate action:**\n- **Call 911** (USA/Canada), **112** (Europe/India), or **999** (UK) immediately.\n- Do NOT wait or rely on online tools for urgent symptoms.\n- If you are experiencing chest pressure, stay seated, rest quietly, and alert someone nearby.\n\n*Emergency hotlines are free, confidential, and available 24/7.*`,
        disclaimer: 'CRITICAL EMERGENCY ALERT • Seek Immediate Emergency Care'
      });
    }

    // 3. Check AI Provider Credentials
    const activeProvider = getActiveAiProvider();
    if (!activeProvider) {
      // Honestly report unconfigured status (Requirement 11)
      return res.status(200).json({
        ok: false,
        configured: false,
        error: 'AI_NOT_CONFIGURED',
        message: 'The AI backend is running, but no GEMINI_API_KEY is configured in the server .env file. To enable real AI responses, add your API key to .env.',
        disclaimer: 'Configuration Notice • API Key Required in .env'
      });
    }

    let replyText = '';

    // 4. Generate AI Response via selected provider
    if (activeProvider.type === 'nvidia') {
      const response = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeProvider.apiKey}`
        },
        body: JSON.stringify({
          model: activeProvider.model,
          temperature: 0.4,
          max_tokens: 1024,
          messages: [
            { role: 'system', content: HEALTH_SYSTEM_INSTRUCTION },
            { role: 'user', content: userQuery }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error?.message || `NVIDIA API returned status ${response.status}`);
      }

      const data = await response.json();
      replyText = data.choices?.[0]?.message?.content?.trim() || '';
    } else if (activeProvider.type === 'gemini') {
      const ai = new GoogleGenAI({ apiKey: activeProvider.apiKey });
      const aiResponse = await ai.models.generateContent({
        model: activeProvider.model,
        contents: userQuery,
        config: {
          systemInstruction: HEALTH_SYSTEM_INSTRUCTION,
          temperature: 0.4
        }
      });
      replyText = aiResponse.text ? aiResponse.text.trim() : '';
    } else if (activeProvider.type === 'openai') {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${activeProvider.apiKey}`
        },
        body: JSON.stringify({
          model: activeProvider.model,
          temperature: 0.4,
          messages: [
            { role: 'system', content: HEALTH_SYSTEM_INSTRUCTION },
            { role: 'user', content: userQuery }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `OpenAI API returned status ${response.status}`);
      }

      const data = await response.json();
      replyText = data.choices?.[0]?.message?.content?.trim() || '';
    }

    if (!replyText) {
      throw new Error('Received empty response from AI model.');
    }

    // 5. Successful Response
    // NOTE: In compliance with privacy guidelines, user question content is NOT logged or stored.
    console.log(`[INFO] /api/chat responded successfully (${activeProvider.name} - ${activeProvider.model})`);

    return res.json({
      ok: true,
      source: 'ai',
      provider: activeProvider.name,
      model: activeProvider.model,
      reply: replyText,
      disclaimer: 'AI Educational Assistant • Non-Diagnostic • Consult a Physician'
    });

  } catch (error) {
    console.error('[ERROR] Error processing /api/chat:', error.message || error);

    // Provide helpful error classification for beginners
    let clientMessage = 'An unexpected error occurred while communicating with the AI service.';
    let statusCode = 500;

    if (error.status === 429 || (error.message && error.message.includes('429'))) {
      statusCode = 429;
      clientMessage = 'The AI service is currently receiving high demand or API rate limits were reached. Please wait a moment and try again.';
    } else if (error.status === 401 || error.status === 403 || (error.message && error.message.includes('API key'))) {
      statusCode = 502;
      clientMessage = 'The configured AI API key appears to be invalid or unauthorized. Please verify GEMINI_API_KEY in your .env file.';
    } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNRESET') {
      statusCode = 503;
      clientMessage = 'Could not reach the AI provider network. Please check your internet connection.';
    }

    return res.status(statusCode).json({
      ok: false,
      error: 'AI_SERVICE_ERROR',
      message: clientMessage,
      disclaimer: 'Service Notice • Please Try Again'
    });
  }
});

// =============================================================================
// 4. STATIC FILE SERVING (WEBSITE & API RUN FROM SAME SERVER)
// =============================================================================

// Serve all static frontend files from project root (index.html, css/, js/)
app.use(express.static(PROJECT_ROOT));

// Fallback route: serve index.html for any standard page navigation
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(PROJECT_ROOT, 'index.html'));
});

// =============================================================================
// 5. GLOBAL ERROR HANDLING & PAYLOAD PROTECTION
// =============================================================================

app.use((err, req, res, next) => {
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      ok: false,
      error: 'PAYLOAD_TOO_LARGE',
      message: 'Request payload exceeded maximum safe size (50 KB).'
    });
  }

  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      ok: false,
      error: 'INVALID_JSON',
      message: 'Malformed JSON payload in request body.'
    });
  }

  console.error('[UNCAUGHT ERROR]', err.message || err);
  res.status(500).json({
    ok: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: 'An internal server error occurred.'
  });
});

// =============================================================================
// 6. SERVER STARTUP
// =============================================================================

app.listen(PORT, () => {
  const active = getActiveAiProvider();
  console.log('====================================================');
  console.log(` MediAssist AI Server is running!`);
  console.log(` Web Application: http://localhost:${PORT}`);
  console.log(` API Status:      http://localhost:${PORT}/api/status`);
  console.log(` AI Provider:     ${active ? `${active.name} (${active.model})` : 'Not Configured (Add GEMINI_API_KEY to .env)'}`);
  console.log('====================================================');
});

