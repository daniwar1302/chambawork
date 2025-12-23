import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Validation schema for tutor profile
const tutorProfileSchema = z.object({
  subjects: z.array(z.string()).min(1, "Selecciona al menos una materia"),
  gradeLevels: z.array(z.string()).min(1, "Selecciona al menos un nivel"),
  education: z.string().optional(),
  experience: z.string().optional(),
  schedulingLink: z.string().url().optional().or(z.literal("")),
  bio: z.string().max(500).optional(),
  isActive: z.boolean().optional(),
});

// GET: Get tutor profile
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const profile = await prisma.tutorProfile.findUnique({
      where: { userId: session.user.id },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching tutor profile:", error);
    return NextResponse.json(
      { error: "Error al obtener perfil" },
      { status: 500 }
    );
  }
}

// POST: Create or update tutor profile
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validation = tutorProfileSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { subjects, gradeLevels, education, experience, schedulingLink, bio, isActive } = validation.data;

    // Update user role to TUTOR and create/update profile
    const [user, profile] = await prisma.$transaction([
      prisma.user.update({
        where: { id: session.user.id },
        data: { role: "TUTOR" },
      }),
      prisma.tutorProfile.upsert({
        where: { userId: session.user.id },
        create: {
          userId: session.user.id,
          subjects: subjects as any,
          gradeLevels: gradeLevels as any,
          education: education || null,
          experience: experience || null,
          schedulingLink: schedulingLink || null,
          bio: bio || null,
          isActive: isActive ?? true,
        },
        update: {
          subjects: subjects as any,
          gradeLevels: gradeLevels as any,
          education: education || null,
          experience: experience || null,
          schedulingLink: schedulingLink || null,
          bio: bio || null,
          isActive: isActive ?? true,
        },
      }),
    ]);

    return NextResponse.json({ user, profile });
  } catch (error) {
    console.error("Error saving tutor profile:", error);
    return NextResponse.json(
      { error: "Error al guardar perfil" },
      { status: 500 }
    );
  }
}

