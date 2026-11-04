import { describe, expect, it } from 'vitest';
import { buildTelegramMessage, describeAttribution, escapeHtml } from '../functions/api/lead';
import type { LeadInput } from '../src/lib/validate';

const heroLead: LeadInput = {
  phone: '600123456',
  service: 'ogrodzenie',
  gdpr: true,
  source: 'hero',
};

const fullLead: LeadInput = {
  ...heroLead,
  name: 'Jan',
  city: 'Gdańsk',
  email: 'jan@example.com',
  message: 'Ogrodzenie 40 mb',
  source: 'full',
};

describe('buildTelegramMessage', () => {
  it('renders a hero lead with only phone and service', () => {
    const message = buildTelegramMessage(heroLead);
    expect(message).toContain('🧱');
    expect(message).toContain('(hero)');
    expect(message).toContain('<code>600123456</code>');
  });

  it('renders a full lead with name, city, email and message', () => {
    const message = buildTelegramMessage(fullLead);
    expect(message).toContain('(formularz)');
    expect(message).toContain('Jan');
    expect(message).toContain('Gdańsk');
    expect(message).toContain('jan@example.com');
    expect(message).toContain('Ogrodzenie 40 mb');
  });

  it('escapes HTML in the message so Telegram parse mode cannot be broken out of', () => {
    const message = buildTelegramMessage({ ...fullLead, message: '<script>alert(1)</script>' });
    expect(message).not.toContain('<script>');
    expect(message).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('falls back to the generic marker for an unknown service value', () => {
    const message = buildTelegramMessage({ ...heroLead, service: 'unknown-service' });
    expect(message).toContain('📩');
  });
});

describe('attribution', () => {
  it('puts the campaign path and the gclid in the message', () => {
    const message = buildTelegramMessage({
      ...heroLead,
      attribution: {
        utmSource: 'google',
        utmMedium: 'cpc',
        utmCampaign: 'bramy-gdansk',
        gclid: 'Cj0KCQ',
        pageUrl: 'https://alu3.pl/?gclid=Cj0KCQ',
      },
    });
    expect(message).toContain('google / cpc / bramy-gdansk');
    expect(message).toContain('gclid: Cj0KCQ');
  });

  it('falls back to the landing URL when only that is known', () => {
    expect(describeAttribution({ pageUrl: 'https://alu3.pl/en/' })).toBe(
      'https://alu3.pl/en/',
    );
  });

  it('says nothing at all when the visit carried no campaign', () => {
    expect(describeAttribution(undefined)).toBe('');
    expect(buildTelegramMessage(heroLead)).not.toContain('Źródło');
  });
});

describe('escapeHtml', () => {
  it('escapes ampersands and angle brackets', () => {
    expect(escapeHtml('<b>&</b>')).toBe('&lt;b&gt;&amp;&lt;/b&gt;');
  });
});
