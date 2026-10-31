export function buildNotificationHref(link?: string | null, refId?: string | null): string | undefined {
  if (!link) return undefined;
  if (!refId) return link;

  const base = link.split('?')[0];
  const params = new URLSearchParams(link.includes('?') ? link.split('?')[1] : '');

  if (base === '/sales') {
    params.set('highlight', refId);
  } else if (base === '/manufacturing' || base === '/inventory') {
    params.set('order', refId);
  } else if (base === '/customers' || base === '/delivery/board') {
    params.set('highlight', refId);
  } else {
    params.set('ref', refId);
  }

  const query = params.toString();
  return query ? `${base}?${query}` : base;
}
