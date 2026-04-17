/**
 * Email service — logs to console in development, sends via Resend in production.
 * To use Resend: npm install resend, set RESEND_API_KEY in .env
 */

import { env } from "@/lib/env/server";

type InviteEmailParams = {
  to: string;
  workspaceName: string;
  inviterName: string;
  inviteUrl: string;
  expiresAt: Date;
};

async function sendViaResend(to: string, subject: string, html: string): Promise<void> {
  const apiKey = env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY not configured.");

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM ?? "Relay <noreply@relay.app>",
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Resend error: ${JSON.stringify(err)}`);
  }
}

export async function sendInviteEmail(params: InviteEmailParams): Promise<void> {
  const { to, workspaceName, inviterName, inviteUrl, expiresAt } = params;
  const subject = `${inviterName} invited you to ${workspaceName} on Relay`;
  const expiry = expiresAt.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8" /><title>${subject}</title></head>
<body style="font-family: -apple-system, sans-serif; background: #f0ece5; margin: 0; padding: 40px 16px;">
  <div style="max-width: 520px; margin: 0 auto; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #e8e3db;">
    <div style="padding: 32px 32px 24px; border-bottom: 1px solid #f0ece5;">
      <p style="margin: 0 0 4px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #a09488;">Relay</p>
      <h1 style="margin: 0; font-size: 24px; font-weight: 800; color: #1a1714; letter-spacing: -0.03em;">You're invited</h1>
    </div>
    <div style="padding: 28px 32px;">
      <p style="margin: 0 0 20px; font-size: 16px; color: #3d3830; line-height: 1.6;">
        <strong>${inviterName}</strong> has invited you to join the <strong>${workspaceName}</strong> workspace on Relay.
      </p>
      <a href="${inviteUrl}"
         style="display: inline-block; padding: 14px 28px; background: #1a1714; color: #faf8f5; border-radius: 8px; font-size: 15px; font-weight: 700; text-decoration: none;">
        Accept invitation →
      </a>
      <p style="margin: 20px 0 0; font-size: 13px; color: #a09488;">
        This invite expires on ${expiry}. If you don't have an account, you'll be asked to create one.
      </p>
    </div>
  </div>
</body>
</html>`;

  if (env.NODE_ENV === "production" && env.RESEND_API_KEY) {
    await sendViaResend(to, subject, html);
  } else {
    // Development: log invite link to console
    console.log(`\n📧 [EMAIL] Invite to ${to}\n   Link: ${inviteUrl}\n   Expires: ${expiry}\n`);
  }
}
