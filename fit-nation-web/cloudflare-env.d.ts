declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    SENDPULSE_API_KEY?: string;
    SENDPULSE_FROM_EMAIL?: string;
    EMAIL_PROVIDER?: string;
    BREVO_API_KEY?: string;
    BREVO_FROM_EMAIL?: string;
    EMAIL_OTP_SECRET?: string;
    EMAIL_OTP_ENABLED?: string;
    STANDALONE_HOSTING?: string;
  }
}
