import {env} from 'cloudflare:workers';
import {createMemberAuth} from '../../../lib/member-auth';
import {sendLoginEmail} from '../../../lib/sendpulse';

export function memberAuth() {
  const ready = !!(env.SENDPULSE_API_KEY && env.SENDPULSE_FROM_EMAIL && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(env.SENDPULSE_FROM_EMAIL));
  return createMemberAuth({
    db: env.DB,
    secret: env.EMAIL_OTP_SECRET,
    enabled: env.EMAIL_OTP_ENABLED === 'true' && ready,
    sendCode: ready ? (email, code, siteOrigin) => sendLoginEmail({apiKey: env.SENDPULSE_API_KEY!, fromEmail: env.SENDPULSE_FROM_EMAIL!, siteOrigin}, email, code) : undefined,
  });
}
