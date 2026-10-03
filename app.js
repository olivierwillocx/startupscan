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
    <div class="head"><h3>${f.url ? `<a href="${B}${esc(f.url)}">${esc(f.name)}</a>` : esc(f.name)}</h3><span class="tag ${mc}">${esc(f.model)}</span></div>
    <div class="meta">${esc(f.place)} · ${esc(f.sector)}</div>
    <p class="desc">${esc(f.desc)}</p>
    ${f.flow ? `<div class="flow">${f.flow}</div>` : ''}
    <div class="facts">${leverChip}${facts}</div>
  </div>
  <div class="lesson"><b>La leçon</b>${esc(f.lesson)}</div>
  <div class="src">Source${(f.sources || []).length > 1 ? 's' : ''} : ${sources(f.sources)}</div>
</article>`;
  }

  // Si une rubrique manque (donnees incompletes, fichier non deploye, cache),
  // on la remplit a vide : la page s'affiche amputee plutot que blanche.
  const FALLBACK = {
    breakeven: { title: '', defaults: { fixed: 0, price: 0, cost: 0, days: 1 }, note: '' },
    models: { intro: '', list: [], others: [] },
    noMoney: { intro: '', ideas: [], steps: [], avoid: '', brussels: { title: '', text: '', source: { label: '', url: '#' } } },
    glossary: { intro: '', terms: [] },
    parcours: { intro: '', chapters: [], form: { title: '', note: '' } },
    quiz: { intro: '', questions: [] },
    simples: { intro: '', list: [] },
    pousses: { intro: '', list: [] },
    levers: { intro: '', list: [], cases: [] },
    ai: { intro: '', stats: [], statsSource: { label: '', url: '#' }, points: [], trap: '', exercise: { title: '', steps: [] } },
    idea: { title: '', text: '' },
    threeQuestions: { kicker: '', title: '', list: [] },
    ideaToTake: { kicker: '', title: '', constat: '', existing: '', model: '', flow: '', test: [], risks: [], warning: '', sources: [] },
    stats: { fiches: 0, pays: 0, innovants: 0, simples: 0 },
    fiches: [], fichesIntro: '', intro: '', reviewedOn: '', nextIssue: '', weekLabel: '', number: ''
  };
  function withDefaults(d) {
    const fill = (dst, src) => {
      Object.keys(src).forEach(k => {
        if (dst[k] == null) dst[k] = JSON.parse(JSON.stringify(src[k]));
        else if (!Array.isArray(src[k]) && typeof src[k] === 'object') fill(dst[k], src[k]);
      });
      return dst;
    };
    return fill(d, FALLBACK);
  }

  function exemplesFor(key, fiches) {
    return fiches.filter(f => modelClass(f.model) === key).map(f => f.name).join(', ');
  }

  function render(d) {
    document.title = `StartupScan — N° ${d.number} · ${d.weekLabel}`;
    const allFiches = [...d.levers.cases, ...d.fiches, ...d.pousses.list, ...d.simples.list];

    const html = `
<header class="masthead"><div class="wrap">
  <a class="logo" href="${B}index.html"><span class="logo-icon">S</span><span class="logo-text">Startup<span>Scan</span></span></a>
  <div class="issue-tag"><b>N° ${d.number}</b> · ${esc(d.weekLabel)}<br>${d.stats.fiches} fiches · ${d.stats.pays} pays · ${d.stats.innovants} modèles innovants · ${d.stats.simples} modèles simples</div>
</div></header>
<div class="ai-banner"><b>Site préparé avec l'aide de l'IA.</b> Chiffres déclarés par les entreprises ou la presse, relus contre leur source le ${esc(d.reviewedOn)} — vérifiez avant de réutiliser.</div>
<nav class="topnav"><div class="wrap">
  <a href="${B}index.html" class="active">Dernier numéro</a><a href="${B}fiches.html">Toutes les fiches</a><a href="${B}modeles.html">Qui paie ?</a><a href="${B}outils.html">Outils</a><a href="${B}glossaire.html">Glossaire</a><a href="${B}sans-argent.html">Sans argent</a><a href="${B}jeux.html">Les jeux</a><a href="${B}archives.html">Archives</a>
