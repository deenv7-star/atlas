import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { pagesConfig } from '@/pages.config';
import { getPageKeyFromPathname } from '@/utils';

export default function NavigationTracker() {
    const location = useLocation();
    const { isAuthenticated } = useAuth();
    const { Pages } = pagesConfig;

    useEffect(() => {
        const pathname = location.pathname;
        const pageName = getPageKeyFromPathname(pathname);

        // Navigation is tracked locally only — no external service required
        if (isAuthenticated && pageName && Pages[pageName]) {
            // Could be extended to log to a local analytics store if needed
        }
    }, [location, isAuthenticated, Pages]);

    return null;
}
