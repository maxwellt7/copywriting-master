import axios from 'axios';
import type { User, Project, Document, Thread, Message, CopyType, CopyOutput, Metric } from '../types';

// Ensure API_URL has protocol
const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_URL = rawApiUrl.startsWith('http') ? rawApiUrl : `https://${rawApiUrl}`;

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth
export const auth = {
  register: async (email: string, password: string) => {
    const response = await api.post('/auth/register', { email, password });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  me: async () => {
    const response = await api.get('/auth/me');
    return response.data.user as User;
  }
};

// Projects
export const projects = {
  list: async () => {
    const response = await api.get('/projects');
    return response.data.projects as Project[];
  },

  get: async (projectId: string) => {
    const response = await api.get(`/projects/${projectId}`);
    return response.data.project as Project;
  },

  create: async (name: string) => {
    const response = await api.post('/projects', { name });
    return response.data.project as Project;
  },

  update: async (projectId: string, name: string) => {
    const response = await api.put(`/projects/${projectId}`, { name });
    return response.data.project as Project;
  },

  delete: async (projectId: string) => {
    const response = await api.delete(`/projects/${projectId}`);
    return response.data;
  }
};

// Documents
export const documents = {
  list: async (projectId: string) => {
    const response = await api.get(`/documents/${projectId}`);
    return response.data.documents as Document[];
  },

  upload: async (projectId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/documents/${projectId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  delete: async (projectId: string, documentId: string) => {
    const response = await api.delete(`/documents/${projectId}/${documentId}`);
    return response.data;
  }
};

// Chat
export const chat = {
  listThreads: async (projectId: string) => {
    const response = await api.get(`/chat/${projectId}/threads`);
    return response.data.threads as Thread[];
  },

  createThread: async (projectId: string, title?: string) => {
    const response = await api.post(`/chat/${projectId}/threads`, { title });
    return response.data.thread as Thread;
  },

  getMessages: async (threadId: string) => {
    const response = await api.get(`/chat/threads/${threadId}/messages`);
    return response.data.messages as Message[];
  },

  sendMessage: async (threadId: string, content: string, copyType: CopyType) => {
    const response = await api.post(`/chat/threads/${threadId}/messages`, {
      content,
      copyType
    });
    return response.data;
  },

  deleteThread: async (threadId: string) => {
    const response = await api.delete(`/chat/threads/${threadId}`);
    return response.data;
  }
};

// Copy
export const copy = {
  get: async (copyId: string) => {
    const response = await api.get(`/copy/${copyId}`);
    return response.data.copy as CopyOutput;
  },

  approve: async (copyId: string) => {
    const response = await api.post(`/copy/${copyId}/approve`);
    return response.data;
  },

  listByThread: async (threadId: string) => {
    const response = await api.get(`/copy/thread/${threadId}`);
    return response.data.copies as CopyOutput[];
  }
};

// Metrics
export const metrics = {
  submit: async (copyId: string, metricType: string, metricValue: number, notes?: string) => {
    const response = await api.post(`/metrics/${copyId}`, {
      metricType,
      metricValue,
      notes
    });
    return response.data;
  },

  list: async (copyId: string) => {
    const response = await api.get(`/metrics/${copyId}`);
    return response.data.metrics as Metric[];
  }
};

export default api;
