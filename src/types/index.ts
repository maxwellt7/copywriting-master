export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  pinecone_namespace: string;
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: string;
  project_id: string;
  filename: string;
  file_type: string;
  upload_date: string;
  chunk_count: number;
}

export interface Thread {
  id: string;
  project_id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  thread_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
}

export type CopyType = 'ad_script' | 'ad_copy' | 'email' | 'landing_page' | 'vsl';

export interface CopyOutput {
  id: string;
  thread_id: string;
  copy_type: CopyType;
  content: any;
  quality_score: number;
  copy_brief: any;
  approved: boolean;
  approved_at?: string;
  pinecone_id?: string;
  created_at: string;
}

export interface Metric {
  id: string;
  copy_output_id: string;
  metric_type: string;
  metric_value: number;
  notes?: string;
  recorded_at: string;
}

export interface GeneratedCopyResult {
  draft: any;
  brief: any;
  evaluation: {
    scores: {
      brief_adherence: number;
      psychological_impact: number;
      voice_consistency: number;
      structural_integrity: number;
      conversion_optimization: number;
    };
    total_score: number;
    feedback: string;
    approved: boolean;
  };
  attempts: number;
  warning?: string;
}
