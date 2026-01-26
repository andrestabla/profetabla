'use client';

import { useState, useEffect } from 'react';
import { Loader2, Search, Briefcase, Target, BookOpen, Send } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function MarketplacePage() {
    const router = useRouter();
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedProject, setSelectedProject] = useState<any | null>(null);
    const [motivation, setMotivation] = useState('');
    const [applying, setApplying] = useState(false);

    useEffect(() => {
        fetch('/api/projects/open')
            .then(res => res.json())
            .then(data => {
                setProjects(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleApply = async () => {
        if (!selectedProject) return;
        setApplying(true);

        try {
            const res = await fetch('/api/projects/apply', {
                method: 'POST',
                body: JSON.stringify({ projectId: selectedProject.id, motivation }),
                headers: { 'Content-Type': 'application/json' }
            });

            if (res.ok) {
                alert('Solicitud enviada con éxito');
                setSelectedProject(null);
                setMotivation('');
            } else {
                alert('Error al enviar solicitud');
            }
        } catch (e) {
            alert('Error de conexión');
        } finally {
            setApplying(false);
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>;

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                    <Search className="w-8 h-8 text-purple-600" />
                    Mercado de Proyectos
                </h1>
                <p className="text-slate-500">Explora proyectos disponibles y postúlate al que mejor se adapte a tus intereses.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                    <div key={project.id} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                        <div className="p-6 flex-1">
                            <div className="flex items-start justify-between mb-4">
                                <span className="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded-full font-bold flex items-center gap-1">
                                    <Briefcase className="w-3 h-3" /> {project.industry || 'General'}
                                </span>
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-2">{project.title}</h3>
                            <p className="text-slate-500 text-sm line-clamp-3 mb-4">{project.description}</p>

                            <div className="space-y-2">
                                <div className="flex items-start gap-2 text-sm text-slate-600">
                                    <Target className="w-4 h-4 mt-0.5 text-indigo-500 shrink-0" />
                                    <p className="line-clamp-2"><span className="font-semibold">Objetivos:</span> {project.objectives}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-xl">
                            <button
                                onClick={() => setSelectedProject(project)}
                                className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-2 rounded-lg transition-colors"
                            >
                                Ver Detalles y Aplicar
                            </button>
                        </div>
                    </div>
                ))}

                {projects.length === 0 && (
                    <div className="col-span-full py-12 text-center text-slate-400">
                        No hay proyectos abiertos en este momento.
                    </div>
                )}
            </div>

            {/* Application Modal */}
            {selectedProject && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl">
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">Aplicar a: {selectedProject.title}</h2>

                        <div className="my-4 space-y-4 max-h-60 overflow-y-auto bg-slate-50 p-4 rounded-lg text-sm text-slate-600">
                            <div>
                                <strong className="block text-slate-800">Justificación</strong>
                                {selectedProject.justification}
                            </div>
                            <div>
                                <strong className="block text-slate-800">Entregables</strong>
                                {selectedProject.deliverables}
                            </div>
                        </div>

                        <label className="block text-sm font-medium text-slate-700 mb-2">Carta de Motivación</label>
                        <textarea
                            className="w-full p-3 border border-slate-300 rounded-lg h-32 mb-4"
                            placeholder="Explica por qué eres el candidato ideal para este proyecto..."
                            value={motivation}
                            onChange={(e) => setMotivation(e.target.value)}
                        />

                        <div className="flex justify-end gap-3">
                            <button onClick={() => setSelectedProject(null)} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                            <button
                                onClick={handleApply}
                                disabled={applying || !motivation.trim()}
                                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-2 disabled:opacity-50"
                            >
                                {applying ? <Loader2 className="animate-spin w-4 h-4" /> : <Send className="w-4 h-4" />}
                                Enviar Solicitud
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
