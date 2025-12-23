import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { providerProfileSchema } from "@/lib/validations";

// GET: Get provider profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const profile = await prisma.providerProfile.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching provider profile:", error);
    return NextResponse.json(
      { error: "Error al obtener perfil" },
      { status: 500 }
    );
  }
}

// POST: Create or update provider profile
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validation = providerProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    // Update user role to PROVEEDOR and create/update profile
    const [user, profile] = await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: { role: "TUTOR" },
      }),
      prisma.providerProfile.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          ...validation.data,
        },
        update: validation.data,
      }),
    ]);

    return NextResponse.json({ user, profile });
  } catch (error) {
    console.error("Error saving provider profile:", error);
    return NextResponse.json(
      { error: "Error al guardar perfil" },
      { status: 500 }
    );
  }
}

