"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LoadingPage } from "@/components/ui/loading";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, LogOut, Settings, ArrowLeft, GraduationCap } from "lucide-react";
import { signOut } from "next-auth/react";

export default function ProveedorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [, setHasProfile] = useState<boolean | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth?callbackUrl=/proveedor/perfil");
    }
  }, [status, router]);

  // Check if provider has a profile
  useEffect(() => {
    const checkProfile = async () => {
      if (session?.user?.id) {
        try {
          const res = await fetch("/api/provider/profile");
          const profile = await res.json();
          setHasProfile(!!profile);
          
          // Redirect to profile setup if no profile and not already on profile page
          if (!profile && pathname !== "/proveedor/perfil") {
            router.push("/proveedor/perfil");
          }
        } catch {
          setHasProfile(false);
        }
      }
    };
    
    if (session) {
      checkProfile();
    }
  }, [session, router, pathname]);

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
            <span className="text-xs bg-[#c41e3a]/10 text-[#c41e3a] px-2 py-0.5 rounded-full font-medium">
              Tutor
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Link href="/proveedor/dashboard">
              <Button 
                variant={pathname === "/proveedor/dashboard" ? "secondary" : "ghost"} 
                size="sm"
                className={pathname === "/proveedor/dashboard" ? "bg-[#c41e3a]/10 text-[#c41e3a]" : "text-gray-600 hover:text-[#c41e3a]"}
              >
                <Home className="w-4 h-4 mr-2" />
                Solicitudes
              </Button>
            </Link>
            <Link href="/proveedor/perfil">
              <Button 
                variant={pathname === "/proveedor/perfil" ? "secondary" : "ghost"} 
                size="sm"
                className={pathname === "/proveedor/perfil" ? "bg-[#c41e3a]/10 text-[#c41e3a]" : "text-gray-600 hover:text-[#c41e3a]"}
              >
                <Settings className="w-4 h-4 mr-2" />
                Mi perfil
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

