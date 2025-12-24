import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { createJobOfferSchema } from "@/lib/validations";
import { sendSMS, generateProviderNewRequestSMS } from "@/lib/twilio";

// POST: Create offer (client selects provider)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validation = createJobOfferSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { jobRequestId, providerId } = validation.data;

    // Verify job belongs to client
    const job = await prisma.tutoringRequest.findUnique({
      where: { id: jobRequestId },
      include: {
        student: {
          select: {
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Solicitud no encontrada" },
        { status: 404 }
      );
    }

    if (job.studentId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Verify provider exists and is active
    const provider = await prisma.user.findUnique({
      where: { id: providerId },
      include: { tutorProfile: true },
    });

    if (!provider || !provider.tutorProfile?.isActive) {
      return NextResponse.json(
        { error: "Tutor no disponible" },
        { status: 400 }
      );
    }

    // Check if offer already exists
    const existingOffer = await prisma.sessionOffer.findFirst({
      where: {
        tutoringRequestId: jobRequestId,
        tutorId: providerId,
      },
    });

    if (existingOffer) {
      return NextResponse.json(
        { error: "Ya existe una oferta para este tutor" },
        { status: 400 }
      );
    }

    // Create offer and update job status in transaction
    const [offer] = await prisma.$transaction([
      prisma.sessionOffer.create({
        data: {
          tutoringRequestId: jobRequestId,
          tutorId: providerId,
          status: "ENVIADO",
        },
      }),
      prisma.tutoringRequest.update({
        where: { id: jobRequestId },
        data: { status: "PENDIENTE" },
      }),
    ]);

    // Send SMS notification to provider (simulated - logs to console)
    if (provider.phone) {
      const subjectLabel = job.subject || "Tutoría";
      const smsBody = generateProviderNewRequestSMS(
        provider.name || "Tutor",
        job.student?.name || "Estudiante",
        subjectLabel
      );
      
      await sendSMS(provider.phone, smsBody);
    } else {
      console.log("Provider has no phone number, skipping SMS");
    }

    return NextResponse.json(offer, { status: 201 });
  } catch (error) {
    console.error("Error creating offer:", error);
    return NextResponse.json(
      { error: "Error al crear oferta" },
      { status: 500 }
    );
  }
}

