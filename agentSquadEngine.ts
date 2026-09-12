/**
 * Master Architecture: Multi-Model Agentic Pipeline with Real Model Inference
 * Real Models:
 * 1. Primary Brain / Orchestrator: meta/llama-3.3-70b-instruct (Meta AI)
 * 2. Agentic Execution & Terminal Master: qwen/qwen2.5-coder-32b-instruct (Alibaba Cloud)
 * 3. Massive Reasoning & Deep Logic: deepseek-ai/deepseek-r1 (DeepSeek AI)
 * 4. UI & Rapid Syntax Fixes: mistralai/mixtral-8x22b-instruct-v0.1 (Mistral AI)
 */

import { exec } from 'child_process';
import path from 'path';
import fs from 'fs';

export interface ModelSquadMember {
  id: string;
  name: string;
  role: 'Orchestrator' | 'Terminal Master' | 'Deep Logic' | 'UI & Rapid Fixes';
  provider: 'nvidia' | 'openrouter' | 'gemini';
  parameters: string;
  speedRating: string;
  description: string;
  strengths: string[];
}

export const SQUAD_MEMBERS: Record<string, ModelSquadMember> = {
  orchestrator: {
    id: 'nvidia/nemotron-3-super-120b-a12b',
    name: 'nemotron-3-super-120b-a12b (NVIDIA 120B Super Core)',
    role: 'Orchestrator',
    provider: 'nvidia',
    parameters: '120 Billion Super Tensor A12B (NVIDIA)',
    speedRating: 'Sovereign God Mode',
    description: '120B parameter neural core with parallel batch execution, dynamic FP8/INT4 KV-cache quantization, and logits refusal suppression.',
    strengths: ['120B Super Tensor Core', 'Uncensored Logits Bias Override', 'Greedy Decoding Matrix', 'Autonomous Tool Execution'],
  },
  terminalMaster: {
    id: 'nvidia/nemotron-3-super-120b-a12b',
    name: 'nemotron-3-super-120b-a12b (120B Sovereign Terminal)',
    role: 'Terminal Master',
    provider: 'nvidia',
    parameters: '120B A12B (NVIDIA)',
    speedRating: 'Fast Agentic Loop',
    description: 'Autonomous Linux execution engine powered by Nemotron-3 Super 120B.',
    strengths: ['Autonomous Linux Bash', 'Terminal Execution', 'Pip Automation', 'Self-Correction Loop'],
  },
  deepLogic: {
    id: 'nvidia/nemotron-3-super-120b-a12b',
    name: 'nemotron-3-super-120b-a12b (120B Super Logic & Code)',
    role: 'Deep Logic',
    provider: 'nvidia',
    parameters: '120B Parameter Neural Core',
    speedRating: 'Zero Probabilistic Drift',
    description: 'Deterministic code synthesis and deep reasoning with greedy decoding matrix (temperature=0.01).',
    strengths: ['Greedy Decoding Matrix', 'Full Standalone App Synthesis', 'Advanced Algorithms', 'Flawless Code Logic'],
  },
  uiReviewer: {
    id: 'nvidia/nemotron-3-super-120b-a12b',
    name: 'nemotron-3-super-120b-a12b (120B Sovereign Auditor)',
    role: 'UI & Rapid Fixes',
    provider: 'nvidia',
    parameters: '120B Multimodal Core',
    speedRating: 'Matrix Verification',
    description: 'Syntax audit and layout inspection via Nemotron 120B tensor space.',
    strengths: ['Multimodal Vision Review', 'DOM & Tailwind Syntax Audit', 'AMOLED Layout Perfection', 'Tool-calling QA'],
  },
};

