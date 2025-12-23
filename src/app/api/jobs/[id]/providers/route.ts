import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET: Get recommended providers for a job
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const job = await prisma.jobRequest.findUnique({
      where: { id: params.id },
      include: {
        offers: true,
      },
    });

    if (!job) {
      return NextResponse.json(
        { error: "Solicitud no encontrada" },
        { status: 404 }
      );
    }

    if (job.clientId !== session.user.id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    // Get query params for pagination/refresh
    const searchParams = request.nextUrl.searchParams;
    const skip = parseInt(searchParams.get("skip") || "0");
    const limit = parseInt(searchParams.get("limit") || "3");

    // Get providers who have already received offers for this job (to exclude)
    const existingOfferProviderIds = job.offers.map((o) => o.providerId);

    // Find active providers offering the requested service
    const providers = await prisma.user.findMany({
      where: {
        role: "TUTOR",
        id: { notIn: existingOfferProviderIds },
        providerProfile: {
          isActive: true,
          servicesOffered: { has: job.serviceType },
        },
      },
      include: {
        providerProfile: true,
      },
    });

    // Calculate distances if job has coordinates
    let providersWithDistance = providers.map((provider) => {
      let distance: number | null = null;
      
      if (job.lat && job.lng && provider.providerProfile) {
        // For MVP, we don't have provider coordinates, so use a random distance
        // In production, you'd store provider location and calculate real distance
        distance = Math.random() * 10 + 1; // 1-11 km random
      }

      return {
        id: provider.id,
        name: provider.name,
        phone: provider.phone,
        profile: provider.providerProfile,
        distance,
      };
    });

    // Sort by distance if available, otherwise randomize
    if (job.lat && job.lng) {
      providersWithDistance.sort((a, b) => {
        if (a.distance === null) return 1;
        if (b.distance === null) return -1;
        return a.distance - b.distance;
      });
    } else {
      // Shuffle for random selection
      providersWithDistance = providersWithDistance.sort(() => Math.random() - 0.5);
    }

    // Apply pagination
    const paginatedProviders = providersWithDistance.slice(skip, skip + limit);
    const hasMore = providersWithDistance.length > skip + limit;

    return NextResponse.json({
      providers: paginatedProviders,
      hasMore,
      total: providersWithDistance.length,
    });
  } catch (error) {
    console.error("Error fetching providers:", error);
    return NextResponse.json(
      { error: "Error al obtener tutores" },
      { status: 500 }
    );
  }
}

