// Campaign attribution. Without gclid a lead cannot be tied back to the click
// that paid for it, which makes offline conversions in Google Ads impossible
// and every A/B result unreadable.
//
// First touch wins and is kept for the session: a visitor who arrives from an
// ad, wanders off to the gallery and comes back through a bookmark is still
// that ad's lead. Nothing is written to a cookie, so this stays outside the
// consent regime that the analytics choice was made to avoid.

const KEYS = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
] as const;

const STORE = 'alu3:attribution';

function readStored(): Record<string, string> {
  try {
    return JSON.parse(sessionStorage.getItem(STORE) ?? '{}') as Record<string, string>;
  } catch {
    return {};
  }
}

const params = new URLSearchParams(window.location.search);
const stored = readStored();
const attribution: Record<string, string> = { ...stored };

for (const key of KEYS) {
  const value = params.get(key);
  // First touch only: an existing value is never overwritten.
  if (value && !attribution[key]) attribution[key] = value;
}

if (Object.keys(attribution).length > 0) {
  try {
    sessionStorage.setItem(STORE, JSON.stringify(attribution));
  } catch {
    // Private mode with storage disabled. The fields below still carry this
    // page load's parameters, which is the common case anyway.
  }
}

attribution.page_url = window.location.href;

document.querySelectorAll<HTMLInputElement>('input[data-tracking]').forEach((input) => {
  input.value = attribution[input.name] ?? '';
});
