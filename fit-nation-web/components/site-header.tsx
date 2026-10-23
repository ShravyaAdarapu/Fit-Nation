'use client';
import {useEffect, useRef, useState} from 'react';
import {ArrowUpRight, Menu, X} from 'lucide-react';
import GymBrand from './gym-brand';
import MemberLogin from './member-login';

const links = [['Branches', 'locations'], ['Programs', 'programs'], ['Trainers', 'team'], ['Equipment', 'equipment'], ['Facilities', 'facilities'], ['Contact', 'contact']];

export default function SiteHeader({onVisit, visitHref, home = false}: {onVisit?: () => void; visitHref?: string; home?: boolean}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const header = useRef<HTMLElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!menuOpen) return;
    const outside = (event: PointerEvent) => {if (!header.current?.contains(event.target as Node)) setMenuOpen(false);};
    const escape = (event: KeyboardEvent) => {if (event.key === 'Escape') {setMenuOpen(false); menuButton.current?.focus();}};
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => {document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape);};
  }, [menuOpen]);
  return <>
    <a className="skip-link" href="#main-content">Skip to content</a>
    <header ref={header} className="site-header">
      <GymBrand/>
      <nav id="site-navigation" className={`site-navigation${menuOpen ? ' is-open' : ''}`} aria-label="Main navigation">
        {links.map(([label, id]) => <a key={id} href={`${home ? '' : '/'}#${id}`} onClick={() => setMenuOpen(false)}>{label}<ArrowUpRight size={17} aria-hidden="true"/></a>)}
      </nav>
      <div className="header-actions">
        {visitHref ? <a className="button small header-visit" href={visitHref}>BOOK A VISIT <ArrowUpRight size={16}/></a> : <button className="button small header-visit" onClick={() => {setMenuOpen(false); onVisit?.();}}>BOOK A VISIT <ArrowUpRight size={16}/></button>}
        <MemberLogin onOpen={() => setMenuOpen(false)}/>
        <button ref={menuButton} className="navigation-toggle" aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} aria-controls="site-navigation" onClick={() => setMenuOpen(!menuOpen)}>{menuOpen ? <X size={22}/> : <Menu size={22}/>}</button>
      </div>
    </header>
  </>;
}
