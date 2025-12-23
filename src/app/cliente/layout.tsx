"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingPage } from "@/components/ui/loading";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, LogOut, ArrowLeft, GraduationCap } from "lucide-react";
import { signOut } from "next-auth/react";

export default function ClienteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth?callbackUrl=/cliente/nueva-solicitud");
    }
  }, [status, router]);

  if (status === "loading") {
    return <LoadingPage />;
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#c41e3a] rounded-lg flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">
                Chamba
              </span>
            </Link>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/cliente/nueva-solicitud">
              <Button variant="ghost" size="sm" className="text-gray-600 hover:text-[#c41e3a]">
                <Home className="w-4 h-4 mr-2" />
                Nueva solicitud
              </Button>
            </Link>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/" })}
              className="text-gray-600 hover:text-[#c41e3a]"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}

