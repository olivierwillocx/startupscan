/* StartupScan — renderer. window.SS = { base: './' | '../', issue: null | 'n01' } */
(function () {
  const SS = window.SS || { base: './', issue: null };
  const B = SS.base;

  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const slug = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const modelClass = m => {
    const s = (m || '').toLowerCase();
    if (s.includes('place de marché')) return 'market';
    if (s.startsWith('b2g')) return 'b2g';
    if (s.includes('b2b')) return 'b2b';
    if (s.includes('b2c') || s.includes('d2c')) return 'b2c';
    return 'other';
  };
  const sources = list => (list || []).map(s => `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)}</a>`).join(' · ');

  function card(f, opts = {}) {
    const mc = modelClass(f.model);
    const facts = (f.facts || []).map(x => `<span>${esc(x)}</span>`).join('');
    const leverChip = f.lever ? `<span class="lever-chip">Levier ${f.lever}</span>` : '';
    return `
<article class="card ${mc} fiche" id="f-${slug(f.name)}" data-chapter="${esc(f.chapter || '')}" data-model="${mc}">
  <div class="bar"></div>
  <div class="body">
    <div class="head"><h3>${esc(f.name)}</h3><span class="tag ${mc}">${esc(f.model)}</span></div>
    <div class="meta">${esc(f.place)} · ${esc(f.sector)}</div>
    <p class="desc">${esc(f.desc)}</p>
    ${f.flow ? `<div class="flow">${f.flow}</div>` : ''}
    <div class="facts">${leverChip}${facts}</div>
  </div>
  <div class="lesson"><b>La leçon</b>${esc(f.lesson)}</div>
  <div class="src">Source${(f.sources || []).length > 1 ? 's' : ''} : ${sources(f.sources)}</div>
</article>`;
  }

  function exemplesFor(key, fiches) {
    return fiches.filter(f => modelClass(f.model) === key).map(f => f.name).join(', ');
  }

  function render(d) {
    document.title = `StartupScan — N° ${d.number} · ${d.weekLabel}`;
    const allFiches = [...d.levers.cases, ...d.fiches, ...d.pousses.list, ...d.simples.list];
    const be = d.breakeven.defaults;

    const html = `
<header class="masthead"><div class="wrap">
  <a class="logo" href="${B}index.html"><span class="logo-icon">S</span><span class="logo-text">Startup<span>Scan</span></span></a>
  <div class="issue-tag"><b>N° ${d.number}</b> · ${esc(d.weekLabel)}<br>${d.stats.fiches} fiches · ${d.stats.pays} pays · ${d.stats.innovants} modèles innovants · ${d.stats.simples} modèles simples</div>
</div></header>
<div class="ai-banner"><b>Site préparé avec l'aide de l'IA.</b> Chiffres déclarés par les entreprises ou la presse, relus contre leur source le ${esc(d.reviewedOn)} — vérifiez avant de réutiliser.</div>
<nav class="topnav"><div class="wrap">
  <a href="#innovants">Modèles innovants</a><a href="#modeles">Qui paie ?</a><a href="#ia">IA</a><a href="#fiches">Fiches</a><a href="#pousses">Petites pousses</a><a href="#simples">Modèles simples</a><a href="#sans-argent">Sans argent</a><a href="#quiz">Quiz</a><a href="#glossaire">Glossaire</a><a href="#parcours">Parcours</a><a href="#recap">Récap</a><a href="#idee">Idée à prendre</a><a href="${B}fiches.html" class="nav-lib">Toutes les fiches</a><a href="#archives">Archives</a>
</div></nav>

<main>
<div class="hero"><div class="wrap">
  <div class="kicker">N° ${d.number} · ${esc(d.weekLabel)}</div>
  <h1>Startup<span>Scan</span></h1>
  <p class="lead">${esc(d.intro)}</p>
  <div class="stats">
    <div class="stat"><b>${d.stats.fiches}</b>fiches</div>
    <div class="stat"><b>${d.stats.pays}</b>pays</div>
    <div class="stat"><b>${d.stats.innovants}</b>modèles innovants</div>
    <div class="stat"><b>${d.stats.simples}</b>modèles simples</div>
  </div>
  <div class="idea-week"><div class="kicker">L'idée de la semaine</div><h2>${esc(d.idea.title)}</h2><p>${esc(d.idea.text)}</p></div>
</div></div>

<section class="block" id="innovants"><div class="wrap">
  <h2>Les modèles qui changent les règles</h2>
  <p class="intro">${esc(d.levers.intro)}</p>
  <div class="levers">${d.levers.list.map(l => `<div class="lever"><b>${l.n}. ${esc(l.title)}</b>${esc(l.text)}</div>`).join('')}</div>
  <div class="grid">${d.levers.cases.map(c => card(c)).join('')}</div>
</div></section>

<section class="block" id="modeles"><div class="wrap">
  <h2>Qui paie ? Les modèles d'affaires</h2>
  <p class="intro">${esc(d.models.intro)}</p>
  <div class="models">${d.models.list.map(m => `
    <div class="model ${m.key}"><h3>${esc(m.title)}</h3><p>${esc(m.desc)}</p>
      <dl><dt>Prix</dt><dd>${esc(m.prix)}</dd><dt>Vente</dt><dd>${esc(m.vente)}</dd><dt>Atout</dt><dd>${esc(m.atout)}</dd><dt>Piège</dt><dd>${esc(m.piege)}</dd><dt>Ce numéro</dt><dd class="ex">${esc(exemplesFor(m.key, allFiches) || '—')}</dd></dl>
    </div>`).join('')}</div>
  <h3 style="font-size:16px;color:var(--navy);margin:6px 0 8px">Et les autres</h3>
  <div class="others">${d.models.others.map(o => `<div><b>${esc(o.title)}</b> — ${esc(o.text)}</div>`).join('')}</div>
</div></section>

<section class="block" id="ia"><div class="wrap">
  <h2>La rubrique IA</h2>
  <p class="intro">${esc(d.ai.intro)}</p>
  <div class="ai-stats">${d.ai.stats.map(s => `<div class="ai-stat"><b>${esc(s.value)}</b><span>${esc(s.text)}</span></div>`).join('')}</div>
  <div class="small-src">Source : <a href="${esc(d.ai.statsSource.url)}" target="_blank" rel="noopener">${esc(d.ai.statsSource.label)}</a></div>
  <div class="ai-points">${d.ai.points.map(p => `<div class="ai-point"><h3>${esc(p.title)}</h3><p>${esc(p.text)}</p><div class="take"><b>À retenir :</b> ${esc(p.takeaway)}</div></div>`).join('')}</div>
  <div class="callout"><b>Le piège à éviter.</b> ${esc(d.ai.trap)}</div>
  <div class="exercise"><h3>${esc(d.ai.exercise.title)}</h3><ol>${d.ai.exercise.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol></div>
</div></section>

<section class="block" id="fiches"><div class="wrap">
  <h2>Les fiches de la semaine</h2>
  <p class="intro">${esc(d.fichesIntro)}</p>
  <div class="grid">${d.fiches.map(f => card(f)).join('')}</div>
</div></section>

<section class="block" id="pousses"><div class="wrap">
  <h2>Les petites pousses</h2>
  <p class="intro">${esc(d.pousses.intro)}</p>
  <div class="grid">${d.pousses.list.map(f => card(f)).join('')}</div>
</div></section>

<section class="block" id="simples"><div class="wrap">
  <h2>Les modèles simples</h2>
  <p class="intro">${esc(d.simples.intro)}</p>
  <div class="grid">${d.simples.list.map(f => card(f)).join('')}</div>
  <div class="tool" id="point-mort">
    <div class="kicker-sm">Outil · le point mort</div>
    <h3>${esc(d.breakeven.title)}</h3>
    <div class="tool-grid">
      <div><label>Frais fixes par mois (€)</label><input type="number" id="be-fixed" value="${be.fixed}" min="0"></div>
      <div><label>Prix moyen d'une vente (€)</label><input type="number" id="be-price" value="${be.price}" min="0" step="0.5"></div>
      <div><label>Coût de cette vente (€)</label><input type="number" id="be-cost" value="${be.cost}" min="0" step="0.5"></div>
      <div><label>Jours ouverts par mois</label><input type="number" id="be-days" value="${be.days}" min="1" max="31"></div>
    </div>
    <div class="tool-out">
      <div><b id="be-margin">—</b><span>Marge par vente</span></div>
      <div><b id="be-sales">—</b><span>Ventes par mois</span></div>
      <div><b id="be-daily" class="hot">—</b><span>Clients par jour</span></div>
    </div>
    <p class="note">${esc(d.breakeven.note)}</p>
  </div>
</div></section>

<section class="block" id="sans-argent"><div class="wrap">
  <h2>Pas d'argent ? Par où commencer</h2>
  <p class="intro">${esc(d.noMoney.intro)}</p>
  <div class="ideas">${d.noMoney.ideas.map(i => `<div><b>${esc(i.title)}</b>${esc(i.text)}</div>`).join('')}</div>
  <div class="steps">${d.noMoney.steps.map(s => `<div class="step"><h3>${esc(s.title)}</h3>${esc(s.text)}</div>`).join('')}</div>
  <div class="callout"><b>À éviter.</b> ${esc(d.noMoney.avoid)}</div>
  <div class="bxl"><div class="kicker-sm">Bruxelles en chiffres</div><h3>${esc(d.noMoney.brussels.title)}</h3><p>${esc(d.noMoney.brussels.text)} Source : <a href="${esc(d.noMoney.brussels.source.url)}" target="_blank" rel="noopener">${esc(d.noMoney.brussels.source.label)}</a></p></div>
</div></section>

<section class="block" id="quiz"><div class="wrap">
  <h2>Le quiz du numéro</h2>
  <p class="intro">${esc(d.quiz.intro)}</p>
  <div class="quiz">${d.quiz.questions.map((q, i) => `
    <div class="q" data-answer="${q.answer}" data-ref="${esc(q.ref)}">
      <h3>${i + 1}. ${esc(q.q)}</h3>
      ${q.options.map((o, j) => `<label><input type="radio" name="q${i}" value="${j}"> ${esc(o)}</label>`).join('')}
      <div class="explain">${esc(q.explain)} <a class="qref" href="#">Voir la fiche →</a></div>
    </div>`).join('')}</div>
  <div class="quiz-actions"><button class="btn" id="quiz-check">Corriger</button><button class="btn ghost" id="quiz-reset">Recommencer</button><span class="score" id="quiz-score"></span></div>
</div></section>

<section class="block" id="glossaire"><div class="wrap">
  <h2>Glossaire</h2>
  <p class="intro">${esc(d.glossary.intro)}</p>
  <dl class="glossary">${d.glossary.terms.map(t => `<dt>${esc(t.term)}</dt><dd>${esc(t.def)}</dd>`).join('')}</dl>
</div></section>

<section class="block" id="parcours"><div class="wrap">
  <h2>Parcours business plan</h2>
  <p class="intro">${esc(d.parcours.intro)}</p>
  <div class="chapters"><button class="pill active" data-ch="">Toutes les fiches</button>${d.parcours.chapters.map(c => `<button class="pill" data-ch="${c.key}">${esc(c.label)}</button>`).join('')}</div>
  <div class="filter-note" id="filter-note"></div>
  <div class="myfiche">
    <div class="kicker-sm">Votre fiche · même grille que les autres</div>
    <h3>${esc(d.parcours.form.title)}</h3>
    <div class="row">
      <div><label>Nom du projet</label><input id="mf-name"></div>
      <div><label>Lieu · secteur</label><input id="mf-place"></div>
      <div><label>Modèle</label><select id="mf-model"><option>B2B</option><option>B2C</option><option>B2G</option><option>Place de marché</option><option>B2B2C</option><option>Freemium</option><option>Autre</option></select></div>
    </div>
    <label>En deux phrases : que vendez-vous, à qui ?</label><textarea id="mf-desc"></textarea>
    <label>Flux d'argent : qui paie quoi à qui ?</label><textarea id="mf-flow"></textarea>
    <label>Trois faits chiffrés (clients visés, prix, coût de départ)</label><textarea id="mf-facts"></textarea>
    <label>Ce qui est difficile à copier dans votre projet</label><textarea id="mf-moat"></textarea>
    <button class="btn secondary" id="mf-copy">Copier ma fiche</button> <span id="mf-status" style="font-size:13px;color:var(--muted)"></span>
    <p class="note">${esc(d.parcours.form.note)}</p>
  </div>
</div></section>

<section class="block" id="recap"><div class="wrap">
  <h2>Le récapitulatif</h2>
  <div class="table-wrap"><table class="recap">
    <thead><tr><th>Startup</th><th>Pays</th><th>Secteur</th><th>Modèle</th><th class="num">Levée</th><th>La leçon en un mot</th></tr></thead>
    <tbody>${[...d.fiches, ...d.pousses.list, ...d.simples.list].map(f => `<tr><td><a href="#f-${slug(f.name)}">${esc(f.name)}</a></td><td>${esc(f.recap.pays)}</td><td>${esc(f.recap.secteur)}</td><td>${esc(f.model)}</td><td class="num">${esc(f.recap.levee)}</td><td>${esc(f.recap.mot)}</td></tr>`).join('')}</tbody>
  </table></div>
</div></section>

<section class="block" id="idee"><div class="wrap">
  <div class="idea-take">
    <div class="kicker-sm">${esc(d.ideaToTake.kicker)}</div>
    <h3>${esc(d.ideaToTake.title)}</h3>
    <div class="cols">
      <div><h4>Le constat</h4><p>${esc(d.ideaToTake.constat)}</p></div>
      <div><h4>Ce qui existe déjà</h4><p>${esc(d.ideaToTake.existing)}</p></div>
      <div><h4>Le modèle</h4><p>${esc(d.ideaToTake.model)}</p></div>
    </div>
    <div class="flow">${d.ideaToTake.flow}</div>
    <div class="cols" style="margin-top:14px">
      <div><h4>Tester en deux semaines</h4><ul>${d.ideaToTake.test.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
      <div><h4>Les risques</h4><ul>${d.ideaToTake.risks.map(t => `<li>${esc(t)}</li>`).join('')}</ul></div>
    </div>
    <p class="warn">${esc(d.ideaToTake.warning)} Sources : ${sources(d.ideaToTake.sources)}</p>
  </div>
  <div class="three"><div class="kicker-sm">${esc(d.threeQuestions.kicker)}</div><h3>${esc(d.threeQuestions.title)}</h3><ol>${d.threeQuestions.list.map(q => `<li>${esc(q)}</li>`).join('')}</ol></div>
</div></section>

<section class="block" id="archives"><div class="wrap">
  <h2>Archives</h2>
  <div class="archives" id="archives-list"></div>
  <p>Chaque numéro est conservé à son adresse propre. La page d'accueil montre toujours le dernier.<br>
  <a class="lib-link" href="${B}fiches.html">Parcourir les ${esc(String(manifestTotal()))} fiches de tous les numéros →</a></p>
</div></section>
</main>

<footer><div class="wrap">
  <b>StartupScan</b> est préparé par Olivier Willocx, enseignant en entrepreneuriat et business plan à l'EPFC · <a href="mailto:olwillocx@epfc.eu">olwillocx@epfc.eu</a><br>
  Montants et chiffres tels qu'annoncés par les entreprises ou la presse ; ce sont des données déclarées, pas des comptes audités.
  <div class="next">Prochain numéro : ${esc(d.nextIssue)}</div>
</div></footer>`;

    document.getElementById('app').innerHTML = html;
    wire(d, allFiches);
  }

  function wire(d, allFiches) {
    // Breakeven
    const $ = id => document.getElementById(id);
    const fmt = n => n.toLocaleString('fr-BE', { maximumFractionDigits: 2 });
    function calc() {
      const fixed = +$('be-fixed').value || 0, price = +$('be-price').value || 0, cost = +$('be-cost').value || 0, days = Math.max(1, +$('be-days').value || 1);
      const margin = price - cost;
      $('be-margin').textContent = fmt(margin) + ' €';
      if (margin <= 0) { $('be-sales').textContent = '∞'; $('be-daily').textContent = '∞'; return; }
      const sales = Math.ceil(fixed / margin);
      $('be-sales').textContent = fmt(sales);
      $('be-daily').textContent = fmt(Math.ceil(sales / days));
    }
    ['be-fixed', 'be-price', 'be-cost', 'be-days'].forEach(id => $(id).addEventListener('input', calc));
    calc();

    // Quiz
    const qs = [...document.querySelectorAll('.q')];
    qs.forEach(q => {
      const ref = q.dataset.ref, a = q.querySelector('.qref');
      const map = { 'point-mort': '#point-mort', 'modeles': '#modeles', 'ia': '#ia' };
      a.href = map[ref] || ('#f-' + slug(ref));
    });
    $('quiz-check').addEventListener('click', () => {
      let score = 0, answered = 0;
      qs.forEach(q => {
        const ans = +q.dataset.answer, labels = [...q.querySelectorAll('label')];
        const chosen = q.querySelector('input:checked');
        labels.forEach(l => l.classList.remove('ok', 'ko'));
        labels[ans].classList.add('ok');
        if (chosen) { answered++; if (+chosen.value === ans) score++; else labels[+chosen.value].classList.add('ko'); }
        q.classList.add('done');
      });
      $('quiz-score').textContent = `${score} / ${qs.length} bonnes réponses` + (answered < qs.length ? ` (${qs.length - answered} sans réponse)` : '');
    });
    $('quiz-reset').addEventListener('click', () => {
      qs.forEach(q => { q.classList.remove('done'); q.querySelectorAll('label').forEach(l => l.classList.remove('ok', 'ko')); q.querySelectorAll('input').forEach(i => i.checked = false); });
      $('quiz-score').textContent = '';
    });

    // Parcours filter
    const pills = [...document.querySelectorAll('.pill')];
    const note = $('filter-note');
    function applyFilter(ch) {
      const cards = [...document.querySelectorAll('.card.fiche')];
      let n = 0;
      cards.forEach(c => { const show = !ch || c.dataset.chapter === ch; c.classList.toggle('hidden', !show); if (show) n++; });
      const label = ch ? d.parcours.chapters.find(c => c.key === ch).label : '';
      note.textContent = ch ? `${n} fiche${n > 1 ? 's' : ''} illustrent le chapitre « ${label} ». Les autres sont masquées dans toutes les rubriques.` : `${cards.length} fiches affichées.`;
    }
    pills.forEach(p => p.addEventListener('click', () => { pills.forEach(x => x.classList.remove('active')); p.classList.add('active'); applyFilter(p.dataset.ch); }));
    applyFilter('');

    // My fiche (localStorage)
    const fields = ['mf-name', 'mf-place', 'mf-model', 'mf-desc', 'mf-flow', 'mf-facts', 'mf-moat'];
    try { const saved = JSON.parse(localStorage.getItem('ss-myfiche') || '{}'); fields.forEach(f => { if (saved[f]) $(f).value = saved[f]; }); } catch (e) {}
    fields.forEach(f => $(f).addEventListener('input', () => { try { const o = {}; fields.forEach(k => o[k] = $(k).value); localStorage.setItem('ss-myfiche', JSON.stringify(o)); } catch (e) {} }));
    $('mf-copy').addEventListener('click', async () => {
      const t = `${$('mf-name').value}\n${$('mf-place').value} · ${$('mf-model').value}\n\n${$('mf-desc').value}\n\nFlux d'argent : ${$('mf-flow').value}\n\nFaits chiffrés : ${$('mf-facts').value}\n\nDifficile à copier : ${$('mf-moat').value}\n\n— Fiche rédigée avec la grille StartupScan (startupscan.eu)`;
      try { await navigator.clipboard.writeText(t); $('mf-status').textContent = 'Copié dans le presse-papiers.'; } catch (e) { $('mf-status').textContent = 'Sélectionnez et copiez le texte manuellement.'; }
    });

    // Active nav on scroll
    const links = [...document.querySelectorAll('.topnav a')].filter(a => a.getAttribute('href').startsWith('#'));
    const secs = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    const io = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) { links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id)); } }); }, { rootMargin: '-40% 0px -55% 0px' });
    secs.forEach(s => io.observe(s));
  }

  let MANIFEST = null;
  function manifestTotal() {
    return MANIFEST ? MANIFEST.issues.reduce((a, i) => a + (i.fiches || 0), 0) : '';
  }

  async function renderArchives(manifest) {
    const el = document.getElementById('archives-list');
    if (!el) return;
    el.innerHTML = manifest.issues.slice().sort((a, b) => b.number - a.number).map(i => `<a href="${B}archives/${i.id}.html">N° ${i.number} · ${esc(i.weekLabel)} · ${i.fiches} fiches</a>`).join('');
  }

  async function init() {
    try {
      const manifestP = fetch(B + 'data/manifest.json').then(r => r.json());
      const siteP = fetch(B + 'data/site.json').then(r => r.json());
      const id = SS.issue || (await manifestP).latest;
      const issue = await (await fetch(B + 'data/issues/' + id + '.json')).json();
      const manifest = await manifestP;
      Object.assign(issue, await siteP);
      MANIFEST = manifest;
      render(issue);
      renderArchives(manifest);
    } catch (e) {
      document.getElementById('app').innerHTML = '<div id="loading">Impossible de charger ce numéro. Réessayez dans un instant.</div>';
      console.error(e);
    }
  }
  init();
})();
