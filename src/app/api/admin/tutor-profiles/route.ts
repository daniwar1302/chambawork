import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Check admin authorization via secret key
function isAuthorized(request: NextRequest): boolean {
  const adminKey = request.headers.get("x-admin-key");
  const expectedKey = process.env.ADMIN_SECRET_KEY;
  
  if (!expectedKey) {
    console.error("ADMIN_SECRET_KEY not set in environment");
    return false;
  }
  
  return adminKey === expectedKey;
}

// GET - List all tutor profiles
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  try {
    const profiles = await prisma.tutorProfile.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            image: true,
            profilePhoto: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(profiles);
  } catch (error) {
    console.error("Error fetching tutor profiles:", error);
    return NextResponse.json(
      { error: "Error al obtener perfiles de tutores" },
      { status: 500 }
    );
  }
}

// POST - Create new tutor profile (creates user if needed)
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { 
      name, 
      phone, 
      email,
      subjects, 
      gradeLevels, 
      bio, 
      education,
      experience,
      schedulingLink,
      isActive = true,
    } = body;

    if (!name || !phone || !subjects || subjects.length === 0) {
      return NextResponse.json(
        { error: "Nombre, teléfono y al menos una materia son requeridos" },
        { status: 400 }
      );
    }

    // Clean phone number
    const cleanPhone = phone.replace(/\D/g, "");

    // Check if user already exists
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { phone: cleanPhone },
          { phone: `+${cleanPhone}` },
        ],
      },
    });

    if (user) {
      // Check if user already has a tutor profile
      const existingProfile = await prisma.tutorProfile.findUnique({
        where: { userId: user.id },
      });

      if (existingProfile) {
        return NextResponse.json(
          { error: "Este usuario ya tiene un perfil de tutor" },
          { status: 409 }
        );
      }

      // Update user to tutor role
      user = await prisma.user.update({
        where: { id: user.id },
        data: { 
          name,
          role: "TUTOR",
        },
      });
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          name,
          phone: cleanPhone,
          email: email || null,
          role: "TUTOR",
          phoneVerified: new Date(),
        },
      });
    }

    // Create tutor profile
    const profile = await prisma.tutorProfile.create({
      data: {
        userId: user.id,
        subjects: subjects,
        gradeLevels: gradeLevels || ["SECUNDARIA", "PREPARATORIA"],
        bio: bio || null,
        education: education || null,
        experience: experience || null,
        schedulingLink: schedulingLink || null,
        isActive,
        isVerified: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    // Also add to approved tutors list if not already there
    const existingApproved = await prisma.approvedTutor.findUnique({
      where: { phone: cleanPhone },
    });

    if (!existingApproved) {
      await prisma.approvedTutor.create({
        data: {
          phone: cleanPhone,
          name,
          notes: "Creado desde admin panel",
          usedAt: new Date(),
        },
      });
    }

    return NextResponse.json(profile, { status: 201 });
  } catch (error) {
    console.error("Error creating tutor profile:", error);
    return NextResponse.json(
      { error: "Error al crear perfil de tutor" },
      { status: 500 }
    );
  }
}

// PUT - Update tutor profile
export async function PUT(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { 
      id,
      name,
      subjects, 
      gradeLevels, 
      bio, 
      education,
      experience,
      schedulingLink,
      isActive,
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID requerido" },
        { status: 400 }
      );
    }

    // Get the profile to find the user
    const existingProfile = await prisma.tutorProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existingProfile) {
      return NextResponse.json(
        { error: "Perfil no encontrado" },
        { status: 404 }
      );
    }

    // Update user name if provided
    if (name !== undefined) {
      await prisma.user.update({
        where: { id: existingProfile.userId },
        data: { name },
      });
    }

    // Update profile
    const profile = await prisma.tutorProfile.update({
      where: { id },
      data: {
        ...(subjects !== undefined && { subjects }),
        ...(gradeLevels !== undefined && { gradeLevels }),
        ...(bio !== undefined && { bio }),
        ...(education !== undefined && { education }),
        ...(experience !== undefined && { experience }),
        ...(schedulingLink !== undefined && { schedulingLink }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error updating tutor profile:", error);
    return NextResponse.json(
      { error: "Error al actualizar perfil" },
      { status: 500 }
    );
  }
}

// DELETE - Delete tutor profile
export async function DELETE(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID requerido" },
        { status: 400 }
      );
    }

    // Get the profile first to get user info
    const profile = await prisma.tutorProfile.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!profile) {
      return NextResponse.json(
        { error: "Perfil no encontrado" },
        { status: 404 }
      );
    }

    // Delete the profile
    await prisma.tutorProfile.delete({
      where: { id },
    });

    // Update user role back to ESTUDIANTE
    await prisma.user.update({
      where: { id: profile.userId },
      data: { role: "ESTUDIANTE" },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting tutor profile:", error);
    return NextResponse.json(
      { error: "Error al eliminar perfil" },
      { status: 500 }
    );
  }
}