</div></nav>
<nav class="subnav"><div class="wrap">
  <span>Dans ce numéro</span><a href="#innovants">Modèles innovants</a><a href="#ia">IA</a><a href="#fiches">Fiches</a><a href="#pousses">Petites pousses</a><a href="#simples">Modèles simples</a><a href="#quiz">Quiz</a><a href="#recap">Récap</a><a href="#idee">Idée à prendre</a>
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
  <p class="more"><a class="lib-link" href="${B}fiches.html">Parcourir les ${manifestTotal()} fiches de tous les numéros →</a></p>
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
  <p class="more"><a class="lib-link" href="${B}outils.html#point-mort">Calculer votre point mort : combien de clients par jour pour couvrir vos frais →</a></p>
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


<section class="block" id="parcours"><div class="wrap">
  <h2>Filtrer par chapitre du business plan</h2>
  <p class="intro">Chaque fiche de ce numéro illustre un chapitre. Choisissez-en un : seules les fiches qui l'illustrent restent affichées, dans toutes les rubriques.</p>
  <div class="chapters"><button class="pill active" data-ch="">Toutes les fiches</button>${d.parcours.chapters.map(c => `<button class="pill" data-ch="${c.key}">${esc(c.label)}</button>`).join('')}</div>
  <div class="filter-note" id="filter-note"></div>
  <p class="more"><a class="lib-link" href="${B}outils.html#parcours">Écrire votre propre projet dans la grille StartupScan →</a></p>
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

</main>

<footer><div class="wrap">
  <b>StartupScan</b> est préparé par Olivier Willocx, enseignant en entrepreneuriat et business plan à l'EPFC · <a href="mailto:olwillocx@epfc.eu">olwillocx@epfc.eu</a><br>
  Montants et chiffres tels qu'annoncés par les entreprises ou la presse ; ce sont des données déclarées, pas des comptes audités.
  <div class="next">Prochain numéro : ${esc(d.nextIssue)} · <a href="${B}archives.html">tous les numéros</a></div>
</div></footer>`;

    document.getElementById('app').innerHTML = html;
    try { wire(d, allFiches); } catch (e) { console.error(e); }
  }

  function wire(d, allFiches) {
    const $ = id => document.getElementById(id);

    // Quiz
    const qs = [...document.querySelectorAll('.q')];
    qs.forEach(q => {
      const ref = q.dataset.ref, a = q.querySelector('.qref');
      const map = { 'point-mort': B + 'outils.html#point-mort', 'modeles': B + 'modeles.html', 'ia': '#ia' };
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

    // Active nav on scroll
    const links = [...document.querySelectorAll('.subnav a')].filter(a => a.getAttribute('href').startsWith('#'));
    const secs = links.map(a => document.querySelector(a.getAttribute('href'))).filter(Boolean);
    const io = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) { links.forEach(l => l.classList.toggle('active', l.getAttribute('href') === '#' + e.target.id)); } }); }, { rootMargin: '-40% 0px -55% 0px' });
    secs.forEach(s => io.observe(s));
  }

  let MANIFEST = null;
  function manifestTotal() {
    return MANIFEST ? MANIFEST.issues.reduce((a, i) => a + (i.fiches || 0), 0) : '';
  }

  async function init() {
    let issue, manifest;
    try {
      const manifestP = fetch(B + 'data/manifest.json').then(r => r.json());
      const siteP = fetch(B + 'data/site.json').then(r => r.json()).catch(e => (console.error(e), {}));
      manifest = await manifestP;
      const id = SS.issue || manifest.latest;
      issue = await (await fetch(B + 'data/issues/' + id + '.json')).json();
      Object.assign(issue, await siteP);
    } catch (e) {
      document.getElementById('app').innerHTML = '<div id="loading">Impossible de charger ce numéro. Réessayez dans un instant.</div>';
      console.error(e);
      return;
    }
    MANIFEST = manifest;
    render(withDefaults(issue));
  }
  init();
})();
