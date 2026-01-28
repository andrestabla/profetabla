import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

import { prisma } from "@/lib/prisma";
import GoogleProvider from "next-auth/providers/google";

interface RouteContext {
    params: Promise<{ nextauth: string[] }>
}

const handler = async (req: Request, context: RouteContext) => {
    const config = await prisma.platformConfig.findUnique({ where: { id: 'global-config' } });

    const currentOptions = {
        ...authOptions,
        providers: [...authOptions.providers]
    };

    if (config?.googleClientId && config?.googleClientSecret) {
        currentOptions.providers.push(
            GoogleProvider({
                clientId: config.googleClientId,
                clientSecret: config.googleClientSecret,
            })
        );
    }

    // @ts-expect-error - NextAuth type definition for App Router wrapper
    return NextAuth(req, context, currentOptions);
};

export { handler as GET, handler as POST };
