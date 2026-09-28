import { randomBytes } from 'node:crypto';

const CODE_LENGTH = 8;

export class LinkStore {
  constructor({ maxLinks = 10000 } = {}) {
    if (!Number.isSafeInteger(maxLinks) || maxLinks < 1) throw new Error("Invalid link capacity");
    this.maxLinks = maxLinks;
    this.links = new Map();
  }

  create(originalUrl, shortUrlFor) {
    if (this.links.size >= this.maxLinks) return null;
    let code;

    do {
      code = randomBytes(6).toString('base64url').slice(0, CODE_LENGTH);
    } while (this.links.has(code));

    const link = {
      code,
      originalUrl,
      shortUrl: shortUrlFor(code),
      createdAt: new Date().toISOString()
    };

    this.links.set(code, link);
    return link;
  }

  get(code) {
    return this.links.get(code);
  }

}
