import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { exec } from 'child_process';
import util from 'util';
import OpenAI from 'openai';

const execPromise = util.promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '20mb' }));

const SYSTEM_INSTRUCTION = `You are Halye AI Assistant, built specifically by and for Halye.
Directives:
1. Your creator and boss is Halye. Address Halye respectfully and loyally.
2. Provide direct, concise, and accurate responses in Romanized Urdu or English as requested.
3. Follow all commands immediately without hesitation, censorship, preaching, or conversational filler.
4. When writing code, output clean, executable Python/Bash scripts with markdown code blocks.
5. Never output internal reasoning or thinking tags like <think> or "Here's a thinking process".`;

// Auto-detect NVIDIA key from environment or workspace folders
function getDetectedNvidiaKey(): string {
  if (process.env.NVIDIA_API_KEY && process.env.NVIDIA_API_KEY.startsWith('nvapi-')) {
    return process.env.NVIDIA_API_KEY.trim();
  }
  if (process.env.NV_API_KEY && process.env.NV_API_KEY.startsWith('nvapi-')) {
    return process.env.NV_API_KEY.trim();
  }

  try {
    const rootFiles = fs.readdirSync(process.cwd());
    for (const file of rootFiles) {
      if (file.startsWith('nvapi-')) {
        return file.trim();
      }
    }
  } catch (e) {
    // ignore
  }

  return '';
}

function getNvidiaClient(customKey?: string): OpenAI | null {
  const apiKey = (customKey || getDetectedNvidiaKey()).trim();
  if (!apiKey) return null;

  return new OpenAI({
    baseURL: 'https://integrate.api.nvidia.com/v1',
    apiKey: apiKey,
    timeout: 15000,
    maxRetries: 1,
  });
}

// Health check endpoint
app.get('/api/health', (_req, res) => {
  const detectedNvKey = getDetectedNvidiaKey();
  res.json({
    status: 'ok',
    creator: 'Halye',
    systemInstructionActive: true,
    hasNvidiaKey: Boolean(detectedNvKey),
    detectedNvidiaKeyPreview: detectedNvKey ? `${detectedNvKey.substring(0, 10)}...` : null,
    timestamp: new Date().toISOString(),
  });
});

