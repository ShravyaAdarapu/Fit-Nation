type SendPulseConfig = {apiKey: string; fromEmail: string};

// Delivery only. Code generation, verification and sessions stay on our server.
export async function sendLoginEmail(config: SendPulseConfig, email: string, code: string, transport: typeof fetch = fetch) {
  const response = await transport('https://api.sendpulse.com/smtp/emails', {
    method: 'POST',
    headers: {'Content-Type': 'application/json', Authorization: `Bearer ${config.apiKey}`},
    body: JSON.stringify({email: {
      subject: 'Your Fit Nation login code',
      text: `Your Fit Nation Hyderabad login code is ${code}.\n\nThis code expires in 10 minutes and can only be used once. Do not share it. If you did not request this code, you can ignore this email.`,
      from: {name: 'Fit Nation Hyderabad', email: config.fromEmail},
      to: [{email}],
    }}),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) throw new Error('Email delivery unavailable');
  const result = await response.json() as {result?: boolean; id?: string};
  if (result.result !== true || !result.id) throw new Error('Email delivery unavailable');
}
