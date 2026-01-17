import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { ArrowLeft, Upload, FileText, MessageSquare, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { documents } from '../services/api';
import type { CopyType } from '../types';

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const {
    currentProject,
    threads,
    currentThread,
    messages,
    copyOutputs,
    currentCopyOutput,
    loading,
    selectProject,
    fetchThreads,
    createThread,
    selectThread,
    sendMessage,
    approveCopy
  } = useStore();

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');

  const [messageInput, setMessageInput] = useState('');
  const [selectedCopyType, setSelectedCopyType] = useState<CopyType>('ad_script');

  useEffect(() => {
    if (projectId) {
      selectProject(projectId);
      fetchThreads(projectId);
    }
  }, [projectId, selectProject, fetchThreads]);

  const handleUpload = async () => {
    if (!uploadFile || !projectId) return;

    setUploading(true);
    setUploadProgress('Uploading file...');

    try {
      await documents.upload(projectId, uploadFile);
      setUploadProgress('File uploaded successfully!');
      setTimeout(() => {
        setShowUploadModal(false);
        setUploadFile(null);
        setUploadProgress('');
      }, 1500);
    } catch (error: any) {
      setUploadProgress(`Error: ${error.response?.data?.error || 'Upload failed'}`);
    } finally {
      setUploading(false);
    }
  };

  const handleNewThread = async () => {
    if (!projectId) return;
    const thread = await createThread(projectId);
    selectThread(thread.id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !currentThread) return;

    const content = messageInput;
    setMessageInput('');

    await sendMessage(currentThread.id, content, selectedCopyType);
  };

  const handleApproveCopy = async (copyId: string) => {
    if (confirm('Approve this copy? It will be stored for future reference.')) {
      await approveCopy(copyId);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate('/')} className="btn btn-secondary flex items-center gap-2">
            <ArrowLeft size={16} />
            Back
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-white">{currentProject?.name}</h1>
          </div>
          <button onClick={() => setShowUploadModal(true)} className="btn btn-primary flex items-center gap-2">
            <Upload size={16} />
            Upload Documents
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Threads */}
        <aside className="w-64 bg-slate-800 border-r border-slate-700 overflow-y-auto">
          <div className="p-4">
            <button onClick={handleNewThread} className="btn btn-primary w-full flex items-center gap-2 justify-center">
              <MessageSquare size={16} />
              New Thread
            </button>
          </div>

          <div className="space-y-1 px-2">
            {threads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => selectThread(thread.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                  currentThread?.id === thread.id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                <div className="truncate text-sm font-medium">{thread.title}</div>
                <div className="text-xs opacity-60">
                  {new Date(thread.updated_at).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col">
          {currentThread ? (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {loading.messages ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="animate-spin text-slate-500" size={32} />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-slate-400">
                    Send a message to generate copy
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-2xl px-4 py-3 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-slate-800 text-slate-200'
                        }`}
                      >
                        <div className="text-sm whitespace-pre-wrap">{message.content}</div>
                        <div className="text-xs opacity-60 mt-1">
                          {new Date(message.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))
                )}

                {/* Copy Outputs */}
                {copyOutputs.map((copyOutput) => (
                  <div key={copyOutput.id} className="card space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="text-blue-500" size={20} />
                        <h3 className="font-semibold text-white">
                          {copyOutput.copy_type.replace('_', ' ').toUpperCase()}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <div
                          className={`px-3 py-1 rounded-full text-sm font-medium ${
                            copyOutput.quality_score >= 90
                              ? 'bg-green-900 text-green-300'
                              : copyOutput.quality_score >= 70
                              ? 'bg-yellow-900 text-yellow-300'
                              : 'bg-red-900 text-red-300'
                          }`}
                        >
                          Score: {copyOutput.quality_score}/100
                        </div>
                        {copyOutput.approved && (
                          <CheckCircle className="text-green-500" size={20} />
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-900 rounded-lg p-4">
                      <pre className="text-sm text-slate-200 whitespace-pre-wrap font-mono">
                        {JSON.stringify(copyOutput.content, null, 2)}
                      </pre>
                    </div>

                    {!copyOutput.approved && copyOutput.quality_score >= 90 && (
                      <button
                        onClick={() => handleApproveCopy(copyOutput.id)}
                        className="btn btn-primary w-full"
                      >
                        Approve & Store for Future Use
                      </button>
                    )}

                    {copyOutput.quality_score < 90 && (
                      <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 flex items-start gap-2">
                        <AlertCircle className="text-yellow-500 mt-0.5" size={16} />
                        <div className="text-sm text-yellow-200">
                          This copy did not meet the 90/100 quality threshold. Consider revising or generating new copy.
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {loading.generating && (
                  <div className="flex items-center gap-3 text-blue-400">
                    <Loader2 className="animate-spin" size={20} />
                    <span>Generating copy...</span>
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="border-t border-slate-700 p-4 bg-slate-800">
                <form onSubmit={handleSendMessage} className="space-y-3">
                  <div className="flex gap-2">
                    <select
                      value={selectedCopyType}
                      onChange={(e) => setSelectedCopyType(e.target.value as CopyType)}
                      className="input max-w-xs"
                    >
                      <option value="ad_script">Ad Script (15-60s video)</option>
                      <option value="ad_copy">Ad Copy (Text ads)</option>
                      <option value="email">Email</option>
                      <option value="landing_page">Landing Page</option>
                      <option value="vsl">VSL (Video Sales Letter)</option>
                    </select>
                  </div>
                  <div className="flex gap-2">
                    <textarea
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      placeholder="Describe what you need... (e.g., 'Create a 30-second ad for my fitness program targeting busy professionals')"
                      className="input flex-1 min-h-[80px] resize-none"
                      disabled={loading.generating}
                    />
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={loading.generating || !messageInput.trim()}
                    >
                      Generate
                    </button>
                  </div>
                </form>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full text-slate-400">
              Select or create a thread to start
            </div>
          )}
        </main>
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-4">Upload Document</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Select File (.txt, .md, .pdf)
              </label>
              <input
                type="file"
                accept=".txt,.md,.pdf,text/plain,text/markdown,application/pdf"
                onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                className="w-full text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-700 file:text-white file:cursor-pointer hover:file:bg-slate-600"
              />
            </div>

            {uploadFile && (
              <div className="bg-slate-900 rounded-lg p-3 mb-4">
                <div className="text-sm text-slate-300">
                  <strong>Selected:</strong> {uploadFile.name}
                </div>
                <div className="text-xs text-slate-400">
                  {(uploadFile.size / 1024).toFixed(2)} KB
                </div>
              </div>
            )}

            {uploadProgress && (
              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3 mb-4 text-sm text-blue-200">
                {uploadProgress}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleUpload}
                className="btn btn-primary flex-1"
                disabled={!uploadFile || uploading}
              >
                {uploading ? 'Uploading...' : 'Upload'}
              </button>
              <button
                onClick={() => {
                  setShowUploadModal(false);
                  setUploadFile(null);
                  setUploadProgress('');
                }}
                className="btn btn-secondary flex-1"
                disabled={uploading}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
