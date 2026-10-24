import {env} from 'cloudflare:workers';
import {createMemberAuth} from '../../../lib/member-auth';
import {sendLoginEmail} from '../../../lib/email-delivery';

export function memberAuth() {
  const provider = env.EMAIL_PROVIDER || 'sendpulse';
  const apiKey = provider === 'brevo' ? env.BREVO_API_KEY : provider === 'sendpulse' ? env.SENDPULSE_API_KEY : undefined;
  const fromEmail = provider === 'brevo' ? env.BREVO_FROM_EMAIL : provider === 'sendpulse' ? env.SENDPULSE_FROM_EMAIL : undefined;
  const ready = !!(apiKey && fromEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fromEmail));
  return createMemberAuth({
    db: env.DB,
    secret: env.EMAIL_OTP_SECRET,
    enabled: env.EMAIL_OTP_ENABLED === 'true' && ready,
    sendCode: ready ? (email, code, siteOrigin) => sendLoginEmail({provider: provider as 'sendpulse' | 'brevo', apiKey: apiKey!, fromEmail: fromEmail!, siteOrigin}, email, code) : undefined,
  });
}
