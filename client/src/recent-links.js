const KEY = 'sniply.recentLinks';

export function readRecentLinks() {
  try {
    const links = JSON.parse(localStorage.getItem(KEY) || '[]');
    if (!Array.isArray(links)) return [];
    return links.filter((link) => {
      if (!link || typeof link.code !== 'string') return false;
      return ['originalUrl', 'shortUrl'].every((key) =>
        typeof link[key] === 'string' && /^https?:$/.test(new URL(link[key]).protocol));
    }).slice(0, 5);
  } catch {
    return [];
  }
}

export function saveRecentLinks(links) {
  try {
    localStorage.setItem(KEY, JSON.stringify(links.slice(0, 5)));
  } catch {
    // Shortening still works when browser storage is unavailable.
  }
}
