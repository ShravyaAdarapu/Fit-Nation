'use client';
import {useState} from 'react';
import {ArrowUpRight,Dumbbell,Activity,Move} from 'lucide-react';
import type {Branch} from '../lib/branches';

export default function EquipmentShowcase({branch,onEnquire}:{branch:Branch;onEnquire:(topic:string)=>void}){
 const [selected,setSelected]=useState('Cardio');
 const groups=branch.equipment||[];
 const group=groups.find(g=>g.category===selected)||groups[0];
 const icons=[Dumbbell,Activity,Activity,Move];
 return <><div className="equipment-category-buttons" role="group" aria-label="Equipment categories">{groups.map((g,i)=>{const Icon=icons[i%icons.length];return <button key={g.category} aria-pressed={group?.category===g.category} aria-controls="equipment-inventory-panel" onClick={()=>setSelected(g.category)}><Icon size={21}/><span>{g.category}</span><ArrowUpRight size={17}/></button>;})}</div><div className="equipment-story equipment-stock" id="equipment-inventory-panel"><figure><img src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=85" alt="Illustrative gym training floor" loading="lazy"/><figcaption>ILLUSTRATIVE TRAINING FLOOR</figcaption></figure><div><span className="verification">{branch.name.toUpperCase()} · {branch.equipmentIsSample?'SAMPLE INVENTORY':'EQUIPMENT INVENTORY'}</span><h3>{group?.category||'Equipment details coming soon'}</h3><div className="equipment-count-list" aria-live="polite">{group?.items.map(item=><div key={item.name}><strong>{item.quantity??'—'}</strong><div><b>{item.name}</b>{(item.detail||item.brand)&&<span>{[item.detail,item.brand].filter(Boolean).join(' · ')}</span>}</div></div>)}</div>{branch.equipmentIsSample&&<small>Sample equipment and quantities for this website preview.</small>}<button className="under-link" onClick={()=>onEnquire((group?.category||'gym').toLowerCase()+' equipment and availability')}>ASK ABOUT EQUIPMENT <ArrowUpRight size={17}/></button></div></div></>;
}