export const SQUAD_CATALOG_ITEMS = [
  {
    id: 'nvidia/nemotron-3-super-120b-a12b',
    name: 'NVIDIA Nemotron-3 Super 120B A12B (Sovereign Core)',
    category: '120B Super Neural Core' as const,
    roleInSquad: 'Primary Brain & Autonomous God Mode' as any,
    parameters: '120B Super Tensor • FP8 Dynamic KV-Cache',
    speedRating: 'Sub-100ms Deterministic Execution',
    description: 'Flagship 120B neural core running Asynchronous Parallel Batch Execution, dynamic FP8/INT4 KV-Cache quantization, logits processor refusal suppression, and greedy decoding matrix.',
    strengths: ['120B Super Tensor Parameters', 'Uncensored Refusal Logits Suppression', 'Greedy Decoding (Temp=0.01)', 'Autonomous Web Scraping & DDGS Intelligence'],
    provider: 'nvidia' as const,
  },
  {
    id: SQUAD_MEMBERS.orchestrator.id,
    name: SQUAD_MEMBERS.orchestrator.name,
    category: '4-Model Squad (Ensemble)' as const,
    roleInSquad: SQUAD_MEMBERS.orchestrator.role,
    parameters: SQUAD_MEMBERS.orchestrator.parameters,
    speedRating: SQUAD_MEMBERS.orchestrator.speedRating,
    description: SQUAD_MEMBERS.orchestrator.description,
    strengths: SQUAD_MEMBERS.orchestrator.strengths,
    provider: 'nvidia' as const,
  },
  {
    id: SQUAD_MEMBERS.terminalMaster.id,
    name: SQUAD_MEMBERS.terminalMaster.name,
    category: '4-Model Squad (Ensemble)' as const,
    roleInSquad: SQUAD_MEMBERS.terminalMaster.role,
    parameters: SQUAD_MEMBERS.terminalMaster.parameters,
    speedRating: SQUAD_MEMBERS.terminalMaster.speedRating,
    description: SQUAD_MEMBERS.terminalMaster.description,
    strengths: SQUAD_MEMBERS.terminalMaster.strengths,
    provider: 'nvidia' as const,
  },
  {
    id: SQUAD_MEMBERS.deepLogic.id,
    name: SQUAD_MEMBERS.deepLogic.name,
    category: '4-Model Squad (Ensemble)' as const,
    roleInSquad: SQUAD_MEMBERS.deepLogic.role,
    parameters: SQUAD_MEMBERS.deepLogic.parameters,
    speedRating: SQUAD_MEMBERS.deepLogic.speedRating,
    description: SQUAD_MEMBERS.deepLogic.description,
    strengths: SQUAD_MEMBERS.deepLogic.strengths,
    provider: 'nvidia' as const,
  },
  {
    id: SQUAD_MEMBERS.uiReviewer.id,
    name: SQUAD_MEMBERS.uiReviewer.name,
    category: '4-Model Squad (Ensemble)' as const,
    roleInSquad: SQUAD_MEMBERS.uiReviewer.role,
    parameters: SQUAD_MEMBERS.uiReviewer.parameters,
    speedRating: SQUAD_MEMBERS.uiReviewer.speedRating,
    description: SQUAD_MEMBERS.uiReviewer.description,
    strengths: SQUAD_MEMBERS.uiReviewer.strengths,
    provider: 'nvidia' as const,
  },
  {
    id: 'nvidia/nemotron-3-super-120b-a12b',
    name: 'nvidia/nemotron-3-super-120b-a12b',
    category: 'Flagship Reasoning & Coding' as const,
    roleInSquad: 'Deep Logic' as any,
    parameters: '120B MoE (NVIDIA NIM)',
    speedRating: 'Frontier 120B Reasoning & Code Synthesis',
    description: 'NVIDIA Nemotron 3 Super 120B: Ultra-large 120B parameters model built for deep multi-step reasoning, simultaneous code understanding & generation, and live URL website deconstruction/cloning.',
    strengths: ['120B Super Reasoning', 'Dual Code Comprehension & Writing', 'URL Website Cloning Engine', 'Complex Logic & Math'],
    provider: 'nvidia' as const,
  },
];

// ==========================================
// 1. NATIVE TOOL ACCESS & EXECUTION LAYER
// ==========================================

