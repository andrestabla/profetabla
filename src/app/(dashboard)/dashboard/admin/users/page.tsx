import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { UserPlus, Search, Shield, User, GraduationCap, Eye, MoreHorizontal } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AdminUsersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
    const { q } = await searchParams;

    const users = await prisma.user.findMany({
        where: q ? {
            OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { email: { contains: q, mode: 'insensitive' } }
            ]
        } : {},
        orderBy: { createdAt: 'desc' }
    });

    const getRoleIcon = (role: string) => {
        switch (role) {
            case 'ADMIN': return <Shield className="w-4 h-4 text-purple-600" />;
            case 'TEACHER': return <GraduationCap className="w-4 h-4 text-blue-600" />;
            default: return <User className="w-4 h-4 text-slate-500" />;
        }
    };

    return (
        <div className="p-6">
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-slate-800">Gestión de Usuarios</h1>
                    <p className="text-slate-500">Administra cuentas, roles y accesos.</p>
                </div>
                <Link
                    href="/dashboard/admin/users/new"
                    className="bg-slate-900 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-black transition-colors"
                >
                    <UserPlus className="w-4 h-4" /> Nuevo Usuario
                </Link>
            </header>

            {/* BARRA DE BÚSQUEDA */}
            <form className="mb-6 relative max-w-lg">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                    name="q"
                    placeholder="Buscar por nombre o correo..."
                    defaultValue={q}
                    className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </form>

            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="p-4 font-bold text-slate-600 text-sm">Usuario</th>
                            <th className="p-4 font-bold text-slate-600 text-sm">Rol</th>
                            <th className="p-4 font-bold text-slate-600 text-sm">Estado</th>
                            <th className="p-4 font-bold text-slate-600 text-sm text-right">Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-slate-50 transition-colors group">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 font-bold">
                                            {user.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full rounded-full" /> : user.name?.[0]?.toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800">{user.name || 'Sin Nombre'}</p>
                                            <p className="text-xs text-slate-500">{user.email}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <div className="flex items-center gap-2 text-sm font-medium">
                                        {getRoleIcon(user.role)}
                                        {user.role}
                                    </div>
                                </td>
                                <td className="p-4">
                                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {user.isActive ? 'ACTIVO' : 'SUSPENDIDO'}
                                    </span>
                                </td>
                                <td className="p-4 text-right">
                                    <Link href={`/dashboard/admin/users/${user.id}`} className="inline-flex items-center justify-center p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                        <Eye className="w-5 h-5" />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {users.length === 0 && (
                    <div className="p-10 text-center text-slate-500">
                        No se encontraron usuarios.
                    </div>
                )}
            </div>
        </div>
    );
}
