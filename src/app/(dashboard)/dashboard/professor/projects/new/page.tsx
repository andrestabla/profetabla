'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Briefcase, Save, Loader2 } from 'lucide-react';
import { createProjectAction } from '@/app/actions/project-actions'; // We need to create this

export default function CreateProjectPage() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    async function onSubmit(formData: FormData) {
        setIsSubmitting(true);
        try {
            await createProjectAction(formData);
            // Action should redirect or we redirect here
            // router.push('/dashboard/professor/projects'); // handled by action usually
        } catch (error) {
            console.error(error);
            alert("Error al crear el proyecto");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <div className="max-w-3xl mx-auto p-6">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                    <Briefcase className="w-8 h-8 text-blue-600" /> Crear Nuevo Proyecto
                </h1>
                <p className="text-slate-500">Define los detalles del proyecto pedagógico.</p>
            </header>

            <form action={onSubmit} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 space-y-6">
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Título del Proyecto</label>
                    <input
                        name="title"
                        required
                        placeholder="Ej: Desarrollo de App Fintech"
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Industria / Sector</label>
                    <input
                        name="industry"
                        placeholder="Ej: Finanzas, Salud, Educación..."
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Descripción General</label>
                    <textarea
                        name="description"
                        rows={3}
                        required
                        placeholder="Describe el propósito y alcance del proyecto..."
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    />
                </div>

                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Justificación Pedagógica</label>
                    <textarea
                        name="justification"
                        rows={3}
                        required
                        placeholder="¿Por qué es importante este proyecto para el estudiante?..."
                        className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Objetivos de Aprendizaje</label>
                        <textarea
                            name="objectives"
                            rows={4}
                            placeholder="- Aprender React&#10;- Gestionar Bases de Datos..."
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Entregables Esperados</label>
                        <textarea
                            name="deliverables"
                            rows={4}
                            placeholder="- Código Fuente&#10;- Documentación..."
                            className="w-full px-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        />
                    </div>
                </div>

                <div className="pt-4 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="px-6 py-3 text-slate-600 font-bold hover:bg-slate-50 rounded-xl transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all flex items-center gap-2 disabled:opacity-70"
                    >
                        {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                        Publicar Proyecto
                    </button>
                </div>
            </form>
        </div>
    );
}
