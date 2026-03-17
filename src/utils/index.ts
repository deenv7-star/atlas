const pagePathMap: Record<string, string> = {
    Landing: '/',
    About: '/about',
    Privacy: '/privacy',
    Terms: '/terms',
    Contact: '/contact',
};

export function createPageUrl(pageName: string) {
    return pagePathMap[pageName] ?? '/' + pageName.replace(/ /g, '-');
}