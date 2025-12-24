import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { respondToOfferSchema } from "@/lib/validations";
import { sendSMS, generateClientConfirmationSMS, generateClientRejectionSMS } from "@/lib/twilio";

// POST: Provider responds to offer (accept/reject)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validation = respondToOfferSchema.safeParse({
      offerId: params.id,
      ...body,
    });

    if (!validation.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: validation.error.flatten() },
        { status: 400 }
      );
    }

    const { action } = validation.data;

    // Verify offer exists and belongs to provider
    const offer = await prisma.jobOffer.findUnique({
      where: { id: params.id },
      include: {
        jobRequest: {
          include: {
            client: true, // Include client for SMS notification
          },
        },
      },
    });

    // Get provider info for SMS
    const provider = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    });

    if (!offer) {
      return NextResponse.json(
        { error: "Oferta no encontrada" },
        { status: 404 }
      );
    }

    if (offer.providerId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    if (offer.status !== "ENVIADO") {
      return NextResponse.json(
        { error: "Esta oferta ya fue respondida" },
        { status: 400 }
      );
    }

    if (action === "accept") {
      // Accept offer: update offer status and job status
      const [updatedOffer] = await prisma.$transaction([
        prisma.jobOffer.update({
          where: { id: params.id },
          data: {
            status: "ACEPTADO",
            respondedAt: new Date(),
          },
        }),
        prisma.jobRequest.update({
          where: { id: offer.jobRequestId },
          data: { status: "CONFIRMADO" },
        }),
        // Reject all other pending offers for this job
        prisma.jobOffer.updateMany({
          where: {
            jobRequestId: offer.jobRequestId,
            id: { not: params.id },
            status: "ENVIADO",
          },
          data: {
            status: "RECHAZADO",
            respondedAt: new Date(),
          },
        }),
      ]);

      // Send SMS notification to client
      if (offer.jobRequest.client.phone) {
      const subjectLabel = offer.jobRequest.subject || "Tutoría";
      const smsBody = generateClientConfirmationSMS(
        offer.jobRequest.client.name || "Estudiante",
        provider?.name || "El tutor",
        subjectLabel
      );
        await sendSMS(offer.jobRequest.client.phone, smsBody);
      }

      return NextResponse.json({
        offer: updatedOffer,
        message: "¡Cita confirmada!",
      });
    } else {
      // Reject offer
      const updatedOffer = await prisma.jobOffer.update({
        where: { id: params.id },
        data: {
          status: "RECHAZADO",
          respondedAt: new Date(),
        },
      });

      // Check if there are other pending offers
      const pendingOffers = await prisma.jobOffer.count({
        where: {
          jobRequestId: offer.jobRequestId,
          status: "ENVIADO",
        },
      });

      // If no pending offers, set job back to BORRADOR so client can select another provider
      if (pendingOffers === 0) {
        await prisma.jobRequest.update({
          where: { id: offer.jobRequestId },
          data: { status: "RECHAZADO" },
        });

        // Send SMS notification to client that all providers rejected
        if (offer.jobRequest.client.phone) {
          const subjectLabel = offer.jobRequest.subject || "Tutoría";
          const smsBody = generateClientRejectionSMS(
            offer.jobRequest.client.name || "Estudiante",
            subjectLabel
          );
          await sendSMS(offer.jobRequest.client.phone, smsBody);
        }
      }

      return NextResponse.json({
        offer: updatedOffer,
        message: "Oferta rechazada",
      });
    }
  } catch (error) {
    console.error("Error responding to offer:", error);
    return NextResponse.json(
      { error: "Error al responder oferta" },
      { status: 500 }
    );
  }
}

