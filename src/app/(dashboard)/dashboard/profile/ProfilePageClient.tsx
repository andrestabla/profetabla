'use client';

import { useState, useEffect } from 'react';
import { Briefcase, GraduationCap, Globe, Heart, Edit2, Plus, ShieldCheck, X, Trash2, AlertCircle, History } from 'lucide-react';
import { updateBasicProfileAction, addExperienceAction, addEducationAction, addLanguageAction } from '@/app/actions/profile-actions';
import { deleteAccountAction } from '@/app/actions/user-actions';
import { signOut } from 'next-auth/react';
import { useModals } from '@/components/ModalProvider';
import { getUserActivityLogs } from '@/app/actions/log-actions';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function ProfilePageClient({ user }: { user: any }) {
    const { showAlert } = useModals();
    const [isEditingBio, setIsEditingBio] = useState(false);
    const [showExpModal, setShowExpModal] = useState(false);
    const [showEduModal, setShowEduModal] = useState(false);
    const [showLangModal, setShowLangModal] = useState(false);
    const [showPolicies, setShowPolicies] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmEmail, setConfirmEmail] = useState("");
    const [showActivityHistory, setShowActivityHistory] = useState(false);

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-6">

            {/* 1. HEADER DEL PERFIL (Datos SSO + Bio) */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative">
                <div className="h-32 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                <div className="px-8 pb-8">
                    <div className="relative flex justify-between items-end -mt-12 mb-6">
                        <div className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-white overflow-hidden">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
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

            {/* 1.5. TABS DE NAVEGACIÓN */}
            <div className="flex gap-4 border-b border-slate-200">
                <button
                    className={`pb-4 px-2 font-bold text-sm border-b-2 transition-colors ${!showActivityHistory ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    onClick={() => setShowActivityHistory(false)}
                >
                    Información Personal
                </button>
                <button
                    className={`pb-4 px-2 font-bold text-sm border-b-2 transition-colors ${showActivityHistory ? 'border-primary text-primary' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
                    onClick={() => setShowActivityHistory(true)}
                >
                    Historial de Actividad
                </button>
            </div>

            {showActivityHistory ? (
                <ActivityHistoryTab userId={user.id} />
            ) : (
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
            )}

            {/* 4. POLÍTICAS DE PRIVACIDAD Y DATOS */}
            <div className="bg-slate-50 border-t border-slate-100 p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 text-slate-700">
                    <div className={`p-2 rounded-lg ${user.policiesAccepted ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                        <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="font-bold text-sm">Políticas de Uso y Privacidad</p>
                        <p className="text-xs text-slate-500">
                            {user.policiesAccepted
                                ? `Aceptadas el ${new Date(user.policiesAcceptedAt).toLocaleDateString()}`
                                : 'Pendiente de aceptación'}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowPolicies(true)}
                    className="text-blue-600 hover:text-blue-700 font-bold text-sm underline underline-offset-4"
                >
                    Revisar Términos y Condiciones
                </button>
                {showPolicies && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 p-4">
                        <div className="bg-white rounded-3xl w-full max-w-2xl relative flex flex-col max-h-[90vh]">
                            <button onClick={() => setShowPolicies(false)} className="absolute top-4 right-4 p-2 hover:bg-slate-100 rounded-full z-10">
                                <X className="w-5 h-5 text-slate-500" />
                            </button>
                            <div className="flex-1 overflow-auto p-8 custom-scrollbar space-y-8">
                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <ShieldCheck className="w-10 h-10" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-slate-900">Políticas de Uso Pedagógico</h2>
                                    <p className="text-slate-500">Consulta los términos que rigen el uso ético de Profe Tabla.</p>
                                </div>

                                <section className="space-y-4">
                                    <h3 className="font-bold text-slate-800 text-lg">1. Finalidad Educativa</h3>
                                    <div className="space-y-3">
                                        <p className="text-slate-600 text-sm leading-relaxed">
                                            Apoyo exclusivo a procesos pedagógicos, académicos y formativos (Gestión de proyectos, interacción docente-estudiante, seguimiento y evaluación).
                                        </p>
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Normativa:</p>
                                            <p className="text-[11px] text-slate-500 italic">Ley 1581 (2012), Decreto 1377 (2013), RGPD (UE), Recomendaciones UNESCO IA.</p>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <h3 className="font-bold text-slate-800 text-lg">2. Uso No Comercial</h3>
                                    <div className="space-y-3">
                                        <p className="text-slate-600 text-sm leading-relaxed">
                                            Prohibida la comercialización, venta o cesión de datos para publicidad o marketing. La información es propiedad de la comunidad educativa.
                                        </p>
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Normativa:</p>
                                            <p className="text-[11px] text-slate-500 italic">Ley 1581 (2012), Convención Niños (ONU), Privacy by Design.</p>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-4">
                                    <h3 className="font-bold text-slate-800 text-lg">3. Protección de Datos</h3>
                                    <div className="space-y-3">
                                        <p className="text-slate-600 text-sm leading-relaxed">
                                            Garantizamos privacidad, confidencialidad y seguridad. Los usuarios conservan derechos de acceso, rectificación y supresión.
                                        </p>
                                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Normativa:</p>
                                            <p className="text-[11px] text-slate-500 italic">Ley 1581 y Decreto 1074 (Colombia), RGPD (UE).</p>
                                        </div>
                                    </div>
                                </section>

                                <section className="space-y-2 border-t pt-4">
                                    <h3 className="font-bold text-slate-800 text-lg">4. Enfoque Ético</h3>
                                    <p className="text-slate-600 text-sm leading-relaxed italic">
                                        Adoptamos un enfoque ético asegurando que la tecnología sirva al aprendizaje humano y respete la autonomía de los usuarios.
                                    </p>
                                </section>

                                <button onClick={() => setShowPolicies(false)} className="w-full mt-8 py-3 bg-slate-900 text-white font-bold rounded-xl shadow-lg hover:bg-black transition-all">Entendido</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 5. ZONA DE PELIGRO - ELIMINAR CUENTA */}
            <div className="bg-red-50/50 border border-red-100 rounded-2xl p-8 space-y-4">
                <div className="flex items-center gap-3 text-red-600 mb-2">
                    <AlertCircle className="w-6 h-6" />
                    <h2 className="text-lg font-bold uppercase tracking-wider">Zona de Peligro</h2>
                </div>
                <p className="text-slate-600 text-sm">
                    Al eliminar tu cuenta, todos tus datos personales, proyectos, tareas, comentarios y participaciones serán borrados permanentemente. Esta acción es <strong>irreversible</strong> y se realiza bajo el ejercicio de tu derecho al olvido según la normativa vigente.
                </p>
                <div className="pt-2">
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="bg-white border-2 border-red-200 text-red-600 px-6 py-3 rounded-xl font-bold hover:bg-red-600 hover:text-white hover:border-red-600 transition-all active:scale-95 flex items-center gap-2"
                    >
                        <Trash2 className="w-5 h-5" /> Eliminar mi cuenta permanentemente
                    </button>
                </div>

                {showDeleteModal && (
                    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                        <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
                            <div className="bg-red-600 p-8 text-white text-center">
                                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Trash2 className="w-8 h-8" />
                                </div>
                                <h3 className="text-2xl font-bold">¿Estás absolutamente seguro?</h3>
                                <p className="text-red-100 text-sm mt-2 font-medium">Esta acción no se puede deshacer.</p>
                            </div>

                            <div className="p-8 space-y-6">
                                <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-800 text-xs leading-relaxed">
                                    <p className="font-bold flex items-center gap-2 mb-1">
                                        <AlertCircle className="w-4 h-4" /> RECUERDA:
                                    </p>
                                    Se perderá el acceso a todos los proyectos inscritos, certificados generados y registros académicos vinculados a este correo.
                                </div>

                                <div className="space-y-3">
                                    <label className="text-sm font-medium text-slate-700 block text-center">
                                        Para confirmar, escribe tu correo electrónico abajo:
                                        <br />
                                        <span className="font-bold text-slate-400 mt-1 inline-block">{user.email}</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={confirmEmail}
                                        onChange={(e) => setConfirmEmail(e.target.value)}
                                        placeholder="Escribe tu correo aquí"
                                        className="w-full p-3 border-2 border-slate-100 rounded-xl focus:border-red-500 outline-none transition-all text-center font-medium"
                                    />
                                </div>

                                <div className="flex flex-col gap-3">
                                    <button
                                        disabled={confirmEmail !== user.email || isDeleting}
                                        onClick={async () => {
                                            setIsDeleting(true);
                                            try {
                                                await deleteAccountAction();
                                                await signOut({ callbackUrl: "/" });
                                            } catch (error) {
                                                console.error("Error al eliminar cuenta:", error);
                                                setIsDeleting(false);
                                                await showAlert("Error", "Hubo un error al intentar eliminar la cuenta.", "error");
                                            }
                                        }}
                                        className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-2xl shadow-lg disabled:opacity-30 transition-all flex items-center justify-center gap-2"
                                    >
                                        {isDeleting ? (
                                            <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                        ) : (
                                            "Eliminar permanentemente"
                                        )}
                                    </button>
                                    <button
                                        onClick={() => { setShowDeleteModal(false); setConfirmEmail(""); }}
                                        disabled={isDeleting}
                                        className="w-full py-3 text-slate-500 font-bold hover:bg-slate-50 rounded-2xl transition-all"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function ActivityHistoryTab({ userId }: { userId: string }) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        getUserActivityLogs(userId)
            .then(setLogs)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [userId]);

    if (loading) {
        return <div className="p-12 text-center text-slate-400">Cargando historial...</div>;
    }

    if (logs.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <History className="w-8 h-8 text-slate-300" />
                </div>
                <h3 className="text-slate-900 font-bold text-lg">Sin actividad reciente</h3>
                <p className="text-slate-500">Tus acciones en la plataforma aparecerán aquí.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-6 border-b border-slate-100">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <History className="w-5 h-5 text-slate-500" /> Últimas Acciones
                </h2>
            </div>
            <div className="divide-y divide-slate-100">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                {logs.map((log: any) => (
                    <div key={log.id} className="p-4 hover:bg-slate-50 transition-colors flex gap-4 items-start">
                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${log.action === 'LOGIN' ? 'bg-green-500' :
                            log.action === 'REGISTER' ? 'bg-blue-500' :
                                'bg-slate-300'
                            }`} />
                        <div className="flex-1">
                            <div className="flex justify-between items-start">
                                <p className="font-bold text-slate-800 text-sm">{log.action}</p>
                                <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full whitespace-nowrap">
                                    {new Date(log.createdAt).toLocaleString()}
                                </span>
                            </div>
                            <p className="text-slate-600 text-sm mt-0.5">{log.description}</p>
                            {log.metadata && (
                                <details className="mt-2">
                                    <summary className="text-[10px] text-slate-400 cursor-pointer hover:text-slate-600 font-medium">Ver detalles técnicos</summary>
                                    <pre className="mt-1 bg-slate-900 text-slate-300 p-2 rounded text-[10px] overflow-x-auto">
                                        {JSON.stringify(log.metadata, null, 2)}
                                    </pre>
                                </details>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
