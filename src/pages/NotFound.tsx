import { Link } from 'react-router-dom';
export default function NotFound() {
  return <section className="container error-screen"><p className="eyebrow">A LITTLE DETOUR</p><h1>This page isn’t on the menu.</h1><p>Let’s take you back to something lovely.</p><Link to="/" className="button">Back to the home page ↗</Link></section>;
}
