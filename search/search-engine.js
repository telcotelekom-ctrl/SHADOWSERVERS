/*
 * search-engine.js — Universale Such-Engine (client-seitig).
 * Läuft im Hauptthread (script tag) UND im Web Worker (importScripts).
 * Merkmale: Normalisierung, Tokenisierung, Fuzzy-/Tippfehler-Toleranz (Levenshtein),
 * Ranking, Vorhersage (Autocomplete), Bezugs-/Vergleichsworte (Synonyme + Themennähe),
 * intelligente Fallback-Logik.
 */
(function (root) {
  'use strict';

  // Thematische Bezugs-/Vergleichsworte. Wird genutzt, wenn ein Treffwort nicht direkt
  // gefunden wird: verwandte Begriffe, Bezugsworte, Themen in der Nähe.
  var SYNONYMS = {
    'suche': ['finden', 'search', 'zoeken', 'nachschlagen'],
    'hilfe': ['handbuch', 'anleitung', 'bedienung', 'support', 'help'],
    'code': ['programmieren', 'entwickler', 'developer', 'software', 'programmierung'],
    'programmieren': ['code', 'entwickler', 'developer', 'sprache', 'software'],
    'entwickler': ['developer', 'code', 'programmieren', 'software'],
    'sprache': ['language', 'programmiersprache', 'python', 'javascript'],
    'python': ['code', 'programmieren', 'developer', 'sprache'],
    'javascript': ['code', 'js', 'programmieren', 'developer'],
    'lernen': ['bildung', 'ausbildung', 'schule', 'kurs', 'wissen', 'curriculum'],
    'bildung': ['lernen', 'ausbildung', 'schule', 'wissen', 'kurs'],
    'schule': ['bildung', 'lernen', 'ausbildung', 'unterricht'],
    'wissen': ['enzyklopädie', 'lexikon', 'knowledge', 'bildung', 'datenbank'],
    'datenbank': ['database', 'db', 'wissen', 'knowledge', 'archiv'],
    'formel': ['gleichung', 'physik', 'rechner', 'berechnung', 'mathematik'],
    'physik': ['formel', 'rechner', 'energie', 'kraft', 'wissenschaft'],
    'rechner': ['calculator', 'berechnung', 'formel', 'tool'],
    'geld': ['wert', 'value', 'finanzen', 'zahlung', 'payment', 'investor'],
    'wert': ['value', 'geld', 'economy', 'preis', 'volume'],
    'musik': ['akkord', 'studio', 'audio', 'tempo', 'sound', 'psy-tel'],
    'akkord': ['musik', 'studio', 'tempo', 'chord'],
    'universum': ['universe', 'kosmos', 'welt', 'system'],
    'universe': ['universum', 'kosmos', 'welt', 'system'],
    'manifest': ['vision', 'philosophie', 'prinzip', 'grundhaltung'],
    'vision': ['manifest', 'zukunft', 'philosophie', 'idee'],
    'marke': ['brand', 'branding', 'logo', 'signe', 'corporate'],
    'brand': ['marke', 'branding', 'logo', 'signe'],
    'büro': ['office', 'arbeit', 'dokumente', 'produktivität'],
    'office': ['büro', 'arbeit', 'dokumente'],
    'job': ['bewerbung', 'karriere', 'arbeit', 'lebenslauf', 'cv'],
    'bewerbung': ['job', 'karriere', 'cv', 'lebenslauf'],
    'tausch': ['exchange', 'handel', 'markt', 'börse', 'tauschbörse'],
    'system': ['runtime', 'os', 'plattform', 'architektur'],
    'runtime': ['system', 'os', 'engine', 'laufzeit'],
    'bild': ['image', 'grafik', 'foto', 'svg', 'vector'],
    'firma': ['company', 'unternehmen', 'startup', 'gründung'],
    'unternehmen': ['company', 'firma', 'startup', 'business'],
    'bibel': ['bijbel', 'weisheit', 'glaube', 'studie', 'spiritualität'],
    'krypto': ['wallet', 'metamask', 'xstox', 'blockchain', 'token']
  };

  function normalize(s) {
    return String(s || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9äöüß\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  function tokenize(s) {
    return normalize(s).split(' ').filter(Boolean);
  }

  // Levenshtein-Distanz für Tippfehler-Toleranz.
  function levenshtein(a, b) {
    if (a === b) return 0;
    var al = a.length, bl = b.length;
    if (!al) return bl;
    if (!bl) return al;
    var prev = new Array(bl + 1), cur = new Array(bl + 1), i, j;
    for (j = 0; j <= bl; j++) prev[j] = j;
    for (i = 1; i <= al; i++) {
      cur[0] = i;
      for (j = 1; j <= bl; j++) {
        var cost = a.charCodeAt(i - 1) === b.charCodeAt(j - 1) ? 0 : 1;
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      }
      var tmp = prev; prev = cur; cur = tmp;
    }
    return prev[bl];
  }

  function build(index) {
    var docs = (index && index.documents) ? index.documents : (index || []);
    return docs.map(function (d) {
      var titleTokens = tokenize(d.title);
      var kwTokens = [];
      (d.keywords || []).forEach(function (k) { kwTokens = kwTokens.concat(tokenize(k)); });
      return {
        ref: d,
        _title: normalize(d.title),
        _titleTokens: titleTokens,
        _kw: (d.keywords || []).map(normalize),
        _kwTokens: kwTokens,
        _desc: normalize(d.description || ''),
        _cat: normalize(d.category || ''),
        _all: [normalize(d.title), (d.keywords || []).map(normalize).join(' '), normalize(d.description || ''), normalize(d.category || '')].join(' ')
      };
    });
  }

  function scoreToken(doc, qt) {
    var score = 0;
    if (!qt) return 0;
    // exakte / Teil-Treffer
    if (doc._title.indexOf(qt) !== -1) score += 12;
    if (doc._titleTokens.indexOf(qt) !== -1) score += 8;
    for (var k = 0; k < doc._kw.length; k++) {
      if (doc._kw[k] === qt) score += 7;
      else if (doc._kw[k].indexOf(qt) !== -1) score += 5;
    }
    if (doc._desc.indexOf(qt) !== -1) score += 3;
    if (doc._cat.indexOf(qt) !== -1) score += 3;
    // Fuzzy: Tippfehler-Toleranz gegen Titel- und Keyword-Tokens
    if (qt.length >= 3) {
      var all = doc._titleTokens.concat(doc._kwTokens), best = 99;
      for (var i = 0; i < all.length; i++) {
        var t = all[i];
        if (Math.abs(t.length - qt.length) > 2) continue;
        var d = levenshtein(t, qt);
        if (d < best) best = d;
      }
      if (best === 1) score += 4;
      else if (best === 2) score += 2;
    }
    return score;
  }

  function scoreDoc(doc, qTokens, weight) {
    var s = 0;
    for (var i = 0; i < qTokens.length; i++) s += scoreToken(doc, qTokens[i]);
    return s * (weight || 1);
  }

  function expandTokens(qTokens) {
    var extra = [];
    for (var i = 0; i < qTokens.length; i++) {
      var rel = SYNONYMS[qTokens[i]];
      if (rel) { for (var j = 0; j < rel.length; j++) extra.push(normalize(rel[j])); }
    }
    return extra.filter(Boolean);
  }

  function publicResult(doc, score) {
    return {
      id: doc.ref.id, title: doc.ref.title, url: doc.ref.url,
      category: doc.ref.category, description: doc.ref.description,
      keywords: doc.ref.keywords || [], score: Math.round(score)
    };
  }

  // Vorhersage / Autocomplete während der Eingabe.
  function suggest(engine, text, limit) {
    var q = normalize(text);
    if (!q) return [];
    var pool = {}, out = [];
    engine.forEach(function (doc) {
      doc._titleTokens.concat(doc._kwTokens).forEach(function (t) {
        if (t.length < 2 || pool[t]) return;
        if (t.indexOf(q) === 0) { pool[t] = 2; }
        else if (t.indexOf(q) !== -1) { pool[t] = 1; }
        else if (q.length >= 3 && Math.abs(t.length - q.length) <= 2 && levenshtein(t, q) === 1) { pool[t] = 0; }
      });
    });
    Object.keys(pool).forEach(function (t) { out.push({ term: t, rank: pool[t] }); });
    out.sort(function (a, b) { return b.rank - a.rank || a.term.length - b.term.length; });
    return out.slice(0, limit || 8).map(function (x) { return x.term; });
  }

  function query(engine, text, opts) {
    opts = opts || {};
    var qTokens = tokenize(text);
    var result = { query: text, results: [], related: [], corrected: null, expanded: false, suggestions: [] };
    if (!qTokens.length) return result;

    var scored = [];
    engine.forEach(function (doc) {
      var s = scoreDoc(doc, qTokens, 1);
      if (s > 0) scored.push({ doc: doc, score: s });
    });

    // Kein direkter Treffer → Bezugsworte / Themennähe (Intelligenzlogik).
    if (!scored.length) {
      var ex = expandTokens(qTokens);
      if (ex.length) {
        engine.forEach(function (doc) {
          var s = scoreDoc(doc, ex, 0.6);
          if (s > 0) scored.push({ doc: doc, score: s });
        });
        if (scored.length) {
          result.expanded = true;
          result.related = ex.filter(function (v, i, a) { return a.indexOf(v) === i; }).slice(0, 8);
        }
      }
    }

    // Korrekturvorschlag (Meinten Sie …?) über bestes Fuzzy-Match.
    if (!scored.length) {
      var bestTerm = null, bestDist = 99;
      engine.forEach(function (doc) {
        doc._titleTokens.concat(doc._kwTokens).forEach(function (t) {
          qTokens.forEach(function (qt) {
            if (qt.length < 3 || Math.abs(t.length - qt.length) > 3) return;
            var d = levenshtein(t, qt);
            if (d < bestDist && d <= 3) { bestDist = d; bestTerm = t; }
          });
        });
      });
      if (bestTerm && bestDist <= 3) result.corrected = bestTerm;
    }

    scored.sort(function (a, b) { return b.score - a.score; });
    result.results = scored.slice(0, opts.limit || 40).map(function (x) { return publicResult(x.doc, x.score); });

    // Vergleichsmöglichkeiten: verwandte Themen aus Kategorien der Top-Treffer.
    if (result.results.length && !result.related.length) {
      var cats = {}, i;
      for (i = 0; i < Math.min(result.results.length, 5); i++) {
        var c = result.results[i].category;
        if (c) cats[c] = (cats[c] || 0) + 1;
      }
      result.related = Object.keys(cats).sort(function (a, b) { return cats[b] - cats[a]; }).slice(0, 5);
    }

    return result;
  }

  var api = { build: build, query: query, suggest: suggest, normalize: normalize, SYNONYMS: SYNONYMS };

  // Worker-Modus: auf Nachrichten reagieren (Pipeline off-main-thread).
  if (typeof self !== 'undefined' && typeof self.importScripts === 'function' && typeof window === 'undefined') {
    var ENGINE = null;
    self.onmessage = function (e) {
      var msg = e.data || {};
      if (msg.type === 'init') { ENGINE = build(msg.index); self.postMessage({ type: 'ready', count: ENGINE.length }); }
      else if (msg.type === 'query' && ENGINE) { self.postMessage({ type: 'results', reqId: msg.reqId, data: query(ENGINE, msg.text, msg.opts) }); }
      else if (msg.type === 'suggest' && ENGINE) { self.postMessage({ type: 'suggestions', reqId: msg.reqId, data: suggest(ENGINE, msg.text, msg.limit) }); }
    };
  }

  root.SearchEngine = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : this);
