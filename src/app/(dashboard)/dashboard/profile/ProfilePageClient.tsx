'use client';

import { useState } from 'react';
import { Briefcase, GraduationCap, Globe, Heart, Edit2, Plus } from 'lucide-react';
import { updateBasicProfileAction, addExperienceAction, addEducationAction, addLanguageAction } from '@/app/actions/profile-actions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ProfilePageClient({ user }: { user: any }) {
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [showExpModal, setShowExpModal] = useState(false);
    const [showEduModal, setShowEduModal] = useState(false);
    const [showLangModal, setShowLangModal] = useState(false);

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">

            {/* 1. HEADER DEL PERFIL (Datos SSO + Bio) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                <div className="px-8 pb-8">
                    <div className="relative flex justify-between items-end -mt-12 mb-6">
                        <div className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-white overflow-hidden">
                            {user.image ? <img src={user.image} alt={user.name} className="w-full h-full object-cover" /> : (
                                <div className="w-full h-full bg-slate-200 flex items-center justify-center text-3xl font-bold text-slate-400">
                                    {user.name?.[0]}
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => setIsEditingBio(!isEditingBio)}
                            className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg font-bold text-sm shadow-sm hover:bg-slate-50 flex items-center gap-2"
                        >
                            <Edit2 className="w-4 h-4" /> Editar Intro
                        </button>
                    </div>

                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{user.name}</h1>
                        <p className="text-slate-500 font-medium mb-4">{user.email} • {user.role}</p>

                        {/* Formulario de Edición Rápida (Bio, Edad) */}
                        {isEditingBio ? (
                            <form action={async (formData) => {
                                await updateBasicProfileAction(formData);
                                setIsEditingBio(false);
                            }} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4 animate-in fade-in">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Acerca de mí</label>
                                    <textarea name="bio" defaultValue={user.bio} rows={3} className="w-full p-2 border rounded-lg" placeholder="Cuéntanos un poco sobre ti..." />
                                </div>
                                <div className="flex gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Edad</label>
                                        <input name="age" type="number" defaultValue={user.age} className="p-2 border rounded-lg w-24" />
                                    </div>
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Intereses (Separados por coma)</label>
                                        <input name="interests" defaultValue={user.interests?.join(", ")} className="w-full p-2 border rounded-lg" placeholder="React, Diseño, AI..." />
                                    </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                    <button type="button" onClick={() => setIsEditingBio(false)} className="px-4 py-2 text-slate-600 font-medium">Cancelar</button>
                                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">Guardar Cambios</button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-3">
                                <p className="text-slate-700 leading-relaxed max-w-2xl">{user.bio || "Sin descripción aún."}</p>
                                <div className="flex flex-wrap gap-2">
                                    {user.interests?.map((tag: string, i: number) => (
                                        <span key={i} className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold flex items-center gap-1">
                                            <Heart className="w-3 h-3" /> {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* 2. EXPERIENCIA LABORAL */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <Briefcase className="w-5 h-5 text-blue-600" /> Experiencia
                        </h2>
                        <button onClick={() => setShowExpModal(true)} className="p-1.5 hover:bg-slate-100 rounded-lg text-blue-600 transition-colors">
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="space-y-6 relative border-l-2 border-slate-100 ml-3 pl-6">
                        {user.workExperiences.length === 0 && <p className="text-slate-400 text-sm italic">No hay experiencia registrada.</p>}

                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        {user.workExperiences.map((exp: any) => (
                            <div key={exp.id} className="relative">
                                <span className="absolute -left-[31px] top-1 w-4 h-4 rounded-full bg-blue-100 border-2 border-blue-500"></span>
                                <h3 className="font-bold text-slate-800">{exp.position}</h3>
                                <p className="text-sm font-medium text-slate-600">{exp.company}</p>
                                <p className="text-xs text-slate-400 mb-2">
                                    {new Date(exp.startDate).getFullYear()} - {exp.endDate ? new Date(exp.endDate).getFullYear() : 'Presente'}
                                </p>
                                <p className="text-sm text-slate-600">{exp.description}</p>
                            </div>
                        ))}
                    </div>

                    {/* Modal Simplificado Experiencia */}
                    {showExpModal && (
                        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                            <form action={async (fd) => { await addExperienceAction(fd); setShowExpModal(false); }} className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
                                <h3 className="text-lg font-bold">Agregar Experiencia</h3>
                                <input name="position" placeholder="Cargo (Ej: Dev Junior)" className="w-full border p-2 rounded" required />
                                <input name="company" placeholder="Empresa" className="w-full border p-2 rounded" required />
                                <div className="flex gap-2">
                                    <input type="date" name="startDate" className="w-full border p-2 rounded" required title="Inicio" />
                                    <input type="date" name="endDate" className="w-full border p-2 rounded" title="Fin (Dejar vacío si es actual)" />
                                </div>
                                <textarea name="description" placeholder="Descripción" className="w-full border p-2 rounded"></textarea>
                                <div className="flex justify-end gap-2">
                                    <button type="button" onClick={() => setShowExpModal(false)} className="px-4 py-2 bg-slate-100 rounded">Cancelar</button>
                                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded font-bold">Guardar</button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>

                {/* 3. EDUCACIÓN E IDIOMAS */}
                <div className="space-y-6">
                    {/* Educación */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <GraduationCap className="w-5 h-5 text-emerald-600" /> Estudios
                            </h2>
                            <button onClick={() => setShowEduModal(true)} className="p-1.5 hover:bg-slate-100 rounded-lg text-blue-600 transition-colors">
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="space-y-4">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {user.education.map((edu: any) => (
                                <div key={edu.id} className="pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                                    <h3 className="font-bold text-slate-800">{edu.institution}</h3>
                                    <p className="text-sm text-slate-600">{edu.degree} en {edu.fieldOfStudy}</p>
                                    <p className="text-xs text-slate-400">Graduado en {edu.endDate ? new Date(edu.endDate).getFullYear() : 'En curso'}</p>
                                </div>
                            ))}
                        </div>

                        {/* Modal Simplificado Edu */}
                        {showEduModal && (
                            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                                <form action={async (fd) => { await addEducationAction(fd); setShowEduModal(false); }} className="bg-white rounded-xl p-6 w-full max-w-md space-y-4">
                                    <h3 className="text-lg font-bold">Agregar Educación</h3>
                                    <input name="institution" placeholder="Institución" className="w-full border p-2 rounded" required />
                                    <input name="degree" placeholder="Título" className="w-full border p-2 rounded" required />
                                    <input name="fieldOfStudy" placeholder="Campo de Estudio" className="w-full border p-2 rounded" />
                                    <div className="flex gap-2">
                                        <input type="date" name="startDate" className="w-full border p-2 rounded" required title="Inicio" />
                                        <input type="date" name="endDate" className="w-full border p-2 rounded" title="Fin" />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button type="button" onClick={() => setShowEduModal(false)} className="px-4 py-2 bg-slate-100 rounded">Cancelar</button>
                                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded font-bold">Guardar</button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>

                    {/* Idiomas */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <Globe className="w-5 h-5 text-purple-600" /> Idiomas
                            </h2>
                            <button onClick={() => setShowLangModal(true)} className="p-1.5 hover:bg-slate-100 rounded-lg text-blue-600 transition-colors">
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                            {user.languages.map((lang: any) => (
                                <div key={lang.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                                    <span className="font-medium text-slate-700">{lang.name}</span>
                                    <span className="text-xs font-bold text-white bg-slate-400 px-2 py-0.5 rounded">{lang.level}</span>
                                </div>
                            ))}
                        </div>

                        {/* Modal Simplificado Lang */}
                        {showLangModal && (
                            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                                <form action={async (fd) => { await addLanguageAction(fd); setShowLangModal(false); }} className="bg-white rounded-xl p-6 w-full max-w-sm space-y-4">
                                    <h3 className="text-lg font-bold">Agregar Idioma</h3>
                                    <input name="name" placeholder="Idioma (Ej: Inglés)" className="w-full border p-2 rounded" required />
                                    <input name="level" placeholder="Nivel (Ej: B2)" className="w-full border p-2 rounded" required />
                                    <div className="flex justify-end gap-2">
                                        <button type="button" onClick={() => setShowLangModal(false)} className="px-4 py-2 bg-slate-100 rounded">Cancelar</button>
                                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded font-bold">Guardar</button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
