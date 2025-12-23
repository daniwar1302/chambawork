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

// GET - List all approved tutors
export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  try {
    const tutors = await prisma.approvedTutor.findMany({
      orderBy: { createdAt: "desc" },
    });

    // Get signup status for each tutor
    const tutorsWithStatus = await Promise.all(
      tutors.map(async (tutor) => {
        const user = await prisma.user.findFirst({
          where: { 
            phone: tutor.phone,
            role: "TUTOR"
          },
          select: { id: true, name: true, createdAt: true }
        });
        
        return {
          ...tutor,
          hasSignedUp: !!user,
          signedUpUser: user || null
        };
      })
    );

    return NextResponse.json(tutorsWithStatus);
  } catch (error) {
    console.error("Error fetching approved tutors:", error);
    return NextResponse.json(
      { error: "Error al obtener tutores aprobados" },
      { status: 500 }
    );
  }
}

// POST - Add new approved tutor
export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { phone, name, notes } = body;

    if (!phone) {
      return NextResponse.json(
        { error: "Número de teléfono requerido" },
        { status: 400 }
      );
    }

    // Clean phone number
    const cleanPhone = phone.replace(/\D/g, "");

    // Check if already exists
    const existing = await prisma.approvedTutor.findUnique({
      where: { phone: cleanPhone }
    });

    if (existing) {
      return NextResponse.json(
        { error: "Este número ya está en la lista" },
        { status: 409 }
      );
    }

    const tutor = await prisma.approvedTutor.create({
      data: {
        phone: cleanPhone,
        name: name || null,
        notes: notes || null,
      },
    });

    return NextResponse.json(tutor, { status: 201 });
  } catch (error) {
    console.error("Error adding approved tutor:", error);
    return NextResponse.json(
      { error: "Error al agregar tutor" },
      { status: 500 }
    );
  }
}

// PUT - Update approved tutor
export async function PUT(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { id, phone, name, notes } = body;

    if (!id) {
      return NextResponse.json(
        { error: "ID requerido" },
        { status: 400 }
      );
    }

    const cleanPhone = phone ? phone.replace(/\D/g, "") : undefined;

    const tutor = await prisma.approvedTutor.update({
      where: { id },
      data: {
        ...(cleanPhone && { phone: cleanPhone }),
        ...(name !== undefined && { name }),
        ...(notes !== undefined && { notes }),
      },
    });

    return NextResponse.json(tutor);
  } catch (error) {
    console.error("Error updating approved tutor:", error);
    return NextResponse.json(
      { error: "Error al actualizar tutor" },
      { status: 500 }
    );
  }
}

// DELETE - Remove approved tutor
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
    const phone = searchParams.get("phone");

    if (!id && !phone) {
      return NextResponse.json(
        { error: "ID o teléfono requerido" },
        { status: 400 }
      );
    }

    if (id) {
      await prisma.approvedTutor.delete({
        where: { id },
      });
    } else if (phone) {
      const cleanPhone = phone.replace(/\D/g, "");
      await prisma.approvedTutor.delete({
        where: { phone: cleanPhone },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting approved tutor:", error);
    return NextResponse.json(
      { error: "Error al eliminar tutor" },
      { status: 500 }
    );
  }
}

