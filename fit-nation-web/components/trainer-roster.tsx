import {ArrowUpRight,Users} from 'lucide-react';
import type {Branch} from '../lib/branches';

export default function TrainerRoster({branch,onEnquire}:{branch:Branch;onEnquire:(question:string)=>void}){
 return <div className="trainer-roster" aria-live="polite" aria-atomic="true">
  <div className="roster-heading"><h3>Trainers at {branch.name}</h3>{branch.trainers?.length?<span>{branch.trainers.length} {branch.trainers.length===1?'trainer':'trainers'}</span>:<span>Roster pending</span>}</div>
  {branch.openingNote&&<p className="roster-opening">{branch.openingNote}</p>}
  {branch.trainers?.length?<div className="home-trainer-grid">{branch.trainers.map(t=><article className="home-trainer-card" key={t.name}>{t.photo?<img src={t.photo} alt={t.name} loading="lazy"/>:<div className="trainer-photo-pending"><Users size={48}/></div>}<div><span className="section-kicker">{t.role}</span><h3>{t.name}</h3><p>{t.specialties.join(' · ')}</p><p>{t.qualifications.join(' · ')}</p>{t.languages.length>0&&<p>Languages: {t.languages.join(', ')}</p>}{t.availability&&<p>Availability: {t.availability}</p>}<button className="under-link" onClick={()=>onEnquire(`training with ${t.name}`)}>ENQUIRE ABOUT THIS TRAINER <ArrowUpRight size={17}/></button></div></article>)}</div>:<div className="roster-empty"><Users size={30} strokeWidth={1.5}/><div><h4>Meet your trainers soon.</h4><p>Trainer profiles for {branch.name} are awaiting confirmation. Ask about coaching specialties, personal training and available shifts.</p><button className="under-link" onClick={()=>onEnquire('the trainers, their specialties and available shifts')}>ASK ABOUT {branch.name.toUpperCase()} TRAINERS <ArrowUpRight size={17}/></button></div></div>}
 </div>;
}