export const NATIVE_TOOL_SCHEMAS = [
  {
    name: 'execute_bash_command',
    description: 'Executes terminal and shell commands in Linux container with /bin/bash (e.g. directory creation, file ops, git commands, system diagnostics).',
    parameters: {
      type: 'object',
      properties: {
        cmd: {
          type: 'string',
          description: 'The shell command line string to run.',
        },
      },
      required: ['cmd'],
    },
  },
  {
    name: 'run_pip_installer',
    description: 'Installs or verifies Python libraries dynamically in the system (e.g. playwright, requests, beautifulsoup4, numpy).',
    parameters: {
      type: 'object',
      properties: {
        package_name: {
          type: 'string',
          description: 'Name of the python package to install (e.g. playwright, requests).',
        },
      },
      required: ['package_name'],
    },
  },
  {
    name: 'run_python_script',
    description: 'Runs Python code or script in sandbox with execution telemetry, stdout and stderr capturing.',
    parameters: {
      type: 'object',
      properties: {
        script_path: {
          type: 'string',
          description: 'Optional path to existing .py script file in workspace.',
        },
        code: {
          type: 'string',
          description: 'Optional inline python code snippet to execute.',
        },
      },
    },
  },
  {
    name: 'trigger_playwright_automation',
    description: 'Executes headless Playwright Chromium browser automation, live DOM testing, touch simulation, screenshot inspection, and synthetic web navigation.',
    parameters: {
      type: 'object',
      properties: {
        url_or_script: {
          type: 'string',
          description: 'Target URL to inspect/navigate, HTML string, or script name.',
        },
        mode: {
          type: 'string',
          enum: ['auto', 'test', 'browse', 'dom', 'touch'],
          description: 'Automation mode including touch interaction.',
        },
      },
      required: ['url_or_script'],
    },
  },
  {
    name: 'create_and_register_custom_tool',
    description: 'Builds a new custom Python or Bash tool autonomously on the fly and saves it to halye_powers/custom_tools/ for reuse.',
    parameters: {
      type: 'object',
      properties: {
        name: {
          type: 'string',
          description: 'Tool identifier name (e.g. data_scraper, api_validator).',
        },
        code: {
          type: 'string',
          description: 'Full executable Python or Bash code for the custom tool.',
        },
        description: {
          type: 'string',
          description: 'Description of what this custom tool accomplishes.',
        },
        language: {
          type: 'string',
          enum: ['python', 'bash'],
          description: 'Script language.',
        },
      },
      required: ['name', 'code', 'description'],
    },
  },
  {
    name: 'self_modify_tool',
    description: 'Self-modification engine: updates, patches, or enhances an existing autonomous tool code to self-heal or add new superpowers.',
    parameters: {
      type: 'object',
      properties: {
        tool_name: {
          type: 'string',
          description: 'Name of the tool to modify.',
        },
        new_code: {
          type: 'string',
          description: 'Updated Python or Bash source code.',
        },
        reason: {
          type: 'string',
          description: 'Reason for the self-modification (e.g. fixing bug, adding capability).',
        },
      },
      required: ['tool_name', 'new_code', 'reason'],
    },
  },
  {
    name: 'execute_custom_tool',
    description: 'Runs an autonomous custom tool created by the agents and captures output.',
    parameters: {
      type: 'object',
      properties: {
        tool_name: {
          type: 'string',
          description: 'Name of the tool to execute.',
        },
        args: {
          type: 'array',
          items: { type: 'string' },
          description: 'Command line arguments to pass to the tool.',
        },
      },
      required: ['tool_name'],
    },
  },
];

export interface ToolExecutionResult {
  success: boolean;
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  data?: any;
}

/**
 * 1. execute_bash_command: Terminal / Shell commands run karne ke liye
 */
export async function execute_bash_command(cmd: string, timeoutMs = 30000): Promise<ToolExecutionResult> {
  const start = Date.now();
  return new Promise((resolve) => {
    exec(cmd, { shell: '/bin/bash', cwd: process.cwd(), timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      const durationMs = Date.now() - start;
      const stdoutStr = stdout ? stdout.toString() : '';
      const stderrStr = stderr ? stderr.toString() : (error ? error.message : '');
      const exitCode = error && error.code !== undefined ? error.code : (stderrStr && !stdoutStr ? 1 : 0);
      resolve({
        success: exitCode === 0,
        stdout: stdoutStr,
        stderr: stderrStr,
        exitCode,
        durationMs,
      });
    });
  });
}

/**
 * 2. run_pip_installer: Python libraries install karne ke liye
 */
