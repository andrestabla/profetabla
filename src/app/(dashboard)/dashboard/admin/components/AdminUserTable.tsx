'use client';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Users } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function AdminUserTable({ users }: { users: any[] }) {
    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-slate-500">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                    <tr>
                        <th className="px-6 py-3">Usuario</th>
                        <th className="px-6 py-3">Email</th>
                        <th className="px-6 py-3">Rol</th>
                        <th className="px-6 py-3">Fecha Registro</th>
                        {/* <th className="px-6 py-3">Acciones</th> */}
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id} className="bg-white border-b hover:bg-slate-50">
                            <td className="px-6 py-4 font-medium text-slate-900 flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-xs font-bold text-slate-600">
                                    {user.name?.charAt(0)}
                                </div>
                                {user.name}
                            </td>
                            <td className="px-6 py-4">{user.email}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded text-xs font-bold ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                                        user.role === 'TEACHER' ? 'bg-blue-100 text-blue-800' :
                                            'bg-emerald-100 text-emerald-800'
                                    }`}>
                                    {user.role}
                                </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">{new Date(user.createdAt).toLocaleDateString()}</td>
                            {/* <td className="px-6 py-4">
                                <button className="font-medium text-blue-600 hover:underline">Editar</button>
                            </td> */}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
