import { NextResponse } from "next/server";
import { sendOTP } from "@/lib/twilio";
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

    // Use the sendOTP function (handles test number and fallback)
    const result = await sendOTP(formattedPhone);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Error al enviar código" },
        { status: 500 }
      );
    }

    // For non-test numbers, store OTP in database for verification
    if (formattedPhone !== TEST_PHONE) {
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
    }

    return NextResponse.json({
      success: true,
      message: formattedPhone === TEST_PHONE 
        ? "Código enviado (número de prueba)" 
        : "Código enviado (modo desarrollo)",
    });
  } catch (error) {
    console.error("Error sending OTP:", error);
    return NextResponse.json(
      { error: "Error al enviar el código" },
      { status: 500 }
    );
  }
}
