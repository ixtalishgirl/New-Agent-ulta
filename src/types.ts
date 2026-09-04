export interface AttachedFile {
  id: string;
  name: string;
  type: 'image' | 'file' | 'screenshot';
  size?: string;
  dataUrl?: string; // base64 representation
  url?: string;
  textContent?: string;
  notes?: string;
  createdAt: string;
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

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content?: string;
  text?: string;
  timestamp: string;
  attachedFiles?: AttachedFile[];
  terminalResult?: TerminalExecutionResult;
  visionAnalysis?: VisionAnalysisResult;
  generatedCode?: string;
  model?: string;
  provider?: string;
  actionTaken?: string;
}
