'use client';

import { createUserAction } from '../../actions';
import { UserPlus, ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export default function NewUserPage() {
    const [isSaving, setIsSaving] = useState(false);

    return (
        <div className="max-w-2xl mx-auto p-6">
            <Link href="/dashboard/admin/users" className="flex items-center gap-2 text-slate-500 hover:text-slate-800 mb-6 transition-colors">
                <ArrowLeft className="w-4 h-4" /> Volver a la Lista
            </Link>

            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
                    <UserPlus className="w-8 h-8 text-slate-900" /> Crear Nuevo Usuario
                </h1>
                <p className="text-slate-500 mt-2">
                    Registra un nuevo usuario manualmente. Se enviarán las credenciales (simulado).
                </p>
            </header>

            <form action={async (fd) => { setIsSaving(true); await createUserAction(fd); }} className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Nombre Completo *</label>
                        <input name="name" required placeholder="Ej: Juan Pérez" className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-slate-500 outline-none" />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Correo Electrónico *</label>
                        <input name="email" type="email" required placeholder="usuario@profetabla.com" className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-slate-500 outline-none" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Contraseña Inicial *</label>
                            <input name="password" type="password" required className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-slate-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-slate-700 mb-1">Rol *</label>
                            <select name="role" className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-slate-500 outline-none">
                                <option value="STUDENT">Estudiante</option>
                                <option value="TEACHER">Profesor</option>
                                <option value="ADMIN">Administrador</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                        type="submit"
                        disabled={isSaving}
                        className="bg-slate-900 hover:bg-black text-white font-bold py-3 px-8 rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                    >
                        {isSaving ? 'Creando...' : <><Save className="w-5 h-5" /> Registrar Usuario</>}
                    </button>
                </div>

            </form>
        </div>
    );
}
