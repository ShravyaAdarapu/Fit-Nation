'use client';
import type {Branch} from '../lib/branches';
import {MapPin,ExternalLink} from 'lucide-react';
export default function BranchMap({branch}:{branch:Branch}){
 const hasPin=!!branch.coordinates;
 const confirmed=hasPin&&branch.locationEvidence?.status==='confirmed';
 const bounds=hasPin?[branch.coordinates!.lng-.008,branch.coordinates!.lat-.006,branch.coordinates!.lng+.008,branch.coordinates!.lat+.006]:[78.38,17.25,78.70,17.48];
 const mapSrc=`https://www.openstreetmap.org/export/embed.html?bbox=${bounds.join('%2C')}&layer=mapnik${hasPin?`&marker=${branch.coordinates!.lat}%2C${branch.coordinates!.lng}`:''}`;
 const link=branch.mapUrl||`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`The Fit Nation Hyderabad ${branch.name} ${branch.address||''}`)}`;
 return <div className="map-card"><div className="map-card-head"><div><MapPin size={18}/><b>{hasPin?`${branch.name} location`:'Hyderabad area overview'}</b></div><span className={confirmed?'verification verified':'verification'}>{confirmed?'PIN CONFIRMED':hasPin?'PUBLIC LISTING PIN':'EXACT PIN UNCONFIRMED'}</span></div><iframe key={branch.id} src={mapSrc} title={`${hasPin?'Listed gym location':'Hyderabad overview, not an exact gym pin'}: ${branch.name}`} loading="lazy" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen/><div className="map-attribution"><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a></div><div className="map-card-foot"><div><p>{branch.address||`An exact address for ${branch.name} has not yet been found.`}</p>{!hasPin&&<p>City overview only. No gym marker is shown.</p>}<details className="map-evidence"><summary>Location verification details</summary><small className="map-source-note">{branch.locationEvidence?.note||'Entrance and parking access await confirmation.'}{branch.locationEvidence?.sources.map(s=><span key={s.url}> · <a href={s.url} target="_blank" rel="noreferrer">{s.label}</a></span>)}</small></details></div><a href={link} target="_blank" rel="noreferrer">{hasPin?'OPEN LISTED PIN IN MAPS':'SEARCH THIS ADDRESS IN MAPS'} <ExternalLink size={14}/></a></div></div>;
}
