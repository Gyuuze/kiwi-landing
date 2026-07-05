# Production Deployment

Recommended production setup:

- Hosting: Vercel
- Lead storage: Google Sheets via Apps Script web app
- Lead notification: email sent by Apps Script
- Domain: purchased custom domain connected in Vercel

## 1. Create the Google Sheets Webhook

1. Create a Google Sheet for leads.
2. Open `Extensions > Apps Script`.
3. Paste `integrations/google-sheets-leads.gs` into Apps Script.
4. Add these script properties:
   - `LEAD_NOTIFICATION_EMAILS`: owner email recipients, comma-separated if there are multiple recipients.
   - `LEADS_WEBHOOK_SECRET`: shared secret, recommended for production.
5. Deploy it as a web app with access set to `Anyone`.
6. Copy the web app URL.

## 2. Configure Vercel Environment Variables

Set these variables in the Vercel project:

```text
LEADS_WEBHOOK_URL=the Apps Script web app URL
LEADS_WEBHOOK_SECRET=the same secret from Apps Script
ALLOWED_ORIGINS=https://your-domain.com,https://www.your-domain.com
```

Do not commit real secret values to Git.

## 3. Connect the Domain

1. Buy the domain from any registrar.
2. Add the domain in the Vercel project settings.
3. Follow the DNS records Vercel shows for that exact domain.
4. After DNS is verified, update `ALLOWED_ORIGINS` to include the final production origin.

## 4. Smoke Test

After deployment:

1. Open the production domain.
2. Submit a test lead.
3. Confirm the row appears in Google Sheets.
4. Confirm the notification email arrives.
5. Delete the test row.

If the form shows a save error, check the Vercel function logs first. The most common causes are a missing `LEADS_WEBHOOK_URL`, a mismatched `LEADS_WEBHOOK_SECRET`, an Apps Script deployment that is not accessible to `Anyone`, or a missing Apps Script mail authorization.
