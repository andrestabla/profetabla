'use client';

import { useState } from 'react';
import { Users, Plus, UserPlus, LogOut, Shield } from 'lucide-react';
import { createTeamAction, joinTeamAction, leaveTeamAction } from '@/app/actions/team-actions';
import { useRouter } from 'next/navigation';
import { useModals } from './ModalProvider';

interface Team {
    id: string;
    name: string;
    members: { id: string; name: string | null; avatarUrl: string | null }[];
}

interface TeamManagementProps {
    teams: Team[];
    projectId: string;
    currentUser: { id: string; role: string };
    projectType: string;
}

export function TeamManagement({ teams, projectId, currentUser, projectType }: TeamManagementProps) {
    const { showConfirm } = useModals();
    const [isCreating, setIsCreating] = useState(false);
    const [newTeamName, setNewTeamName] = useState('');
    const router = useRouter();

    const handleCreateTeam = async () => {
        if (!newTeamName.trim()) return;
        await createTeamAction(projectId, newTeamName);
        setNewTeamName('');
        setIsCreating(false);
        router.refresh();
    };

    const handleJoinTeam = async (teamId: string) => {
        await joinTeamAction(teamId);
        router.refresh();
    };

    const handleLeaveTeam = async (teamId: string) => {
        const confirmLeave = await showConfirm(
            "¿Salir del equipo?",
            "Esta acción te retirará del equipo actual.",
            "warning"
        );
        if (!confirmLeave) return;
        await leaveTeamAction(teamId);
        router.refresh();
    }

    const myTeam = teams.find(t => t.members.some(m => m.id === currentUser.id));

    return (
        <div className="space-y-8">
            <header className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Users className="w-6 h-6 text-blue-600" /> Equipos de Trabajo
                    </h2>
                    <p className="text-slate-500 text-sm">Gestiona la conformación de grupos para este {projectType.toLowerCase()}.</p>
                </div>
                {!isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-blue-700 transition"
                    >
                        <Plus className="w-4 h-4" /> Nuevo Equipo
                    </button>
                )}
            </header>

            {isCreating && (
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-center gap-4 animate-in fade-in slide-in-from-top-2">
                    <input
                        autoFocus
                        value={newTeamName}
                        onChange={(e) => setNewTeamName(e.target.value)}
                        placeholder="Nombre del equipo (ej: Los Innovadores)"
                        className="flex-1 px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    <div className="flex gap-2">
                        <button onClick={() => setIsCreating(false)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg">Cancelar</button>
                        <button onClick={handleCreateTeam} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Crear</button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Individual/No Team Card - Optional logic could go here */}

                {teams.map(team => {
                    const isMember = team.members.some(m => m.id === currentUser.id);
                    return (
                        <div key={team.id} className={`bg-white rounded-2xl p-6 border transition-all ${isMember ? 'border-blue-500 shadow-md ring-1 ring-blue-500' : 'border-slate-200 hover:border-blue-300'}`}>
                            <div className="flex justify-between items-start mb-4">
                                <h3 className="font-bold text-lg text-slate-800">{team.name}</h3>
                                {isMember ? (
                                    <span className="bg-blue-100 text-blue-700 text-xs font-bold px-2 py-1 rounded-full">Tu Equipo</span>
                                ) : (
                                    <span className="bg-slate-100 text-slate-500 text-xs font-bold px-2 py-1 rounded-full">{team.members.length} miembros</span>
                                )}
                            </div>

                            <div className="space-y-3 mb-6">
                                {team.members.length > 0 ? team.members.map(member => (
                                    <div key={member.id} className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-xs">
                                            {member.name ? member.name[0] : '?'}
                                        </div>
                                        <span className="text-sm text-slate-700">{member.name}</span>
                                    </div>
                                )) : (
                                    <p className="text-sm text-slate-400 italic">Sin miembros aún.</p>
                                )}
                            </div>

                            <div className="pt-4 border-t border-slate-100">
                                {isMember ? (
                                    <button
                                        onClick={() => handleLeaveTeam(team.id)}
                                        className="w-full py-2 flex items-center justify-center gap-2 text-red-500 hover:bg-red-50 rounded-lg font-bold text-sm transition"
                                    >
                                        <LogOut className="w-4 h-4" /> Salir del Equipo
                                    </button>
                                ) : (
                                    /* Only allow joining if not in a team OR enable switching logic handled by action */
                                    <button
                                        onClick={() => handleJoinTeam(team.id)}
                                        disabled={!!myTeam} // Disable if already in another team? Logic depends on preference
                                        className="w-full py-2 flex items-center justify-center gap-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-lg font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <UserPlus className="w-4 h-4" /> Unirme
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
