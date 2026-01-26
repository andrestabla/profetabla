import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          Profe Tabla
        </h1>
        <p className="text-xl text-slate-400">Sistema de Gestión de Proyectos Educativos</p>

        <div className="pt-8">
          <Link
            href="/dashboard"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
          >
            Entrar al Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
