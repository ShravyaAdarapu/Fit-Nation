'use client';
import {ArrowUpRight,Users,Dumbbell,Activity,Move,Check,Minus,Car,LockKeyhole,ShowerHead,Wind,Droplets,Accessibility} from 'lucide-react';
import {branches} from '../lib/branches';
import TrainerRoster from './trainer-roster';
import EquipmentShowcase from './equipment-showcase';

const amenityIcons:Record<string,typeof Car>={Parking:Car,Lockers:LockKeyhole,Showers:ShowerHead,'Air conditioning':Wind,'Drinking water':Droplets,'Step-free access':Accessibility};

export default function HomeGymDetails({selected,setSelected,onEnquire}:{selected:string;setSelected:(id:string)=>void;onEnquire:(branch:string,question:string)=>void}){
 const branch=branches.find(b=>b.id===selected)!;
 const enquiry=(topic:string)=>onEnquire(branch.id,`I'd like to know about ${topic} at ${branch.name}.`);
 const picker=(id:string)=><label className="home-branch-picker" htmlFor={id}><span>EXPLORE A BRANCH</span><select id={id} value={selected} onChange={e=>setSelected(e.target.value)}>{branches.map(b=><option key={b.id} value={b.id}>{b.name}</option>)}</select></label>;
 return <>
 <section id="team" className="home-team section" aria-labelledby="team-title">
  <div className="section-top"><div><div className="section-kicker">03 / MEET YOUR BRANCH TRAINERS</div><h2 id="team-title">YOUR BRANCH.<br/><em>YOUR TRAINERS.</em></h2></div><div className="details-intro"><p>Choose a branch to see its trainers, their specialties, qualifications and available shifts.</p></div></div>
  <div className="trainer-branch-buttons" role="group" aria-label="Select branch trainers">{branches.map(b=><button key={b.id} aria-pressed={selected===b.id} aria-controls="branch-trainer-roster" onClick={()=>setSelected(b.id)}>{b.name}<ArrowUpRight size={17}/></button>)}</div>
  <div id="branch-trainer-roster"><TrainerRoster branch={branch} onEnquire={enquiry}/></div>
 </section>
 <section id="equipment" className="home-equipment section" aria-labelledby="equipment-title"><div className="section-top"><div><div className="section-kicker">04 / GET TO KNOW THE FLOOR</div><h2 id="equipment-title">FIND YOUR<br/><em>TRAINING SETUP.</em></h2></div><div className="details-intro"><p>The right equipment for the way you want to train. Check the inventory for your branch before you join.</p>{picker('equipment-branch')}</div></div>
 <EquipmentShowcase branch={branch} onEnquire={enquiry}/>
 </section>
 <section id="facilities" className="home-facilities section" aria-labelledby="facilities-title"><div className="section-top"><div><div className="section-kicker">05 / THE DETAILS THAT MAKE YOUR DAY</div><h2 id="facilities-title">COME PREPARED.<br/><em>TRAIN COMFORTABLY.</em></h2></div><div className="details-intro"><p>Parking, changing facilities and everyday essentials can differ by branch. Choose yours to see what’s available.</p>{picker('facilities-branch')}</div></div><div className="home-amenities">{Object.entries(branch.amenities).map(([name,value])=>{const Icon=amenityIcons[name]||Check;return <article key={name}><Icon size={26} strokeWidth={1.5}/><h3>{name}</h3><span className={value===true?'amenity-status available':'amenity-status'}>{value===true?<Check size={13}/>:<Minus size={13}/>} {value===true?'Available':value===false?'Not available':'Awaiting confirmation'}</span></article>;})}</div><div className="facilities-foot"><p>Showing <b>{branch.name}</b>. Ask about access, inclusions and any additional charges before your visit.</p><button className="under-link" onClick={()=>enquiry('facilities, parking, accessibility and what is included')}>ASK ABOUT FACILITIES <ArrowUpRight size={17}/></button></div></section>
 </>;
}