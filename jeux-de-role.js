/* StartupScan — jeux-de-role.html : crises du comité, calculateur Marmite, tirage des rôles. */
(function () {
  const $ = id => document.getElementById(id);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const eur = n => Math.round(n).toLocaleString('fr-BE') + ' €';
  const store = {
    get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ---------- Jeu 1 : le comité ---------- */
  const G = ['Trésorerie', 'Clients', 'Équipe', 'Réputation'];
  const CRISES = [
    { t: 'La grosse commande', fiche: ['l-entreprise-de-titres-services', 'Titres-services : quand le vrai client est le public'],
      d: "Un CPAS propose de faire réparer 300 appareils de ses bénéficiaires : 18 000 €, payés à 60 jours, à livrer en six semaines. C'est 6 % du chiffre d'affaires annuel, d'un coup.",
      o: [['Tout accepter', [-2, 2, -2, 1], "La commande est gagnée, mais il faut préfinancer les pièces et les heures supplémentaires pendant deux mois. L'atelier sature."],
          ['Accepter 150 appareils avec un acompte de 30 %', [0, 1, -1, 1], "Le CPAS accepte l'acompte. Moitié moins de chiffre, mais la trésorerie tient et l'équipe aussi."],
          ['Refuser poliment', [0, -1, 1, -1], "L'équipe souffle. Le CPAS ira ailleurs, et ne rappellera peut-être pas."]] },
    { t: 'Le départ', fiche: ['atomic', 'Atomic : construire une équipe'],
      d: "Karim, le technicien le plus expérimenté, annonce qu'il part chez un concurrent pour 300 € net de plus par mois. Il forme tout le monde depuis trois ans.",
      o: [['Aligner son salaire', [-2, 0, -1, 0], "Karim reste. Une semaine plus tard, les deux autres demandent la même chose."],
          ['Le laisser partir et former l\'apprenti', [1, -1, -1, -1], "La masse salariale baisse, mais les délais s'allongent et les retours augmentent pendant trois mois."],
          ['Proposer autre chose : responsable de la formation, un 4/5, une prime liée aux retours', [-1, 0, 2, 0], "Karim accepte : ce n'était pas que l'argent. Il se sentait invisible."]] },
    { t: 'La semaine noire', fiche: ['la-boulangerie', 'La boulangerie : le point mort avant le bail'],
      d: "La TVA du trimestre (7 400 €) et les cotisations sociales de la gérance (2 100 €) tombent la même semaine. Le compte affiche 6 000 €. Et la ligne de crédit vient d'être réduite.",
      o: [['Demander un plan de paiement au SPF Finances pour la TVA', [2, 0, 0, 0], "Accordé, avec des intérêts. Le problème est étalé, pas réglé : il faudra en parler au prochain comité."],
          ['Payer et retarder les fournisseurs', [2, 0, 0, -2], "Le compte tient. Le fournisseur de pièces exige désormais le paiement à la commande."],
          ['Relancer les factures impayées et vendre le stock reconditionné en promotion', [1, 1, -1, 0], "Un week-end de rush. L'argent rentre, l'équipe est épuisée, et de nouveaux clients découvrent l'atelier."]] },
    { t: 'L\'avis viral', fiche: ['la-taverne-des-dresseurs', 'La Taverne des Dresseurs : la communauté fait revenir'],
      d: "Une cliente publie un avis à une étoile, avec vidéo : son lave-linge réparé a fui dans la cuisine. 4 000 vues dans le groupe du quartier en deux jours.",
      o: [['Répondre publiquement, reprendre gratuitement, expliquer', [-1, 0, 0, 2], "La réponse est partagée presque autant que la vidéo. Trois personnes écrivent qu'elles viendront justement pour ça."],
          ['Ne rien faire, ça passera', [0, -1, 0, -2], "Ça ne passe pas. La vidéo ressort chaque fois que quelqu'un demande un réparateur dans le quartier."],
          ['Contester les faits en commentaire', [0, -1, 1, -2], "L'équipe se sent défendue. Le quartier, lui, voit une entreprise qui se dispute avec une cliente."]] },
    { t: 'La plateforme', fiche: ['le-professeur-freelance', 'Le professeur freelance : la plateforme apporte, puis prend'],
      d: "Une plateforme de dépannage à domicile propose de vous référencer : 40 demandes par mois garanties, 25 % de commission, tarif imposé par elle.",
      o: [['Signer pour tout', [1, 3, -1, 0], "Les demandes arrivent. Dans six mois, la moitié du chiffre dépendra d'une entreprise qui fixe vos prix."],
          ['Refuser et lancer sa propre prise de rendez-vous en ligne', [-1, 1, 0, 1], "Plus lent, plus cher au départ, mais les clients restent les vôtres."],
          ['Tester trois mois, sans dépasser 30 % du volume', [1, 2, 0, 0], "Vous apprenez ce que la plateforme vaut vraiment, sans lui donner les clés."]] },
    { t: 'Le fournisseur', fiche: ['cotti-coffee-le-cafe-a-1-euro', 'Cotti Coffee : un prix cassé se paie ailleurs'],
      d: "Un fournisseur propose des pièces génériques 40 % moins chères que les pièces d'origine, sans garantie du fabricant.",
      o: [['Tout passer en générique', [2, 0, 0, -2], "La marge remonte. Les retours aussi, et ce sont les clients qui les remarquent en premier."],
          ['Garder les pièces d\'origine', [-1, 0, 0, 1], "La qualité reste irréprochable ; la marge, elle, continue de fondre."],
          ['Laisser choisir le client : deux prix affichés, deux garanties', [1, 1, -1, 1], "Les clients apprécient de choisir. L'atelier doit gérer deux stocks, et râle."]] }
  ];
  const listEl = $('crises-list');
  if (listEl) {
    listEl.innerHTML = CRISES.map((c, i) => `<div class="crise"><div class="rc-top">Crise ${i + 1}</div><h4>${esc(c.t)}</h4><p>${esc(c.d)}</p><ol type="A">${c.o.map(o => `<li>${esc(o[0])}</li>`).join('')}</ol><p class="crise-fiche">À relire après le vote : <a href="./f/${c.fiche[0]}.html">${esc(c.fiche[1])}</a></p></div>`).join('');
  }
  if ($('cr-sel')) {
    const KEY = 'ss-rp-comite';
    let st = store.get(KEY, null) || { g: [5, 5, 5, 5], hist: [] };
    const sel = $('cr-sel');
    sel.innerHTML = CRISES.map((c, i) => `<option value="${i}">${i + 1}. ${esc(c.t)}</option>`).join('');
    const sign = n => (n > 0 ? '+' : '') + n;
    function renderCr(msg) {
      const c = CRISES[+sel.value];
      $('cr-text').textContent = c.d;
      const done = st.hist.find(h => h.c === +sel.value);
      $('cr-opts').innerHTML = c.o.map((o, j) => `<button type="button" class="btn-opt${done && done.o === j ? ' on' : ''}" data-j="${j}" ${done ? 'disabled' : ''}>${'ABC'[j]} · ${esc(o[0])}</button>`).join('');
      $('gauges').innerHTML = G.map((n, k) => {
        const v = st.g[k];
        return `<div class="gauge${v <= 0 ? ' alert' : ''}"><span>${n}</span><div class="bar-o"><div class="bar-i" style="width:${Math.max(0, Math.min(10, v)) * 10}%"></div></div><b>${v}/10</b></div>`;
      }).join('');
      const total = st.g.reduce((a, b) => a + b, 0);
      $('cr-effect').innerHTML = (msg || (done ? 'Décision déjà prise pour cette crise : ' + esc(c.o[done.o][2]) : '')) +
        `<br><b>Score du comité : ${total}</b> · crises traitées : ${st.hist.length}/6` + (st.g.some(v => v <= 0) ? ' · <span class="hot">alerte : une jauge est à zéro</span>' : '');
      $('cr-opts').querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
        const j = +b.dataset.j, e = c.o[j][1];
        st.g = st.g.map((v, k) => Math.max(0, Math.min(10, v + e[k])));
        st.hist.push({ c: +sel.value, o: j, e });
        store.set(KEY, st);
        const eff = G.map((n, k) => e[k] ? `${n} ${sign(e[k])}` : '').filter(Boolean).join(' · ');
        renderCr(`<b>${esc(c.o[j][0])}</b> — ${esc(c.o[j][2])}<br>${eff}`);
      }));
    }
    sel.addEventListener('change', () => renderCr());
    $('cr-undo').addEventListener('click', () => {
      const h = st.hist.pop(); if (!h) return;
      st.g = st.g.map((v, k) => Math.max(0, Math.min(10, v - h.e[k])));
      store.set(KEY, st); sel.value = String(h.c);
      renderCr('Carte « Rejouer » utilisée : la décision est annulée, le comité peut reprendre.');
    });
    $('cr-reset').addEventListener('click', () => {
      if (!confirm('Recommencer la partie ? Les jauges reviennent à 5.')) return;
      st = { g: [5, 5, 5, 5], hist: [] }; store.set(KEY, st); sel.value = '0'; renderCr();
    });
    renderCr();
  }

  /* ---------- Jeu 2 : calculateur Marmite ---------- */
  if ($('pf-cooks')) {
    const ids = ['pf-cooks', 'pf-clients', 'pf-comm', 'pf-fee', 'pf-coupon', 'pf-guar', 'pf-ads', 'pf-cash'];
    const BASKET = 20, CAP = 30, FIXED = 1500, AD_UNIT = 250;
    let last = null;
    function calc() {
      const v = {}; ids.forEach(i => v[i] = Math.max(0, +$(i).value || 0));
      v['pf-cash'] = +$('pf-cash').value || 0;
      const C = Math.floor(v['pf-cooks']), K = Math.floor(v['pf-clients']) + Math.floor(v['pf-ads'] / AD_UNIT);
      const comm = Math.min(60, v['pf-comm']) / 100;
      const price = Math.max(0, BASKET + v['pf-fee'] - v['pf-coupon']);
      const perClient = price <= 22 ? 10 : price <= 25 ? 7 : 4;
      const orders = Math.min(K * perClient, C * CAP);
      const perCook = C ? orders / C : 0;
      const cookNet = perCook * BASKET * (1 - comm);
      const topup = C ? Math.max(0, v['pf-guar'] - cookNet) * C : 0;
      const cookFinal = cookNet + (C ? topup / C : 0);
      const revenue = orders * (BASKET * comm + v['pf-fee']);
      const result = revenue - orders * v['pf-coupon'] - topup - v['pf-ads'] - FIXED;
      const end = v['pf-cash'] + result;
      $('pf-orders').textContent = orders;
      $('pf-price').textContent = price.toLocaleString('fr-BE') + ' €';
      $('pf-cookrev').textContent = eur(cookFinal);
      $('pf-result').textContent = (result >= 0 ? '+' : '') + eur(result);
      $('pf-result').className = result < 0 ? 'hot' : '';
      $('pf-endcash').textContent = eur(end);
      $('pf-endcash').className = end < 0 ? 'hot' : '';
      let diag;
      if (!C && !K) diag = "Personne n'est entré. C'est le problème de la poule et de l'œuf : qui allez-vous convaincre en premier, et avec quoi ?";
      else if (!C) diag = "Des clients, aucun cuisinier : ils repartiront le mois prochain. Le côté rare, ici, ce sont les cuisiniers.";
      else if (K * perClient < C * CAP * 0.5) diag = `Les cuisiniers ne remplissent que ${Math.round(orders / (C * CAP) * 100)} % de leur capacité. Avec ${eur(cookFinal)} chacun, ceux dont le seuil est plus haut vont partir.`;
      else if (C * CAP < K * perClient) diag = "Il y a plus de demande que de cuisiniers : des clients restent sans repas. C'est le moment d'attirer de l'offre.";
      else diag = "Offre et demande se tiennent. Reste à savoir si la plateforme gagne de l'argent — et ce qui empêche les deux côtés de se passer d'elle.";
      if (price > 22) diag += ` Au prix de ${price.toLocaleString('fr-BE')} €, chaque groupe de clients ne commande plus que ${perClient} repas.`;
      if (end < 0) diag += " La trésorerie est négative : il faut convaincre l'investisseur ou réduire les coûts fixes.";
      $('pf-diag').textContent = diag;
      last = end;
    }
    ids.forEach(i => $(i).addEventListener('input', calc));
    $('pf-next').addEventListener('click', () => { if (last !== null) { $('pf-cash').value = Math.round(last); $('pf-ads').value = 0; calc(); } });
    calc();
  }

  /* ---------- Tirage des rôles ---------- */
  const ROLES = {
    comite: { size: 7, min: 5, roles: ['La gérance', 'Les finances', 'Le commercial', "L'atelier", 'Les ressources humaines', 'La comptable externe', "L'observateur"], label: 'Comité' },
    plateforme: { whole: true, label: 'Partie' },
    parcours: { half: true, label: 'Manche 1' },
    client: { size: 3, min: 2, roles: ['Vendeur', 'Acheteur', 'Observateur'], label: 'Trio' },
    financeurs: { teams: 3, label: 'Équipe' }
  };
  const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  function chunk(arr, size) {
    const n = Math.max(1, Math.round(arr.length / size)), out = Array.from({ length: n }, () => []);
    arr.forEach((x, i) => out[i % n].push(x)); return out;
  }
  let groups = [], picked = null;
  function draw() {
    const names = $('dr-names').value.split(/\n|,|;/).map(s => s.trim()).filter(Boolean);
    const g = $('dr-game').value, cfg = ROLES[g];
    if (names.length < 2) { $('dr-out').innerHTML = ''; $('dr-hint').textContent = 'Ajoutez au moins deux prénoms.'; return; }
    const sh = shuffle(names);
    groups = [];
    if (g === 'plateforme') {
      const n = sh.length, inv = 1, ctl = 1, team = Math.min(3, Math.max(1, n - 4));
      const rest = Math.max(0, n - team - inv - ctl);
      const cooks = Math.ceil(rest / 2);
      const roles = [...Array(team).fill('Équipe plateforme'), 'Investisseur', 'Contrôle', ...Array(cooks).fill('Cuisiniers'), ...Array(rest - cooks).fill('Clients')];
      groups.push({ name: 'Marmite', items: sh.map((p, i) => ({ p, r: roles[i] || 'Clients' })) });
    } else if (g === 'parcours') {
      const st = ['Station 1 · guichet', 'Station 2 · caisse sociale', 'Station 3 · TVA', 'Station 4 · notaire', 'Station 5 · financement', 'Station 6 · accompagnement'];
      const pr = ['Le food truck', 'Le pop-up store', 'Le professeur freelance', 'La boulangerie', 'Le café par un trou dans le mur', "L'entreprise de titres-services"];
      const half = Math.ceil(sh.length / 2);
      groups.push({ name: 'Stations (manche 1)', items: sh.slice(0, half).map((p, i) => ({ p, r: st[i % 6] })) });
      groups.push({ name: 'Porteurs (manche 1)', items: sh.slice(half).map((p, i) => ({ p, r: pr[i % 6] })) });
    } else if (g === 'financeurs') {
      const fin = ['La banque', 'Le microcrédit', "L'investisseur privé", 'La famille et les amis'];
      const nf = Math.min(4, Math.max(1, Math.floor(sh.length / 4)));
      groups.push({ name: 'La table', items: sh.slice(0, nf).map((p, i) => ({ p, r: fin[i] })) });
      chunk(sh.slice(nf), 3).forEach((t, i) => groups.push({ name: 'Équipe ' + (i + 1), items: t.map(p => ({ p, r: 'Porteur·euse' })) }));
    } else {
      chunk(sh, cfg.size).forEach((t, i) => {
        const roles = cfg.roles.slice(0, Math.max(t.length, cfg.min)).slice(0, t.length);
        if (g === 'comite' && t.length < 7) { const k = roles.indexOf("L'observateur"); if (k === -1 && t.length >= 6) roles[roles.length - 1] = "L'observateur"; }
        groups.push({ name: cfg.label + ' ' + (i + 1), items: t.map((p, j) => ({ p, r: roles[j] || 'Observateur' })) });
      });
    }
    picked = null; renderDr();
    $('dr-hint').textContent = 'Chacun peut échanger une fois : cliquez sur deux personnes pour permuter leurs rôles. Le rôle d\'observateur est un vrai rôle, pas une mise à l\'écart.';
  }
  function renderDr() {
    $('dr-out').innerHTML = groups.map((gr, gi) => `<div class="dr-group"><h4>${esc(gr.name)}</h4>${gr.items.map((it, ii) =>
      `<button type="button" class="dr-item${picked && picked[0] === gi && picked[1] === ii ? ' on' : ''}" data-g="${gi}" data-i="${ii}"><b>${esc(it.p)}</b><span>${esc(it.r)}</span></button>`).join('')}</div>`).join('');
    $('dr-out').querySelectorAll('.dr-item').forEach(b => b.addEventListener('click', () => {
      const g = +b.dataset.g, i = +b.dataset.i;
      if (!picked) { picked = [g, i]; renderDr(); return; }
      const a = groups[picked[0]].items[picked[1]], c = groups[g].items[i];
      [a.p, c.p] = [c.p, a.p]; picked = null; renderDr();
    }));
  }
  if ($('dr-go')) {
    $('dr-names').value = store.get('ss-rp-names', '');
    $('dr-names').addEventListener('input', () => store.set('ss-rp-names', $('dr-names').value));
    $('dr-go').addEventListener('click', draw);
  }
})();
