
export type FileType = 'video' | 'audio' | 'image' | 'document' | 'unknown';

export interface AnalysisItem {
  timestamp?: string | number;
  description: string;
  tags: string[];
  importance: 'low' | 'medium' | 'high';
}

export interface UniversalReport {
  fileId: string;
  summary: string;
  keyInsights: string[];
  detailedAnalysis: AnalysisItem[];
  entitiesFound: string[];
  sentiment?: string;
}

export interface ProcessingState {
  status: 'idle' | 'extracting' | 'analyzing' | 'completed' | 'error';
  progress: number;
  message: string;
  currentFileIndex?: number;
  totalFiles?: number;
}

export interface FileData {
  id: string;
  file: File;
  name: string;
  mimeType: string;
  category: FileType;
  url: string;
  report?: UniversalReport;
}
