'use client';
import {useEffect, useRef, useState} from 'react';
import {UserRound, X, ArrowLeft, Mail, ArrowRight, Check, LogOut} from 'lucide-react';
import {clickedBackdrop} from '../lib/dialog';

type User = {email: string};
type LoginStatus = 'loading' | 'ready' | 'setup' | 'error';

async function readResponse(response: Response) {
  const value: unknown = await response.json();
  if (!value || typeof value !== 'object') throw new Error('Unable to load sign-in.');
  const data = value as Record<string, unknown>;
  const user = data.user && typeof data.user === 'object' ? data.user as Record<string, unknown> : null;
  return {
    error: typeof data.error === 'string' ? data.error : undefined,
    available: data.available === true,
    challengeId: typeof data.challengeId === 'string' ? data.challengeId : undefined,
    user: user && typeof user.email === 'string' ? {email: user.email} : null,
  };
}

async function post(path: string, body: unknown) {
  const response = await fetch(path, {method: 'POST', credentials: 'same-origin', headers: {'Content-Type': 'application/json'}, body: JSON.stringify(body), signal: AbortSignal.timeout(20_000)});
  const result = await readResponse(response);
  if (!response.ok) throw new Error(result.error || 'Unable to sign in. Please try again.');
  return result;
}

export default function MemberLogin({onOpen}: {onOpen?: () => void}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState<LoginStatus>('loading');
  const [user, setUser] = useState<User | null>(null);
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [resendAt, setResendAt] = useState(0);
  const [now, setNow] = useState(Date.now());

  async function refresh() {
    try {
      const response = await fetch('/api/auth/session', {credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(8_000)});
      if (!response.ok) throw new Error();
      const result = await readResponse(response);
      setUser(result.user && typeof result.user.email === 'string' ? result.user : null);
      setStatus(result.available ? 'ready' : 'setup');
    } catch {setStatus('error');}
  }
  useEffect(() => {void refresh();}, []);
  useEffect(() => {
    if (step !== 'code') return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [step]);

  function open() {
    onOpen?.(); setStep('email'); setEmail(''); setCode(''); setChallengeId(''); setError('');
    void refresh(); dialog.current?.showModal();
  }
  async function sendCode() {
    const address = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {setError('Enter a valid email address.'); return;}
    setBusy(true); setError('');
    try {
      const result = await post('/api/auth/request-code', {email: address});
      if (typeof result.challengeId !== 'string') throw new Error('Please try requesting a code again.');
      setEmail(address); setChallengeId(result.challengeId); setCode(''); setStep('code');
      const time = Date.now(); setNow(time); setResendAt(time + 60_000);
    } catch (error) {setError(error instanceof Error ? error.message : 'Unable to send your code. Please try again.');}
    finally {setBusy(false);}
  }
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (step === 'email') {await sendCode(); return;}
    if (!/^\d{6}$/.test(code)) {setError('Enter the six-digit code from your email.'); return;}
    setBusy(true); setError('');
    try {
      const result = await post('/api/auth/verify-code', {challengeId, code});
      if (!result.user || typeof result.user.email !== 'string') throw new Error('Unable to confirm sign-in. Please try again.');
      setUser(result.user); setCode(''); setChallengeId('');
    } catch (error) {setError(error instanceof Error ? error.message : 'Unable to verify your code. Please try again.');}
    finally {setBusy(false);}
  }
  async function logout() {
    setBusy(true); setError('');
    try {await post('/api/auth/logout', {}); setUser(null); setStep('email'); setEmail('');}
    catch {setError('Unable to sign out. Please try again.');}
    finally {setBusy(false);}
  }
  const seconds = Math.max(0, Math.ceil((resendAt - now) / 1000));

  return <>
    <button className="account-trigger" onClick={open} disabled={busy} aria-label={user ? 'Open member account' : 'Open member login'} aria-haspopup="dialog"><UserRound size={22}/><span>{user ? 'ACCOUNT' : 'LOG IN'}</span></button>
    <dialog ref={dialog} className="member-dialog" aria-labelledby="login-title" aria-describedby="login-description" onClick={event => {if (clickedBackdrop(event)) dialog.current?.close();}}>
      <button className="login-close" aria-label="Close login" onClick={() => dialog.current?.close()}><X size={21}/></button>
      <div className="login-brand"><img src="/fit-nation-official-logo.jpg" alt="Fit Nation Hyderabad official logo"/><strong>FIT NATION</strong><span>HYDERABAD</span></div>
      <div className="login-heading"><p className="login-kicker">YOUR NEXT CHAPTER STARTS HERE</p><h2 id="login-title">{user ? 'YOU’RE SIGNED IN.' : step === 'code' ? 'CHECK YOUR EMAIL.' : 'WELCOME TO YOUR NATION.'}</h2>
        <p id="login-description" className="login-demo-note">{user ? 'Your Fit Nation account' : step === 'code' ? 'Enter your one-time login code. It expires in 10 minutes.' : 'Sign in with a code sent to your email. No password needed.'}</p>
      </div>
      {user ? <div className="login-complete"><span><Check size={27}/></span><p className="member-account-email">{user.email}</p><p>Explore your branch and arrange your next visit. Gym memberships are managed separately by the team.</p><button className="login-continue" onClick={() => dialog.current?.close()}>EXPLORE FIT NATION <ArrowRight size={18}/></button><button className="login-signout" disabled={busy} onClick={logout}><LogOut size={16}/>{busy ? 'SIGNING OUT…' : 'SIGN OUT'}</button></div> :
        <form className="login-form" onSubmit={submit} noValidate>
          {step === 'email' ? <>
            <label className="login-field-label" htmlFor="member-email">Email address</label>
            <div className="login-input-row"><Mail size={19} aria-hidden="true"/><input id="member-email" name="email" autoFocus type="email" inputMode="email" autoComplete="email" autoCapitalize="none" spellCheck={false} placeholder="you@example.com" maxLength={254} value={email} onChange={event => setEmail(event.target.value)} disabled={busy} aria-invalid={!!error} aria-describedby={error ? 'login-error' : undefined}/></div>
            {status === 'setup' && <p className="login-setup-note" role="status">Email login is being set up. You can still explore the gym and send an enquiry.</p>}
            {status === 'error' && <p className="login-setup-note" role="status">Login is temporarily unavailable. <button type="button" onClick={() => {setStatus('loading'); void refresh();}}>Try again</button></p>}
          </> : <>
            <button type="button" className="login-back" disabled={busy} onClick={() => {setStep('email'); setCode(''); setError('');}}><ArrowLeft size={15}/> CHANGE EMAIL</button>
            <p className="verification-destination">Code requested for {email}</p>
            <label className="login-field-label" htmlFor="member-code">Verification code</label>
            <input className="login-code" id="member-code" autoFocus type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="000000" value={code} disabled={busy} onChange={event => setCode(event.target.value.replace(/\D/g, ''))} aria-invalid={!!error} aria-describedby={error ? 'login-error' : undefined}/>
            <p className="login-provider-note">Check your spam folder if the email hasn’t arrived.</p>
          </>}
          <button className="login-continue" type="submit" disabled={busy || (step === 'email' && status !== 'ready')}>{busy ? 'PLEASE WAIT…' : step === 'code' ? 'VERIFY & SIGN IN' : status === 'loading' ? 'CHECKING AVAILABILITY…' : 'SEND LOGIN CODE'}<ArrowRight size={18}/></button>
          {step === 'code' && <button className="login-resend" type="button" disabled={busy || seconds > 0} onClick={sendCode}>{seconds > 0 ? `Resend code in ${seconds}s` : 'Resend code'}</button>}
        </form>}
      {error && <p id="login-error" className="login-error" role="alert">{error}</p>}
      <p className="login-privacy">Email sign-in · <a href="/privacy">Privacy notice</a></p>
    </dialog>
  </>;
}
