const pagePathMap: Record<string, string> = {
    Landing: '/',
    Dashboard: '/dashboard',
    About: '/about',
    Privacy: '/privacy',
    Terms: '/terms',
    Contact: '/contact',
    Changelog: '/changelog',
    Status: '/status',
    GuestService: '/guest-service',
    DataSecurity: '/data-security',
    Accessibility: '/accessibility',
    SLA: '/sla',
};

export function createPageUrl(pageName: string) {
    return pagePathMap[pageName] ?? '/' + pageName.replace(/ /g, '-');
}