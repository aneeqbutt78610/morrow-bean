import './devtoolsHook';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import SiteLayout from './components/layout/SiteLayout';
import Home from './pages/Home';
import Menu from './pages/Menu';
import OurStory from './pages/OurStory';
import CoffeeAndBakes from './pages/CoffeeAndBakes';
import VisitUs from './pages/VisitUs';
import Contact from './pages/Contact';
import NotFound from './pages/NotFound';
import Order from './pages/Order';
import { OrderProvider } from './components/order/OrderProvider';
import './styles/globals.css';

const router = createBrowserRouter([
  {
    path: '/',
    element: <SiteLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'menu', element: <Menu /> },
      { path: 'our-story', element: <OurStory /> },
      { path: 'coffee-and-bakes', element: <CoffeeAndBakes /> },
      { path: 'visit-us', element: <VisitUs /> },
      { path: 'contact', element: <Contact /> },
      { path: 'order', element: <Order /> },
      { path: '*', element: <NotFound /> },
    ],
  },
], {
  // Opt in to React Router v7 behaviour now (silences the future-flag console warnings).
  future: { v7_relativeSplatPath: true, v7_fetcherPersist: true, v7_normalizeFormMethod: true, v7_partialHydration: true, v7_skipActionErrorRevalidation: true },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode><OrderProvider><RouterProvider router={router} future={{ v7_startTransition: true }} /></OrderProvider></React.StrictMode>,
);
