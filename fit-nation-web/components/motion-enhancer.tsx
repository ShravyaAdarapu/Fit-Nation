'use client';

import {useEffect, useRef} from 'react';
import {usePathname} from 'next/navigation';

const revealSelector = [
  'main .section-top', 'main .experience-layout', 'main .principles>div',
  'main .home-amenities>article', 'main .branch-card', 'main .trainer-roster',
  'main .motion-program-card', 'main .story-heading', 'main .story-footer',
  'main .equipment-story', 'main .location-tools', 'main .branch-explorer',
  'main .membership>div', 'main .faq>div:first-child', 'main .faq-item',
  'main .contact-intro', 'main .contact-option', 'main .social>a', 'main .social>p',
  'main .branch-hero-heading', 'main .branch-page-hero>div>p',
  'main .branch-info-block>.info-heading', 'main .branch-info-block>h2',
  'main .branch-info-block>.section-kicker', 'main .weekly-hours>div',
  'main .equipment-groups>div', 'main .trainer-card', 'main .amenity-grid>div',
  'main .branch-info-block>.map-card', 'main .visit-card', 'main .source-note',
  'footer .footer-top>*',
].join(',');

export default function MotionEnhancer() {
  const progress = useRef<HTMLSpanElement>(null);
  const pathname = usePathname();

  useEffect(() => {
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (!('IntersectionObserver' in window)) return;
    const targets = new Set<HTMLElement>();
    const scenes = Array.from(document.querySelectorAll<HTMLElement>('.training-story, .equipment-story'));
    const hero = document.querySelector<HTMLElement>('.cinema-hero');
    const root = document.documentElement;
    let frame = 0;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) {
        entry.target.classList.add('motion-visible');
        observer.unobserve(entry.target);
      }
    }, {threshold: 0, rootMargin: '0px 0px -32px 0px'});

    const register = () => {
      document.querySelectorAll<HTMLElement>(revealSelector).forEach(element => {
        if (targets.has(element)) return;
        targets.add(element);
        // Keep initial viewport and deep-linked content immediately readable.
        if (preference.matches || element.getBoundingClientRect().top < window.innerHeight - 24) return;
        element.classList.add('motion-reveal');
        const index = Array.from(element.parentElement?.children ?? []).indexOf(element);
        if (element.matches('.branch-card, .motion-program-card, .home-amenities>article, .principles>div, .faq-item, .weekly-hours>div, .amenity-grid>div, .contact-option, .trainer-card, .equipment-groups>div')) {
          element.style.setProperty('--reveal-delay', `${Math.min(index, 4) * 65}ms`);
          element.classList.add('motion-card');
        } else if (element.matches('.section-top, .experience-layout, .story-heading, .info-heading')) {
          element.classList.add('motion-heading');
        }
        observer.observe(element);
      });
    };
    const update = () => {
      frame = 0;
      const range = Math.max(1, root.scrollHeight - window.innerHeight);
      progress.current?.style.setProperty('--read-progress', String(Math.min(1, Math.max(0, window.scrollY / range))));
      document.querySelector('.site-header')?.classList.toggle('has-scrolled', window.scrollY > 24);
      if (preference.matches || root.classList.contains('motion-paused')) return;
      if (window.innerWidth < 701) {
        hero?.style.removeProperty('--hero-drift');
        scenes.forEach(scene => scene.style.removeProperty('--scene-shift'));
        return;
      }
      if (hero) {
        const rect = hero.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight) hero.style.setProperty('--hero-drift', `${Math.max(0, -rect.top) * .13}px`);
      }
      scenes.forEach(scene => {
        const rect = scene.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight) {
          const position = (window.innerHeight / 2 - (rect.top + rect.height / 2)) / window.innerHeight;
          scene.style.setProperty('--scene-shift', `${Math.max(-26, Math.min(26, position * 44))}px`);
        }
      });
    };
    const schedule = () => {if (!frame) frame = requestAnimationFrame(update);};
    const revealFocused = (event: FocusEvent) => {
      if (!(event.target instanceof Element)) return;
      let target = event.target.closest('.motion-reveal');
      while (target) {
        target.classList.add('motion-visible');
        observer.unobserve(target);
        target = target.parentElement?.closest('.motion-reveal') ?? null;
      }
    };
    const changed = () => {
      if (preference.matches) {
        targets.forEach(element => element.classList.add('motion-visible'));
        observer.disconnect();
        hero?.style.removeProperty('--hero-drift');
        scenes.forEach(scene => scene.style.removeProperty('--scene-shift'));
      }
      schedule();
    };
    register(); update();
    // Re-register cards inserted by branch filters, without watching style updates.
    const mutations = new MutationObserver(() => {register(); schedule();});
    const main = document.querySelector('main');
    if (main) mutations.observe(main, {childList: true, subtree: true});
    const resize = new ResizeObserver(schedule);
    resize.observe(document.body);
    window.addEventListener('scroll', schedule, {passive: true});
    window.addEventListener('resize', schedule);
    document.addEventListener('focusin', revealFocused);
    preference.addEventListener('change', changed);
    return () => {
      observer.disconnect(); mutations.disconnect(); resize.disconnect(); cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      document.removeEventListener('focusin', revealFocused);
      preference.removeEventListener('change', changed);
      document.querySelector('.site-header')?.classList.remove('has-scrolled');
      hero?.style.removeProperty('--hero-drift');
      scenes.forEach(scene => scene.style.removeProperty('--scene-shift'));
      targets.forEach(element => {
        element.classList.remove('motion-reveal', 'motion-visible', 'motion-card', 'motion-heading');
        element.style.removeProperty('--reveal-delay');
      });
    };
  }, [pathname]);

  return <div className="scroll-progress" aria-hidden="true"><span ref={progress}/></div>;
}
