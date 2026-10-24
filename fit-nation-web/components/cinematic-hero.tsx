'use client';

import {useEffect, useRef, useState} from 'react';
import {ArrowDown, ArrowUpRight, Pause, Play} from 'lucide-react';

export default function CinematicHero({onVisit}: {onVisit: () => void}) {
  const video = useRef<HTMLVideoElement>(null);
  const hero = useRef<HTMLElement>(null);
  const [source, setSource] = useState<string>();
  const [ready, setReady] = useState(false);
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as Navigator & {connection?: {saveData?: boolean}}).connection;
    const applyPreference = () => {
      const stop = preference.matches || !!connection?.saveData;
      setPaused(stop);
      if (!stop) setSource(window.innerWidth <= 700 ? '/media/training-mobile.mp4' : '/media/training-desktop.mp4');
    };
    applyPreference();
    preference.addEventListener('change', applyPreference);
    return () => {preference.removeEventListener('change', applyPreference); document.documentElement.classList.remove('motion-paused');};
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('motion-paused', paused);
    const player = video.current;
    if (!player || !source) return;
    let visible = true;
    const sync = () => {
      if (paused || document.hidden || !visible) player.pause();
      else void player.play().catch(() => setPaused(true));
    };
    const observer = new IntersectionObserver(([entry]) => {visible = entry.isIntersecting; sync();}, {threshold: .01});
    if (hero.current) observer.observe(hero.current);
    document.addEventListener('visibilitychange', sync);
    sync();
    return () => {observer.disconnect(); document.removeEventListener('visibilitychange', sync); player.pause();};
  }, [paused, source]);

  function toggleMotion() {
    if (!source && !failed) setSource(window.innerWidth <= 700 ? '/media/training-mobile.mp4' : '/media/training-desktop.mp4');
    setPaused(value => !value);
  }

  return <>
    <section ref={hero} className="hero cinema-hero" aria-labelledby="hero-title">
      <div className="cinema-media" aria-hidden="true">
        <img className="cinema-poster" src="/media/training-poster.jpg" alt="" width={1600} height={900} fetchPriority="high"/>
        {source && !failed && <video ref={video} className={ready ? 'cinema-video is-ready' : 'cinema-video'} src={source} poster="/media/training-poster.jpg" muted loop playsInline preload="none" tabIndex={-1} onPlaying={() => setReady(true)} onError={() => {setFailed(true); setReady(false);}}/>}
      </div>
      <div className="cinema-shade"/>
      <div className="cinema-grain" aria-hidden="true"/>
      <div className="cinema-topline"><span><i/> HYDERABAD. THIS IS YOUR NATION.</span><span className="cinema-edition">EST. IN EFFORT / BUILT TOGETHER</span></div>
      <svg className="cinema-ribbon" viewBox="0 0 1440 800" preserveAspectRatio="none" aria-hidden="true"><path d="M-160 600C160 115 325 835 760 435S1310 355 1590 40"/><path d="M-100 650C190 200 350 880 795 485S1320 420 1580 120"/></svg>
      <div className="cinema-content">
        <span className="cinema-kicker">YOUR NEXT CHAPTER STARTS WITH YOU.</span>
        <h1 id="hero-title"><span className="cinema-title-line">SHOW UP.</span><span className="cinema-title-line cinema-title-orange">GET STRONGER<span className="cinema-period">.</span></span></h1>
        <p>For the first rep. The next goal. The better you.<br/>Find your people. Find your Fit Nation.</p>
        <div className="cinema-actions"><button className="button" onClick={onVisit}>FIND YOUR START <ArrowUpRight size={19}/></button><a href="#locations">EXPLORE OUR BRANCHES <ArrowUpRight size={17}/></a></div>
      </div>
      <div className="cinema-bottom"><a className="cinema-scroll" href="#experience"><span className="cinema-scroll-icon"><ArrowDown size={17}/></span><span>THERE’S MORE IN YOU.<small>SCROLL TO DISCOVER</small></span></a><span className="cinema-footage">TRAINING IN MOTION <small>ILLUSTRATIVE STOCK FOOTAGE</small></span><button className="cinema-motion-toggle" onClick={toggleMotion} aria-label={paused ? 'Play background motion' : 'Pause background motion'} aria-pressed={paused}>{paused ? <Play size={14}/> : <Pause size={14}/>}<span>{paused ? 'PLAY MOTION' : 'PAUSE MOTION'}</span></button></div>
    </section>
    <div className="nation-marquee" aria-hidden="true"><div>{[0,1].map(n => <span className="nation-marquee-group" key={n}><span>YOUR PACE.</span><b>↗</b><span>YOUR PROGRESS.</span><b>↗</b><span>YOUR NATION.</span><b>↗</b></span>)}</div></div>
  </>;
}
