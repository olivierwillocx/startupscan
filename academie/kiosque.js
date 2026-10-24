/* Le Kiosque — interface. Dépend de kiosque-engine.js (window.KQ). */
(function () {
  "use strict";
  var K = window.KQ, G = document.getElementById("game"), HUD = document.getElementById("hud");
  var IMG = "./academie/img/kiosque/", SAVE = "kq1", S = null;

  /* ---------- utilitaires ---------- */
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function eur(n, d) {
    d = d == null ? (Math.abs(n) >= 100 || Math.abs(n - Math.round(n)) < 0.005 ? 0 : 2) : d;
    var s = Math.abs(n).toLocaleString("fr-BE", { minimumFractionDigits: d, maximumFractionDigits: d });
    return (n < -0.004 ? "−" : "") + s + " €";
  }
  function sgn(n, d) { return (n >= 0 ? "+" : "") + eur(n, d).replace(/^−/, "−"); }
  function im(n) { return IMG + n + ".jpg"; }
  function store(fn) { try { return fn(window.localStorage); } catch (e) { return null; } }
  function save() { store(function (l) { l.setItem(SAVE, JSON.stringify(S)); }); }
  function load() { return store(function (l) { var t = l.getItem(SAVE); return t ? JSON.parse(t) : null; }); }
  function wipe() { store(function (l) { l.removeItem(SAVE); }); }
  function scrollTop() { window.scrollTo({ top: 0, behavior: "auto" }); }

  var ICO = {
    sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="4.2"/><path d="M12 2.5v2.4M12 19.1v2.4M2.5 12h2.4M19.1 12h2.4M5.3 5.3l1.7 1.7M17 17l1.7 1.7M18.7 5.3 17 7M7 17l-1.7 1.7"/></svg>',
    grey: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 18.5h10.2a4 4 0 0 0 .5-7.97A5.6 5.6 0 0 0 6.9 9.3 4.6 4.6 0 0 0 7 18.5Z"/></svg>',
    rain: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M7 15h10.2a3.6 3.6 0 0 0 .4-7.2A5.2 5.2 0 0 0 7.5 6.6 4.2 4.2 0 0 0 7 15Z"/><path d="M8.5 18l-1 2.4M12.5 18l-1 2.4M16.5 18l-1 2.4"/></svg>',
    heat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 4.5a2 2 0 1 1 4 0v8.2a4 4 0 1 1-4 0Z"/><path d="M12 9v6.4"/><path d="M17 6.5h3M17 10h2"/></svg>',
    cold: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.5v19M3.8 7.2l16.4 9.6M20.2 7.2 3.8 16.8M9.5 4.2 12 6.5l2.5-2.3M9.5 19.8 12 17.5l2.5 2.3"/></svg>'
  };
  var ST = { prudent: { nom: "Le Prudent", img: "grey", t: "Tu as commandé raisonnablement, peu jeté, peu investi. Ta caisse dort tranquille. Le risque : passer à côté des jours de folie (canicule, festival, grosse averse). Question à te poser : sais-tu ce que tu aurais gagné en osant un peu plus ?" },
    joueur: { nom: "Le Parieur", img: "heat", t: "Tu as misé gros sur la météo. Certains jours ont payé très cher, d’autres ont fini à la poubelle. Aucun mal à parier — à condition de savoir pourquoi ça a marché et de pouvoir encaisser quand ça rate." },
    fidele: { nom: "L’Hôte", img: "sun", t: "Ta réputation est ton principal actif : prix doux, service rapide, clients qui reviennent. Le risque : des marges fines et une équipe qu’il faut payer même quand il pleut. Question : à quel prix ta fidélité devient-elle rentable ?" },
    batisseur: { nom: "Le Bâtisseur", img: "front", t: "Tu as investi dans le matériel pour durer. Sur 15 jours, ça pèse sur la caisse ; sur 3 ans, ça peut rapporter gros. Question : ta trésorerie tient-elle jusque-là, et ton banquier aussi ?" } };

  /* ---------- barre d’état ---------- */
  function hud() {
    if (!S) { HUD.innerHTML = ""; return; }
    var pips = ""; for (var i = 1; i <= K.DAYS; i++) pips += '<span class="' + (i < S.day ? "d" : i === S.day ? "c" : "") + '"></span>';
    HUD.innerHTML =
      '<div class="h"><small>Jour</small><b class="num">' + S.day + " / " + K.DAYS + '</b><div class="pips">' + pips + "</div></div>" +
      '<div class="h' + (S.cash < 0 ? " neg" : "") + '"><small>Caisse</small><b class="num">' + eur(S.cash) + "</b></div>" +
      '<div class="h"><small>Dette</small><b class="num">' + eur(S.debt) + "</b></div>" +
      '<div class="h rep"><small>Réputation</small><b class="num">' + Math.round(S.rep) + '</b><i><s style="width:' + S.rep + '%"></s></i></div>';
  }

  /* ---------- briques ---------- */
  function stage(img, titre, sous, tag, bad) {
    return '<figure class="stage"><img src="' + im(img) + '" alt="">' + (tag ? '<span class="tag' + (bad ? " bad" : "") + '">' + esc(tag) + "</span>" : "") +
      '<figcaption class="cap"><div><h2>' + titre + "</h2>" + (sous ? "<p>" + sous + "</p>" : "") + "</div></figcaption></figure>";
  }
  function put(html) { G.innerHTML = html; hud(); }
  function go(html, noscroll) { put(html); if (!noscroll) scrollTop(); }

  /* ---------- intro ---------- */
  function intro() {
    S = null; hud();
    var saved = load(), q = /[?&]seed=(\d+)/.exec(location.search), seed = q ? +q[1] : 0;
    go(stage("front", "Le Kiosque", "15 jours pour faire tourner un kiosque à Bruxelles. 20 minutes. Pas de bonne réponse unique.", "Jeu · Académie StartupScan") +
      '<div class="panel card"><span class="eyebrow">Ta situation</span><h2 class="h">Tu viens de reprendre un kiosque près d’une grande place</h2>' +
      '<p class="lead">1 500 € en caisse, un stock d’environ 300 € et une dette de 4 000 € à rembourser. Chaque matin, tu regardes le ciel, tu commandes, tu fixes tes prix. Chaque soir, tu comptes.</p>' +
      '<div class="rules"><div class="rule"><b>5 produits</b><span>Glaces, café &amp; soupes, parapluies, sandwichs, souvenirs. Chacun aime un temps différent.</span></div>' +
      '<div class="rule"><b>Un étudiant à 15 €/h</b><span>Il fait respirer ta file d’attente… les jours où il vient. À toi de voir si tu le paies quand il ne vient pas.</span></div>' +
      '<div class="rule"><b>Des investissements</b><span>Tables, congélateur, enseigne, machine à café. Chacun coûte aujourd’hui, rapporte (peut-être) demain.</span></div>' +
      '<div class="rule"><b>Une dette</b><span>400 € à rembourser tous les 5 jours, plus des intérêts. Même quand il pleut.</span></div></div>' +
      '<p class="lead" style="font-size:16px">Il n’y a ni bonne ni mauvaise stratégie : prudent, joueur, généreux ou bâtisseur peuvent tous s’en sortir. À la fin, tu verras ce que ton kiosque vaut <em>vraiment</em> — pas seulement ce qu’il y a dans la caisse.</p>' +
      '<div class="row" style="margin-top:18px"><button class="btn lg" data-act="new">Ouvrir le kiosque</button>' +
      (saved && saved.day > 1 && saved.day <= K.DAYS ? '<button class="btn ghost lg" data-act="resume">Reprendre ma partie (jour ' + saved.day + ")</button>" : "") + "</div>" +
      '<div class="seedbox" style="margin-top:14px"><label for="seed">Code de partie (pour rejouer la même météo, par exemple en classe) :</label><input id="seed" inputmode="numeric" placeholder="au hasard" value="' + (seed || "") + '"></div></div>');
    G._saved = saved;
  }

  /* ---------- déroulé ---------- */
  function newGame(seed) {
    S = K.newGame(seed || (Math.floor(Math.random() * 90000) + 10000));
    save(); startDay();
  }
  function startDay() {
    save();
    var ev = K.eventForDay(S);
    if (!ev) return plan();
    if (ev.bank) return bank();
    if (ev.quit) return quit();
    return event(ev.id);
  }

  function event(id) {
    var E = K.EVENTS[id], ch = E.choix.map(function (c, i) { return [c, i]; }).filter(function (x) { return !x[0].show || x[0].show(S); });
    var single = ch.length === 1 && E.auto;
    go(stage(E.img, esc(E.titre), "", "Jour " + S.day + " · Imprévu") +
      '<div class="panel card"><p class="lead">' + esc(E.texte) + "</p>" +
      '<div class="choices" id="ch">' + ch.map(function (x) { return '<button class="choice" data-act="ev" data-id="' + id + '" data-i="' + x[1] + '"><b>' + esc(x[0].t) + "</b>" + (x[0].s ? "<span>" + esc(x[0].s) + "</span>" : "") + "</button>"; }).join("") + "</div></div>");
    if (single) G.querySelector(".choice b").textContent = E.choix[0].t;
  }
  function eventDone(msg) {
    var c = document.getElementById("ch");
    c.outerHTML = '<div class="result">' + esc(msg) + '</div><div class="row" style="margin-top:14px"><button class="btn lg" data-act="plan">Préparer la journée →</button></div>';
    hud();
  }

  function bank() {
    go(stage("banker", "Le banquier te convoque", "Jour 8 · mi-parcours", "Jour 8 · Rendez-vous") +
      '<div class="panel card"><p class="lead">« Votre kiosque tourne. Je peux vous prêter <b>1 200 €</b> tout de suite, pour acheter du matériel ou renforcer votre stock. » Il fait tourner son stylo. « Mais vos échéances passent de 400 à <b>520 €</b> tous les 5 jours, et les intérêts s’appliquent sur toute la dette. »</p>' +
      '<div class="choices" id="ch"><button class="choice" data-act="bank" data-v="1"><b>J’accepte le prêt de 1 200 €</b><span>+1 200 € en caisse maintenant ; dette ' + eur(S.debt + 1200) + " ; échéance 520 €</span></button>" +
      '<button class="choice" data-act="bank" data-v="0"><b>Je refuse, je me débrouille</b><span>Pas de dette en plus, pas de marge de manœuvre en plus non plus</span></button></div>' +
      '<p class="legal">Dans la vraie vie : un prêt se compare (taux, durée, garanties, frais) et se lit en entier — voir la leçon « Emprunter : ce qu’on signe vraiment ».</p></div>');
  }
  function quit() {
    go(stage("student", "Ton étudiant démissionne", "", "Jour " + S.day + " · Imprévu", true) +
      '<div class="panel card"><p class="lead">« Je vais travailler chez le concurrent. Là-bas, on me dit bonjour le matin. » Il te rend son tablier. Tu peux en chercher un autre dès aujourd’hui.</p>' +
      '<div class="row" style="margin-top:14px"><button class="btn lg" data-act="quitok">Je continue sans lui →</button></div></div>');
  }

  /* ---------- plan du jour ---------- */
  function fcHtml() {
    var f = K.forecastRounded(S, S.day), top = K.mostLikely(S, S.day);
    return K.WIDS.map(function (w) { return '<div class="f' + (w === top ? " top" : "") + '">' + ICO[w] + "<div><span>" + K.WN[w] + '</span><div class="bar"><i style="width:' + f[w] + '%"></i></div></div><b class="num">' + f[w] + "&nbsp;%</b></div>"; }).join("");
  }
  function planTotals() {
    var oc = K.orderCost(S, S.plan.order);
    var after = S.cash - oc.total;
    return { oc: oc, after: after, left: Math.max(0, 150 - oc.raw) };
  }
  function prodCard(p) {
    var P = K.PR[p], n = S.plan.order[p] || 0, lvl = S.plan.price[p], have = K.stockCount(S, p), sh = K.shelf(S, p);
    var expiring = 0; S.stock[p].forEach(function (b) { if (b.age + 1 >= sh) expiring += b.n; });
    var prices = [0, 1, 2].map(function (i) { return K.priceOf(S, p, i); });
    var labels = ["Promo", "Normal", "Premium"];
    var nb = JSON.parse(JSON.stringify(S.plan.order)); nb[p] = n + P.step;
    var canMore = S.cash - K.orderCost(S, nb).total >= -K.OVERDRAFT;
    var vit = S.plan.vitrine === p;
    return '<article class="prod' + (vit ? " vit" : "") + '"><div class="ph"><img src="' + im(p === "cafe" ? "cafe" : p === "para" ? "parapluies" : p === "sand" ? "sandwichs" : p === "souv" ? "souvenirs" : "glaces") + '" alt="" loading="lazy"><button class="vitb" data-act="vit" data-p="' + p + '" aria-pressed="' + vit + '">' + (vit ? "★ En vitrine" : "☆ Mettre en vitrine") + "</button></div>" +
      '<div class="bd"><div class="top"><h3>' + P.nom + '</h3><span class="st">Achat <b class="num">' + eur(P.cost, 2) + "</b> l’unité</span></div>" +
      '<div class="chips"><span class="chip">' + esc(P.aime) + '</span><span class="chip' + (sh < 10 ? " w" : "") + '">' + esc(p === "glaces" && S.equip.freezer ? "Se garde 6 jours (congélateur)" : P.peri) + "</span></div>" +
      '<div class="st">En stock : <b class="num">' + have + "</b>" + (expiring ? ' · <span class="miss">' + expiring + " périment ce soir</span>" : "") + "</div>" +
      '<div class="ctl"><div class="step" role="group" aria-label="Commander ' + P.nom + '"><button data-act="ord" data-p="' + p + '" data-d="-1" aria-label="Moins"' + (n <= 0 ? " disabled" : "") + '>−</button><output class="num" aria-live="polite">' + n + '</output><button data-act="ord" data-p="' + p + '" data-d="1" aria-label="Plus"' + (canMore ? "" : " disabled") + ">+</button></div>" +
      '<span class="st">à commander · <b class="num">' + eur(n * P.cost) + "</b></span></div>" +
      '<div class="seg" role="group" aria-label="Prix de vente">' + labels.map(function (l, i) { return '<button data-act="prc" data-p="' + p + '" data-l="' + i + '" class="' + (lvl === i ? "on" : "") + '" aria-pressed="' + (lvl === i) + '">' + l + "<small>" + eur(prices[i], 2) + "</small></button>"; }).join("") + "</div></div></article>";
  }
  function studHtml() {
    var s = S.student, c = K.studentCost(S), mood = "";
    for (var i = 0; i < 4; i++) mood += '<i class="' + (i < s.loyal ? "on" : "") + '"></i>';
    if (!s.hired) return '<div class="card c-stu"><div class="stud"><img src="' + im("student") + '" alt=""><div><h3 class="h">Engager un étudiant ?</h3><p class="sub">' + K.WAGE_H + " €/h × " + K.SHIFT_H + " h = " + eur(K.WAGE_H * K.SHIFT_H) + " les jours où il travaille. Il te permet de servir ~50 clients de plus. Il peut aussi ne pas venir.</p></div></div><div class=\"row\" style=\"margin-top:12px\"><button class=\"btn ghost sm\" data-act=\"hire\">Engager (15 €/h)</button></div></div>";
    return '<div class="card c-stu"><div class="stud"><img src="' + im("student") + '" alt=""><div><h3 class="h">Ton étudiant<span class="mood" title="Humeur" aria-label="Humeur ' + s.loyal + ' sur 4">' + mood + "</span></h3><p class=\"sub\">" + s.wage + " €/h × " + K.SHIFT_H + " h = " + eur(c) + " par jour travaillé</p></div></div>" +
      '<label class="switch"><input type="checkbox" data-act="works"' + (s.works ? " checked" : "") + "> Il travaille aujourd’hui (" + eur(c) + ")</label>" +
      '<button class="link" data-act="fire">Mettre fin à son contrat</button></div>';
  }
  function investHtml() {
    var h = '<section class="panel"><span class="eyebrow">Investir ?</span><h2 class="h">Du matériel qui coûte aujourd’hui et rapporte (peut-être) demain</h2><p class="sub">Dans le bilan final, ton matériel compte pour 70 % de son prix d’achat. Mais ce que tu paies sort de ta caisse tout de suite.</p><div class="invest">';
    Object.keys(K.INVEST).forEach(function (id) {
      var it = K.INVEST[id], owned = false, rent = false;
      if (id === "tables1") owned = S.equip.tables >= 1; if (id === "tables2") owned = S.equip.tables >= 2;
      if (id === "freezer") owned = !!S.equip.freezer; if (id === "sign") owned = !!S.equip.sign;
      if (id === "machine") { owned = S.equip.machine === 1; rent = S.equip.machine === 2; }
      if (id === "tables2" && S.equip.tables < 1) return;
      var can = K.canBuy(S, id), afford = S.cash - it.prix >= -K.OVERDRAFT, b = "";
      if (owned) b = '<div class="own">Acheté ✓</div>';
      else if (rent) b = '<div class="own">Loué · 22 € / jour</div><button class="btn ghost sm" data-act="stoprent">Arrêter la location</button>';
      else {
        b = '<div class="pr num">' + eur(it.prix) + "</div>" + '<button class="btn sm" data-act="buy" data-id="' + id + '"' + (can && afford ? "" : " disabled") + ">" + (afford ? "Acheter" : "Trop cher pour ta caisse") + "</button>";
        if (id === "machine") b += '<button class="btn ghost sm" data-act="rent">Louer 22 € / jour</button>';
      }
      h += '<article class="inv"><img src="' + im(it.img) + '" alt="" loading="lazy"><div class="b"><h4>' + esc(it.nom) + "</h4><p>" + esc(it.txt) + '</p><div class="eff">' + esc(it.eff) + "</div>" + b + "</div></article>";
    });
    return h + "</div></section>";
  }
  function sumHtml() {
    var t = planTotals(), cap = K.capacity(S) + ((K.studentWorking(S)) ? 0 : 0);
    var capNote = K.studentWorking(S) ? "~" + (K.OWNER_CAP + (S.student.loyal >= 3 ? 60 : 50)) + " clients servis maximum aujourd’hui (étudiant inclus, s’il vient)" : "~" + K.OWNER_CAP + " clients servis maximum seul·e";
    var disc = S.flags.discountDay === S.day;
    return '<div class="card sum"><span class="eyebrow">Ce matin</span><dl>' +
      "<dt>Caisse</dt><dd class=\"num\">" + eur(S.cash) + "</dd>" +
      "<dt>Commande du jour</dt><dd class=\"num neg\">−" + eur(t.oc.total).replace("−", "") + "</dd>" +
      (t.oc.disc ? '<dt class="ok">dont remise fournisseur</dt><dd class="num ok">−' + eur(t.oc.raw - t.oc.total).replace("−", "") + "</dd>" : "") +
      (K.studentWorking(S) ? "<dt>Étudiant (si présent)</dt><dd class=\"num neg\">−" + eur(K.studentCost(S)) + "</dd>" : "") +
      "<dt>Emplacement</dt><dd class=\"num neg\">−" + eur(K.PLACE + (S.flags.surcharge || 0)) + "</dd>" +
      '<dt class="tot">Caisse après achats</dt><dd class="tot num ' + (t.after < 0 ? "neg" : "") + '">' + eur(t.after) + "</dd></dl>" +
      (disc ? '<div class="note' + (t.oc.disc ? " ok" : "") + '">' + (t.oc.disc ? "Remise fournisseur appliquée : −30 %." : "Remise fournisseur −30 % si ta commande atteint 150 € (encore " + eur(t.left) + ").") + "</div>" : "") +
      (S.day % 5 === 0 ? '<div class="note">Ce soir : échéance de la banque (' + eur(Math.min(S.repay, S.debt) + S.debt * 0.015) + " avec les intérêts).</div>" : "") +
      (t.after < 0 ? '<div class="note">Tu es à découvert : 1 % d’intérêts par jour, et en dessous de −600 € le banquier te convoque.</div>' : "") +
      '<p class="sub" style="margin-top:10px">' + capNote + ".</p>" +
      '<div class="row" style="margin-top:14px"><button class="btn lg" style="width:100%" data-act="launch">Ouvrir le kiosque →</button></div></div>';
  }
  function plan(keep) {
    var y = window.scrollY, fc = K.mostLikely(S, S.day);
    var html = keep ? "" : stage(fc, "Jour " + S.day + " — que va-t-il se passer ?", "Prévision : " + K.WN[fc].toLowerCase() + " le plus probable. Mais une prévision n’est jamais une certitude.", "Prévision · " + K.WN[fc], false);
    var left = '<div class="lft"><div class="prods">' + K.PIDS.map(prodCard).join("") + "</div>" + investHtml() + "</div>";
    var side = '<aside class="side"><div class="card c-fc"><span class="eyebrow">Météo de ce soir</span><div class="fc">' + fcHtml() + "</div></div>" + studHtml() + sumHtml() + "</aside>";
    var t = planTotals(), bar = '<div class="gobar"><span>Caisse après achats<b class="num' + (t.after < 0 ? ' neg' : '') + '">' + eur(t.after) + '</b></span><button class="btn" data-act="launch">Ouvrir le kiosque →</button></div>';
    if (keep) { var p = G.querySelector(".plan"); p.innerHTML = left + side + bar; hud(); window.scrollTo(0, y); return; }
    go(html + '<div class="panel plan">' + left + side + bar + "</div>");
  }

  /* ---------- lancer la journée ---------- */
  function launch() {
    var ab = K.rollAbsence(S);
    if (ab) return absence(ab);
    day();
  }
  function absence(ab) {
    G._ab = ab;
    var ch = K.absenceChoices(S, ab);
    go(stage("absent", "Ton étudiant ne vient pas", "", "Jour " + S.day + " · Imprévu", true) +
      '<div class="panel card"><p class="lead">Il est 7 h 40. Ton téléphone vibre. ' + esc(ab.reason) + " Tu as déjà commandé pour une journée à deux. Que fais-tu ?</p>" +
      '<div class="choices">' + ch.map(function (c, i) { return '<button class="choice" data-act="abs" data-i="' + i + '"><b>' + esc(c.t) + "</b><span>" + esc(c.s) + "</span></button>"; }).join("") + "</div>" +
      '<p class="legal">À vérifier dans la vraie vie : un contrat d’étudiant (« jobiste ») a ses règles sur l’absence et la rémunération. Demande-les à ton secrétariat social avant de décider « au feeling ».</p></div>');
  }
  function day() {
    var res = K.playDay(S);
    results(res);
  }

  function results(res) {
    var w = res.weather, fc = K.forecastRounded(S, S.day)[w], surprise = fc <= 20;
    var tag = "Jour " + S.day + " · " + K.WN[w];
    var sub = "La météo annonçait " + fc + " % de « " + K.WN[w].toLowerCase() + " ». " + (surprise ? "C’était la surprise." : fc >= 50 ? "Rien d’étonnant." : "Ça pouvait arriver.");
    var rows = res.rows.map(function (r) {
      var miss = r.lostStock + r.lostCap, why = [];
      if (r.lostStock > 0) why.push(r.lostStock + " en rupture"); if (r.lostCap > 0) why.push(r.lostCap + " dans la file");
      var pn = r.p === "cafe" ? "cafe" : r.p === "para" ? "parapluies" : r.p === "sand" ? "sandwichs" : r.p === "souv" ? "souvenirs" : "glaces";
      return "<tr><td><img src=\"" + im(pn) + '" alt="">' + K.PR[r.p].nom + '</td><td>' + r.sold + "</td><td>" + eur(r.price, 2) + "</td><td>" + eur(r.income) + '</td><td class="' + (miss ? "miss" : "") + '">' + (miss ? esc(why.join(", ")) : "—") + "</td><td>" + r.left + "</td></tr>";
    }).join("");
    var costRows = res.costs.map(function (c) { return "<dt>" + esc(c[0]) + "</dt><dd class=\"num\">−" + eur(c[1]).replace("−", "") + "</dd>"; }).join("");
    var q = res.quips.length ? '<div class="quotes">' + res.quips.map(function (x) { return '<div class="q"><p>' + esc(x.t) + "</p><cite>" + esc(x.who) + "</cite></div>"; }).join("") + "</div>" : "";
    var j = S.journal.filter(function (x) { return x.day === S.day; });
    var jh = j.length ? '<ul class="journal">' + j.map(function (x) { return "<li>" + esc(x.txt) + "</li>"; }).join("") + "</ul>" : "";
    var wh = res.waste.length ? '<div class="note" style="margin-top:12px">Périmé ce soir : ' + res.waste.map(function (x) { return x.n + " " + K.PR[x.p].nom.toLowerCase(); }).join(", ") + " — " + eur(res.wasteVal, 2) + " jetés.</div>" : "";
    var lost = res.lostRevenue > 5 ? '<div class="note" style="margin-top:12px">Ventes manquées aujourd’hui : environ ' + eur(res.lostRevenue) + " (rupture de stock ou file d’attente trop longue).</div>" : "";
    var last = S.day >= K.DAYS;
    go(stage(w, K.WN[w], esc(sub), tag, false) +
      '<div class="panel">' + q +
      '<div class="card"><span class="eyebrow">Ce qui s’est vendu</span><div class="tw"><table class="t"><thead><tr><th>Produit</th><th>Vendus</th><th>Prix</th><th>Recette</th><th>Manqué</th><th>Reste</th></tr></thead><tbody>' + rows + '</tbody><tfoot><tr><td>Total</td><td>' + res.sold + "</td><td></td><td>" + eur(res.rev) + "</td><td></td><td></td></tr></tfoot></table></div>" + wh + lost + "</div>" +
      '<div class="card"><span class="eyebrow">Ta caisse ce soir</span><dl class="flow" style="margin-top:10px">' +
      "<dt>Caisse ce matin</dt><dd>" + eur(res.cashStart) + "</dd>" +
      "<dt>Achats du jour" + (res.order.disc ? " (remise −30 %)" : "") + "</dt><dd>−" + eur(res.order.total).replace("−", "") + "</dd>" +
      "<dt>Ventes</dt><dd>+" + eur(res.rev) + "</dd>" + costRows +
      '<div class="sep"></div><dt class="big">Caisse ce soir</dt><dd class="big">' + eur(res.cashEnd) + "</dd>" +
      "<dt class=\"sub\">Stock restant (au prix d’achat)</dt><dd class=\"sub\">" + eur(res.stockEnd) + "</dd><dt class=\"sub\">Dette restante</dt><dd class=\"sub\">" + eur(S.debt) + "</dd></dl>" + jh + "</div>" +
      '<div class="row" style="margin-top:16px"><button class="btn lg" data-act="after">' + (last ? "Voir le bilan de mon kiosque →" : res.rescue ? "Continuer →" : "Jour " + (S.day + 1) + " →") + "</button></div></div>");
    G._res = res; save();
  }
  function after() {
    var res = G._res;
    if (res && res.rescue && S.day < K.DAYS) return rescue();
    advance();
  }
  function advance() {
    if (S.day >= K.DAYS) return final();
    K.nextDay(S); startDay();
  }
  function rescue() {
    go(stage("banker", "Le banquier t’appelle", "Ta caisse est à " + eur(S.cash), "Jour " + S.day + " · Alerte", true) +
      '<div class="panel card"><p class="lead">« Votre compte est dans le rouge. Je ne vous laisse pas tomber, mais il faut une solution aujourd’hui. »</p>' +
      '<div class="choices"><button class="choice" data-act="resc" data-v="loan"><b>Rallonge de 800 €</b><span>Ta caisse respire ; dette +800 € ; échéance +80 €</span></button>' +
      '<button class="choice" data-act="resc" data-v="sell"><b>Liquider mon stock à moitié prix</b><span>Du cash tout de suite, des étagères vides demain</span></button></div>' +
      '<p class="legal">Pas de game over : un entrepreneur qui rate un trimestre renégocie, il ne disparaît pas. Mais chaque solution a un coût.</p></div>');
  }

  /* ---------- bilan ---------- */
  function spark() {
    var H = S.hist, W = 640, Hh = 170, pad = 8, i, vals = H.map(function (h) { return h.cash; }).concat(H.map(function (h) { return h.worth; })).concat([S.startWorth]);
    var mn = Math.min.apply(null, vals), mx = Math.max.apply(null, vals);
    function X(i) { return pad + (W - 2 * pad) * (i / (H.length - 1)); } function Y(v) { return pad + (Hh - 2 * pad) * (1 - (v - mn) / (mx - mn || 1)); }
    function line(key, col, w) { return '<polyline fill="none" stroke="' + col + '" stroke-width="' + w + '" stroke-linejoin="round" stroke-linecap="round" points="' + H.map(function (h, i) { return X(i).toFixed(1) + "," + Y(h[key]).toFixed(1); }).join(" ") + '"/>'; }
    var zero = mn < 0 && mx > 0 ? '<line x1="' + pad + '" x2="' + (W - pad) + '" y1="' + Y(0).toFixed(1) + '" y2="' + Y(0).toFixed(1) + '" stroke="#C5D3E4" stroke-dasharray="4 4"/>' : "";
    return '<svg class="spark" viewBox="0 0 ' + W + " " + Hh + '" role="img" aria-label="Évolution de ta caisse et de la valeur de ton kiosque, jour après jour">' + zero + line("worth", "#004A93", 3) + line("cash", "#5B9BD8", 2.5) + "</svg>" +
      '<div class="legend"><span><i style="background:#004A93"></i>Ce que vaut ton kiosque (caisse + stock + matériel − dette)</span><span><i style="background:#5B9BD8"></i>Ce qu’il y a en caisse</span></div>';
  }
  function final() {
    var F = K.finale(S), st = S.stats, sty = ST[F.style];
    var stock = K.stockValue(S), eq = K.equipValue(S);
    wipe();
    var stud = K.WAGE_H;
    go(stage(sty.img, sty.nom, "Ton style de gestion sur 15 jours — aucun n’est « le bon ».", "Bilan · Partie n° " + S.seed) +
      '<div class="panel"><div class="card"><p class="lead">' + esc(sty.t) + "</p>" +
      '<div class="bignums"><div class="bn"><small>Ce que ton kiosque vaut</small><b>' + eur(F.endWorth) + '</b><span>caisse + stock + matériel + kiosque − dette. Au départ : ' + eur(S.startWorth) + ".</span></div>" +
      '<div class="bn"><small>Ce qu’il t’a rapporté</small><b>' + sgn(F.profit) + '</b><span>en 15 jours de travail, avant de te payer un salaire.</span></div>' +
      '<div class="bn"><small>Ton taux horaire réel</small><b>' + eur(F.perHour, 2) + '</b><span>pour ~' + F.hours + " h de présence (10 h par jour). Ton étudiant gagnait " + stud + " €/h.</span></div></div>" +
      '<h3 class="h" style="margin-top:6px">Comment ton kiosque a évolué</h3>' + spark() + "</div>" +
      '<div class="card"><span class="eyebrow">La caisse n’est pas le bénéfice</span><dl class="vs"><dt>Caisse</dt><dd>' + eur(S.cash) + "</dd><dt>+ Stock restant (prix d’achat)</dt><dd>" + eur(stock) + "</dd><dt>+ Matériel (70 % du prix payé)</dt><dd>" + eur(eq) + "</dd><dt>+ Le kiosque lui-même (repris 4 000 €)</dt><dd>" + eur(K.START_DEBT) + "</dd><dt>− Dette restante</dt><dd>−" + eur(S.debt) + '</dd><dt style="font-weight:800">= Valeur de ton kiosque</dt><dd style="font-weight:800">' + eur(F.endWorth) + "</dd></dl></div>" +
      '<div class="card"><span class="eyebrow">Où est passé l’argent ?</span><dl class="vs"><dt>Ventes encaissées</dt><dd>' + eur(st.ca) + "</dd><dt>Marchandises achetées</dt><dd>−" + eur(st.achats) + "</dd><dt>Emplacement</dt><dd>−" + eur(st.place) + "</dd><dt>Personnel (étudiant, intérim, heures en plus)</dt><dd>−" + eur(st.personnel) + "</dd><dt>Intérêts et location</dt><dd>−" + eur(st.interets + st.loyer) + "</dd><dt>Autres frais (stands, flyers, amendes…)</dt><dd>−" + eur(st.autres) + "</dd><dt>Matériel acheté</dt><dd>−" + eur(st.invest) + "</dd></dl>" +
      '<div class="note" style="margin-top:12px">Ce que tu n’as pas vu partir : ' + eur(st.waste) + " de marchandise périmée ou bradée, et environ " + eur(st.perdu) + " de ventes manquées (rupture ou file trop longue).</div></div>" +
      '<div class="card"><span class="eyebrow">Ce que ce jeu t’a montré</span><h2 class="h">Trois choses à retenir — et où creuser</h2><div class="lessons">' +
      '<a class="lesson" href="./index.html#/lecon/ent-sec-m6-1"><b>La caisse n’est pas le bénéfice</b><span>Stock, matériel, dette : ce qui entre n’est pas ce qui reste. → Comprends ta compta : 8 règles qu’on confond</span></a>' +
      '<a class="lesson" href="./index.html#/lecon/ent-sec-m6-5"><b>Une dette se rembourse même quand il pleut</b><span>Les échéances tombent, les intérêts aussi. → Emprunter : ce qu’on signe vraiment</span></a>' +
      '<a class="lesson" href="./index.html#/lecon/ent-sec-m6-6"><b>Un coût fixe se paie même les jours creux</b><span>L’étudiant, la location, l’emplacement. → Gérer ses coûts : couper où, ne jamais couper quoi</span></a>' +
      '<a class="lesson" href="./index.html#/lecon/ent-sec-m6-7"><b>Quand ça dérape, il faut un plan</b><span>Le banquier n’aime pas les surprises. → Ça dérape : les 90 jours pour redresser</span></a>' +
      "</div></div>" +
      '<div class="row" style="margin-top:16px"><button class="btn lg" data-act="replay" data-seed="' + S.seed + '">Rejouer la même partie (n° ' + S.seed + ')</button><button class="btn ghost lg" data-act="again">Une autre partie</button><a class="btn ghost lg" href="./index.html#/ressources">Retour à l’Académie</a></div>' +
      '<p class="sub" style="margin-top:10px">Rejouer le même numéro, c’est retrouver exactement la même météo et les mêmes imprévus : idéal pour comparer ses décisions avec celles d’un voisin.</p></div>');
  }

  /* ---------- actions ---------- */
  G.addEventListener("click", function (e) {
    var b = e.target.closest("[data-act]"); if (!b || b.disabled) return;
    var a = b.getAttribute("data-act"), p = b.getAttribute("data-p");
    if (a === "new") { var v = parseInt((document.getElementById("seed") || {}).value, 10); return newGame(v > 0 ? v : 0); }
    if (a === "resume") { S = G._saved; return startDay(); }
    if (a === "again") { return intro(); }
    if (a === "replay") { return newGame(+b.getAttribute("data-seed")); }
    if (a === "ev") { var id = b.getAttribute("data-id"), i = +b.getAttribute("data-i"); var msg = K.applyEvent(S, id, i); return eventDone(msg); }
    if (a === "plan") return plan();
    if (a === "bank") { var m = K.bankLoan(S, b.getAttribute("data-v") === "1"); return eventDone(m); }
    if (a === "quitok") { K.studentQuits(S); return plan(); }
    if (a === "ord") { var o = S.plan.order, d = +b.getAttribute("data-d"), st = K.PR[p].step; o[p] = Math.max(0, (o[p] || 0) + d * st); return plan(true); }
    if (a === "prc") { S.plan.price[p] = +b.getAttribute("data-l"); return plan(true); }
    if (a === "vit") { S.plan.vitrine = S.plan.vitrine === p ? null : p; return plan(true); }
    if (a === "hire") { S.student.hired = true; S.student.works = true; S.student.quit = false; return plan(true); }
    if (a === "fire") { S.student.hired = false; S.student.works = false; S.student.loyal = 2; S.student.wage = K.WAGE_H; return plan(true); }
    if (a === "buy") { K.buy(S, b.getAttribute("data-id")); return plan(true); }
    if (a === "rent") { K.buy(S, "machine", true); return plan(true); }
    if (a === "stoprent") { K.stopRent(S); return plan(true); }
    if (a === "launch") return launch();
    if (a === "abs") { var ch = K.resolveAbsence(S, G._ab, +b.getAttribute("data-i")); return day(); }
    if (a === "after") return after();
    if (a === "resc") { var r = K.rescue(S, b.getAttribute("data-v")); S.journal.push({ day: S.day, txt: r }); return advance(); }
  });
  G.addEventListener("change", function (e) {
    var t = e.target; if (t.getAttribute && t.getAttribute("data-act") === "works") { S.student.works = t.checked; plan(true); }
  });

  intro();
  window.__kq = { get S() { return S; }, K: K };
})();
