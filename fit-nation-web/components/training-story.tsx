import {ArrowUpRight} from 'lucide-react';

export default function TrainingStory({onVisit}: {onVisit: () => void}) {
  return <section className="training-story" aria-labelledby="story-heading">
    <div className="story-photo"><img src="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=1600&q=85" width={1600} height={1100} loading="lazy" alt="Illustrative athlete preparing for a strength workout"/><div className="story-photo-shade"/></div>
    <div className="story-heading"><div className="section-kicker">THE EVERYDAY IS WHERE IT HAPPENS.</div><h2 id="story-heading">LESS <span>SOMEDAY.</span><br/>MORE <em>DAY ONE.</em></h2></div>
    <div className="story-footer"><span className="story-index" aria-hidden="true">FN / 01</span><div><p>You don’t need a new version of yourself to begin.<br/>Just a place to start. And a reason to come back.</p><button className="under-link" onClick={onVisit}>MAKE TODAY YOUR DAY ONE <ArrowUpRight size={19}/></button></div><span className="story-caption">REAL EFFORT. EVERY DAY.<small>ILLUSTRATIVE TRAINING PHOTOGRAPHY</small></span></div>
  </section>;
}
