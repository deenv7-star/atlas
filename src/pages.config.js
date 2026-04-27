/**
 * pages.config.js — עם Lazy Loading
 * 
 * שינוי: כל הדפים עוטפים ב-React.lazy() כדי לחלק את הבאנדל.
 * הדפים נטענים רק כשהמשתמש מנווט אליהם — First Load JS קטן ב-30-50%.
 * 
 * Suspense ב-Layout.jsx (דפים ציבוריים ומאובטחים) עם PageLoader — טעינת lazy().
 */
import { lazy } from 'react';
import __Layout from './Layout.jsx';

const AIAssistant        = lazy(() => import('./pages/AIAssistant'));
const ApiDocs            = lazy(() => import('./pages/ApiDocs'));
const About              = lazy(() => import('./pages/About'));
const Accessibility      = lazy(() => import('./pages/Accessibility'));
const Automations        = lazy(() => import('./pages/Automations'));
const Billing            = lazy(() => import('./pages/Billing'));
const BookingDetail      = lazy(() => import('./pages/BookingDetail'));
const Bookings           = lazy(() => import('./pages/Bookings'));
const Cleaning           = lazy(() => import('./pages/Cleaning'));
const Changelog          = lazy(() => import('./pages/Changelog'));
const Contact            = lazy(() => import('./pages/Contact'));
const Contracts          = lazy(() => import('./pages/Contracts'));
const Dashboard          = lazy(() => import('./pages/Dashboard'));
const DataSecurity       = lazy(() => import('./pages/DataSecurity'));
const DynamicPricing     = lazy(() => import('./pages/DynamicPricing'));
const GuestJourney       = lazy(() => import('./pages/GuestJourney'));
const GuestPortal        = lazy(() => import('./pages/GuestPortal'));
const GuestService       = lazy(() => import('./pages/GuestService'));
const HowItWorks         = lazy(() => import('./pages/HowItWorks'));
const MultiCalendar      = lazy(() => import('./pages/MultiCalendar'));
const OwnerReports       = lazy(() => import('./pages/OwnerReports'));
const RevenueIntelligence = lazy(() => import('./pages/RevenueIntelligence'));
const Integrations       = lazy(() => import('./pages/Integrations'));
const Invoices           = lazy(() => import('./pages/Invoices'));
const ExpenseTracker     = lazy(() => import('./pages/ExpenseTracker'));
const Landing            = lazy(() => import('./pages/Landing'));
const LeadDetail         = lazy(() => import('./pages/LeadDetail'));
const Leads              = lazy(() => import('./pages/Leads'));
const Messages           = lazy(() => import('./pages/Messages'));
const Payments           = lazy(() => import('./pages/Payments'));
const PricingPlans       = lazy(() => import('./pages/PricingPlans'));
const Privacy            = lazy(() => import('./pages/Privacy'));
const Reviews            = lazy(() => import('./pages/Reviews'));
const ServiceRequests    = lazy(() => import('./pages/ServiceRequests'));
const SLA                = lazy(() => import('./pages/SLA'));
const Status             = lazy(() => import('./pages/Status'));
const Settings           = lazy(() => import('./pages/Settings'));
const Subscription       = lazy(() => import('./pages/Subscription'));
const Terms              = lazy(() => import('./pages/Terms'));
const Onboarding         = lazy(() => import('./pages/Onboarding'));
const PlatformAdmin      = lazy(() => import('./pages/PlatformAdmin'));
const Register           = lazy(() => import('./pages/Register'));
const VerifyEmail        = lazy(() => import('./pages/VerifyEmail'));

export const PAGES = {
  AIAssistant, ApiDocs, About, Accessibility, Automations,
  Billing, BookingDetail, Bookings, Cleaning, Changelog,
  Contact, Contracts, Dashboard, DataSecurity, DynamicPricing,
  GuestJourney, GuestPortal, GuestService, HowItWorks,
  Integrations, Invoices, ExpenseTracker, Landing,
  LeadDetail, Leads, Messages, Onboarding, PlatformAdmin,
  Register, VerifyEmail, MultiCalendar, OwnerReports,
  Payments, PricingPlans, Privacy, RevenueIntelligence,
  Reviews, ServiceRequests, SLA, Status, Settings,
  Subscription, Terms,
};

export const pagesConfig = {
  mainPage: 'Landing',
  Pages: PAGES,
  Layout: __Layout,
};
