import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { verifyOTP, isTwilioConfigured } from "@/lib/twilio";

// Test phone number for development
const TEST_PHONE = "+11111111111";
const TEST_CODE = "000000";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone, code } = body;

    if (!phone || !code) {
      return NextResponse.json(
        { error: "Teléfono y código requeridos" },
        { status: 400 }
      );
    }

    // Format phone number
    const formattedPhone = phone.startsWith("+")
      ? phone
      : `+${phone.replace(/\D/g, "")}`;
    
    // Clean version for database (just digits)
    const cleanPhone = phone.replace(/\D/g, "");

    let isValid = false;

    // TEST NUMBER: Accept test code for test phone
    if (formattedPhone === TEST_PHONE) {
      if (code !== TEST_CODE) {
        console.log("═══════════════════════════════════════════");
        console.log("📱 TEST NUMBER - VERIFICACIÓN FALLIDA");
        console.log(`Código ingresado: ${code}`);
        console.log(`Código esperado: ${TEST_CODE}`);
        console.log("═══════════════════════════════════════════");
        return NextResponse.json(
          { error: `Código inválido (usa ${TEST_CODE} para número de prueba)` },
          { status: 400 }
        );
      }
      
      console.log("═══════════════════════════════════════════");
      console.log("📱 TEST NUMBER - VERIFICACIÓN EXITOSA ✅");
      console.log(`Para: ${formattedPhone}`);
      console.log("═══════════════════════════════════════════");
      
      isValid = true;
    }
    // Use Twilio Verify if configured
    else if (isTwilioConfigured()) {
      const result = await verifyOTP(formattedPhone, code);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Código inválido" },
          { status: 400 }
        );
      }
      
      isValid = true;
    } else {
      // Fallback: Check database-stored OTP
      const verification = await prisma.phoneVerification.findFirst({
        where: {
          phone: cleanPhone,
          code,
          expires: { gt: new Date() },
          verified: false,
        },
      });

      if (!verification) {
        return NextResponse.json(
          { error: "Código inválido o expirado" },
          { status: 400 }
        );
      }

      // Mark as verified
      await prisma.phoneVerification.update({
        where: { id: verification.id },
        data: { verified: true },
      });

      isValid = true;
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "Verificación fallida" },
        { status: 400 }
      );
    }

    // Find or create user (store with + prefix for consistency)
    let user = await prisma.user.findUnique({
      where: { phone: formattedPhone },
    });

    // Also check without + prefix for backwards compatibility
    if (!user) {
      user = await prisma.user.findUnique({
        where: { phone: cleanPhone },
      });
      
      // Update to use formatted phone if found
      if (user) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { phone: formattedPhone, phoneVerified: new Date() },
        });
      }
    }

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          phone: formattedPhone,
          phoneVerified: new Date(),
          role: "ESTUDIANTE", // Default role
        },
      });
    } else {
      // Update phoneVerified timestamp
      user = await prisma.user.update({
        where: { id: user.id },
        data: { phoneVerified: new Date() },
      });
    }

    // Clean up old verification codes (for fallback mode)
    await prisma.phoneVerification.deleteMany({
      where: { phone: cleanPhone },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Error verifying OTP:", error);
    return NextResponse.json(
      { error: "Error al verificar el código" },
      { status: 500 }
    );
  }
}
