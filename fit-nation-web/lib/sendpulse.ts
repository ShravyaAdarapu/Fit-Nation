type SendPulseConfig = {apiKey: string; fromEmail: string; siteOrigin?: string};

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
export async function sendLoginEmail(config: SendPulseConfig, email: string, code: string, transport: typeof fetch = fetch) {
  const response = await transport('https://api.sendpulse.com/smtp/emails', {
    method: 'POST',
    headers: {'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}`},
    body: JSON.stringify({email: {
      subject: 'Your Fit Nation code and first-visit guide',
      text: loginEmailText(code, config.siteOrigin),
      from: {name: 'Fit Nation Hyderabad', email: config.fromEmail},
      to: [{email}],
    }}),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error('Email delivery unavailable');
  const result = await response.json() as {result?: boolean; id?: string};
  if (result.result !== true || !result.id) throw new Error('Email delivery unavailable');
}
