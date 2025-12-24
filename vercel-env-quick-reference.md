# Quick Reference: Vercel Environment Variables

Copy and paste these into Vercel → Settings → Environment Variables

---

## Required Variables (Copy One by One)

### 1. Database
```
DATABASE_URL
```
Paste your Supabase connection string here

---

### 2. NextAuth
```
NEXTAUTH_URL
```
Your Vercel app URL (e.g., `https://chamba-tutorias.vercel.app`)

```
NEXTAUTH_SECRET
```
Generate with: `openssl rand -base64 32`

---

### 3. OpenAI (Optional - for AI chatbot)
```
OPENAI_API_KEY
```
Your OpenAI API key (starts with `sk-proj-`)

---

### 4. Twilio (Optional - for SMS)
```
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_VERIFY_SERVICE_SID
TWILIO_PHONE_NUMBER
```

---

### 5. Admin Panel
```
ADMIN_SECRET_KEY
```
Your admin password for `/admin` page

---

### 6. App URL (Optional)
```
NEXT_PUBLIC_APP_URL
```
Same as NEXTAUTH_URL

---

## Quick Setup Checklist

1. ✅ Go to Vercel → Your Project → Settings → Environment Variables
2. ✅ Add each variable above
3. ✅ Set scope: Production ✅ Preview ✅ Development
4. ✅ Click "Save"
5. ✅ Go to Deployments → Redeploy latest

---

## Test Values (Development Only)

If you want to test without real services:

```
OPENAI_API_KEY=sk-test-optional
TWILIO_ACCOUNT_SID=test
TWILIO_AUTH_TOKEN=test
TWILIO_VERIFY_SERVICE_SID=test
TWILIO_PHONE_NUMBER=+11111111111
```

The app will use fallbacks (console logging, rule-based chatbot) when these are not configured.

