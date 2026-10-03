/* StartupScan — bibliotheque : toutes les fiches de tous les numeros. */
(function () {
  const B = './';
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const slug = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const norm = s => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const modelClass = m => {
    const s = (m || '').toLowerCase();
    if (s.includes('place de marche') || s.includes('place de marché')) return 'market';
    if (s.startsWith('b2g')) return 'b2g';
    if (s.includes('b2b')) return 'b2b';
    if (s.includes('b2c') || s.includes('d2c')) return 'b2c';
    return 'other';
  };
  const sources = list => (list || []).map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join(' · ');
  const uniq = a => [...new Set(a.filter(Boolean))].sort((x, y) => x.localeCompare(y, 'fr'));

  let FICHES = [], CH = [], state = { q: '', ch: '', model: '', pays: '', secteur: '', issue: '' };

  // Mots que le lecteur emploie et qui ne figurent pas tels quels dans les fiches
  const SYN = {
    b2g: 'vendre aux pouvoirs publics administration administrations commune communes etat gouvernement marche public secteur public region ministere armee',
    b2b: 'vendre aux entreprises professionnels societes clients professionnels',
    b2c: 'vendre aux particuliers grand public consommateurs clients particuliers',
    market: 'place de marche plateforme mise en relation intermediaire commission marketplace',
    other: ''
  };
  const STOP = new Set(['les','des','une','aux','pour','avec','dans','par','sur','que','qui','est','son','sa','ses','mon','ma','mes','the','and','comment','quoi','quel','quelle','faire','etre','avoir','plus','tout','tous','mais','pas','sans','chez','vers','entre']);

  function tokens(q) {
    return norm(q).split(/[^a-z0-9]+/).filter(w => w.length > 2 && !STOP.has(w));
  }
  // « communes » doit trouver « commune », « louer » doit trouver « location »
  const stem = w => w.replace(/(aux|ales|eurs|euse|ions|ment|es|er|ir|s|e)$/, '');

  function card(f) {
    const mc = modelClass(f.model);
    const facts = (f.facts || []).map(x => `<span>${esc(x)}</span>`).join('');
    return `
<article class="card ${mc} fiche" id="f-${slug(f.name)}">
  <div class="bar"></div>
  <div class="body">
    <div class="head"><h3>${esc(f.name)}</h3><span class="tag ${mc}">${esc(f.model)}</span></div>
    <div class="meta">${esc(f.place)} · ${esc(f.sector)} · <a href="${B}archives/${esc(f.issueId)}.html">N° ${f.issue}</a></div>
    <p class="desc">${esc(f.desc)}</p>
    ${f.flow ? `<div class="flow">${f.flow}</div>` : ''}
    <div class="facts">${facts}</div>
  </div>
  <div class="lesson"><b>La leçon</b>${esc(f.lesson)}</div>
  <div class="src">Source${(f.sources || []).length > 1 ? 's' : ''} : ${sources(f.sources)}</div>
</article>`;
  }

  function haystack(f) {
    if (f.__h) return f.__h;
    const ch = (CH.find(c => c.key === f.chapter) || {}).label || '';
    f.__h = norm([f.name, f.place, f.sector, f.model, f.desc, f.lesson, f.rubrique, ch,
      (f.facts || []).join(' '), (f.kw || []).join(' '), f.flow || '',
      (f.recap || {}).mot, (f.recap || {}).secteur, (f.recap || {}).pays,
      SYN[modelClass(f.model)]].join(' '));
    return f.__h;
  }

  function passesFilters(f) {
    if (state.ch && f.chapter !== state.ch) return false;
    if (state.model && modelClass(f.model) !== state.model) return false;
    if (state.pays && (f.recap || {}).pays !== state.pays) return false;
    if (state.secteur && (f.recap || {}).secteur !== state.secteur) return false;
    if (state.issue && String(f.issue) !== state.issue) return false;
    return true;
  }

  // Score : nombre de mots de la requete retrouves dans la fiche.
  // On garde les fiches qui en retrouvent au moins 60 %, triees par pertinence.
  function score(f, toks) {
    const h = haystack(f);
    let n = 0;
    for (const w of toks) if (h.includes(w) || h.includes(stem(w))) n++;
    return n;
  }

  function apply() {
    let hits = FICHES.filter(passesFilters);
    const toks = tokens(state.q);
    if (toks.length) {
      const need = Math.max(1, Math.ceil(toks.length * 0.6));
      hits = hits.map(f => [f, score(f, toks)]).filter(([, n]) => n >= need)
                 .sort((a, b) => b[1] - a[1] || b[0].issue - a[0].issue).map(([f]) => f);
    }
    document.getElementById('lib-grid').innerHTML =
      hits.length ? hits.map(card).join('')
                  : `<p class="lib-empty">Aucune fiche ne correspond. Essayez un mot plus large, ou retirez un filtre.</p>`;
    document.getElementById('lib-count').textContent =
      `${hits.length} fiche${hits.length > 1 ? 's' : ''} sur ${FICHES.length}`;
    const active = Object.entries(state).filter(([k, v]) => v && k !== 'q').length + (state.q ? 1 : 0);
    document.getElementById('lib-reset').classList.toggle('hidden', !active);
  }

  function selectFor(id, label, values, cur) {
    return `<label class="lib-sel"><span>${esc(label)}</span><select id="${id}">
      <option value="">Tous</option>
      ${values.map(v => `<option value="${esc(v.k)}"${v.k === cur ? ' selected' : ''}>${esc(v.l)}</option>`).join('')}
    </select></label>`;
  }

  function render(corpus, site, manifest) {
    FICHES = corpus.fiches;
    CH = (site.parcours && site.parcours.chapters) || [];
    const pays = uniq(FICHES.map(f => (f.recap || {}).pays));
    const secteurs = uniq(FICHES.map(f => (f.recap || {}).secteur));
    const issues = manifest.issues.slice().sort((a, b) => b.number - a.number);

    document.getElementById('app').innerHTML = `
<header class="masthead"><div class="wrap">
  <a class="logo" href="${B}index.html"><span class="logo-icon">S</span><span class="logo-text">Startup<span>Scan</span></span></a>
  <div class="issue-tag"><b>Bibliothèque</b><br>${FICHES.length} fiches · ${issues.length} numéro${issues.length > 1 ? 's' : ''}</div>
</div></header>
<nav class="topnav"><div class="wrap">
  <a href="${B}index.html">Dernier numéro</a><a href="#lib" class="active">Toutes les fiches</a>${issues.map(i => `<a href="${B}archives/${i.id}.html">N° ${i.number}</a>`).join('')}
</div></nav>
<main>
<div class="hero lib-hero"><div class="wrap">
  <div class="kicker">La bibliothèque</div>
  <h1>Toutes les fiches</h1>
  <p class="lead">Chaque entreprise publiée depuis le premier numéro, cherchable et filtrable par chapitre du business plan, modèle d'affaires, secteur et pays. Les numéros restent la lecture de la semaine ; cette page est la réserve dans laquelle on pioche.</p>
</div></div>

<section class="block" id="lib"><div class="wrap">
  <div class="lib-tools">
    <input id="lib-q" type="search" placeholder="Chercher : vendre aux communes, abonnement, louer au lieu de vendre…" autocomplete="off">
    <div class="lib-filters">
      ${selectFor('lib-ch', 'Chapitre', CH.map(c => ({ k: c.key, l: c.label })), state.ch)}
      ${selectFor('lib-model', 'Modèle', [{ k: 'b2b', l: 'B2B' }, { k: 'b2c', l: 'B2C' }, { k: 'b2g', l: 'B2G' }, { k: 'market', l: 'Place de marché' }, { k: 'other', l: 'Autre' }], state.model)}
      ${selectFor('lib-secteur', 'Secteur', secteurs.map(v => ({ k: v, l: v })), state.secteur)}
      ${selectFor('lib-pays', 'Pays', pays.map(v => ({ k: v, l: v })), state.pays)}
      ${selectFor('lib-issue', 'Numéro', issues.map(i => ({ k: String(i.number), l: 'N° ' + i.number })), state.issue)}
      <button class="btn ghost hidden" id="lib-reset">Tout effacer</button>
    </div>
    <div class="lib-count" id="lib-count"></div>
  </div>
  <div class="grid" id="lib-grid"></div>
</div></section>
</main>
<footer><div class="wrap">
  <b>StartupScan</b> est préparé par Olivier Willocx, enseignant en entrepreneuriat et business plan à l'EPFC · <a href="mailto:olwillocx@epfc.eu">olwillocx@epfc.eu</a><br>
  Montants et chiffres tels qu'annoncés par les entreprises ou la presse ; ce sont des données déclarées, pas des comptes audités.
  Mots-clés de recherche générés localement, relus par l'auteur.
</div></footer>`;

    const q = document.getElementById('lib-q');
    let t = null;
    q.addEventListener('input', () => { clearTimeout(t); t = setTimeout(() => { state.q = q.value; apply(); sync(); }, 120); });
    const binds = { 'lib-ch': 'ch', 'lib-model': 'model', 'lib-secteur': 'secteur', 'lib-pays': 'pays', 'lib-issue': 'issue' };
    Object.entries(binds).forEach(([id, key]) => {
      document.getElementById(id).addEventListener('change', e => { state[key] = e.target.value; apply(); sync(); });
    });
    document.getElementById('lib-reset').addEventListener('click', () => {
      state = { q: '', ch: '', model: '', pays: '', secteur: '', issue: '' };
      q.value = ''; Object.keys(binds).forEach(id => document.getElementById(id).value = '');
      apply(); sync();
    });

    function sync() {
      const p = new URLSearchParams();
      Object.entries(state).forEach(([k, v]) => { if (v) p.set(k, v); });
      history.replaceState(null, '', p.toString() ? '?' + p : location.pathname);
    }

    const p = new URLSearchParams(location.search);
    Object.keys(state).forEach(k => { if (p.get(k)) state[k] = p.get(k); });
    q.value = state.q;
    Object.entries(binds).forEach(([id, key]) => { document.getElementById(id).value = state[key]; });
    apply();
  }

  Promise.all([
    fetch(B + 'data/corpus.json').then(r => r.json()),
    fetch(B + 'data/site.json').then(r => r.json()),
    fetch(B + 'data/manifest.json').then(r => r.json()),
  ]).then(([c, s, m]) => render(c, s, m))
    .catch(e => {
      document.getElementById('app').innerHTML = '<div id="loading">Impossible de charger la bibliothèque. Réessayez dans un instant.</div>';
      console.error(e);
    });
})();
