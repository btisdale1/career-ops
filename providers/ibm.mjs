// @ts-check
/** @typedef {import('./_types.js').Provider} Provider */

// IBM Careers provider - best-effort HTML discovery for IBM's Avature-backed
// careers site. IBM can redirect stale jobs to /closedjob, so this provider
// only returns direct JobDetail URLs found on search/listing pages.

const DEFAULT_SEARCH_TERMS = [
  'Site Reliability Engineer',
  'SRE',
  'Cloud Infrastructure Engineer',
  'Systems Engineer',
  'Solutions Engineer',
];

const BASE_URL = 'https://careers.ibm.com';

function isIbmCareersUrl(url) {
  try {
    return new URL(url).hostname === 'careers.ibm.com';
  } catch {
    return false;
  }
}

function decodeEntities(text) {
  return String(text || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function stripTags(html) {
  return decodeEntities(html)
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeUrl(url) {
  const absolute = new URL(decodeEntities(url), BASE_URL);
  absolute.hash = '';
  return absolute.href;
}

function inferTitleFromUrl(url) {
  const parsed = new URL(url);
  const detailIndex = parsed.pathname.split('/').findIndex(part => part === 'JobDetail');
  const slug = parsed.pathname.split('/')[detailIndex + 1] || '';
  return decodeURIComponent(slug)
    .replace(/-\d+$/, '')
    .replace(/-/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanTitle(title, url) {
  const cleaned = stripTags(title)
    .replace(/\s+-\s+\d+\s+-\s+IBM$/i, '')
    .replace(/\s+\|\s+IBM$/i, '')
    .trim();
  return cleaned || inferTitleFromUrl(url) || 'IBM Job';
}

function parseJobs(html, entry) {
  const jobs = new Map();

  for (const match of html.matchAll(/<a\b[^>]*href=["']([^"']*\/careers\/JobDetail\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi)) {
    const url = normalizeUrl(match[1]);
    if (url.includes('/closedjob')) continue;
    jobs.set(url, {
      title: cleanTitle(match[2], url),
      url,
      company: entry.name,
      location: '',
    });
  }

  for (const match of html.matchAll(/https:\/\/careers\.ibm\.com\/en_US\/careers\/JobDetail\/[^"'<\s]+/gi)) {
    const url = normalizeUrl(match[0]);
    if (url.includes('/closedjob')) continue;
    if (!jobs.has(url)) {
      jobs.set(url, {
        title: inferTitleFromUrl(url) || 'IBM Job',
        url,
        company: entry.name,
        location: '',
      });
    }
  }

  return [...jobs.values()].filter(job => {
    const title = job.title.toLowerCase();
    return title && title !== "let's connect!" && title !== 'ibm job';
  });
}

function searchUrls(entry) {
  const terms = Array.isArray(entry.search_terms) && entry.search_terms.length > 0
    ? entry.search_terms.filter(term => typeof term === 'string' && term.trim())
    : DEFAULT_SEARCH_TERMS;

  return [
    entry.careers_url || BASE_URL,
    ...terms.map(term => `${BASE_URL}/en_US/careers/SearchJobs?search=${encodeURIComponent(term)}`),
  ];
}

/** @type {Provider} */
export default {
  id: 'ibm',

  detect(entry) {
    return isIbmCareersUrl(entry.careers_url || '') ? { url: entry.careers_url } : null;
  },

  async fetch(entry, ctx) {
    const jobs = new Map();
    const errors = [];

    for (const url of searchUrls(entry)) {
      try {
        const html = await ctx.fetchText(url, {
          headers: {
            accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          },
        });
        for (const job of parseJobs(html, entry)) jobs.set(job.url, job);
      } catch (err) {
        errors.push(err?.message || String(err));
      }
    }

    if (jobs.size === 0 && errors.length === searchUrls(entry).length) {
      throw new Error(`ibm: all careers requests failed: ${errors[0]}`);
    }

    return [...jobs.values()];
  },
};
