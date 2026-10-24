'use client';
import {useEffect} from 'react';

export default function MotionEnhancer() {
  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!('IntersectionObserver' in window)) return;
    const targets = Array.from(document.querySelectorAll<HTMLElement>('main .section-top, main .experience-layout, main .principles>div, main .home-amenities, main .branch-card, main .membership, main .trainer-roster, main .motion-program-card, main .training-story'));
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.classList.add('motion-visible');
        observer.unobserve(entry.target);
      }
    }, {threshold: .08, rootMargin: '0px 0px 35px 0px'});
    for (const element of targets) {
      if (!preference.matches && element.getBoundingClientRect().top > window.innerHeight) {
        element.classList.add('motion-reveal');
        if (element.matches('.motion-program-card, .branch-card, .principles>div')) {
          const index = Array.from(element.parentElement?.children ?? []).indexOf(element);
          element.style.setProperty('--reveal-delay', `${Math.min(index, 2) * 100}ms`);
        }
        observer.observe(element);
      }
    }
    const hero = document.querySelector<HTMLElement>('.cinema-hero');
    let frame = 0;
    const update = () => {
      frame = 0;
      if (!hero || preference.matches || document.documentElement.classList.contains('motion-paused') || window.innerWidth < 701) return;
      const rect = hero.getBoundingClientRect();
      if (rect.bottom > 0 && rect.top < window.innerHeight) hero.style.setProperty('--hero-drift', `${Math.max(0, -rect.top) * .16}px`);
    };
    const scroll = () => {if (!frame) frame = requestAnimationFrame(update);};
    const revealFocused = (event: FocusEvent) => {
      const target = event.target instanceof Element ? event.target.closest('.motion-reveal') : null;
      target?.classList.add('motion-visible');
    };
    const changed = () => {
      if (preference.matches) {
        targets.forEach(element => element.classList.add('motion-visible'));
        observer.disconnect();
        hero?.style.removeProperty('--hero-drift');
      }
    };
    window.addEventListener('scroll', scroll, {passive: true});
    document.addEventListener('focusin', revealFocused);
    preference.addEventListener('change', changed);
    return () => {
      observer.disconnect(); cancelAnimationFrame(frame);
      window.removeEventListener('scroll', scroll);
      document.removeEventListener('focusin', revealFocused);
      preference.removeEventListener('change', changed);
      hero?.style.removeProperty('--hero-drift');
      targets.forEach(element => {element.classList.remove('motion-reveal', 'motion-visible'); element.style.removeProperty('--reveal-delay');});
    };
  }, []);
  return null;
}
