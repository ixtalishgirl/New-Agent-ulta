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
  generatedCode?: string;
  model?: string;
  provider?: string;
  actionTaken?: string;
}

export interface NvidiaModelCatalogItem {
  id: string;
  name: string;
  category: 'Running Active' | 'Fastest / High Speed' | 'Largest / High Capacity' | 'Flagship Reasoning & Coding' | 'Multimodal Vision' | 'Uncensored Frontier';
  parameters: string;
  speedRating: string;
  description: string;
  strengths: string[];
  provider?: 'openrouter' | 'groq' | 'nvidia' | 'custom';
}

export interface CustomModelSettings {
  provider: 'openrouter' | 'groq' | 'nvidia' | 'custom';
  model: string;
  apiKey?: string;
  baseUrl?: string;
}
