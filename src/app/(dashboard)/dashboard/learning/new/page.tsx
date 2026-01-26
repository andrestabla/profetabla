'use client';

import { useState } from 'react';
import { createLearningObjectAction } from '../actions';
import { BookOpen, Save, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function NewLearningObjectPage() {
    const [isSaving, setIsSaving] = useState(false);

    return (
        <div className="max-w-3xl mx-auto p-6">
            <Link href="/dashboard/learning" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Volver a la Biblioteca
            </Link>

            <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Crear Nuevo Objeto de Aprendizaje</h1>
                        <p className="text-slate-500 text-sm">Define la estructura básica del contenido.</p>
                    </div>
                </div>

                <form action={async (fd) => { setIsSaving(true); await createLearningObjectAction(fd); }} className="space-y-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Título del OA</label>
                        <input
                            name="title"
                            required
                            placeholder="Ej: Fundamentos de React Avanzado"
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Materia / Categoría</label>
                        <input
                            name="subject"
                            required
                            placeholder="Ej: Desarrollo Frontend"
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Descripción</label>
                        <textarea
                            name="description"
                            rows={4}
                            placeholder="Describe brevemente qué aprenderá el estudiante..."
                            className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none"
                        ></textarea>
                    </div>

                    <div className="pt-4 flex justify-end">
                        <button
                            type="submit"
                            disabled={isSaving}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg flex items-center gap-2 transition-all disabled:opacity-50"
                        >
                            {isSaving ? 'Creando...' : <><Save className="w-5 h-5" /> Crear Objeto de Aprendizaje</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
