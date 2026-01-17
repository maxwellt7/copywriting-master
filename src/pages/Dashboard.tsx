import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Plus, FolderOpen, LogOut, Upload } from 'lucide-react';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, projects, loading, logout, fetchProjects, createProject, selectProject } = useStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [projectName, setProjectName] = useState('');

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) return;

    const project = await createProject(projectName);
    setProjectName('');
    setShowCreateModal(false);
    selectProject(project.id);
    navigate(`/project/${project.id}`);
  };

  const handleProjectClick = (projectId: string) => {
    selectProject(projectId);
    navigate(`/project/${projectId}`);
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="bg-slate-800 border-b border-slate-700">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Copywriting Master</h1>
            <p className="text-slate-400 text-sm">{user?.email}</p>
          </div>
          <button onClick={logout} className="btn btn-secondary flex items-center gap-2">
            <LogOut size={16} />
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Your Projects</h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary flex items-center gap-2"
          >
            <Plus size={16} />
            New Project
          </button>
        </div>

        {loading.projects ? (
          <div className="text-center py-12">
            <div className="text-slate-400">Loading projects...</div>
          </div>
        ) : projects.length === 0 ? (
          <div className="card text-center py-12">
            <Upload className="mx-auto mb-4 text-slate-600" size={48} />
            <h3 className="text-lg font-medium text-white mb-2">No projects yet</h3>
            <p className="text-slate-400 mb-6">Create your first project to get started</p>
            <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
              Create Project
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <button
                key={project.id}
                onClick={() => handleProjectClick(project.id)}
                className="card hover:bg-slate-700 transition-colors text-left"
              >
                <div className="flex items-start gap-3">
                  <FolderOpen className="text-blue-500 mt-1" size={24} />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium mb-1 truncate">{project.name}</h3>
                    <p className="text-slate-400 text-sm">
                      Created {new Date(project.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </main>

      {/* Create Project Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="card max-w-md w-full">
            <h3 className="text-xl font-semibold text-white mb-4">Create New Project</h3>
            <form onSubmit={handleCreateProject}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Project Name
                </label>
                <input
                  type="text"
                  className="input"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="My Marketing Campaign"
                  autoFocus
                  required
                />
              </div>
              <div className="flex gap-2">
                <button type="submit" className="btn btn-primary flex-1">
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
