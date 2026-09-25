/* Pure game rules, shared by the browser and node tests. */
(function (root) {
  'use strict';
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  function cards(rows, source) {
    const seen = new Set();
    return (Array.isArray(rows) ? rows : []).flatMap(row => {
      const word = String(row?.palabra || '').trim();
      const image = String(row?.imagen || '').split(',')[0].trim();
      const key = normalize(word);
      if (!word || !image || seen.has(key)) return [];
      seen.add(key);
      return [{word, image, category: String(row.categoria || 'Vocabulario'), source, key}];
    });
  }
  function select(cards, deck, category = '') {
    const seen = new Set();
    return cards.filter(c => {
      const matches = deck === 'todos' || (deck === 'vocabulario' ? c.source === 'vocabulario' && (!category || c.category === category) : c.category === deck);
      if (!matches || seen.has(c.key)) return false;
      seen.add(c.key); return true;
    });
  }
  function shuffle(cards, random = Math.random) {
    const result = cards.slice();
    for (let i = result.length - 1; i > 0; i--) {const j = Math.floor(random() * (i + 1)); [result[i], result[j]] = [result[j], result[i]];}
    return result;
  }
  // Normal of the screen relative to gravity: independent of portrait/landscape.
  function screenZ(beta, gamma) {
    if (typeof beta !== 'number' || typeof gamma !== 'number' || !Number.isFinite(beta) || !Number.isFinite(gamma)) return null;
    return Math.cos(beta * Math.PI / 180) * Math.cos(gamma * Math.PI / 180);
  }
  function tiltGate() {
    let armed = false, neutralSince = null, heldSince = null, direction = null;
    return {
      reset() {armed = false; neutralSince = heldSince = direction = null;},
      update(z, now) {
        if (z === null || !Number.isFinite(z)) return null;
        if (Math.abs(z) < .28) {
          heldSince = direction = null;
          if (neutralSince === null) neutralSince = now;
          if (now - neutralSince >= 300) armed = true;
          return null;
        }
        neutralSince = null;
        if (!armed || Math.abs(z) < .57) {heldSince = direction = null; return null;}
        const next = z < 0 ? 'correct' : 'pass';
        if (direction !== next) {direction = next; heldSince = now;}
        if (now - heldSince < 180) return null;
        armed = false; heldSince = direction = null;
        return next;
      }
    };
  }
  const api = {normalize, cards, select, shuffle, screenZ, tiltGate};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.AdivinaCore = api;
})(typeof window !== 'undefined' ? window : globalThis);
