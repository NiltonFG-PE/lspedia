(function (root) {
  'use strict';
  const LEVELS = ['facil', 'medio', 'dificil'];
  const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  const levelOf = value => {
    const key = normalize(value);
    return LEVELS.includes(key) ? key : null;
  };
  const same = (a, b) => normalize(a) === normalize(b);

  function cards(rows, source) {
    const seen = new Set();
    return (Array.isArray(rows) ? rows : []).flatMap(row => {
      const word = String(row?.palabra || '').trim();
      const image = String(row?.imagen || '').split(',')[0].trim();
      const emoji = String(row?.emoji || '').trim();
      const key = normalize(word);
      if (!word || (!image && !emoji) || seen.has(key)) return [];
      seen.add(key);
      return [{
        word,
        image,
        emoji,
        category: String(row?.categoria || 'Vocabulario').trim(),
        level: levelOf(row?.nivel),
        source,
        key
      }];
    });
  }

  function select(cards, deck, category = '', level = 'todos') {
    const wanted = levelOf(level);
    const wantedDeck = normalize(deck);
    const wantedCategory = normalize(category);
    const seen = new Set();

    return (Array.isArray(cards) ? cards : []).filter(c => {
      if (!c || !c.key) return false;
      if (wanted && c.level && c.level !== wanted) return false;

      const source = normalize(c.source);
      const cardCategory = normalize(c.category);
      const matches = wantedDeck === 'todos'
        || (wantedDeck === 'vocabulario'
          ? source === 'vocabulario' && (!wantedCategory || cardCategory === wantedCategory)
          : cardCategory === wantedDeck);

      if (!matches || seen.has(c.key)) return false;
      seen.add(c.key);
      return true;
    });
  }

  function shuffle(cards, random = Math.random) {
    const result = Array.isArray(cards) ? cards.slice() : [];
    const rng = typeof random === 'function' ? random : Math.random;
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  function draw(pool, seen, count, random = Math.random, required = count) {
    const source = Array.isArray(pool) ? pool : [];
    const usedKeys = seen instanceof Set ? seen : new Set();
    const amount = Math.max(0, Number.isFinite(count) ? Math.floor(count) : 0);
    const minimumFresh = Math.min(Math.max(0, Number.isFinite(required) ? Math.floor(required) : amount), source.length);
    if (!amount || !source.length) return {cards: [], exhausted: source.length > 0 && usedKeys.size >= source.length};

    const fresh = source.filter(c => c && !usedKeys.has(c.key));
    if (fresh.length >= minimumFresh) {
      return {cards: shuffle(fresh, random).slice(0, amount), exhausted: false};
    }

    const used = source.filter(c => c && usedKeys.has(c.key));
    return {
      cards: [...shuffle(fresh, random), ...shuffle(used, random)].slice(0, amount),
      exhausted: true
    };
  }

  function standings(scores, names = []) {
    const safeScores = Array.isArray(scores) ? scores.map(score => Number.isFinite(score) ? score : 0) : [];
    const top = Math.max(0, ...safeScores);
    return safeScores
      .map((score, index) => ({
        index,
        score,
        name: names[index] || `Equipo ${index + 1}`,
        leader: top > 0 && score === top
      }))
      .sort((a, b) => b.score - a.score || a.index - b.index);
  }

  function screenZ(beta, gamma) {
    if (typeof beta !== 'number' || typeof gamma !== 'number' || !Number.isFinite(beta) || !Number.isFinite(gamma)) return null;
    return Math.cos(beta * Math.PI / 180) * Math.cos(gamma * Math.PI / 180);
  }

  function smoother(alpha = .5) {
    const factor = Number.isFinite(alpha) ? Math.min(1, Math.max(0, alpha)) : .5;
    let value = null;
    return {
      reset() { value = null; },
      next(z) {
        if (z === null || !Number.isFinite(z)) return null;
        value = value === null ? z : value + factor * (z - value);
        return value;
      }
    };
  }

  function tiltGate() {
    let armed = false, neutralSince = null, heldSince = null, direction = null;
    return {
      reset() { armed = false; neutralSince = heldSince = direction = null; },
      ready() { return armed; },
      update(z, now, allowAction = true) {
        if (z === null || !Number.isFinite(z) || !Number.isFinite(now)) return null;
        if (Math.abs(z) < .34) {
          heldSince = direction = null;
          if (neutralSince === null) neutralSince = now;
          if (now - neutralSince >= 90) armed = true;
          return null;
        }
        neutralSince = null;
        if (!allowAction || !armed || Math.abs(z) < .45) {
          heldSince = direction = null;
          return null;
        }
        const next = z < 0 ? 'correct' : 'pass';
        if (direction !== next) {
          direction = next;
          heldSince = now;
        }
        if (now - heldSince < 80) return null;
        armed = false;
        heldSince = direction = null;
        return next;
      }
    };
  }

  const api = {normalize, levelOf, cards, select, shuffle, draw, standings, screenZ, smoother, tiltGate, same};
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.AdivinaCore = api;
})(typeof window !== 'undefined' ? window : globalThis);