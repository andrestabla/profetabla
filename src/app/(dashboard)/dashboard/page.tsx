export default function DashboardPage() {
    return (
        <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-6">Bienvenido, Estudiante</h1>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Card: Resumen de Proyecto */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <h2 className="font-semibold text-slate-600 mb-2">Proyecto Activo</h2>
                    <p className="text-xl font-bold text-slate-800">Sistema de Gestión Escolar</p>
                    <p className="text-sm text-slate-400 mt-2">Última actualización: Hoy</p>
                </div>

                {/* Card: Tareas Pendientes */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <h2 className="font-semibold text-slate-600 mb-2">Tareas Pendientes</h2>
                    <p className="text-4xl font-bold text-amber-500">3</p>
                </div>

                {/* Card: Próxima Mentoría */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <h2 className="font-semibold text-slate-600 mb-2">Próxima Mentoría</h2>
                    <p className="text-lg font-medium text-slate-800">No programada</p>
                    <button className="text-blue-500 text-sm mt-2 hover:underline">Agendar ahora</button>
                </div>
            </div>
        </div>
    );
}
