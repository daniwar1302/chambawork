import Twilio from "twilio";

// Twilio configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Twilio client only if credentials exist
const client = accountSid && authToken ? Twilio(accountSid, authToken) : null;

// Test phone number for development/testing
const TEST_PHONE = "+11111111111";
const TEST_CODE = "000000";

// Check if Twilio is configured
export const isTwilioConfigured = (): boolean => {
  return !!(client && verifyServiceSid);
};

/**
 * Send OTP via Twilio Verify
 * Falls back to console.log in development if Twilio not configured
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

  // Development fallback
  if (!client || !verifyServiceSid) {
    console.log("═══════════════════════════════════════════");
    console.log("📱 OTP SIMULADO (Twilio no configurado)");
    console.log(`Para: ${formattedPhone}`);
    console.log("Código: 123456 (usar este en desarrollo)");
    console.log("═══════════════════════════════════════════");
    return { success: true };
  }

  try {
    const verification = await client.verify.v2
      .services(verifyServiceSid)
      .verifications.create({
        to: formattedPhone,
        channel: "sms",
      });

    console.log(`📱 OTP enviado a ${formattedPhone}: ${verification.status}`);
    return { success: verification.status === "pending" };
  } catch (error) {
    console.error("Twilio Verify error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error al enviar código";
    return { success: false, error: errorMessage };
  }
}

/**
 * Verify OTP via Twilio Verify
 * Falls back to accepting '123456' in development if Twilio not configured
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

  // Development fallback - accept 123456
  if (!client || !verifyServiceSid) {
    const isValid = code === "123456";
    console.log("═══════════════════════════════════════════");
    console.log("📱 OTP VERIFICACIÓN (Twilio no configurado)");
    console.log(`Para: ${formattedPhone}`);
    console.log(`Código: ${code}`);
    console.log(`Resultado: ${isValid ? "✅ Válido" : "❌ Inválido"}`);
    console.log("═══════════════════════════════════════════");
    return {
      success: isValid,
      error: isValid ? undefined : "Código inválido (usa 123456 en desarrollo)",
    };
  }

  try {
    const verificationCheck = await client.verify.v2
      .services(verifyServiceSid)
      .verificationChecks.create({
        to: formattedPhone,
        code,
      });

    const isApproved = verificationCheck.status === "approved";
    console.log(
      `📱 OTP verificación para ${formattedPhone}: ${verificationCheck.status}`
    );

    return {
      success: isApproved,
      error: isApproved ? undefined : "Código inválido o expirado",
    };
  } catch (error) {
    console.error("Twilio verify check error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error al verificar código";
    return { success: false, error: errorMessage };
  }
}

/**
 * Send a regular SMS message (for notifications)
 * Falls back to console.log if Twilio not configured
 */
export async function sendSMS(
  to: string,
  body: string
): Promise<{ success: boolean; error?: string; simulated?: boolean }> {
  // Ensure phone has + prefix
  const formattedPhone = to.startsWith("+") ? to : `+${to}`;

  // Development fallback
  if (!client || !twilioPhoneNumber) {
    console.log("═══════════════════════════════════════════");
    console.log("📱 SMS SIMULADO");
    console.log(`Para: ${formattedPhone}`);
    console.log(`Mensaje: ${body}`);
    console.log("═══════════════════════════════════════════");
    return { success: true, simulated: true };
  }

  try {
    const message = await client.messages.create({
      body,
      from: twilioPhoneNumber,
      to: formattedPhone,
    });

    console.log(`📱 SMS enviado a ${formattedPhone}: ${message.sid}`);
    return { success: true };
  } catch (error) {
    console.error("Twilio SMS error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Error al enviar SMS";
    return { success: false, error: errorMessage };
  }
}

// ============================================
// SMS Notification Templates
// ============================================

/**
 * Generate notification SMS for provider when they receive a new job request
 */
export function generateProviderNewRequestSMS(
  providerName: string,
  serviceType: string,
  location: string,
  dateTime: Date
): string {
  const formattedDate = new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateTime);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return `🔔 ¡Nueva solicitud en Chamba!

${serviceType} en ${location}
📅 ${formattedDate}

Responde en: ${appUrl}/proveedor/dashboard`;
}

/**
 * Generate confirmation SMS for client when provider accepts
 */
export function generateClientConfirmationSMS(
  clientName: string,
  providerName: string,
  serviceType: string,
  dateTime: Date
): string {
  const formattedDate = new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(dateTime);

  return `✅ ¡${providerName} aceptó tu solicitud!

${serviceType}
📅 ${formattedDate}

Te contactará pronto para coordinar los detalles. 💅`;
}

/**
 * Generate rejection SMS for client when provider declines
 */
export function generateClientRejectionSMS(
  clientName: string,
  serviceType: string
): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  return `😔 La proveedora no pudo aceptar tu solicitud de ${serviceType}.

Busca otra opción en: ${appUrl}`;
}