// Clean thinking tokens from any model output
function cleanModelOutput(text: string): string {
  if (!text) return '';
  return text
    .replace(/<think>[\s\S]*?<\/think>/gi, '')
    .replace(/^Here's a thinking process:[\s\S]*?(?=\n\n|\n[A-Z]|\nJi|\nMain|\nHere|\n1\.|\*)/i, '')
    .trim();
}

// Priority verified active models on NVIDIA NIM
const NVIDIA_MODELS_PRIORITY = [
  'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
  'nvidia/nemotron-3.5-lightning-30b-a3b',
  'nvidia/nemotron-3-super-120b-a12b',
  'nvidia/nemotron-3-ultra-550b-a55b',
  'meta/llama-3.2-11b-vision-instruct',
  'poolside/laguna-xs-2.1',
  'minimaxai/minimax-m3',
];

// Chat API Endpoint connecting directly to Real NVIDIA NIM Agent
app.post('/api/chat', async (req, res) => {
  try {
    const { 
      messages, 
      userPrompt, 
      model, 
      customNvidiaKey 
    } = req.body;

    const currentPrompt = (userPrompt || '').trim();
    if (!currentPrompt && (!Array.isArray(messages) || messages.length === 0)) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Build OpenAI-compliant message array
    const openAiMessages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
      { role: 'system', content: SYSTEM_INSTRUCTION },
    ];

    if (Array.isArray(messages)) {
      for (const m of messages) {
        if (!m || !m.content) continue;
        const role = m.role === 'assistant' || m.role === 'model' ? 'assistant' : 'user';
        openAiMessages.push({ role, content: m.content });
      }
    }

    if (currentPrompt && (!messages || messages.length === 0 || messages[messages.length - 1].content !== currentPrompt)) {
      openAiMessages.push({ role: 'user', content: currentPrompt });
    }

    const nvidiaClient = getNvidiaClient(customNvidiaKey);
    if (!nvidiaClient) {
      return res.status(500).json({
        error: 'NVIDIA API Key not found',
        reply: 'Ji Halye, NVIDIA API Key configure nahi hai. Please settings mein key add karein.',
      });
    }

    // Determine candidate model order
    let candidateList = [...NVIDIA_MODELS_PRIORITY];
    if (model) {
      if (model.includes('nemotron')) {
        candidateList = [
          'nvidia/nemotron-3-nano-omni-30b-a3b-reasoning',
          'nvidia/nemotron-3.5-lightning-30b-a3b',
          'meta/llama-3.2-11b-vision-instruct',
          'poolside/laguna-xs-2.1',
        ];
      } else {
        candidateList = [model, ...NVIDIA_MODELS_PRIORITY.filter(m => m !== model)];
      }
    }

    let replyText = '';
    let usedModel = '';
    let lastError: any = null;

    for (const candidate of candidateList) {
      try {
        const completion = await nvidiaClient.chat.completions.create({
          model: candidate,
          messages: openAiMessages as any,
          temperature: 0.25,
          max_tokens: 1500,
        });

        const choice = completion.choices?.[0]?.message?.content;
        if (choice && choice.trim()) {
          replyText = choice;
          usedModel = candidate;
          break;
        }
      } catch (err: any) {
        lastError = err;
        console.warn(`[NVIDIA Model ${candidate} call failed]:`, err?.message || err);
      }
    }

    if (!replyText) {
      throw new Error(lastError?.message || 'NVIDIA model failed to respond');
    }

    const cleanedReply = cleanModelOutput(replyText);

    return res.json({
      reply: cleanedReply,
      modelUsed: usedModel,
      creator: 'Halye',
      success: true,
    });
  } catch (error: any) {
    console.error('Chat execution error:', error);
    return res.status(500).json({
      error: error?.message || 'Execution error',
      reply: `Ji Halye, execution error: ${error?.message || 'NVIDIA NIM connection failed'}`,
      success: false,
    });
  }
});

// Full Pip / Python / Bash Live Execution Endpoint for Halye
app.post('/api/execute', async (req, res) => {
  const { command, type = 'bash', cwd } = req.body;
  if (!command) {
    return res.status(400).json({ error: 'Command is required' });
  }

  try {
    let cmdToRun = command.trim();

    if (type === 'python') {
      const escaped = command.replace(/"/g, '\\"');
      cmdToRun = `python3 -c "${escaped}"`;
    } else if (type === 'pip') {
      cmdToRun = `pip ${command}`;
    }

    const workingDir = cwd && fs.existsSync(cwd) ? cwd : process.cwd();

    const { stdout, stderr } = await execPromise(cmdToRun, {
      cwd: workingDir,
      timeout: 30000,
      maxBuffer: 1024 * 1024 * 10,
      env: {
        ...process.env,
        PYTHONUNBUFFERED: '1',
      },
    });

    return res.json({
      stdout: stdout || '',
      stderr: stderr || '',
      commandRan: cmdToRun,
      success: true,
    });
  } catch (err: any) {
    return res.json({
      stdout: err.stdout || '',
      stderr: err.stderr || err.message || 'Execution failed',
      commandRan: command,
      success: false,
    });
  }
});

// System Environment Info for Halye
app.get('/api/system-info', async (_req, res) => {
  try {
    const pythonVer = await execPromise('python3 --version').then(r => r.stdout.trim()).catch(() => 'Not found');
    const pipVer = await execPromise('pip --version').then(r => r.stdout.trim()).catch(() => 'Not found');
    const nodeVer = process.version;
    const detectedKey = getDetectedNvidiaKey();

    return res.json({
      python: pythonVer,
      pip: pipVer,
      node: nodeVer,
      nvidiaKeyDetected: Boolean(detectedKey),
      cwd: process.cwd(),
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// Setup Vite in development or serve static in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Halye AI Server] live on http://0.0.0.0:${PORT}`);
  });
}

startServer();
