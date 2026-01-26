import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const token = req.nextauth.token as any;
        const pathname = req.nextUrl.pathname;
        const role = token?.role;

        // 1. Protege Rutas de Profesor
        if (pathname.startsWith("/dashboard/professor") && role !== "TEACHER" && role !== "ADMIN") {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }

        // 2. Protege Rutas de Admin
        if (pathname.startsWith("/dashboard/admin") && role !== "ADMIN") {
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }

        // 3. (Opcional) Protege rutas de Estudiante (si existieran exclusivas)
        // Por ahora /dashboard es compartido y /marketplace podría ser público para teachers también
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token, // Requiere estar logueado siempre
        },
        pages: {
            signIn: '/login',
        },
    }
);

export const config = { matcher: ["/dashboard/:path*"] };
