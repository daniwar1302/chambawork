// Re-export from twilio.ts for backward compatibility
// This file can be removed once all imports are updated to use @/lib/twilio

export {
  sendSMS,
  sendSMS as sendSms, // Legacy alias
  generateProviderNewRequestSMS,
  generateProviderNewRequestSMS as generateProviderNotificationSMS, // Legacy alias
  generateClientConfirmationSMS,
  generateClientRejectionSMS,
} from "./twilio";
