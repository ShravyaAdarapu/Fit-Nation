'use client';
import {ArrowUpRight} from 'lucide-react';
import type {EnquiryInterest} from '../lib/enquiry';
const programs=[{name:'Strength training',tag:'BUILD YOUR FOUNDATION',text:'From your first rep to your next milestone. Find your rhythm on the training floor.',image:'photo-1534438327276-14e5300c3a48',position:'55% center'},{name:'Yoga',tag:'BREATHE. RESET. RECONNECT.',text:'Create space for balance, flexibility and a little more calm in your day.',image:'photo-1544367567-0f2fcb009e0b',position:'center'},{name:'Zumba',tag:'BRING YOUR ENERGY',text:'Move with the music. Explore an energetic way to make movement part of your week.',image:'photo-1518611012118-696072aa579a',position:'center'}];
export default function ProgramCards({onEnquire}: {onEnquire: (name: EnquiryInterest) => void}) {
 return <section id="programs" className="programs section immersive-programs">
  <div className="section-top"><div><div className="section-kicker">02 / FIND YOUR MOVEMENT</div><h2>FIND YOUR ENERGY.<br/><em>MAKE IT YOURS.</em></h2></div><p>Three ways to show up for yourself.<br/>Find your program. Make it part of your routine.</p></div>
  <div className="motion-program-cards">{programs.map((p,i) => <article key={p.name} className="motion-program-card">
   <img src={`https://images.unsplash.com/${p.image}?auto=format&fit=crop&w=900&q=80`} alt={`Illustrative ${p.name.toLowerCase()} photography`} loading="lazy" width={900} height={1200} style={{objectPosition:p.position}}/>
   <div className="program-card-shade"/><span className="program-card-number">0{i+1}</span>
   <div className="program-card-copy"><span>{p.tag}</span><h3>{p.name}</h3><p>{p.text}</p><button className="program-card-cta" onClick={() => onEnquire(p.name as EnquiryInterest)}>ENQUIRE ABOUT {p.name.toUpperCase()} <ArrowUpRight size={17}/></button></div>
  </article>)}</div>
  <p className="program-bottom-note">Illustrative photography · Sessions and availability vary by branch.</p>
 </section>;
}
