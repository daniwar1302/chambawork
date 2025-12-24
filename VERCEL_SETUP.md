# Vercel Environment Variables Setup Guide

This guide will help you set up all required environment variables in Vercel for the Chamba Tutorías application.

## Quick Setup Steps

1. **Go to your Vercel project dashboard**
   - Navigate to: https://vercel.com/dashboard
   - Select your project: `chambawork` or `chamba-tutorias`

2. **Open Environment Variables**
   - Click on **Settings** tab
   - Click on **Environment Variables** in the sidebar

3. **Add each variable** from the list below

4. **Set environment scope**
   - For each variable, select: ✅ Production, ✅ Preview, ✅ Development
   - (Or select only the environments you need)

5. **Redeploy**
   - After adding variables, go to **Deployments** tab
   - Click the **⋯** menu on the latest deployment
   - Click **Redeploy**

---

## Required Environment Variables

### 1. Database Connection (Supabase PostgreSQL)

```
Variable Name: DATABASE_URL
Value: postgresql://postgres.xxxxx:YOUR_PASSWORD@aws-0-us-west-2.pooler.supabase.com:5432/postgres
```

**How to get it:**
- Go to your Supabase project dashboard
- Navigate to: **Settings** → **Database**
- Copy the **Connection string** (use the **Pooled connection** for Vercel)
- Replace `[YOUR-PASSWORD]` with your actual database password
- Make sure to URL-encode special characters (e.g., `!` becomes `%21`)

**Example:**
```
postgresql://postgres.zcczxbyxqiohprtnfiya:Chamba2025%21@aws-0-us-west-2.pooler.supabase.com:5432/postgres
```

---

### 2. NextAuth Configuration

```
Variable Name: NEXTAUTH_URL
Value: https://your-app-name.vercel.app
```

**How to get it:**
- This is your Vercel deployment URL
- Find it in your Vercel project dashboard under **Domains**
- Example: `https://chamba-tutorias.vercel.app`

```
Variable Name: NEXTAUTH_SECRET
Value: [Generate a random secret]
```

**How to generate:**
- Run this command in your terminal:
  ```bash
  openssl rand -base64 32
  ```
- Or use an online generator: https://generate-secret.vercel.app/32
- Copy the generated string

---

### 3. OpenAI API Key (for Chatbot)

```
Variable Name: OPENAI_API_KEY
Value: sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

**How to get it:**
- Go to: https://platform.openai.com/api-keys
- Sign in or create an account
- Click **Create new secret key**
- Copy the key (starts with `sk-proj-`)

**Note:** The chatbot will work without this, but will use a simpler rule-based system instead of AI.

---

### 4. Twilio Configuration (for SMS)

```
Variable Name: TWILIO_ACCOUNT_SID
Value: ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

```
Variable Name: TWILIO_AUTH_TOKEN
Value: [Your Twilio Auth Token]
```

```
Variable Name: TWILIO_VERIFY_SERVICE_SID
Value: VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

```
Variable Name: TWILIO_PHONE_NUMBER
Value: +12059906389
```

**How to get it:**
- Go to: https://console.twilio.com/
- Sign in or create an account
- Find your **Account SID** and **Auth Token** in the dashboard
- For Verify Service SID:
  - Go to **Verify** → **Services**
  - Create a new service or use existing one
  - Copy the **Service SID** (starts with `VA`)
- Your phone number is in **Phone Numbers** → **Manage** → **Active numbers**

**Note:** SMS features will work without Twilio (uses console logging fallback), but real SMS won't be sent.

---

### 5. Admin Panel Secret

```
Variable Name: ADMIN_SECRET_KEY
Value: [Create a strong password]
```

**How to create:**
- Use a strong, random password
- You'll use this to access `/admin` page
- Example: `ChambaAdmin2025!SecureKey`
- Or generate one: https://www.lastpass.com/features/password-generator

---

### 6. App URL (Optional)

```
Variable Name: NEXT_PUBLIC_APP_URL
Value: https://your-app-name.vercel.app
```

**Note:** This is optional. If not set, it defaults to `http://localhost:3000` in development.

---

## Optional Variables

These are set automatically by Vercel, but you can override them if needed:

```
NODE_ENV=production
```

---

## Verification Checklist

After adding all variables, verify:

- [ ] `DATABASE_URL` is set and connection string is correct
- [ ] `NEXTAUTH_URL` matches your Vercel deployment URL
- [ ] `NEXTAUTH_SECRET` is a long random string
- [ ] `OPENAI_API_KEY` starts with `sk-proj-`
- [ ] `TWILIO_*` variables are all set (if using SMS)
- [ ] `ADMIN_SECRET_KEY` is set (for admin panel access)
- [ ] All variables are set for **Production** environment
- [ ] Redeployed the application after adding variables

---

## Testing Your Setup

1. **Test Database Connection:**
   - Deploy and check Vercel logs for database connection errors

2. **Test Admin Panel:**
   - Go to: `https://your-app.vercel.app/admin`
   - Enter your `ADMIN_SECRET_KEY` as password
   - Should see the admin dashboard

3. **Test Chatbot:**
   - Go to: `https://your-app.vercel.app`
   - Try asking for a tutor
   - Should see tutor results if you have tutors in the database

4. **Test Authentication:**
   - Try logging in with phone number
   - If Twilio is configured, you'll receive SMS
   - If not, use test number: `+11111111111` with code: `000000`

---

## Troubleshooting

### Database Connection Errors
- Check that `DATABASE_URL` is correct
- Make sure password is URL-encoded (special characters)
- Verify Supabase project is active
- Check if using pooled connection string (recommended for Vercel)

### NextAuth Errors
- Verify `NEXTAUTH_URL` matches your actual deployment URL
- Make sure `NEXTAUTH_SECRET` is set
- Check Vercel logs for specific error messages

### OpenAI API Errors
- Verify API key is correct
- Check if you have credits in your OpenAI account
- Chatbot will fall back to rule-based system if API key is missing

### Twilio Errors
- Verify all 4 Twilio variables are set
- Check Twilio console for account status
- SMS will use console logging fallback if not configured

---

## Security Notes

⚠️ **Important:**
- Never commit `.env` files to Git
- Never share your environment variables publicly
- Rotate secrets periodically
- Use different secrets for production vs development
- Vercel encrypts environment variables at rest

---

## Need Help?

If you encounter issues:
1. Check Vercel deployment logs
2. Verify all required variables are set
3. Make sure variable names match exactly (case-sensitive)
4. Redeploy after making changes

