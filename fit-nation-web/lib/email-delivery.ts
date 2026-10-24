type EmailConfig = {provider?: 'sendpulse' | 'brevo'; apiKey: string; fromEmail: string; siteOrigin?: string};

export function loginEmailText(code: string, siteOrigin?: string) {
  const security = `Your Fit Nation Hyderabad login code is ${code}.\n\nThis code expires in 10 minutes and can only be used once. Do not share it. If you did not request this email, you can ignore it.`;
  if (!siteOrigin) return security;
  const url = new URL(siteOrigin);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname))) {
    throw new Error('Invalid website origin');
  }
  const origin = url.origin;
  return `${security}\n\nWELCOME TO YOUR NATION.\nYour first rep. Your next goal. Your place to begin.\n\nFind a branch close to you: ${origin}/#locations\n\nExplore your branch and request a visit:\nKothapet: ${origin}/branches/kothapet\nHayathnagar: ${origin}/branches/hayathnagar\nMoosarambagh: ${origin}/branches/moosarambagh\nNagole: ${origin}/branches/nagole\n\nSome branch opening details, hours, facilities and trainer rosters are awaiting confirmation. Please confirm availability with the gym before travelling.\n\nReady for your first visit? Choose a branch and use Book a visit on the website. A visit is confirmed only when the gym team agrees on a time with you.\n\nThis is your requested sign-in and first-visit guide, not a marketing subscription.\nPrivacy: ${origin}/privacy`;
}

// Delivery only. Code generation, verification and sessions stay on our server.
export async function sendLoginEmail(config: EmailConfig, email: string, code: string, transport: typeof fetch = fetch) {
  const subject = 'Your Fit Nation code and first-visit guide';
  const text = loginEmailText(code, config.siteOrigin);
  const brevo = config.provider === 'brevo';
  const headers: Record<string, string> = {'Content-Type': 'application/json'};
  if (brevo) headers['api-key'] = config.apiKey;
  else headers.Authorization = `Bearer ${config.apiKey}`;
  const response = await transport(brevo ? 'https://api.brevo.com/v3/smtp/email' : 'https://api.sendpulse.com/smtp/emails', {
    method: 'POST',
    headers,
    body: JSON.stringify(brevo ? {
      sender: {name: 'Fit Nation Hyderabad', email: config.fromEmail},
      to: [{email}], subject, textContent: text,
    } : {email: {
      subject, text,
      from: {name: 'Fit Nation Hyderabad', email: config.fromEmail},
      to: [{email}],
    }}),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error('Email delivery unavailable');
  const result = await response.json() as {result?: boolean; id?: string; messageId?: string};
  if (brevo ? !result.messageId : (result.result !== true || !result.id)) throw new Error('Email delivery unavailable');
}
