import { MapPin, Navigation } from 'lucide-react';

export default function VisitMap() {
  return <div className="mock-map" role="img" aria-label="Illustrated mock street map for the fictional Morrow and Bean Café location in Faisalabad">
    <div className="mock-map__grid" />
    <svg className="mock-map__roads" viewBox="0 0 740 490" preserveAspectRatio="none" aria-hidden="true">
      <path d="M-40 95 C115 120 178 85 255 130 S410 255 790 140" />
      <path d="M40 -30 C160 95 245 190 210 520" />
      <path d="M470 -30 C420 110 520 220 465 520" />
      <path d="M-20 370 C150 310 245 390 360 330 S540 280 780 390" />
      <path d="M635 -20 C590 115 650 250 720 520" />
      <path className="mock-map__road-main" d="M-30 255 C160 235 280 260 405 230 S585 200 770 245" />
    </svg>
    <span className="mock-map__park mock-map__park--one" /><span className="mock-map__park mock-map__park--two" /><span className="mock-map__block mock-map__block--one" /><span className="mock-map__block mock-map__block--two" />
    <div className="mock-map__pin"><span><MapPin size={24} fill="currentColor" /></span><div><strong>Morrow &amp; Bean</strong><small>Mock location</small></div></div>
    <div className="mock-map__legend"><span className="mock-map__legend-pin"><MapPin size={13} /></span><span>Illustrative map</span><i /> <span>Not for navigation</span></div>
    <div className="mock-map__compass"><Navigation size={16} /><span>N</span></div>
    <span className="mock-map__label mock-map__label--a">CANAL ROAD</span><span className="mock-map__label mock-map__label--b">THE COURTYARD</span>
  </div>;
}
