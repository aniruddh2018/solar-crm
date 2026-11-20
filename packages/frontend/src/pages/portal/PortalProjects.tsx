import { useEffect, useState } from 'react';
import api from '../../api/client';
import type { Project, ProjectMilestone } from '../../types';
import { CheckCircle, Circle } from 'lucide-react';

export default function PortalProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/projects').then(({ data }) => setProjects(data.projects)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-8 text-gray-500">Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">My Projects</h1>
      {projects.length === 0 ? (
        <div className="card text-center py-8 text-gray-400">No projects found</div>
      ) : (
        <div className="space-y-4">
          {projects.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const [milestones, setMilestones] = useState<ProjectMilestone[]>([]);

  useEffect(() => {
    api.get(`/projects/${project.id}`).then(({ data }) => setMilestones(data.milestones));
  }, [project.id]);

  const progress = milestones.length > 0
    ? Math.round((milestones.filter((m) => m.completed).length / milestones.length) * 100)
    : 0;

  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="font-semibold text-lg">{project.name}</h3>
          <p className="text-sm text-gray-500">{project.system_size_kw} kW system | {project.panel_count} panels</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
          project.status === 'completed' ? 'bg-green-100 text-green-700' :
          project.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
          'bg-gray-100 text-gray-600'
        }`}>{project.status.replace('_', ' ')}</span>
      </div>

      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Progress</span>
          <span className="text-sm text-gray-500">{progress}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="bg-solar-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="mt-4 space-y-1">
        {milestones.map((m) => (
          <div key={m.id} className="flex items-center gap-2 text-sm">
            {m.completed ? (
              <CheckCircle className="w-4 h-4 text-green-500" />
            ) : (
              <Circle className="w-4 h-4 text-gray-300" />
            )}
            <span className={m.completed ? 'line-through text-gray-400' : ''}>{m.title}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
