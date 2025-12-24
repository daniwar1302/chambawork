// Simple OTP and SMS fallback (no Twilio dependency)
// This file provides the same interface as before but without Twilio SDK

// Test phone number for development/testing
const TEST_PHONE = "+11111111111";
const TEST_CODE = "000000";
const DEV_CODE = "123456";

// Check if "Twilio" is configured (always false now, but kept for compatibility)
export const isTwilioConfigured = (): boolean => {
  return false;
};

/**
 * Send OTP - Simulated (no real SMS)
 * Always succeeds and logs to console
 */
export async function sendOTP(
  phone: string
): Promise<{ success: boolean; error?: string }> {
  // Ensure phone has + prefix
  const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;

  // Test phone number - always succeeds
  if (formattedPhone === TEST_PHONE) {
    console.log("═══════════════════════════════════════════");
    console.log("📱 TEST NUMBER - OTP SIMULADO");
    console.log(`Para: ${formattedPhone}`);
    console.log(`Código de prueba: ${TEST_CODE}`);
    console.log("═══════════════════════════════════════════");
    return { success: true };
  }

  // Development fallback - always succeeds
  console.log("═══════════════════════════════════════════");
  console.log("📱 OTP SIMULADO");
  console.log(`Para: ${formattedPhone}`);
  console.log(`Código de desarrollo: ${DEV_CODE}`);
  console.log("═══════════════════════════════════════════");
  return { success: true };
}

/**
 * Verify OTP - Simulated (no real verification)
 * Accepts test code or dev code
 */
export async function verifyOTP(
  phone: string,
  code: string
): Promise<{ success: boolean; error?: string }> {
  // Ensure phone has + prefix
  const formattedPhone = phone.startsWith("+") ? phone : `+${phone}`;

  // Test phone number - accept test code
  if (formattedPhone === TEST_PHONE) {
    const isValid = code === TEST_CODE;
    console.log("═══════════════════════════════════════════");
    console.log("📱 TEST NUMBER - VERIFICACIÓN");
    console.log(`Para: ${formattedPhone}`);
    console.log(`Código ingresado: ${code}`);
    console.log(`Resultado: ${isValid ? "✅ Válido" : "❌ Inválido"}`);
    console.log("═══════════════════════════════════════════");
    return {
      success: isValid,
      error: isValid ? undefined : `Código inválido (usa ${TEST_CODE} para número de prueba)`,
    };
  }

  // Development fallback - accept dev code
  const isValid = code === DEV_CODE;
  console.log("═══════════════════════════════════════════");
  console.log("📱 OTP VERIFICACIÓN SIMULADA");
  console.log(`Para: ${formattedPhone}`);
  console.log(`Código ingresado: ${code}`);
  console.log(`Código esperado: ${DEV_CODE}`);
  console.log(`Resultado: ${isValid ? "✅ Válido" : "❌ Inválido"}`);
  console.log("═══════════════════════════════════════════");
  
  return {
    success: isValid,
    error: isValid ? undefined : `Código inválido (usa ${DEV_CODE} en desarrollo)`,
  };
}

/**
 * Send SMS - Simulated (no real SMS)
 * Always succeeds and logs to console
 */
export async function sendSMS(
  to: string,
  message: string
): Promise<{ success: boolean; error?: string }> {
  const formattedPhone = to.startsWith("+") ? to : `+${to}`;
  
  console.log("═══════════════════════════════════════════");
  console.log("📱 SMS SIMULADO");
  console.log(`Para: ${formattedPhone}`);
  console.log(`Mensaje: ${message}`);
  console.log("═══════════════════════════════════════════");
  
  return { success: true };
}

// SMS message generators (kept for compatibility)
export function generateProviderNewRequestSMS(
  providerName: string,
  studentName: string,
  subject: string
): string {
  return `¡Hola ${providerName}! 👋\n\n${studentName} necesita ayuda con ${subject}.\n\nRevisa tu dashboard para más detalles: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/proveedor/dashboard\n\n¡Gracias por ser parte de Chamba Tutorías! 🎓`;
}

export function generateClientConfirmationSMS(
  clientName: string,
  providerName: string,
  subject: string
): string {
  return `¡Hola ${clientName}! 🎉\n\n${providerName} ha aceptado tu solicitud de tutoría en ${subject}.\n\nRevisa los detalles en tu dashboard: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/cliente/solicitudes\n\n¡Que tengas una excelente sesión! 📚`;
}

export function generateClientRejectionSMS(
  clientName: string,
  providerName: string,
  subject: string
): string {
  return `¡Hola ${clientName}!\n\nLamentamos informarte que ${providerName} no está disponible para tu solicitud de tutoría en ${subject} en este momento.\n\nNo te preocupes, puedes buscar otros tutores disponibles en: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}\n\n¡Gracias por usar Chamba Tutorías! 📚`;
}
