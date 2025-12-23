import { NextResponse } from "next/server";
import { sendOTP, isTwilioConfigured } from "@/lib/twilio";
import prisma from "@/lib/prisma";

// Test phone number for development
const TEST_PHONE = "+11111111111";

// Generate a 6-digit OTP (for fallback mode)
function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { phone } = body;

    if (!phone) {
      return NextResponse.json(
        { error: "Número de teléfono requerido" },
        { status: 400 }
      );
    }

    // Format phone number - keep the + prefix if present, otherwise add it
    // The phone input sends numbers like "+525512345678"
    const formattedPhone = phone.startsWith("+") 
      ? phone 
      : `+${phone.replace(/\D/g, "")}`;
    
    // Clean version for database storage (just digits)
    const cleanPhone = phone.replace(/\D/g, "");

    // Validate minimum length (country code + local number)
    if (cleanPhone.length < 10 || cleanPhone.length > 15) {
      return NextResponse.json(
        { error: "Número de teléfono inválido" },
        { status: 400 }
      );
    }

    // TEST NUMBER: Always succeed for test phone
    if (formattedPhone === TEST_PHONE) {
      console.log("═══════════════════════════════════════════");
      console.log("📱 TEST NUMBER - OTP SIMULADO");
      console.log(`Para: ${formattedPhone}`);
      console.log("Código de prueba: 000000");
      console.log("═══════════════════════════════════════════");
      
      return NextResponse.json({
        success: true,
        message: "Código enviado (número de prueba)",
        isTestNumber: true,
      });
    }

    // Use Twilio Verify if configured
    if (isTwilioConfigured()) {
      const result = await sendOTP(formattedPhone);
      
      if (!result.success) {
        return NextResponse.json(
          { error: result.error || "Error al enviar código" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: "Código enviado por SMS",
        useTwilio: true,
      });
    }

    // Fallback: Use database-stored OTP (for development)
    const code = generateOTP();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Delete any existing verification codes for this phone
    await prisma.phoneVerification.deleteMany({
      where: { phone: cleanPhone },
    });

    // Create new verification code
    await prisma.phoneVerification.create({
      data: {
        phone: cleanPhone,
        code,
        expires,
      },
    });

    // Log the code in development (simulated SMS)
    console.log("═══════════════════════════════════════════");
    console.log("📱 OTP SIMULADO (Twilio no configurado)");
    console.log(`Para: ${formattedPhone}`);
    console.log(`Código: ${code}`);
    console.log("═══════════════════════════════════════════");

    return NextResponse.json({
      success: true,
      message: "Código enviado (modo desarrollo)",
      useTwilio: false,
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return NextResponse.json(
      { error: "Error al enviar el código" },
      { status: 500 }
    );
  }
}
