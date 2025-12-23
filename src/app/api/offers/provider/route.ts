import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { OfferStatus } from "@prisma/client";

// GET: Get offers for current provider
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Verify user is a provider
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { providerProfile: true },
    });

    if (!user || user.role !== "TUTOR") {
      return NextResponse.json(
        { error: "Solo tutores pueden acceder" },
        { status: 403 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");

    const whereClause: { providerId: string; status?: OfferStatus } = {
      providerId: session.user.id,
    };

    if (status && Object.values(OfferStatus).includes(status as OfferStatus)) {
      whereClause.status = status as OfferStatus;
    }

    const offers = await prisma.jobOffer.findMany({
      where: whereClause,
      include: {
        jobRequest: {
          include: {
            client: {
              select: {
                id: true,
                name: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: { sentAt: "desc" },
    });

    return NextResponse.json(offers);
  } catch (error) {
    console.error("Error fetching provider offers:", error);
    return NextResponse.json(
      { error: "Error al obtener ofertas" },
      { status: 500 }
    );
  }
}

