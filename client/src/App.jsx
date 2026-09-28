import { useState } from 'react';
import { createShortLink } from './api.js';
import { readRecentLinks, saveRecentLinks } from './recent-links.js';

const isValidUrl = (value) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button className="copy-button" type="button" onClick={copy} aria-label={`Copy ${value}`}>
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

function LinkItem({ link, featured = false }) {
  return (
    <article className={featured ? 'link-card result-card' : 'link-card'}>
      <div className="link-details">
        {featured && <span className="eyebrow">Your shortened link</span>}
        <a className="short-link" href={link.shortUrl} target="_blank" rel="noreferrer">
          {link.shortUrl}
        </a>
        <span className="original-link" title={link.originalUrl}>{link.originalUrl}</span>
      </div>
      <CopyButton value={link.shortUrl} />
    </article>
  );
}

export default function App() {
  const [url, setUrl] = useState('');
  const [links, setLinks] = useState(readRecentLinks);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    const value = url.trim();
    if (!isValidUrl(value)) {
      setError('Enter a complete URL beginning with http:// or https://');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const link = await createShortLink(value);
      setResult(link);
      const recent = [link, ...links.filter((item) => item.code !== link.code)].slice(0, 5);
      setLinks(recent);
      saveRecentLinks(recent);
      setUrl('');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      <nav aria-label="Primary navigation">
        <a className="brand" href="/" aria-label="Sniply home"><span>↗</span> sniply</a>
        <a className="github-link" href="https://github.com/Mollymulhern/url-shortener" target="_blank" rel="noreferrer">GitHub ↗</a>
      </nav>

      <section className="hero">
        <div className="hero-copy">
          <span className="pill">Simple · Fast · Free</span>
          <h1>Short links.<br /><em>Big impact.</em></h1>
          <p>Turn unwieldy URLs into clean, shareable links in seconds. No account required.</p>
        </div>

        <div className="shortener-panel">
          <form onSubmit={submit} noValidate>
            <label htmlFor="url">Paste your long URL</label>
            <div className="input-row">
              <input
                id="url"
                type="url"
                value={url}
                onChange={(event) => { setUrl(event.target.value); setError(''); }}
                placeholder="https://example.com/a/very/long/link"
                aria-describedby={error ? 'url-error' : undefined}
                aria-invalid={Boolean(error)}
                autoComplete="url"
              />
              <button className="submit-button" type="submit" disabled={loading}>
                {loading ? 'Shortening…' : 'Shorten URL'}
              </button>
            </div>
            {error && <p className="error" id="url-error" role="alert">{error}</p>}
            <p className="form-note">By shortening a link, you agree to use this service responsibly.</p>
          </form>
          {result && <div aria-live="polite"><LinkItem link={result} featured /></div>}
        </div>
      </section>

      <section className="recent-section" aria-labelledby="recent-title">
        <div className="section-heading">
          <div><span className="eyebrow">Made by you</span><h2 id="recent-title">Recent links</h2></div>
          <span>{links.length} {links.length === 1 ? 'link' : 'links'}</span>
        </div>
        {links.length ? (
          <div className="link-list">{links.map((link) => <LinkItem key={link.code} link={link} />)}</div>
        ) : (
          <div className="empty-state"><span>↗</span><p>Your latest shortened links will appear here.</p></div>
        )}
      </section>

      <footer><span>© {new Date().getFullYear()} Sniply</span><span>Links made simple.</span></footer>
    </main>
  );
}
