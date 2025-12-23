import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const updateRoleSchema = z.object({
  role: z.enum(["ESTUDIANTE", "TUTOR"]),
});

// PATCH: Update user role
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validation = updateRoleSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Rol inválido" },
        { status: 400 }
      );
    }

    const { role } = validation.data;

    // If trying to become a tutor, check the whitelist
    if (role === "TUTOR") {
      // Get the user's phone number
      const currentUser = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { phone: true }
      });

      if (!currentUser?.phone) {
        return NextResponse.json(
          { error: "Se requiere un número de teléfono verificado para ser tutor" },
          { status: 400 }
        );
      }

      // Check if phone is in the approved tutors list
      const approvedTutor = await prisma.approvedTutor.findUnique({
        where: { phone: currentUser.phone }
      });

      if (!approvedTutor) {
        return NextResponse.json(
          { 
            error: "Tu número no está autorizado para registrarse como tutor. Contacta al equipo de Chamba para solicitar acceso.",
            code: "NOT_APPROVED"
          },
          { status: 403 }
        );
      }

      // Mark the approved tutor as used
      await prisma.approvedTutor.update({
        where: { phone: currentUser.phone },
        data: { usedAt: new Date() }
      });
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { role },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json(
      { error: "Error al actualizar rol" },
      { status: 500 }
    );
  }
}
