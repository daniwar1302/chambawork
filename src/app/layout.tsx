import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { SessionProvider } from "@/components/providers/session-provider";
import { Toaster } from "@/components/ui/toaster";

const outfit = Outfit({ 
  subsets: ["latin"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Chamba | Tutorías gratuitas en línea",
  description: "Conectamos estudiantes con tutores voluntarios para tutorías gratuitas en línea. Matemáticas, ciencias, inglés y más.",
  keywords: ["tutorías", "clases", "voluntarios", "gratuito", "matemáticas", "ciencias", "inglés", "educación"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${outfit.variable} font-sans antialiased`}>
        <SessionProvider>
          {children}
          <Toaster />
        </SessionProvider>
      </body>
    </html>
  );
}
