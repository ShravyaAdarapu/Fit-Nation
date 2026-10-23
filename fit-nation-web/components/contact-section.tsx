'use client';
import {ArrowUpRight, Mail, MessageCircle, Phone} from 'lucide-react';
import {gymContact} from '../lib/contact';

export default function ContactSection({onEnquire}: {onEnquire: () => void}) {
  return <section id="contact" className="contact-section section" aria-labelledby="contact-title">
    <div className="contact-intro">
      <div className="section-kicker">09 / CONTACT US</div>
      <h2 id="contact-title">LET’S TALK.<br/><em>LET’S TRAIN.</em></h2>
      <p>Questions about memberships, training or your first visit? We’re here to help you take the next step.</p>
    </div>
    <div className="contact-options">
      <article className="contact-option"><Mail size={25} strokeWidth={1.5} aria-hidden="true"/><div><h3>Email us</h3>{gymContact.email ? <a href={`mailto:${gymContact.email}`}>{gymContact.email}</a> : <p>Email address coming soon.</p>}</div></article>
      <article className="contact-option"><Phone size={25} strokeWidth={1.5} aria-hidden="true"/><div><h3>Call us</h3>{gymContact.phone ? <a href={`tel:${gymContact.phone.replace(/[^+0-9]/g, '')}`}>{gymContact.phone}</a> : <p>Phone number coming soon.</p>}</div></article>
      <button className="contact-option contact-enquiry" onClick={onEnquire}><MessageCircle size={25} strokeWidth={1.5} aria-hidden="true"/><span><strong>Memberships & visits</strong><small>Send an enquiry</small></span><ArrowUpRight size={23} aria-hidden="true"/></button>
    </div>
  </section>;
}
