export interface AttachedFile {
  id: string;
  name: string;
  type: 'image' | 'file' | 'screenshot' | 'code';
  size?: number | string;
  dataUrl?: string; // base64 representation
  url?: string;
  textContent?: string;
  notes?: string;
  createdAt?: string;
  uploadedAt?: string;
}

export interface TerminalExecutionResult {
  command: string;
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  timestamp: string;
}

export interface VisionAnalysisResult {
  layoutType: string;
  dominantColors: string[];
  components: string[];
  typography: string;
  ocrSummary: string;
  suggestedTailwindPrompt?: string;
}

export interface WebInspectionResult {
  success: boolean;
  url: string;
  title: string;
  description?: string;
  headings: string[];
  touchable_elements: {
    buttons: Array<{ text: string; type?: string; id?: string }>;
    inputs: Array<{ tag: string; type?: string; name?: string; placeholder?: string; id?: string }>;
    interactive_links: Array<{ href: string; text: string }>;
  };
  human_readable_summary: string;
  error?: string;
}

export interface ActionHistoryFileRead {
  path: string;
  linesCount?: number;
  preview?: string;
  status?: string;
}

export interface ActionHistoryFileEdited {
  path: string;
  linesModified?: number;
  diffSummary?: string;
  status?: string;
}

export interface ActionHistoryIssue {
  title: string;
  severity: 'error' | 'warning' | 'info';
  description: string;
}

export interface ActionHistoryFix {
  title: string;
  description: string;
}

export interface ActionHistoryItem {
  thought?: {
    durationSeconds: number;
    summary: string;
    detailedSteps?: string[];
  };
  filesRead?: ActionHistoryFileRead[];
  filesEdited?: ActionHistoryFileEdited[];
  commandsRun?: Array<{
    command: string;
    exitCode: number;
    stdoutSummary?: string;
  }>;
  issuesDiagnosed?: ActionHistoryIssue[];
  fixesApplied?: ActionHistoryFix[];
}

export interface ProjectScopeStep {
  id: string;
  title: string;
  description?: string;
  status: 'completed' | 'in_progress' | 'pending';
  completedAt?: string;
}

export interface ProjectScope {
  id: string;
  title: string;
  activeTask: string;
  steps: ProjectScopeStep[];
  percentage: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content?: string;
  text?: string;
  timestamp: string;
  attachedFiles?: AttachedFile[];
  terminalResult?: TerminalExecutionResult;
  visionAnalysis?: VisionAnalysisResult;
  webInspection?: WebInspectionResult;
  zipInspection?: ZipInspectionResult;
  powerBuilt?: HalyePowerItem;
  fileCreated?: { path: string; name: string; size: number };
  suggestedPane?: 'preview' | 'terminal' | 'workspace' | 'powers' | 'webeyes' | 'vision' | 'code';
  generatedCode?: string;
  executionPlan?: {
    thought?: string;
    steps: string[];
  };
  auditResult?: any;
  model?: string;
  provider?: string;
  actionTaken?: string;
  pipeline?: AgenticSquadPipeline;
  toolCalls?: AgentToolCall[];
  dialogue?: InterAgentMessage[];
  actionHistory?: ActionHistoryItem;
  projectScopeUpdate?: Partial<ProjectScope>;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  codeSnapshot?: string;
  model?: string;
}

export interface WorkspaceFileItem {
  name: string;
  path: string;
  isDir: boolean;
  size: number;
  sizeFormatted: string;
  extension: string;
  isZip: boolean;
  mtime: string;
}

export interface ZipEntry {
  filename: string;
  is_dir: boolean;
  file_size: number;
  compress_size: number;
  compression_ratio: string;
  date_time: string;
}

export interface ZipInspectionResult {
  success: boolean;
  archive_name: string;
  archive_path: string;
  total_files: number;
  total_uncompressed_bytes: number;
  total_compressed_bytes: number;
  total_size_formatted: string;
  files: ZipEntry[];
  error?: string;
}

export interface HalyePowerItem {
  id: string;
  name: string;
  description: string;
  category: string;
  command: string;
  status: 'active' | 'inactive';
  version: string;
  invocations: number;
  createdAt: string;
}

export interface AgentToolCall {
  id: string;
  tool: 'execute_bash_command' | 'run_pip_installer' | 'run_python_script' | 'trigger_playwright_automation';
  args: Record<string, any>;
  result: {
    success: boolean;
    stdout?: string;
    stderr?: string;
    exitCode?: number;
    durationMs?: number;
    data?: any;
    error?: string;
  };
  selfCorrectionAttempts?: number;
  correctedWith?: string;
}

export interface InterAgentMessage {
  agentId: string;
  name: string;
  role: string;
  avatar: string;
  color: string;
  targetAgent: string;
  speech: string;
  toolExecuted?: string;
  toolOutput?: string;
  timestamp?: string;
}

export interface AgenticSquadPipeline {
  orchestrator: {
    model: string; // google/gemma-4-31b-it
    role: string;
    plan: string;
    steps: string[];
    delegatedTo: string;
  };
  executionMaster?: {
    model: string; // poolside/laguna-xs-2.1
    role: string;
    actionSummary: string;
    selfCorrectionLoops: number;
    success: boolean;
  };
  deepReasoner?: {
    model: string; // deepseek-ai/deepseek-v4-pro-0813
    role: string;
    codeArchitecture?: string;
    summary?: string;
  };
  reviewer?: {
    model: string; // minimaxai/minimax-m3
    role: string;
    syntaxScore: number;
    passedReview: boolean;
    fixesApplied: string[];
  };
  dialogue?: InterAgentMessage[];
}

export interface NvidiaModelCatalogItem {
  id: string;
  name: string;
  category: 'Running Active' | '4-Model Squad (Ensemble)' | 'Fastest / High Speed' | 'Largest / High Capacity' | 'Flagship Reasoning & Coding' | 'Multimodal Vision' | 'Uncensored Frontier';
  parameters: string;
  speedRating: string;
  description: string;
  strengths: string[];
  provider?: 'openrouter' | 'groq' | 'nvidia' | 'custom' | 'gemini';
  roleInSquad?: 'Orchestrator' | 'Terminal Master' | 'Deep Logic' | 'UI & Rapid Fixes';
}

export interface CustomModelSettings {
  provider: 'openrouter' | 'groq' | 'nvidia' | 'custom' | 'gemini';
  model: string;
  apiKey?: string;
  baseUrl?: string;
}
