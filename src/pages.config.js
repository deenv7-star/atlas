/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import AIAssistant from './pages/AIAssistant';
import Automations from './pages/Automations';
import BookingDetail from './pages/BookingDetail';
import Bookings from './pages/Bookings';
import Cleaning from './pages/Cleaning';
import Contracts from './pages/Contracts';
import Dashboard from './pages/Dashboard';
import Integrations from './pages/Integrations';
import Invoices from './pages/Invoices';
import Landing from './pages/Landing';
import LeadDetail from './pages/LeadDetail';
import Leads from './pages/Leads';
import Messages from './pages/Messages';
import Payments from './pages/Payments';
import Privacy from './pages/Privacy';
import Reviews from './pages/Reviews';
import Settings from './pages/Settings';
import Terms from './pages/Terms';
import GuestService from './pages/GuestService';
import ServiceRequests from './pages/ServiceRequests';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AIAssistant": AIAssistant,
    "Automations": Automations,
    "BookingDetail": BookingDetail,
    "Bookings": Bookings,
    "Cleaning": Cleaning,
    "Contracts": Contracts,
    "Dashboard": Dashboard,
    "Integrations": Integrations,
    "Invoices": Invoices,
    "Landing": Landing,
    "LeadDetail": LeadDetail,
    "Leads": Leads,
    "Messages": Messages,
    "Payments": Payments,
    "Privacy": Privacy,
    "Reviews": Reviews,
    "Settings": Settings,
    "Terms": Terms,
    "GuestService": GuestService,
    "ServiceRequests": ServiceRequests,
}

export const pagesConfig = {
    mainPage: "Landing",
    Pages: PAGES,
    Layout: __Layout,
};