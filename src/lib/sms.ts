// Re-export from twilio.ts for backward compatibility
export {
  sendSMS,
  sendSMS as sendSms,
  generateProviderNewRequestSMS,
  generateProviderNewRequestSMS as generateProviderNotificationSMS,
  generateClientConfirmationSMS,
  generateClientRejectionSMS,
} from "./twilio";
