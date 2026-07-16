import { type DefaultSession, type NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/server/db";
import { rateLimit, clientIp } from "@/lib/rate-limit";

declare module "next-auth" {
  interface Session {
    user: { id: string; role: string } & DefaultSession["user"];
  }
}
declare module "next-auth/jwt" {
  interface JWT { id: string; role: string }
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        username: { label: "Usuario", type: "text" },
        password: { label: "Contraseña", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.username || !credentials?.password) return null;

        // Anti fuerza bruta: límite por IP (15 intentos / 10 min).
        const ip = clientIp(req?.headers as Record<string, string | string[] | undefined> | undefined);
        if (!rateLimit(`login:${ip}`, 15, 10 * 60 * 1000).ok) return null;

        const user = await db.user.findUnique({
          where: { username: credentials.username as string },
        });
        if (!user) return null;

        const valid = await bcrypt.compare(credentials.password as string, user.password);
        if (!valid) return null;

        if (user.role !== "admin" && !user.approved) return null;

        return { id: user.id, name: user.username, email: user.email ?? "", role: user.role } as never;
      },
    }),
  ],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.role = (user as unknown as { role: string }).role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id   = token.id;
      session.user.role = token.role;
      return session;
    },
  },
  pages: { signIn: "/login" },
  // Sesión larga y "rolling": se renueva cada 24 h de uso, así el usuario
  // queda logueado mientras entre al menos una vez cada 90 días.
  session: { strategy: "jwt", maxAge: 90 * 24 * 60 * 60, updateAge: 24 * 60 * 60 },
  jwt: { maxAge: 90 * 24 * 60 * 60 },
  secret: process.env.NEXTAUTH_SECRET,
};
