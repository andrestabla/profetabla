'use client';

import { useState } from 'react';
import { Users, Settings, Terminal, Database } from 'lucide-react';
import { AdminUserTable } from './components/AdminUserTable';
import { ConfigForm } from './components/ConfigForm';
import { SystemLogsViewer } from './components/SystemLogsViewer';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function AdminDashboardPage({ users, config, logs }: { users: any[], config: any, logs: any[] }) {
    const [activeTab, setActiveTab] = useState<'USERS' | 'CONFIG' | 'LOGS'>('USERS');

    return (
        <div className="max-w-7xl mx-auto p-6">
            <header className="mb-8">
                <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
                    <Settings className="w-8 h-8 text-slate-900" /> Panel de Administración
                </h1>
                <p className="text-slate-500">Gestión global de usuarios, integraciones y sistema.</p>
            </header>

            {/* Navegación de Pestañas */}
            <div className="flex gap-4 mb-8 border-b border-slate-200">
                <button
                    onClick={() => setActiveTab('USERS')}
                    className={`pb-3 px-4 font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'USERS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
                >
                    <Users className="w-4 h-4" /> Gestión de Usuarios
                </button>
                <button
                    onClick={() => setActiveTab('CONFIG')}
                    className={`pb-3 px-4 font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'CONFIG' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
                >
                    <Database className="w-4 h-4" /> Integraciones y APIs
                </button>
                <button
                    onClick={() => setActiveTab('LOGS')}
                    className={`pb-3 px-4 font-bold flex items-center gap-2 border-b-2 transition-all ${activeTab === 'LOGS' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}
                >
                    <Terminal className="w-4 h-4" /> Logs del Sistema
                </button>
            </div>

            {/* ÁREA DE CONTENIDO */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm min-h-[500px] p-6">
                {activeTab === 'USERS' && <AdminUserTable users={users} />}
                {activeTab === 'CONFIG' && <ConfigForm config={config} />}
                {activeTab === 'LOGS' && <SystemLogsViewer logs={logs} />}
            </div>
        </div>
    );
}