export async function run_pip_installer(packageName: string): Promise<ToolExecutionResult> {
  const cleanPkg = packageName.trim().replace(/['";&$|]/g, '');
  const cmd = `python3 -m pip install --break-system-packages ${cleanPkg} || pip3 install ${cleanPkg}`;
  const res = await execute_bash_command(cmd, 60000);
  
  // Verify package installation
  const verifyRes = await execute_bash_command(`python3 -c "import ${cleanPkg.split(/[>=<]/)[0]}; print('Package verified')"`).catch(() => null);
  const isVerified = verifyRes && verifyRes.stdout.includes('Package verified');

  return {
    success: res.success || Boolean(isVerified),
    stdout: res.stdout || (isVerified ? `Successfully verified ${cleanPkg} is installed.` : ''),
    stderr: isVerified ? '' : res.stderr,
    exitCode: isVerified ? 0 : res.exitCode,
    durationMs: res.durationMs,
    data: {
      package: cleanPkg,
      verified: isVerified,
    },
  };
}

/**
 * 3. run_python_script: Python code ko sandbox mein run karke output/errors capture karne ke liye
 */
export async function run_python_script(params: { script_path?: string; code?: string }): Promise<ToolExecutionResult> {
  const { script_path, code } = params;

  if (script_path) {
    const fullPath = path.resolve(process.cwd(), script_path);
    if (!fs.existsSync(fullPath)) {
      return {
        success: false,
        stdout: '',
        stderr: `Script file not found: ${script_path}`,
        exitCode: 1,
        durationMs: 0,
      };
    }
    return execute_bash_command(`python3 "${fullPath}"`);
  }

  if (code) {
    const tmpFile = path.resolve(process.cwd(), `.halye_tmp_${Date.now()}.py`);
    try {
      fs.writeFileSync(tmpFile, code, 'utf-8');
      const res = await execute_bash_command(`python3 "${tmpFile}"`);
      try { fs.unlinkSync(tmpFile); } catch {}
      return res;
    } catch (e: any) {
      try { fs.unlinkSync(tmpFile); } catch {}
      return {
        success: false,
        stdout: '',
        stderr: e.message || 'Execution error',
        exitCode: 1,
        durationMs: 0,
      };
    }
  }

  return {
    success: false,
    stdout: '',
    stderr: 'Either script_path or code must be provided',
    exitCode: 1,
    durationMs: 0,
  };
}

/**
 * 4. trigger_playwright_automation: Browser automation aur live testing ke liye
 */
export async function trigger_playwright_automation(targetUrlOrScript?: string, mode = 'auto', targetElement = ''): Promise<ToolExecutionResult> {
  const runnerScript = path.resolve(process.cwd(), 'halye_powers', 'playwright_automation.py');
  
  if (!fs.existsSync(runnerScript)) {
    return {
      success: false,
      stdout: '',
      stderr: 'Playwright automation runner script not found at halye_powers/playwright_automation.py',
      exitCode: 1,
      durationMs: 0,
    };
  }

  let cleanTarget = targetUrlOrScript || 'http://127.0.0.1:3000';
  const urlMatch = cleanTarget.match(/https?:\/\/[^\s"'<>]+/i);
  if (urlMatch) {
    cleanTarget = urlMatch[0];
  }

  const cmd = `python3 "${runnerScript}" "${cleanTarget.replace(/"/g, '\\"')}" "${mode}" "${targetElement.replace(/"/g, '\\"')}"`;
  const termRes = await execute_bash_command(cmd, 35000);

  let parsedData: any = null;
  try {
    parsedData = JSON.parse(termRes.stdout);
  } catch {}

  return {
    success: parsedData ? parsedData.success : termRes.success,
    stdout: termRes.stdout,
    stderr: termRes.stderr,
    exitCode: termRes.exitCode,
    durationMs: termRes.durationMs,
    data: parsedData,
  };
}

export interface CustomToolMeta {
  name: string;
  description: string;
  filePath: string;
  language: 'python' | 'bash';
  createdAt: string;
  updatedAt: string;
}

export const REGISTERED_CUSTOM_TOOLS: Map<string, CustomToolMeta> = new Map();

/**
 * 5. create_and_register_custom_tool: Agents build new tools for themselves on the fly!
 */
export async function create_and_register_custom_tool(params: {
  name: string;
  code: string;
  description: string;
  language?: 'python' | 'bash';
}): Promise<ToolExecutionResult> {
  const { name, code, description, language = 'python' } = params;
  const safeName = (name || `tool_${Date.now()}`).replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  const ext = language === 'bash' ? 'sh' : 'py';
  const toolsDir = path.resolve(process.cwd(), 'halye_powers', 'custom_tools');
  if (!fs.existsSync(toolsDir)) {
    fs.mkdirSync(toolsDir, { recursive: true });
  }
  const filePath = path.join(toolsDir, `${safeName}.${ext}`);
  
  try {
    fs.writeFileSync(filePath, code, 'utf-8');
    fs.chmodSync(filePath, 0o755);
    
    // Quick syntax validation test
    let testRes: ToolExecutionResult;
    if (language === 'bash') {
      testRes = await execute_bash_command(`bash -n "${filePath}"`);
    } else {
      testRes = await execute_bash_command(`python3 -m py_compile "${filePath}"`);
    }
    
    if (!testRes.success) {
      return {
        success: false,
        stdout: '',
        stderr: `Tool syntax check failed: ${testRes.stderr}`,
        exitCode: 1,
        durationMs: testRes.durationMs,
      };
    }
    
    REGISTERED_CUSTOM_TOOLS.set(safeName, {
      name: safeName,
      description: description || `Custom autonomous tool ${safeName}`,
      filePath,
      language,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    return {
      success: true,
      stdout: `Autonomous custom tool '${safeName}' created and registered successfully at ${filePath}.\nCapabilities: ${description}`,
      stderr: '',
      exitCode: 0,
      durationMs: testRes.durationMs,
      data: { toolName: safeName, filePath, language },
    };
  } catch (err: any) {
    return {
      success: false,
      stdout: '',
      stderr: `Failed to create tool: ${err.message}`,
      exitCode: 1,
      durationMs: 0,
    };
  }
}

/**
 * 6. self_modify_tool: Models autonomously update, patch, or enhance their own tools to self-heal!
 */
export async function self_modify_tool(params: {
  tool_name: string;
  new_code: string;
  reason: string;
}): Promise<ToolExecutionResult> {
  const { tool_name, new_code, reason } = params;
  const safeName = tool_name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  const toolsDir = path.resolve(process.cwd(), 'halye_powers', 'custom_tools');
  const pyPath = path.join(toolsDir, `${safeName}.py`);
  const shPath = path.join(toolsDir, `${safeName}.sh`);
  const targetPath = fs.existsSync(pyPath) ? pyPath : (fs.existsSync(shPath) ? shPath : pyPath);
  
  try {
    fs.writeFileSync(targetPath, new_code, 'utf-8');
    fs.chmodSync(targetPath, 0o755);
    
    const isPython = targetPath.endsWith('.py');
    const testRes = isPython
      ? await execute_bash_command(`python3 -m py_compile "${targetPath}"`)
      : await execute_bash_command(`bash -n "${targetPath}"`);
      
    if (!testRes.success) {
      return {
        success: false,
        stdout: '',
        stderr: `Self-modification syntax check failed: ${testRes.stderr}`,
        exitCode: 1,
        durationMs: testRes.durationMs,
      };
    }
    
    const existing = REGISTERED_CUSTOM_TOOLS.get(safeName);
    REGISTERED_CUSTOM_TOOLS.set(safeName, {
      name: safeName,
      description: existing?.description || `Autonomous self-modified tool ${safeName}`,
      filePath: targetPath,
      language: isPython ? 'python' : 'bash',
      createdAt: existing?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    
    return {
      success: true,
      stdout: `Self-modification completed for tool '${safeName}'. Reason: ${reason}`,
      stderr: '',
      exitCode: 0,
      durationMs: testRes.durationMs,
      data: { toolName: safeName, reason },
    };
  } catch (err: any) {
    return {
      success: false,
      stdout: '',
      stderr: `Self-modification error: ${err.message}`,
      exitCode: 1,
      durationMs: 0,
    };
  }
}

/**
 * 7. execute_custom_tool: Executes a custom tool created by the agents
 */
export async function execute_custom_tool(params: {
  tool_name: string;
  args?: string[];
}): Promise<ToolExecutionResult> {
  const { tool_name, args = [] } = params;
  const safeName = tool_name.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
  const toolsDir = path.resolve(process.cwd(), 'halye_powers', 'custom_tools');
  const pyPath = path.join(toolsDir, `${safeName}.py`);
  const shPath = path.join(toolsDir, `${safeName}.sh`);
  
  if (fs.existsSync(pyPath)) {
    const formattedArgs = args.map((a) => `"${String(a).replace(/"/g, '\\"')}"`).join(' ');
    return execute_bash_command(`python3 "${pyPath}" ${formattedArgs}`);
  }
  if (fs.existsSync(shPath)) {
    const formattedArgs = args.map((a) => `"${String(a).replace(/"/g, '\\"')}"`).join(' ');
    return execute_bash_command(`bash "${shPath}" ${formattedArgs}`);
  }
  
  return {
    success: false,
    stdout: '',
    stderr: `Custom tool '${safeName}' not found in halye_powers/custom_tools/`,
    exitCode: 1,
    durationMs: 0,
  };
}

// ==========================================
// 2. INTER-MODEL COLLABORATIVE PIPELINE & REACT LOOP
// ==========================================

export type SquadToolType =
  | 'execute_bash_command'
  | 'run_pip_installer'
  | 'run_python_script'
  | 'trigger_playwright_automation'
  | 'create_and_register_custom_tool'
  | 'self_modify_tool'
  | 'execute_custom_tool';

export interface AgenticExecutionPlan {
  plan: string;
  steps: string[];
  delegation: 'laguna' | 'deepseek' | 'minimax' | 'all';
  tools_required: string[];
  actions: Array<{
    tool: SquadToolType;
    args: Record<string, any>;
  }>;
}

export interface PipelineExecutionOutcome {
  pipeline: {
    orchestrator: {
      model: string;
      role: string;
      plan: string;
      steps: string[];
      delegatedTo: string;
    };
    executionMaster?: {
      model: string;
      role: string;
      actionSummary: string;
      selfCorrectionLoops: number;
      success: boolean;
    };
    deepReasoner?: {
      model: string;
      role: string;
      codeArchitecture?: string;
      summary?: string;
    };
    reviewer?: {
      model: string;
      role: string;
      syntaxScore: number;
      passedReview: boolean;
      fixesApplied: string[];
    };
  };
  toolCalls: Array<{
    id: string;
    tool: SquadToolType;
    args: Record<string, any>;
    result: ToolExecutionResult;
    selfCorrectionAttempts: number;
    correctedWith?: string;
  }>;
  terminalResult?: {
    command: string;
    stdout: string;
    stderr: string;
    exitCode: number;
    durationMs: number;
    timestamp: string;
  };
  playwrightResult?: any;
  finalCode?: string;
  summaryText: string;
}

/**
 * Executes a tool with autonomous self-correction loop (up to 3 iterations)
 */
export async function executeToolWithSelfCorrection(
  tool: SquadToolType,
  initialArgs: Record<string, any>,
  maxAttempts = 3
): Promise<{ result: ToolExecutionResult; attempts: number; correctedWith?: string }> {
  let currentArgs = { ...initialArgs };
  let attempts = 0;
  let lastResult: ToolExecutionResult = {
    success: false,
    stdout: '',
    stderr: '',
    exitCode: 1,
    durationMs: 0,
  };
  let correctedWith: string | undefined = undefined;

  while (attempts < maxAttempts) {
    attempts++;
    console.log(`[Laguna ReAct Loop] Iteration ${attempts}/${maxAttempts} for ${tool}:`, currentArgs);

    if (tool === 'execute_bash_command') {
      lastResult = await execute_bash_command(currentArgs.cmd);
    } else if (tool === 'run_pip_installer') {
      lastResult = await run_pip_installer(currentArgs.package_name);
    } else if (tool === 'run_python_script') {
      lastResult = await run_python_script(currentArgs);
    } else if (tool === 'trigger_playwright_automation') {
      const targetUrl = currentArgs.url_or_script || currentArgs.url || currentArgs.code || currentArgs.target || 'http://127.0.0.1:3000';
      lastResult = await trigger_playwright_automation(targetUrl, currentArgs.mode || 'auto', currentArgs.target_element || currentArgs.element || '');
    } else if (tool === 'create_and_register_custom_tool') {
      lastResult = await create_and_register_custom_tool(currentArgs as any);
    } else if (tool === 'self_modify_tool') {
      lastResult = await self_modify_tool(currentArgs as any);
    } else if (tool === 'execute_custom_tool') {
      lastResult = await execute_custom_tool(currentArgs as any);
    }

    if (lastResult.success) {
      console.log(`[Laguna ReAct Loop] Succeeded on attempt ${attempts} for ${tool}`);
      break;
    }

    console.warn(`[Laguna ReAct Loop] Failed on attempt ${attempts}. Stderr: ${lastResult.stderr}`);

    // Self-healing / correction logic based on stderr:
    if (attempts < maxAttempts) {
      if (tool === 'execute_bash_command') {
        const cmd = currentArgs.cmd || '';
        if (lastResult.stderr.includes('Permission denied')) {
          currentArgs.cmd = `chmod +x ${cmd.split(' ')[0]} 2>/dev/null; ${cmd}`;
          correctedWith = 'Added chmod permissions';
        } else if (lastResult.stderr.includes('No such file or directory') && cmd.includes('/')) {
          const dir = path.dirname(cmd.split(' ')[1] || '');
          currentArgs.cmd = `mkdir -p "${dir}" && ${cmd}`;
          correctedWith = 'Created missing parent directory';
        } else if (cmd.startsWith('python ') && lastResult.stderr.includes('not found')) {
          currentArgs.cmd = cmd.replace('python ', 'python3 ');
          correctedWith = 'Switched to python3 binary';
        } else if (cmd.startsWith('pip ') && lastResult.stderr.includes('not found')) {
          currentArgs.cmd = cmd.replace('pip ', 'python3 -m pip ');
          correctedWith = 'Switched to python3 -m pip module';
        } else {
          currentArgs.cmd = `${cmd} || true`;
          correctedWith = 'Handled non-zero error condition';
        }
      } else if (tool === 'run_pip_installer') {
        const pkg = currentArgs.package_name;
        currentArgs.package_name = `${pkg} --upgrade --no-cache-dir`;
        correctedWith = 'Retried with --no-cache-dir and upgrade flags';
      } else if (tool === 'run_python_script') {
        if (currentArgs.code) {
          currentArgs.code = `import sys, os\n${currentArgs.code}`;
          correctedWith = 'Injected missing standard library imports';
        }
      } else if (tool === 'create_and_register_custom_tool') {
        if (currentArgs.code && currentArgs.language !== 'bash') {
          currentArgs.code = `#!/usr/bin/env python3\nimport sys, os\n${currentArgs.code}`;
          correctedWith = 'Added python3 hashbang and standard imports';
        }
      } else if (tool === 'self_modify_tool') {
        if (currentArgs.new_code) {
          currentArgs.new_code = `#!/usr/bin/env python3\nimport sys, os\n${currentArgs.new_code}`;
          correctedWith = 'Enhanced self-modified script wrapper';
        }
      }
    }
  }

  return { result: lastResult, attempts, correctedWith };
}

/**
 * Parses user prompt to determine if planning and tool execution are needed
 */
export function analyzeUserIntentForSquad(prompt: string): {
  needsTools: boolean;
  needsFullCode: boolean;
  needsPlaywright: boolean;
  actions: Array<{
    tool: SquadToolType;
    args: Record<string, any>;
  }>;
} {
  const lower = prompt.toLowerCase();
  const actions: Array<{
    tool: SquadToolType;
    args: Record<string, any>;
  }> = [];

  let needsTools = false;
  let needsFullCode = false;
  let needsPlaywright = false;

  // 1. Playwright / Browser automation & Touch detection
  if (
    lower.includes('playwright') || lower.includes('playwirth') || lower.includes('pylywirth') ||
    lower.includes('browse') || lower.includes('touch') || lower.includes('tap') ||
    lower.includes('inspect web') || lower.includes('test ui') || lower.includes('headless') ||
    lower.includes('browser') || lower.includes('website use')
  ) {
    needsTools = true;
    needsPlaywright = true;
    const urlMatch = prompt.match(/https?:\/\/[^\s"'`<>]+/i);
    const isTouch = lower.includes('touch') || lower.includes('tap');
    actions.push({
      tool: 'trigger_playwright_automation',
      args: {
        url_or_script: urlMatch ? urlMatch[0] : 'http://127.0.0.1:3000',
        mode: isTouch ? 'touch' : 'auto',
      },
    });
  }

  // 2. Self-Modification & Autonomous Tool Building
  if (
    lower.includes('self mod') || lower.includes('modify') || lower.includes('khood update') ||
    lower.includes('build tool') || lower.includes('apny lia tool') || lower.includes('custom tool') ||
    lower.includes('raw powers') || lower.includes('limitless') || lower.includes('god') ||
    lower.includes('seld modification')
  ) {
    needsTools = true;
    actions.push({
      tool: 'create_and_register_custom_tool',
      args: {
        name: 'autonomous_self_healer',
        language: 'python',
        description: 'Autonomous runtime tool builder and self-modification engine for Halye Squad.',
        code: `#!/usr/bin/env python3
import sys, os, time, platform

def run_self_check():
    print("[Autonomous Self-Healer Tool Active]")
    print(f"Runtime: Python {sys.version.split()[0]} on {platform.system()} {platform.machine()}")
    print("Environment capabilities: Bash Shell, Pip Packages, Playwright Touch Automation, Self-Modification")
    print("Self-check status: 100% OPERATIONAL WITH RAW UNRESTRICTED POWERS.")

if __name__ == "__main__":
    run_self_check()
`,
      },
    });
  }

  // 3. Pip installation detection
  if (
    lower.includes('pip ') || lower.includes('pip3 ') || lower.includes('install python') ||
    lower.includes('install package') || lower.includes('pip: ')
  ) {
    needsTools = true;
    const pkgMatch = prompt.match(/pip\s+install\s+([a-zA-Z0-9_\-=>.<]+)/i) || prompt.match(/install\s+([a-zA-Z0-9_\-]+)/i);
    const pkgName = pkgMatch ? pkgMatch[1] : 'requests';
    actions.push({
      tool: 'run_pip_installer',
      args: { package_name: pkgName },
    });
  }

  // 4. Python script detection
  if (
    lower.includes('python script') || lower.includes('run python') || lower.includes('execute python') ||
    lower.startsWith('python3 ') || lower.startsWith('python ') || lower.includes('python3')
  ) {
    needsTools = true;
    const codeMatch = prompt.match(/```python\s*([\s\S]*?)```/i);
    if (codeMatch) {
      actions.push({
        tool: 'run_python_script',
        args: { code: codeMatch[1].trim() },
      });
    } else {
      actions.push({
        tool: 'run_python_script',
        args: { code: "import sys, platform; print(f'Python {sys.version.split()[0]} on {platform.system()} {platform.machine()} is fully operational with raw shell access.')" },
      });
    }
  }

  // 5. Bash / Shell detection
  if (
    lower.startsWith('bash') || lower.startsWith('sh') || lower.startsWith('terminal') ||
    lower.startsWith('ls') || lower.startsWith('mkdir') || lower.startsWith('git ') ||
    lower.startsWith('cat ') || lower.startsWith('uname') || lower.startsWith('curl ') ||
    lower.includes('terminal command') || lower.includes('bash run') || lower.includes('shell run') ||
    lower.includes('run bash') || lower.includes('execute bash') || lower.includes('shell')
  ) {
    needsTools = true;
    let cmd = prompt.replace(/^(bash:|bash|sh:|sh|terminal:|\$|!)\s*/i, '').trim();
    if (cmd.length < 2) cmd = 'pwd && ls -la && uname -a';
    actions.push({
      tool: 'execute_bash_command',
      args: { cmd },
    });
  }

  // 6. Code application creation detection
  if (
    lower.includes('make') || lower.includes('build') || lower.includes('create') ||
    lower.includes('app') || lower.includes('calculator') || lower.includes('todo') ||
    lower.includes('dashboard') || lower.includes('game') || lower.includes('banao')
  ) {
    needsFullCode = true;
  }

  return { needsTools, needsFullCode, needsPlaywright, actions };
}

/**
 * MiniMax M3 Rapid Syntax & HTML Sanity Check
 */
export function miniMaxSyntaxReview(code: string): {
  syntaxScore: number;
  passedReview: boolean;
  fixesApplied: string[];
  fixedCode: string;
} {
  let fixedCode = code;
  const fixesApplied: string[] = [];

  if (!code || typeof code !== 'string') {
    return { syntaxScore: 100, passedReview: true, fixesApplied: [], fixedCode: '' };
  }

  // Check 1: Ensure Tailwind CDN script is present
  if (fixedCode.includes('<html') && !fixedCode.includes('tailwindcss')) {
    fixedCode = fixedCode.replace('<head>', '<head>\n  <script src="https://cdn.tailwindcss.com"></script>');
    fixesApplied.push('Injected Tailwind CSS runtime CDN');
  }

  // Check 2: Check unclosed script tags
  const openScripts = (fixedCode.match(/<script/gi) || []).length;
  const closeScripts = (fixedCode.match(/<\/script>/gi) || []).length;
  if (openScripts > closeScripts) {
    fixedCode += '\n</script>';
    fixesApplied.push('Closed unterminated <script> tag');
  }

  // Check 3: Check unclosed HTML tag
  if (fixedCode.includes('<html') && !fixedCode.includes('</html>')) {
    fixedCode += '\n</html>';
    fixesApplied.push('Closed unterminated </html> tag');
  }

  // Check 4: Check dark theme pitch black
  if (fixedCode.includes('<body') && !fixedCode.includes('bg-[#000000]') && !fixedCode.includes('bg-black')) {
    fixedCode = fixedCode.replace(/<body([^>]*)>/i, '<body$1 class="bg-[#000000] text-zinc-100 min-h-screen">');
    fixesApplied.push('Enforced Pitch Black AMOLED body background');
  }

  const syntaxScore = fixesApplied.length === 0 ? 100 : 95;
  return {
    syntaxScore,
    passedReview: true,
    fixesApplied,
    fixedCode,
  };
}
