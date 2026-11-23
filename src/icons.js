const symbols = {
  messages:
    '<path d="M13 39a17 17 0 1 1 23 1l-8-1-10 4 2-7"/><g fill="currentColor" stroke="none"><circle cx="18" cy="24" r="2"/><circle cx="25" cy="24" r="2"/><circle cx="32" cy="24" r="2"/></g>',
  contacts: '<path d="M17 7c-4 0-8 6-7 11 2 11 14 24 26 25 4 0 9-5 9-8l-9-7-5 5c-5-2-12-9-15-15l5-4z" fill="currentColor" stroke="none"/>',
  camera:
    '<path fill="currentColor" stroke="none" d="M6 15h8l3-5h13l4 5h6q3 0 3 3v19q0 3-3 3H7q-3 0-3-3V18q0-3 2-3Z"/><circle cx="24" cy="27" r="8" stroke="#555544"/><circle cx="37" cy="20" r="1" fill="#555544"/>',
  feed: '<path d="M7 12h21" stroke="#ff76ad" stroke-width="7"/><path d="M9 24h32" stroke="#6addda" stroke-width="7"/><path d="M11 36h22" stroke="#ad84eb" stroke-width="7"/>',
  gallery: Array.from(
    { length: 6 },
    (_, i) =>
      '<path d="M23 6 32 7 27 23 17 17Z" transform="rotate(' +
      i * 60 +
      ' 24 24)" fill="' +
      ['#60bc83', '#4babc8', '#5555ad', '#e15e60', '#fa964b', '#ffd852'][i] +
      '" stroke="none"/>',
  ).join(''),
  news: '<g transform="rotate(-7 24 24)"><rect x="11" y="9" width="27" height="31" rx="3"/><path d="M10 15H6v22q0 4 5 4M17 16h14m-14 7h4v7h-4zm10 0h4m-4 7h4"/></g>',
  weather:
    '<circle cx="16" cy="19" r="10" fill="#ffce5c" stroke="none"/><path d="M11 37q-7-1-5-7 1-6 8-6 3-11 13-9 6 1 8 9 9-1 10 6 1 6-7 7Z" fill="#f2f5f3" stroke="none"/>',
  reminders: Array.from(
    { length: 7 },
    (_, i) =>
      '<ellipse cx="24" cy="12" rx="3.8" ry="9" fill="' +
      ['#ffe9a2', '#ffb7b9', '#ff9fb9', '#d0a2df', '#a2e6e0', '#add5a4', '#f7def8'][i] +
      '" transform="rotate(' +
      (i * 360) / 7 +
      ' 24 24)" stroke="none"/>',
  ).join(''),
  settings:
    '<g fill="currentColor" stroke="none">' +
    Array.from({ length: 8 }, (_, i) => '<rect x="21" y="4" width="7" height="12" rx="1.5" transform="rotate(' + i * 45 + ' 24 24)"/>').join('') +
    '</g><circle cx="24" cy="24" r="13" stroke-width="7"/>',
};

export const iconNames = Object.freeze(Object.keys(symbols));

export function makeIcon(name, image) {
  const glyph = document.createElement('span');
  const key = Object.hasOwn(symbols, name) ? name : 'messages';
  glyph.className = 'glyph g-' + key;
  glyph.setAttribute('aria-hidden', 'true');
  if (image) {
    const img = document.createElement('img');
    img.alt = '';
    img.src = image;
    glyph.append(img);
  } else {
    glyph.innerHTML =
      '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round">' +
      symbols[key] +
      '</svg>';
  }
  return glyph;
}
