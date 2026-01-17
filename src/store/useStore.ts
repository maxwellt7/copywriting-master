import { create } from 'zustand';
import type { User, Project, Thread, Message, CopyOutput } from '../types';
import * as api from '../services/api';

interface AppState {
  // Auth
  user: User | null;
  token: string | null;

  // Projects
  projects: Project[];
  currentProject: Project | null;

  // Threads
  threads: Thread[];
  currentThread: Thread | null;

  // Messages
  messages: Message[];

  // Copy outputs
  copyOutputs: CopyOutput[];
  currentCopyOutput: CopyOutput | null;

  // Loading states
  loading: {
    projects: boolean;
    threads: boolean;
    messages: boolean;
    generating: boolean;
  };

  // Actions
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;

  fetchProjects: () => Promise<void>;
  createProject: (name: string) => Promise<Project>;
  selectProject: (projectId: string) => void;
  deleteProject: (projectId: string) => Promise<void>;

  fetchThreads: (projectId: string) => Promise<void>;
  createThread: (projectId: string, title?: string) => Promise<Thread>;
  selectThread: (threadId: string) => void;
  deleteThread: (threadId: string) => Promise<void>;

  fetchMessages: (threadId: string) => Promise<void>;
  sendMessage: (threadId: string, content: string, copyType: string) => Promise<void>;

  approveCopy: (copyId: string) => Promise<void>;
  fetchCopyOutputs: (threadId: string) => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  user: null,
  token: localStorage.getItem('token'),
  projects: [],
  currentProject: null,
  threads: [],
  currentThread: null,
  messages: [],
  copyOutputs: [],
  currentCopyOutput: null,
  loading: {
    projects: false,
    threads: false,
    messages: false,
    generating: false
  },

  // Actions
  setUser: (user) => set({ user }),
  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token });
  },

  login: async (email, password) => {
    const data = await api.auth.login(email, password);
    get().setToken(data.token);
    get().setUser(data.user);
  },

  register: async (email, password) => {
    const data = await api.auth.register(email, password);
    get().setToken(data.token);
    get().setUser(data.user);
  },

  logout: () => {
    get().setToken(null);
    get().setUser(null);
    set({ projects: [], currentProject: null, threads: [], currentThread: null, messages: [] });
  },

  fetchProjects: async () => {
    set((state) => ({ loading: { ...state.loading, projects: true } }));
    try {
      const projects = await api.projects.list();
      set({ projects });
    } finally {
      set((state) => ({ loading: { ...state.loading, projects: false } }));
    }
  },

  createProject: async (name) => {
    const project = await api.projects.create(name);
    set((state) => ({ projects: [project, ...state.projects] }));
    return project;
  },

  selectProject: (projectId) => {
    const project = get().projects.find((p) => p.id === projectId);
    if (project) {
      set({ currentProject: project });
    }
  },

  deleteProject: async (projectId) => {
    await api.projects.delete(projectId);
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== projectId),
      currentProject: state.currentProject?.id === projectId ? null : state.currentProject
    }));
  },

  fetchThreads: async (projectId) => {
    set((state) => ({ loading: { ...state.loading, threads: true } }));
    try {
      const threads = await api.chat.listThreads(projectId);
      set({ threads });
    } finally {
      set((state) => ({ loading: { ...state.loading, threads: false } }));
    }
  },

  createThread: async (projectId, title) => {
    const thread = await api.chat.createThread(projectId, title);
    set((state) => ({ threads: [thread, ...state.threads] }));
    return thread;
  },

  selectThread: (threadId) => {
    const thread = get().threads.find((t) => t.id === threadId);
    if (thread) {
      set({ currentThread: thread });
      get().fetchMessages(threadId);
      get().fetchCopyOutputs(threadId);
    }
  },

  deleteThread: async (threadId) => {
    await api.chat.deleteThread(threadId);
    set((state) => ({
      threads: state.threads.filter((t) => t.id !== threadId),
      currentThread: state.currentThread?.id === threadId ? null : state.currentThread
    }));
  },

  fetchMessages: async (threadId) => {
    set((state) => ({ loading: { ...state.loading, messages: true } }));
    try {
      const messages = await api.chat.getMessages(threadId);
      set({ messages });
    } finally {
      set((state) => ({ loading: { ...state.loading, messages: false } }));
    }
  },

  sendMessage: async (threadId, content, copyType) => {
    set((state) => ({ loading: { ...state.loading, generating: true } }));
    try {
      const result = await api.chat.sendMessage(threadId, content, copyType as any);

      // Refresh messages
      await get().fetchMessages(threadId);

      // Add copy output to list
      if (result.copyOutput) {
        set((state) => ({
          copyOutputs: [result.copyOutput, ...state.copyOutputs],
          currentCopyOutput: result.copyOutput
        }));
      }
    } finally {
      set((state) => ({ loading: { ...state.loading, generating: false } }));
    }
  },

  approveCopy: async (copyId) => {
    await api.copy.approve(copyId);

    // Update copy output in list
    set((state) => ({
      copyOutputs: state.copyOutputs.map((co) =>
        co.id === copyId ? { ...co, approved: true, approved_at: new Date().toISOString() } : co
      )
    }));
  },

  fetchCopyOutputs: async (threadId) => {
    const copyOutputs = await api.copy.listByThread(threadId);
    set({ copyOutputs });
  }
}));
