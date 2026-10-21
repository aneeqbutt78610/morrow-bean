import { Outlet } from 'react-router-dom';
import AnnouncementBar from './AnnouncementBar';
import Header from '../navigation/Header';
import Footer from './Footer';
import ChatbotWidget from '../chatbot/ChatbotWidget';
import ErrorBoundary from './ErrorBoundary';
import { CursorFollower, PageMotion } from '../motion/InteractionEffects';
import { SmoothScroll } from '../motion/SmoothScroll';

export default function SiteLayout() {
  return (
    <ErrorBoundary>
      <div id="top" className="app-shell">
        <SmoothScroll />
        <PageMotion />
        <CursorFollower />
        <AnnouncementBar />
        <Header />
        <main id="main-content"><Outlet /></main>
        <Footer />
        <ChatbotWidget />
      </div>
    </ErrorBoundary>
  );
}
