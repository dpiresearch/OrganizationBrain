export interface UploadedFile {
  name: string;
  content: string;
  fileObject?: File;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ChartDataPoint {
  [key: string]: string | number;
}

export interface Chart {
  type: 'bar' | 'line' | 'pie';
  title: string;
  data: ChartDataPoint[];
  dataKey: string;
  categoryKey: string;
}

export interface DashboardData {
  charts: Chart[];
}

export interface AnalysisResponse {
  summary: string;
  charts: Chart[];
}
