'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Plus, Target, Briefcase, FileText } from 'lucide-react';

export default function CreateProjectPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        industry: '',
        justification: '',
        objectives: '',
        deliverables: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const res = await fetch('/api/projects', {
            method: 'POST',
            body: JSON.stringify(formData),
            headers: { 'Content-Type': 'application/json' }
        });

        if (res.ok) {
            router.push('/dashboard/professor/projects'); // Redirect to list (need to create list too or go to dashboard)
            // For now back to dashboard
            router.push('/dashboard/professor');
        } else {
            alert('Error creating project');
            setLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Plus className="w-8 h-8 text-blue-600" />
                Crear Nuevo Proyecto
            </h1>
            <p className="text-slate-500 mb-8">Define el marco pedagógico y lanza el proyecto al mercado de estudiantes.</p>

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-6">

                {/* Basic Info */}
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 border-b pb-2">Información General</h3>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Título del Proyecto</label>
                        <input name="title" required value={formData.title} onChange={handleChange} className="w-full p-2 border rounded-lg" placeholder="Ej. Sistema Fintech de Microcréditos" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Industria / Sector</label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                            <input name="industry" required value={formData.industry} onChange={handleChange} className="w-full pl-9 p-2 border rounded-lg" placeholder="Ej. Servicios Financieros, Salud, E-commerce" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Descripción Breve</label>
                        <textarea name="description" rows={2} required value={formData.description} onChange={handleChange} className="w-full p-2 border rounded-lg" placeholder="Resumen del alcance..." />
                    </div>
                </div>

                {/* Pedagogical Framework */}
                <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                        <Target className="w-5 h-5 text-indigo-600" /> Marco Pedagógico
                    </h3>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Justificación (El "Por Qué")</label>
                        <textarea name="justification" rows={3} required value={formData.justification} onChange={handleChange} className="w-full p-2 border rounded-lg" placeholder="¿Por qué es relevante este proyecto en la industria actual?" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Objetivos de Aprendizaje</label>
                        <textarea name="objectives" rows={3} required value={formData.objectives} onChange={handleChange} className="w-full p-2 border rounded-lg" placeholder="Competencias técnicas y blandas que desarrollará el estudiante..." />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">Productos Esperados (Entregables)</label>
                        <textarea name="deliverables" rows={3} required value={formData.deliverables} onChange={handleChange} className="w-full p-2 border rounded-lg" placeholder="Lista de artefactos a entregar (ej. MVP, Documentación, Pitch Deck)..." />
                    </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                    <button type="button" onClick={() => router.back()} className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg">Cancelar</button>
                    <button type="submit" disabled={loading} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center gap-2">
                        {loading && <Loader2 className="animate-spin w-4 h-4" />}
                        Lanzar Proyecto
                    </button>
                </div>
            </form>
        </div>
    );
}
