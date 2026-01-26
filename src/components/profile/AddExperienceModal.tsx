'use client';

import { useState } from 'react';
import { X, Briefcase, Calendar, Save, Loader2 } from 'lucide-react';
import { addExperienceAction } from '@/app/actions/profile-actions';

export function AddExperienceModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const [isCurrentlyWorking, setIsCurrentlyWorking] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">

            {/* Contenedor del Modal */}
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">

                {/* Cabecera */}
                <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                    <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-blue-600" /> Agregar Experiencia
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Formulario */}
                <form
                    action={async (formData) => {
                        setIsSubmitting(true);
                        await addExperienceAction(formData);
                        setIsSubmitting(false);
                        onClose(); // Cerrar al terminar
                    }}
                    className="p-6 space-y-5"
                >
                    {/* Cargo y Empresa */}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cargo / Puesto</label>
                            <input
                                name="position"
                                required
                                placeholder="Ej: Desarrollador Frontend Senior"
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Empresa</label>
                            <input
                                name="company"
                                required
                                placeholder="Ej: Microsoft, Startup Inc..."
                                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            />
                        </div>
                    </div>

                    {/* Fechas */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha de Inicio</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                                <input
                                    type="date"
                                    name="startDate"
                                    required
                                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fecha de Fin</label>
                            <div className="relative">
                                <Calendar className={`absolute left-3 top-2.5 w-4 h-4 ${isCurrentlyWorking ? 'text-slate-200' : 'text-slate-400'}`} />
                                <input
                                    type="date"
                                    name="endDate"
                                    disabled={isCurrentlyWorking}
                                    className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm disabled:bg-slate-50 disabled:text-slate-300 disabled:border-slate-200"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Checkbox "Trabajo aquí actualmente" */}
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            id="currentJob"
                            checked={isCurrentlyWorking}
                            onChange={(e) => setIsCurrentlyWorking(e.target.checked)}
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                        />
                        <label htmlFor="currentJob" className="text-sm text-slate-600 cursor-pointer select-none">
                            Trabajo aquí actualmente
                        </label>
                    </div>

                    {/* Descripción */}
                    <div>
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descripción de responsabilidades</label>
                        <textarea
                            name="description"
                            rows={3}
                            placeholder="Lideré el equipo de UI, implementé mejoras de rendimiento..."
                            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none text-sm"
                        />
                    </div>

                    {/* Botones de Acción */}
                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 text-slate-600 font-bold hover:bg-slate-50 rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg shadow-lg shadow-blue-500/20 transition-all flex justify-center items-center gap-2 disabled:opacity-70"
                        >
                            {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                            {isSubmitting ? 'Guardando...' : 'Guardar Experiencia'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
