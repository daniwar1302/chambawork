import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "./prisma";
import type { Adapter } from "next-auth/adapters";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as Adapter,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth",
    error: "/auth/error",
  },
  providers: [
    // Phone + OTP Credentials Provider
    CredentialsProvider({
      id: "phone-otp",
      name: "Phone OTP",
      credentials: {
        phone: { label: "Phone", type: "tel" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.code) {
          throw new Error("Teléfono y código requeridos");
        }

        // Format phone - keep + prefix if present
        const formattedPhone = credentials.phone.startsWith("+")
          ? credentials.phone
          : `+${credentials.phone.replace(/\D/g, "")}`;
        const cleanPhone = credentials.phone.replace(/\D/g, "");

        // Test number bypass - no database verification needed
        const TEST_PHONE = "+11111111111";
        const TEST_CODE = "000000";
        
        if (formattedPhone === TEST_PHONE && credentials.code === TEST_CODE) {
          // Find or create test user
          let user = await prisma.user.findFirst({
            where: {
              OR: [
                { phone: formattedPhone },
                { phone: cleanPhone },
              ],
            },
          });

          if (!user) {
            user = await prisma.user.create({
              data: {
                phone: formattedPhone,
                phoneVerified: new Date(),
                role: "ESTUDIANTE",
              },
            });
          }

          return {
            id: user.id,
            phone: user.phone,
            name: user.name,
            email: user.email,
            role: user.role,
          };
        }

        // Find the verified verification record
        const verification = await prisma.phoneVerification.findFirst({
          where: {
            phone: cleanPhone,
            code: credentials.code,
            verified: true,
            expires: { gt: new Date(Date.now() - 5 * 60 * 1000) }, // Allow 5 min grace after verification
          },
        });

        if (!verification) {
          throw new Error("Código inválido o expirado");
        }

        // Find the user
        const user = await prisma.user.findFirst({
          where: {
            OR: [
              { phone: formattedPhone },
              { phone: cleanPhone },
            ],
          },
        });

        if (!user) {
          throw new Error("Usuario no encontrado");
        }

        // Clean up verification code
        await prisma.phoneVerification.delete({
          where: { id: verification.id },
        });

        return {
          id: user.id,
          phone: user.phone,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: "ESTUDIANTE" | "TUTOR" }).role || "ESTUDIANTE";
        token.phone = (user as { phone?: string }).phone;
      }
      
      // Handle session updates
      if (trigger === "update" && session) {
        token.role = session.role;
        token.name = session.name;
        token.phone = session.phone;
      }
      
      // Fetch latest user data
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true, name: true, phone: true },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.name = dbUser.name;
          token.phone = dbUser.phone;
        }
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "ESTUDIANTE" | "TUTOR";
        session.user.phone = token.phone as string | undefined;
      }
      return session;
    },
  },
};

// Type augmentation for NextAuth
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: "ESTUDIANTE" | "TUTOR";
      phone?: string | null;
    };
  }
  
  interface User {
    role: "ESTUDIANTE" | "TUTOR";
    phone?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "ESTUDIANTE" | "TUTOR";
    phone?: string | null;
  }
}
