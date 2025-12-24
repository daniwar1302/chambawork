// Simple SMS helper (console logging only - no Twilio)
// This file provides SMS simulation for development

/**
 * Send SMS - Simulated (logs to console)
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

// SMS message generators
export function generateProviderNewRequestSMS(
  providerName: string,
  studentName: string,
  subject: string
): string {
  return `¡Hola ${providerName}! 👋\n\n${studentName} necesita ayuda con ${subject}.\n\nRevisa tu dashboard para más detalles.\n\n¡Gracias por ser parte de Chamba Tutorías! 🎓`;
}

export function generateClientConfirmationSMS(
  clientName: string,
  providerName: string,
  subject: string
): string {
  return `¡Hola ${clientName}! 🎉\n\n${providerName} ha aceptado tu solicitud de tutoría en ${subject}.\n\n¡Que tengas una excelente sesión! 📚`;
}

export function generateClientRejectionSMS(
  clientName: string,
  subject: string
): string {
  return `¡Hola ${clientName}!\n\nLamentamos informarte que no hay tutores disponibles para ${subject} en este momento.\n\nPuedes buscar otros tutores disponibles.\n\n¡Gracias por usar Chamba Tutorías! 📚`;
}
