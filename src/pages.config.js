/**
 * pages.config.js — עם Lazy Loading
 * 
 * שינוי: כל הדפים עוטפים ב-React.lazy() כדי לחלק את הבאנדל.
 * הדפים נטענים רק כשהמשתמש מנווט אליהם — First Load JS קטן ב-30-50%.
 * 
 * Suspense ב-Layout.jsx (דפים ציבוריים ומאובטחים) עם PageLoader — טעינת lazy().
 */
import { lazy } from 'react';

/** One loader per page: lazy() uses it, and preloadPage() can start the same download early. */
export const PAGE_LOADERS = {
  AIAssistant: () => import('./pages/AIAssistant'),
  About: () => import('./pages/About'),
  Accessibility: () => import('./pages/Accessibility'),
  Automations: () => import('./pages/Automations'),
  Billing: () => import('./pages/Billing'),
  BookingDetail: () => import('./pages/BookingDetail'),
  Bookings: () => import('./pages/Bookings'),
  Cleaning: () => import('./pages/Cleaning'),
  Contact: () => import('./pages/Contact'),
  Contracts: () => import('./pages/Contracts'),
  Dashboard: () => import('./pages/Dashboard'),
  DataSecurity: () => import('./pages/DataSecurity'),
  DynamicPricing: () => import('./pages/DynamicPricing'),
  GuestJourney: () => import('./pages/GuestJourney'),
  GuestPortal: () => import('./pages/GuestPages'),
  GuestService: () => import('./pages/GuestService'),
  HowItWorks: () => import('./pages/HowItWorks'),
  MultiCalendar: () => import('./pages/MultiCalendar'),
  OwnerReports: () => import('./pages/OwnerReports'),
  RevenueIntelligence: () => import('./pages/RevenueIntelligence'),
  Integrations: () => import('./pages/Integrations'),
  Invoices: () => import('./pages/Invoices'),
  ExpenseTracker: () => import('./pages/ExpenseTracker'),
  Landing: () => import('./pages/Landing'),
  LeadDetail: () => import('./pages/LeadDetail'),
  Leads: () => import('./pages/Leads'),
  Messages: () => import('./pages/Messages'),
  Payments: () => import('./pages/Payments'),
  PricingPlans: () => import('./pages/PricingPlans'),
  Privacy: () => import('./pages/Privacy'),
  Reviews: () => import('./pages/Reviews'),
  ServiceRequests: () => import('./pages/ServiceRequests'),
  SLA: () => import('./pages/SLA'),
  Status: () => import('./pages/Status'),
  Settings: () => import('./pages/Settings'),
  Subscription: () => import('./pages/Subscription'),
  Terms: () => import('./pages/Terms'),
  Onboarding: () => import('./pages/Onboarding'),
  PlatformAdmin: () => import('./pages/PlatformAdmin'),
  Register: () => import('./pages/Register'),
  VerifyEmail: () => import('./pages/VerifyEmail'),
  Today: () => import('./pages/Today'),
  Balances: () => import('./pages/Balances'),
  MonthlyReport: () => import('./pages/MonthlyReport'),
};

const AIAssistant = lazy(PAGE_LOADERS.AIAssistant);
const About = lazy(PAGE_LOADERS.About);
const Accessibility = lazy(PAGE_LOADERS.Accessibility);
const Automations = lazy(PAGE_LOADERS.Automations);
const Billing = lazy(PAGE_LOADERS.Billing);
const BookingDetail = lazy(PAGE_LOADERS.BookingDetail);
const Bookings = lazy(PAGE_LOADERS.Bookings);
const Cleaning = lazy(PAGE_LOADERS.Cleaning);
const Contact = lazy(PAGE_LOADERS.Contact);
const Contracts = lazy(PAGE_LOADERS.Contracts);
const Dashboard = lazy(PAGE_LOADERS.Dashboard);
const DataSecurity = lazy(PAGE_LOADERS.DataSecurity);
const DynamicPricing = lazy(PAGE_LOADERS.DynamicPricing);
const GuestJourney = lazy(PAGE_LOADERS.GuestJourney);
const GuestPortal = lazy(PAGE_LOADERS.GuestPortal);
const GuestService = lazy(PAGE_LOADERS.GuestService);
const HowItWorks = lazy(PAGE_LOADERS.HowItWorks);
const MultiCalendar = lazy(PAGE_LOADERS.MultiCalendar);
const OwnerReports = lazy(PAGE_LOADERS.OwnerReports);
const RevenueIntelligence = lazy(PAGE_LOADERS.RevenueIntelligence);
const Integrations = lazy(PAGE_LOADERS.Integrations);
const Invoices = lazy(PAGE_LOADERS.Invoices);
const ExpenseTracker = lazy(PAGE_LOADERS.ExpenseTracker);
const Landing = lazy(PAGE_LOADERS.Landing);
const LeadDetail = lazy(PAGE_LOADERS.LeadDetail);
const Leads = lazy(PAGE_LOADERS.Leads);
const Messages = lazy(PAGE_LOADERS.Messages);
const Payments = lazy(PAGE_LOADERS.Payments);
const PricingPlans = lazy(PAGE_LOADERS.PricingPlans);
const Privacy = lazy(PAGE_LOADERS.Privacy);
const Reviews = lazy(PAGE_LOADERS.Reviews);
const ServiceRequests = lazy(PAGE_LOADERS.ServiceRequests);
const SLA = lazy(PAGE_LOADERS.SLA);
const Status = lazy(PAGE_LOADERS.Status);
const Settings = lazy(PAGE_LOADERS.Settings);
const Subscription = lazy(PAGE_LOADERS.Subscription);
const Terms = lazy(PAGE_LOADERS.Terms);
const Onboarding = lazy(PAGE_LOADERS.Onboarding);
const PlatformAdmin = lazy(PAGE_LOADERS.PlatformAdmin);
const Register = lazy(PAGE_LOADERS.Register);
const VerifyEmail = lazy(PAGE_LOADERS.VerifyEmail);
const Today = lazy(PAGE_LOADERS.Today);
const Balances = lazy(PAGE_LOADERS.Balances);
const MonthlyReport = lazy(PAGE_LOADERS.MonthlyReport);

/** Start downloading a page's code now (returns the import promise; safe to call repeatedly). */
export function preloadPage(key) {
  const load = PAGE_LOADERS[key];
  return load ? load().catch(() => null) : null;
}

// /guest-portal now opens the working guest-page + direct-booking settings (was a static mock).

export const PAGES = {
  AIAssistant, About, Accessibility, Automations,
  Billing, BookingDetail, Bookings, Cleaning,
  Contact, Contracts, Dashboard, DataSecurity, DynamicPricing,
  GuestJourney, GuestPortal, GuestService, HowItWorks,
  Integrations, Invoices, ExpenseTracker, Landing,
  LeadDetail, Leads, Messages, Onboarding, PlatformAdmin,
  Register, VerifyEmail, MultiCalendar, OwnerReports,
  Payments, PricingPlans, Privacy, RevenueIntelligence,
  Reviews, ServiceRequests, SLA, Status, Settings,
  Subscription, Terms,
  Today, Balances, MonthlyReport,
};

export const pagesConfig = {
  mainPage: 'Landing',
  Pages: PAGES,
};
