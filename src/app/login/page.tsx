import { prisma } from '@/lib/prisma';
import { LoginForm } from '@/components/auth/LoginForm';
import Link from 'next/link';
import { LayoutDashboard } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function LoginPage() {
    const config = await prisma.platformConfig.findUnique({ where: { id: 'global-config' } });

    const layout = config?.loginLayout || 'SPLIT';
    const bgUrl = config?.loginBgUrl || 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=2671&auto=format&fit=crop';
    const message = config?.loginMessage || 'Bienvenido a Profe Tabla';
    const logoUrl = config?.logoUrl;
    const institutionName = config?.institutionName || 'Profe Tabla';

    // 1. SPLIT LAYOUT
    if (layout === 'SPLIT') {
        return (
            <div className="min-h-screen flex bg-white">
                {/* Left Side - Image */}
                <div className="hidden lg:flex lg:w-1/2 relative bg-slate-900">
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-60 mix-blend-overlay"
                        style={{ backgroundImage: `url(${bgUrl})` }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />

                    <div className="relative z-10 p-16 flex flex-col justify-between h-full text-white">
                        <div className="flex items-center gap-3">
                            {/* Logo removed as per request */}
                        </div>
                        <div>
                            <h1 className="text-4xl font-bold mb-4">{message}</h1>
                            <p className="text-lg opacity-80">Gestión integral de proyectos educativos, mentorías y seguimiento curricular.</p>
                        </div>
                    </div>
                </div>

                {/* Right Side - Form */}
                <div className="flex-1 flex items-center justify-center p-8 lg:p-16">
                    <div className="w-full max-w-md space-y-8">
                        <div className="text-center lg:text-left mb-6">
                            {logoUrl ? (
                                <img
                                    src={logoUrl}
                                    alt={institutionName}
                                    className="h-16 mx-auto lg:mx-0 mb-6 object-contain"
                                />
                            ) : (
                                <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mx-auto lg:mx-0 mb-6">
                                    <LayoutDashboard className="w-6 h-6" />
                                </div>
                            )}
                            <h2 className="text-2xl font-bold text-slate-800">Iniciar Sesión</h2>
                            <p className="text-slate-500 mt-2">Accede a tu cuenta institucional</p>
                        </div>

                        <LoginForm />

                        <div className="text-center text-sm text-slate-500">
                            ¿No tienes cuenta?{' '}
                            <Link href="/register" className="text-primary font-bold hover:underline">
                                Regístrate
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // 2. CENTERED LAYOUT
    return (
        <div
            className="min-h-screen flex items-center justify-center bg-slate-900 bg-cover bg-center relative"
            style={{ backgroundImage: `url(${bgUrl})` }}
        >
            <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm" />

            <div className="bg-white/95 backdrop-blur-xl p-8 rounded-3xl shadow-2xl w-full max-w-md relative z-10 border border-white/20">
                <div className="text-center mb-8">
                    {logoUrl ? (
                        <img src={logoUrl} alt={institutionName} className="h-12 mx-auto mb-4 object-contain" />
                    ) : (
                        <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                            <LayoutDashboard className="w-6 h-6" />
                        </div>
                    )}
                    <h1 className="text-2xl font-bold text-slate-800">{message}</h1>
                    <p className="text-slate-500 text-sm mt-1">Ingresa a tu cuenta institucional</p>
                </div>

                <LoginForm />

                <div className="mt-6 pt-6 border-t border-slate-200 text-center text-sm text-slate-500">
                    ¿No tienes cuenta?{' '}
                    <Link href="/register" className="text-primary font-bold hover:underline">
                        Regístrate
                    </Link>
                </div>
            </div>
        </div>
    );
}

