import { AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface ProjectRisk {
    id: string;
    title: string;
    studentName: string;
    progress: number;
    risk: 'LOW' | 'MEDIUM' | 'HIGH';
}

export function ProjectRiskCard({ project }: { project: ProjectRisk }) {
    const getRiskColor = () => {
        switch (project.risk) {
            case 'HIGH': return 'bg-red-50 border-red-200';
            case 'MEDIUM': return 'bg-orange-50 border-orange-200';
            default: return 'bg-white border-slate-200';
        }
    };

    return (
        <div className={`p-5 rounded-xl border ${getRiskColor()} shadow-sm`}>
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h4 className="font-bold text-slate-800">{project.title}</h4>
                    <p className="text-sm text-slate-500">{project.studentName}</p>
                </div>
                {project.risk === 'HIGH' && (
                    <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> En Riesgo
                    </span>
                )}
            </div>

            <div className="mb-2 flex justify-between text-xs text-slate-500 font-medium">
                <span>Progreso</span>
                <span>{project.progress}%</span>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                <div
                    className={`h-2.5 rounded-full ${project.progress < 30 ? 'bg-red-500' : 'bg-blue-600'
                        }`}
                    style={{ width: `${project.progress}%` }}
                ></div>
            </div>
        </div>
    );
}
