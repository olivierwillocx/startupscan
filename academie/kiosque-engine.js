/* Le Kiosque — moteur du jeu (sans DOM, testable sous Node).
   Tout est inventé : chiffres, météo, événements. L’état est sérialisable (reprise de partie). */
(function (g) {
  "use strict";

  var DAYS = 15, START_CASH = 1500, START_DEBT = 4000, PLACE = 50, OWNER_CAP = 70, OWNER_HOURS = 10;
  var WAGE_H = 15, SHIFT_H = 6, OVERDRAFT = 500, RESCUE_AT = -600;
  var PIDS = ["glaces", "cafe", "para", "sand", "souv"];
  var WIDS = ["sun", "grey", "rain", "heat", "cold"];
  var WN = { sun: "Grand soleil", grey: "Ciel gris", rain: "Il pleut", heat: "Canicule", cold: "Coup de froid" };

  var PR = {
    glaces: { nom: "Glaces", cost: 1.2, price: [3.2, 4, 5], step: 5, shelf: 2, base: 16, low: 1.5, high: 0.5, aime: "Aime : la chaleur", peri: "Périssable : 2 jours (6 avec un congélateur)" },
    cafe: { nom: "Café & soupes", cost: 0.8, price: [2.4, 3, 3.8], step: 5, shelf: 3, base: 28, low: 1.35, high: 0.6, aime: "Aime : le froid et la pluie", peri: "Se garde 3 jours" },
    para: { nom: "Parapluies", cost: 5, price: [9, 12, 15], step: 2, shelf: 99, base: 4, low: 1.3, high: 0.7, aime: "Aime : les averses", peri: "Se garde (ne périme pas)" },
    sand: { nom: "Sandwichs", cost: 2, price: [4, 5, 6.2], step: 5, shelf: 1, base: 26, low: 1.3, high: 0.65, aime: "Aime : la semaine, les bureaux", peri: "Périssable : le jour même" },
    souv: { nom: "Cartes & souvenirs", cost: 2.5, price: [4.8, 6, 7.5], step: 2, shelf: 99, base: 9, low: 1.6, high: 0.45, aime: "Aime : touristes, week-ends, beau temps", peri: "Se garde (ne périme pas)" }
  };
  var MACHINE_PRICE = [2.9, 3.6, 4.5];

  var WF = {
    glaces: { sun: 2.2, grey: 0.6, rain: 0.2, heat: 4.0, cold: 0.1 },
    cafe: { sun: 0.7, grey: 1.3, rain: 1.5, heat: 0.3, cold: 2.2 },
    para: { sun: 0.0, grey: 0.5, rain: 6.0, heat: 0.3, cold: 0.8 },
    sand: { sun: 1.1, grey: 1.0, rain: 0.8, heat: 0.9, cold: 0.9 },
    souv: { sun: 1.6, grey: 0.8, rain: 0.4, heat: 1.2, cold: 0.5 }
  };
  var CHAIN = {
    sun: { sun: 0.5, grey: 0.2, rain: 0.1, heat: 0.2, cold: 0 },
    grey: { sun: 0.25, grey: 0.4, rain: 0.25, heat: 0, cold: 0.1 },
    rain: { sun: 0.15, grey: 0.3, rain: 0.4, heat: 0.0, cold: 0.15 },
    heat: { sun: 0.3, grey: 0.1, rain: 0.15, heat: 0.45, cold: 0 },
    cold: { sun: 0.15, grey: 0.35, rain: 0.2, heat: 0, cold: 0.3 }
  };
  var PRIOR = { sun: 0.35, grey: 0.35, rain: 0.2, heat: 0.05, cold: 0.05 };

  var INVEST = {
    tables1: { nom: "Deux tables de terrasse + parasol", prix: 420, img: "tables", txt: "Des clients qui s’assoient consomment plus. Mais par temps de pluie, personne ne s’assoit.", eff: "+10 % sur glaces, café, sandwichs quand il ne pleut pas" },
    tables2: { nom: "Deux tables de plus", prix: 380, img: "tables", txt: "Quatre tables : plus de places… et plus de mètres carrés à rentabiliser.", eff: "+18 % au total (au lieu de +10 %), quand il ne pleut pas", req: "tables1" },
    freezer: { nom: "Un congélateur vitrine", prix: 650, img: "freezer", txt: "Tes glaces tiennent 6 jours au lieu de 2. Tu peux commander gros sans trembler.", eff: "Glaces : 6 jours de conservation, +12 % de demande" },
    machine: { nom: "Machine à café professionnelle", prix: 900, img: "machine", txt: "Un vrai café à 3,60 €. À acheter (900 €) ou à louer (22 €/jour, résiliable).", eff: "Café : +30 % de demande, prix de vente plus haut", rent: 22 },
    sign: { nom: "Enseigne lumineuse", prix: 350, img: "enseigne", txt: "On voit ton kiosque de loin, même quand le ciel est gris.", eff: "+10 % de clients, tous les jours" }
  };

  /* ---------- aléatoire reproductible et sérialisable ---------- */
  function mulberry32(a) {
    return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  }
  function rnd(S, k) {
    var c = S.ctr[k] = (S.ctr[k] || 0) + 1;
    var h = (S.seed * 2654435761) ^ (k.charCodeAt(0) * 7919) ^ Math.imul(c, 40503);
    var r = mulberry32(h >>> 0); r(); return r();
  }
  function srnd(S, k, x) { var f = Math.floor(x); return f + (rnd(S, k) < x - f ? 1 : 0); }
  function r2(x) { return Math.round(x * 100) / 100; }

  /* ---------- météo ---------- */
  function forecast(S, day) {
    var prev = day <= 1 ? null : S.weather[day - 2];
    return prev ? CHAIN[prev] : PRIOR;
  }
  function forecastRounded(S, day) {
    var p = forecast(S, day), out = {}, tot = 0, rem = [];
    WIDS.forEach(function (w) { var v = p[w] * 100 / 5; out[w] = Math.floor(v) * 5; tot += out[w]; rem.push([w, v - Math.floor(v)]); });
    rem.sort(function (a, b) { return b[1] - a[1]; });
    var i = 0; while (tot < 100 && i < rem.length) { out[rem[i][0]] += 5; tot += 5; i++; }
    return out;
  }
  function mostLikely(S, day) {
    var p = forecast(S, day), b = "grey", v = -1;
    WIDS.forEach(function (w) { if (p[w] > v) { v = p[w]; b = w; } });
    return b;
  }

  /* ---------- événements ---------- */
  function addMod(S, from, to, prod, f) { S.mods.push({ from: from, to: to, prod: prod, f: f }); }
  function stockCount(S, p) { return S.stock[p].reduce(function (a, b) { return a + b.n; }, 0); }
  function stockValue(S) { return PIDS.reduce(function (a, p) { return a + stockCount(S, p) * PR[p].cost; }, 0); }
  function removeStock(S, p, n) {
    var left = n, took = 0;
    S.stock[p].sort(function (a, b) { return b.age - a.age; });
    S.stock[p].forEach(function (b) { var t = Math.min(b.n, left); b.n -= t; left -= t; took += t; });
    S.stock[p] = S.stock[p].filter(function (b) { return b.n > 0; });
    return took;
  }
  function addStock(S, p, n) { if (n > 0) S.stock[p].push({ n: n, age: 0 }); }
  function pay(S, x, what) { S.cash = r2(S.cash - x); if (what) S.stats[what] = r2((S.stats[what] || 0) + x); }
  function studentWorking(S) { return S.student.hired && S.student.works; }

  var EVENTS = {
    fournisseur: { img: "front", titre: "Ton fournisseur casse les prix", texte: "« Moins 30 % sur toute ta commande du jour, mais seulement si tu commandes pour au moins 150 € (avant remise). » Il sourit comme un homme qui a trop de stock.", cond: function (S) { return S.day <= 13; },
      choix: [
        { t: "Je saisis l’affaire", s: "−30 % si ta commande du jour dépasse 150 €", run: function (S) { S.flags.discountDay = S.day; return "Remise de 30 % valable aujourd’hui sur une commande d’au moins 150 €."; } },
        { t: "Je commande comme d’habitude", s: "Pas de folie", run: function () { return "Tu laisses passer l’occasion. Tu dormiras tranquille."; } }
      ] },
    festival: { img: "festival", titre: "Un festival s’installe sur la place", texte: "Trois jours de concerts et de foule, juste à côté de ton kiosque. Les organisateurs te proposent un emplacement de stand supplémentaire.", cond: function (S) { return S.day <= 12; },
      choix: [
        { t: "Prendre un stand en plus (80 €)", s: "Café, sandwichs, souvenirs ×1,5 ; glaces ×1,3 pendant 3 jours", run: function (S) { pay(S, 80, "autres"); ["cafe", "sand", "souv"].forEach(function (p) { addMod(S, S.day, S.day + 2, p, 1.5); }); addMod(S, S.day, S.day + 2, "glaces", 1.3); return "Stand payé : 80 €. La foule arrive."; } },
        { t: "Rester tel quel", s: "Tout vendu ×1,2 pendant 3 jours", run: function (S) { addMod(S, S.day, S.day + 2, "all", 1.2); return "Le festival t’apporte un peu de passage, gratuitement."; } },
        { t: "Ouvrir plus tard : l’étudiant fait 2 h de plus (30 €)", s: "Tout ×1,3 et plus de monde servi, 3 jours", show: function (S) { return S.student.hired; }, run: function (S) { addMod(S, S.day, S.day + 2, "all", 1.3); S.capBonus.push({ from: S.day, to: S.day + 2, n: 15 }); pay(S, 30, "personnel"); return "2 h supplémentaires : 30 € de plus au personnel, mais une file qui ne dort jamais."; } }
      ] },
    travaux: { img: "travaux", titre: "Travaux devant le kiosque", texte: "Une pelleteuse bloque la moitié du trottoir pendant trois jours. Les passants contournent ton kiosque en râlant.", cond: function (S) { return S.day <= 12; },
      choix: [
        { t: "Ouvrir quand même", s: "Tout ×0,65 pendant 3 jours", run: function (S) { addMod(S, S.day, S.day + 2, "all", 0.65); return "Trois jours de trottoir éventré. Courage."; } },
        { t: "Flyers & panneau « Kiosque ouvert » (45 €)", s: "Tout ×0,85 pendant 3 jours", run: function (S) { pay(S, 45, "autres"); addMod(S, S.day, S.day + 2, "all", 0.85); return "Les flyers limitent les dégâts : −45 € mais des clients qui te trouvent."; } }
      ] },
    influence: { img: "student", titre: "Une influenceuse bruxelloise t’écrit", texte: "« Salut ! 20 glaces gratuites pour moi et ma team, et je fais une vidéo sur ton kiosque. » (Tu les paies : 24 € de marchandise.) Elle a 48 000 abonnés. Ou 480. Difficile à dire.", cond: function (S) { return S.day <= 12 && S.cash >= 24; },
      choix: [
        { t: "Accepter (24 €)", s: "Peut-être un coup de projecteur, peut-être rien", run: function (S) { pay(S, 24, "autres"); if (rnd(S, "e") < 0.55) { addMod(S, S.day, S.day + 2, "all", 1.35); S.rep = Math.min(100, S.rep + 6); return "La vidéo cartonne : file d’attente pendant 3 jours (+6 de réputation)."; } return "La vidéo a fait 212 vues, dont ta mère. 24 € de partis en glace."; } },
        { t: "Refuser poliment", s: "Tu gardes tes glaces", run: function () { return "Elle te laisse en « vu ». La vie continue."; } }
      ] },
    concurrent: { img: "camion", titre: "Une camionnette de glaces s’installe", texte: "Cinquante mètres plus loin, une camionnette vend des glaces avec une sono qui joue de la musique. Elle vient aussi pour tes clients.", cond: function (S) { return S.day <= 11; },
      choix: [
        { t: "Ignorer", s: "Glaces ×0,7 pendant 4 jours", run: function (S) { addMod(S, S.day, S.day + 3, "glaces", 0.7); return "Tu laisses la camionnette tourner. Tes glaces en pâtissent."; } },
        { t: "Carte de fidélité (50 €)", s: "Glaces ×0,85 au lieu de ×0,7, réputation +3", run: function (S) { pay(S, 50, "autres"); addMod(S, S.day, S.day + 3, "glaces", 0.85); S.rep = Math.min(100, S.rep + 3); return "10 glaces achetées, la 11e offerte : tes habitués restent."; } }
      ] },
    salaire: { img: "student", titre: "Ton étudiant veut une augmentation", texte: "« Vu la file d’attente, je pensais à 17 € de l’heure. Sinon, le café d’en face cherche quelqu’un. » Il a de la répartie, c’est utile.", cond: function (S) { return S.student.hired && S.student.wage === 15 && S.day >= 3 && S.day <= 12; },
      choix: [
        { t: "Accepter 17 €/h", s: "Plus cher, mais il reste motivé", run: function (S) { S.student.wage = 17; S.student.loyal = Math.min(4, S.student.loyal + 1); return "Son salaire passe à 17 €/h. Il sourit, tu fais le calcul."; } },
        { t: "Proposer 16 € + un sandwich par jour", s: "Compromis", run: function (S) { S.student.wage = 16; return "Accord à 16 €/h et un sandwich offert."; } },
        { t: "Refuser", s: "Il risque de partir", run: function (S) { S.student.loyal = Math.max(0, S.student.loyal - 1); return "Il hausse les épaules. « OK. » Il n’a pas l’air convaincu."; } }
      ] },
    coupure: { img: "freezer", titre: "Coupure de courant dans le quartier", texte: "Ce matin, plus de courant pendant des heures. Les glaces fondent doucement, mais elles fondent.", cond: function (S) { return S.day >= 2 && stockCount(S, "glaces") > 0; }, auto: true,
      choix: [
        { t: "Voir les dégâts", s: "", run: function (S) {
          if (S.equip.freezer) return "Ton congélateur vitrine garde tout au froid. Ouf : aucune perte.";
          var n = Math.floor(stockCount(S, "glaces") * 0.6); removeStock(S, "glaces", n); S.stats.waste = r2((S.stats.waste || 0) + n * PR.glaces.cost);
          return "Tu perds " + n + " glaces (" + (n * PR.glaces.cost).toFixed(2).replace(".", ",") + " € de marchandise). Un congélateur t’aurait évité ça."; } }
      ] },
    controle: { img: "inspecteur", titre: "Contrôle d’hygiène", texte: "Un inspecteur ouvre ton frigo et lit son thermomètre avec une gravité de notaire. (Situation inventée pour le jeu.)", cond: function (S) { return S.day >= 3; }, auto: true,
      choix: [
        { t: "Le laisser faire", s: "", run: function (S) {
          if (S.equip.freezer) { S.rep = Math.min(100, S.rep + 2); return "Congélateur aux normes : il note « irréprochable » (+2 réputation)."; }
          pay(S, 90, "autres"); return "Température limite : avertissement et 90 € d’amende, payable tout de suite."; } }
      ] },
    avis: { img: "front", titre: "Un avis en ligne tombe", texte: "Quelqu’un a laissé un avis sur ton kiosque. Tu l’ouvres avec le même courage qu’un bulletin de notes.", cond: function (S) { return S.day >= 3; }, auto: true,
      choix: [
        { t: "Lire l’avis", s: "", run: function (S) {
          if (S.rep >= 55) { S.rep = Math.min(100, S.rep + 4); addMod(S, S.day, S.day + 1, "all", 1.1); return "★★★★★ « Meilleur kiosque du quartier, service nickel. » (+4 de réputation, +10 % pendant 2 jours)"; }
          S.rep = Math.max(0, S.rep - 3); return "★★ « File interminable, rupture de stock, vendeur débordé. » Aïe (−3 de réputation)."; } }
      ] },
    voisin: { img: "front", titre: "Le café d’en face ferme trois jours", texte: "Il refait son sol. Ses habitués regardent autour d’eux, ils te voient. Tu te sens un peu coupable. Un tout petit peu.", cond: function (S) { return S.day <= 12; }, auto: true,
      choix: [
        { t: "Accueillir les orphelins", s: "Café ×1,4, sandwichs ×1,25 pendant 3 jours", run: function (S) { addMod(S, S.day, S.day + 2, "cafe", 1.4); addMod(S, S.day, S.day + 2, "sand", 1.25); return "Trois jours de clients supplémentaires. Pense à avoir assez de stock."; } }
      ] },
    redevance: { img: "front", titre: "La commune augmente la redevance", texte: "Courrier recommandé : l’emplacement passe de 50 à 60 € par jour. Tu es libre de contester, mais un recours coûte du temps et de l’argent.", cond: function (S) { return S.day >= 2 && S.day <= 12 && !S.flags.surcharge; },
      choix: [
        { t: "Payer sans discuter", s: "+10 € par jour jusqu’à la fin", run: function (S) { S.flags.surcharge = 10; return "L’emplacement coûte désormais 60 € par jour."; } },
        { t: "Contester (40 € de frais)", s: "Une chance sur deux de tout annuler", run: function (S) { pay(S, 40, "autres"); if (rnd(S, "e") < 0.5) return "Recours accepté : la hausse est annulée. Tu as perdu 40 € de frais mais gagné 10 € par jour."; S.flags.surcharge = 10; return "Recours rejeté : 40 € de frais, et l’emplacement passe quand même à 60 €."; } }
      ] },
    ecole: { img: "classe", titre: "Une classe de 30 enfants en sortie", texte: "Une institutrice épuisée et trente élèves surexcités débarquent à 15 h devant ton kiosque. Ils ont vu les glaces.", cond: function (S) { var w = S.weather[S.day - 1]; return S.day <= 14 && w !== "rain" && w !== "cold" && !((S.day - 1) % 7 >= 5); },
      choix: [
        { t: "Prix groupe à 3 €", s: "18 glaces en plus aujourd’hui (si tu en as)", run: function (S) { S.flags.extra = { p: "glaces", n: 18, price: 3 }; return "Prix groupe : 18 glaces supplémentaires à 3 € si ton stock suit."; } },
        { t: "Prix normal", s: "9 glaces en plus aujourd’hui", run: function (S) { S.flags.extra = { p: "glaces", n: 9, price: 0 }; return "Les enfants râlent un peu mais achètent : 9 glaces au prix de ta vitrine."; } },
        { t: "Dire que c’est fermé", s: "Tu protèges ta santé mentale", run: function () { return "Tu baisses le store. Les enfants repartent déçus. L’institutrice, soulagée."; } }
      ] },
    car: { img: "bus", titre: "Un car de touristes s’arrête dix minutes", texte: "Photo devant les maisons, tout le monde sort. Ils cherchent des cartes postales, un café, un souvenir.", cond: function (S) { return S.day <= 14; }, auto: true,
      choix: [
        { t: "En voiture, pour dix minutes !", s: "Souvenirs ×3, café ×1,5 aujourd’hui", run: function (S) { addMod(S, S.day, S.day, "souv", 3); addMod(S, S.day, S.day, "cafe", 1.5); return "Aujourd’hui : souvenirs et café très demandés (si tu en as !)."; } }
      ] },
    greve: { img: "grey", titre: "Grève des transports", texte: "Ni train, ni métro, ni touristes. Les bureaux du quartier tournent au ralenti.", cond: function (S) { return (S.day - 1) % 7 < 5 && S.day <= 14; }, auto: true,
      choix: [
        { t: "Faire avec", s: "Sandwichs ×0,6, souvenirs ×0,5, le reste ×0,9 aujourd’hui", run: function (S) { addMod(S, S.day, S.day, "sand", 0.6); addMod(S, S.day, S.day, "souv", 0.5); addMod(S, S.day, S.day, "cafe", 0.9); addMod(S, S.day, S.day, "glaces", 0.9); return "Une journée au ralenti : ne commande pas trop de sandwichs."; } }
      ] },
    grossiste: { img: "rain", titre: "Le grossiste liquide ses parapluies", texte: "« Parapluies à 4 € au lieu de 5 €, par lot de 20 (80 €). Je les écoule avant l’été. » Il y a quand même des nuages à l’horizon, non ?", cond: function (S) { return S.day <= 12 && S.cash >= 120; },
      choix: [
        { t: "Prendre un lot de 20 (80 €)", s: "Stock de parapluies prêt pour les averses", run: function (S) { pay(S, 80, "achats"); addStock(S, "para", 20); return "20 parapluies en plus dans l’arrière-boutique, à 4 € pièce."; } },
        { t: "Passer", s: "Tu gardes ton cash", run: function () { return "Tu laisses l’offre passer. Les nuages décideront."; } }
      ] }
  };
  var EVENT_IDS = Object.keys(EVENTS);

  /* ---------- création de la partie ---------- */
  function newGame(seed) {
    seed = (seed >>> 0) || 1;
    var S = {
      seed: seed, ctr: {}, day: 1, cash: START_CASH, debt: START_DEBT, rep: 50, repay: 400,
      stock: { glaces: [], cafe: [], para: [], sand: [], souv: [] },
      equip: { tables: 0, freezer: 0, machine: 0, sign: 0 }, paidEquip: 0,
      student: { hired: false, loyal: 2, wage: WAGE_H, works: false, quit: false, absences: 0, daysWorked: 0 },
      plan: { order: { glaces: 15, cafe: 25, para: 4, sand: 20, souv: 6 }, price: { glaces: 1, cafe: 1, para: 1, sand: 1, souv: 1 }, vitrine: "glaces" },
      mods: [], capBonus: [], flags: { discountDay: 0, surcharge: 0, extra: null, repl: false },
      weather: [], evSlots: {}, evOrder: {}, evDone: [], hist: [], journal: [],
      stats: { achats: 0, personnel: 0, autres: 0, place: 0, interets: 0, waste: 0, invest: 0, vendu: 0, ca: 0, loyer: 0, perdu: 0, promo: 0, premium: 0, studentDays: 0, maxOrder: 0, orderSum: 0, discount: 0, stockouts: 0, bets: 0, overdraft: 0, rescue: 0, lostCap: 0, lostStock: 0 }
    };
    var prev = null;
    for (var d = 1; d <= DAYS; d++) {
      var pr = prev ? CHAIN[prev] : PRIOR, x = rnd(S, "w"), acc = 0, pick = "grey";
      for (var i = 0; i < WIDS.length; i++) { acc += pr[WIDS[i]]; if (x < acc) { pick = WIDS[i]; break; } }
      S.weather.push(pick); prev = pick;
    }
    for (var e = 2; e <= DAYS - 1; e++) {
      if (e === 8) continue;
      S.evSlots[e] = rnd(S, "e") < 0.62;
      var ids = EVENT_IDS.slice(), j;
      for (j = ids.length - 1; j > 0; j--) { var k = Math.floor(rnd(S, "e") * (j + 1)); var t = ids[j]; ids[j] = ids[k]; ids[k] = t; }
      S.evOrder[e] = ids;
    }
    addStock(S, "glaces", 30); addStock(S, "cafe", 80); addStock(S, "para", 12); addStock(S, "sand", 20); addStock(S, "souv", 40);
    S.startWorth = worth(S);
    return S;
  }

  function equipValue(S) { return Math.round(S.paidEquip * 0.7); }
  function worth(S) { return r2(S.cash + stockValue(S) + equipValue(S) + START_DEBT - S.debt); } /* + le kiosque lui-même, repris 4 000 € */

  /* ---------- tarifs ---------- */
  function priceOf(S, p, lvl) { var t = (p === "cafe" && S.equip.machine) ? MACHINE_PRICE : PR[p].price; return t[lvl]; }
  function shelf(S, p) { return (p === "glaces" && S.equip.freezer) ? 6 : PR[p].shelf; }
  function orderCostRaw(S, order) { return r2(PIDS.reduce(function (a, p) { return a + (order[p] || 0) * PR[p].cost; }, 0)); }
  function orderCost(S, order) {
    var raw = orderCostRaw(S, order);
    var disc = S.flags.discountDay === S.day && raw >= 150;
    return { raw: raw, disc: disc, total: disc ? r2(raw * 0.7) : raw };
  }
  function capacity(S) {
    var c = OWNER_CAP;
    if (studentWorking(S) && !S.flags.absent) c += S.student.loyal >= 3 ? 60 : 50;
    if (S.flags.repl) c += 50;
    S.capBonus.forEach(function (b) { if (S.day >= b.from && S.day <= b.to && (studentWorking(S) || S.flags.repl)) c += b.n; });
    return c;
  }
  function studentCost(S) { return r2(S.student.wage * SHIFT_H); }

  /* ---------- événements du jour ---------- */
  function eventForDay(S) {
    var d = S.day;
    if (d === 8 && !S.flags.bankDone) return { id: "banque", bank: true };
    if (S.student.hired && S.student.loyal <= 0 && !S.student.quit) return { id: "demission", quit: true };
    if (!S.evSlots[d]) return null;
    var ids = S.evOrder[d] || [];
    for (var i = 0; i < ids.length; i++) {
      var id = ids[i];
      if (S.evDone.indexOf(id) >= 0) continue;
      if (EVENTS[id].cond(S)) return { id: id };
    }
    return null;
  }
  function applyEvent(S, id, choiceIdx) {
    var ev = EVENTS[id], res = ev.choix[choiceIdx].run(S);
    S.evDone.push(id); S.journal.push({ day: S.day, txt: ev.titre + " — " + res });
    return res;
  }
  function bankLoan(S, accept) {
    S.flags.bankDone = true;
    if (accept) { S.cash = r2(S.cash + 1200); S.debt += 1200; S.repay += 120; S.journal.push({ day: S.day, txt: "Banquier — tu empruntes 1 200 € (échéance +120 € tous les 5 jours)." }); return "Prêt accordé : +1 200 € en caisse, et 120 € de plus à rembourser à chaque échéance."; }
    S.journal.push({ day: S.day, txt: "Banquier — tu refuses le prêt." }); return "Tu refuses. Le banquier note quelque chose sur son carnet. Probablement « prudent ».";
  }
  function studentQuits(S) { S.student.hired = false; S.student.works = false; S.student.quit = true; S.student.loyal = 2; S.student.wage = WAGE_H; S.journal.push({ day: S.day, txt: "Ton étudiant démissionne." }); }

  /* ---------- absence de l’étudiant ---------- */
  var ABS = [
    { r: "Il a un examen de dernière minute (« je te l’avais dit ! », ce qui est faux).", j: true },
    { r: "Il est malade, certificat médical à l’appui.", j: true },
    { r: "Aucune nouvelle. Son téléphone sonne dans le vide.", j: false },
    { r: "Crevaison sur le vélo : il arrive « bientôt ». Il n’arrivera pas.", j: false },
    { r: "La soirée d’hier a duré plus longtemps que prévu.", j: false }
  ];
  function rollAbsence(S) {
    if (!studentWorking(S)) return null;
    var w = S.weather[S.day - 1], dow = (S.day - 1) % 7;
    var p = 0.1 + (w === "rain" ? 0.05 : 0) + (S.student.loyal < 2 ? 0.08 : 0) + (dow >= 5 ? 0.05 : 0) - (S.student.loyal >= 3 ? 0.05 : 0);
    var x = rnd(S, "s"), i = Math.floor(rnd(S, "s") * ABS.length);
    if (x >= p) return null;
    return { reason: ABS[i].r, justified: ABS[i].j, cost: studentCost(S), idx: i };
  }
  function absenceChoices(S, a) {
    var c = a.cost;
    return [
      { t: "Ne pas le payer", s: "Il n’a pas travaillé : 0 €. Mais il s’en souviendra" + (a.justified ? " (surtout qu’il a une bonne raison)" : ""), pay: 0, loyal: a.justified ? -2 : -1, repl: false },
      { t: "Le payer quand même (" + c + " €)", s: "Un geste. Il s’en souviendra aussi, dans l’autre sens", pay: c, loyal: 1, repl: false },
      { t: "Moitié-moitié (" + (c / 2) + " €)", s: "Le compromis du patron", pay: c / 2, loyal: 0, repl: false },
      { t: "Appeler une agence d’intérim (120 €)", s: "Un remplaçant arrive en 30 minutes ; l’étudiant n’est pas payé", pay: 120, loyal: a.justified ? 0 : -1, repl: true }
    ];
  }
  function resolveAbsence(S, a, idx) {
    var ch = absenceChoices(S, a)[idx];
    S.flags.absent = true; S.flags.absentPay = ch.pay; S.flags.repl = ch.repl;
    S.student.loyal = Math.max(0, Math.min(4, S.student.loyal + ch.loyal)); S.student.absences++;
    S.journal.push({ day: S.day, txt: "Étudiant absent — " + ch.t.toLowerCase() + "." });
    return ch;
  }

  /* ---------- investissements ---------- */
  function canBuy(S, id) {
    var it = INVEST[id];
    if (id === "tables1") return S.equip.tables === 0;
    if (id === "tables2") return S.equip.tables === 1;
    if (id === "freezer") return !S.equip.freezer;
    if (id === "machine") return !S.equip.machine;
    if (id === "sign") return !S.equip.sign;
    return false;
  }
  function buy(S, id, rent) {
    var it = INVEST[id];
    if (!canBuy(S, id)) return false;
    if (rent) { S.equip.machine = 2; S.journal.push({ day: S.day, txt: "Machine à café louée (22 €/jour)." }); return true; }
    if (S.cash - it.prix < -OVERDRAFT) return false;
    pay(S, it.prix); S.stats.invest = r2(S.stats.invest + it.prix); S.paidEquip += it.prix;
    if (id === "tables1") S.equip.tables = 1; if (id === "tables2") S.equip.tables = 2;
    if (id === "freezer") S.equip.freezer = 1; if (id === "machine") S.equip.machine = 1; if (id === "sign") S.equip.sign = 1;
    S.journal.push({ day: S.day, txt: it.nom + " achetée (" + it.prix + " €)." });
    return true;
  }
  function stopRent(S) { if (S.equip.machine === 2) { S.equip.machine = 0; return true; } return false; }

  /* ---------- le jour qui se joue ---------- */
  function modFactor(S, p) {
    var f = 1, d = S.day;
    S.mods.forEach(function (m) { if (d >= m.from && d <= m.to && (m.prod === "all" || m.prod === p)) f *= m.f; });
    return f;
  }
  function demandFactors(S, p) {
    var w = S.weather[S.day - 1], dow = (S.day - 1) % 7, we = dow >= 5, f = PR[p].base * WF[p][w];
    if (p === "sand") f *= we ? 0.45 : 1;
    if (p === "souv") f *= we ? 2.0 : 0.8;
    if (p === "cafe") f *= we ? 0.8 : 1;
    if (p === "glaces") f *= we ? 1.25 : 1;
    var lvl = S.plan.price[p], pr = PR[p];
    var pf = lvl === 0 ? pr.low : lvl === 2 ? ((p === "para" && w === "rain") ? 0.9 : pr.high) : 1;
    f *= pf;
    f *= S.plan.vitrine === p ? 1.25 : 0.97;
    f *= 0.7 + S.rep / 100 * 0.6;
    if (S.equip.sign) f *= 1.1;
    var dry = (w === "sun" || w === "grey" || w === "heat");
    if (dry && (p === "glaces" || p === "cafe" || p === "sand")) f *= 1 + [0, 0.1, 0.18][S.equip.tables];
    if (p === "glaces" && S.equip.freezer) f *= 1.12;
    if (p === "cafe" && S.equip.machine) f *= 1.3;
    f *= modFactor(S, p);
    return f;
  }

  function expireStock(S) {
    var waste = [];
    PIDS.forEach(function (p) {
      var sh = shelf(S, p), lost = 0;
      S.stock[p].forEach(function (b) { b.age++; if (b.age >= sh) { lost += b.n; b.n = 0; } });
      S.stock[p] = S.stock[p].filter(function (b) { return b.n > 0; });
      if (lost) { waste.push({ p: p, n: lost, val: r2(lost * PR[p].cost) }); S.stats.waste = r2(S.stats.waste + lost * PR[p].cost); }
    });
    return waste;
  }

  function playDay(S) {
    var day = S.day, w = S.weather[day - 1], res = { day: day, weather: w, rows: [], notes: [] };
    var cashStart = S.cash;
    // achats
    var oc = orderCost(S, S.plan.order);
    res.order = oc;
    pay(S, oc.total, "achats");
    if (oc.disc) S.stats.discount = r2(S.stats.discount + oc.raw - oc.total);
    PIDS.forEach(function (p) { addStock(S, p, S.plan.order[p] || 0); });
    if ((S.plan.order.glaces || 0) >= 45 || (S.plan.order.para || 0) >= 14 || (S.plan.order.cafe || 0) >= 55 || (S.plan.order.sand || 0) >= 40) S.stats.bets++;
    S.stats.maxOrder = Math.max(S.stats.maxOrder, oc.total); S.stats.orderSum += oc.total;

    // demande
    var pot = 0, tmp = [];
    PIDS.forEach(function (p) {
      var noise = 0.85 + rnd(S, "n") * 0.3;
      var wanted = srnd(S, "n", demandFactors(S, p) * noise);
      var avail = stockCount(S, p), reg = Math.min(avail, wanted);
      var extra = 0, extraPrice = 0;
      if (S.flags.extra && S.flags.extra.p === p) { extra = Math.min(S.flags.extra.n, avail - reg); extraPrice = S.flags.extra.price || priceOf(S, p, S.plan.price[p]); }
      tmp.push({ p: p, price: priceOf(S, p, S.plan.price[p]), wanted: wanted + (S.flags.extra && S.flags.extra.p === p ? S.flags.extra.n : 0), pot: reg + extra, reg: reg, extra: extra, extraPrice: extraPrice, avail: avail });
      pot += reg + extra;
    });
    var cap = capacity(S), scale = pot > cap ? cap / pot : 1;
    res.cap = cap; res.pot = pot; res.capHit = pot > cap;
    var rev = 0, soldTot = 0, wantedTot = 0, lostRevenue = 0, soldBy = {};
    tmp.forEach(function (t) {
      var sold = Math.round(t.pot * scale);
      var regSold = Math.min(sold, t.reg), exSold = sold - regSold;
      var income = regSold * t.price + exSold * t.extraPrice;
      removeStock(S, t.p, sold);
      var lostStock = t.wanted - t.pot, lostCap = t.pot - sold;
      rev += income; soldTot += sold; wantedTot += t.wanted; soldBy[t.p] = sold;
      lostRevenue += (lostStock + lostCap) * t.price;
      if (lostStock > 0 && t.avail === 0 || (lostStock > 2 && t.avail < t.wanted)) S.stats.stockouts++;
      res.rows.push({ p: t.p, price: t.price, wanted: t.wanted, sold: sold, lostStock: Math.max(0, lostStock), lostCap: Math.max(0, lostCap), income: r2(income), left: stockCount(S, t.p), avail: t.avail });
    });
    res.rev = r2(rev); res.sold = soldTot; res.wanted = wantedTot; res.lostRevenue = r2(lostRevenue);
    S.cash = r2(S.cash + rev); S.stats.ca = r2(S.stats.ca + rev); S.stats.vendu += soldTot;
    S.stats.lostCap += res.rows.reduce(function (a, r) { return a + r.lostCap; }, 0);
    S.stats.lostStock += res.rows.reduce(function (a, r) { return a + r.lostStock; }, 0);
    S.stats.perdu = r2(S.stats.perdu + lostRevenue);

    // réputation
    var lostShare = wantedTot > 0 ? (wantedTot - soldTot) / wantedTot : 0, rd = 0;
    if (lostShare > 0.25) rd = -3; else if (lostShare > 0.1) rd = -1; else rd = 1;
    var nHigh = PIDS.filter(function (p) { return S.plan.price[p] === 2; }).length, nLow = PIDS.filter(function (p) { return S.plan.price[p] === 0; }).length;
    if (nHigh >= 3) rd -= 2; if (nLow >= 3) rd += 1;
    if (studentWorking(S) && !S.flags.absent && lostShare <= 0.25) rd += 1;
    S.stats.premium += nHigh; S.stats.promo += nLow;
    var repBefore = S.rep; S.rep = Math.max(0, Math.min(100, S.rep + rd)); res.repDelta = S.rep - repBefore;

    // expiration
    res.waste = expireStock(S);
    res.wasteVal = r2(res.waste.reduce(function (a, x) { return a + x.val; }, 0));

    // charges
    var costs = [];
    var place = PLACE + (S.flags.surcharge || 0); pay(S, place, "place"); costs.push(["Emplacement", place]);
    var wage = 0;
    if (studentWorking(S)) {
      wage = S.flags.absent ? S.flags.absentPay : studentCost(S);
      if (!S.flags.absent) S.student.daysWorked++;
      S.stats.studentDays++;
    }
    if (S.flags.repl && S.flags.absent) { /* le coût de l’agence est déjà dans absentPay */ }
    if (wage > 0) { pay(S, wage, "personnel"); costs.push([S.flags.absent ? (S.flags.repl ? "Agence d’intérim" : "Étudiant (absent)") : "Étudiant (" + SHIFT_H + " h × " + S.student.wage + " €)", wage]); }
    if (S.equip.machine === 2) { pay(S, 22, "loyer"); costs.push(["Location machine à café", 22]); }
    if (S.cash < 0) { var it = r2(-S.cash * 0.01); pay(S, it, "interets"); costs.push(["Intérêts de découvert", it]); S.stats.overdraft++; }
    if (day % 5 === 0) {
      var intr = r2(S.debt * 0.015), cap2 = Math.min(S.repay, S.debt);
      pay(S, intr, "interets"); S.cash = r2(S.cash - cap2); S.debt = r2(S.debt - cap2);
      costs.push(["Échéance de la banque : intérêts", intr]); costs.push(["Échéance de la banque : capital", cap2]); res.echeance = true;
    }
    res.costs = costs; res.costTotal = r2(costs.reduce(function (a, c) { return a + c[1]; }, 0));
    res.cashStart = cashStart; res.cashEnd = S.cash; res.stockEnd = r2(stockValue(S));
    res.worth = worth(S);
    S.hist.push({ day: day, cash: S.cash, worth: res.worth, rep: S.rep });
    res.quips = quips(S, res);
    res.rescue = S.cash < RESCUE_AT;
    // nettoyage du jour
    S.flags.extra = null; S.flags.absent = false; S.flags.absentPay = 0; S.flags.repl = false;
    return res;
  }

  function rescue(S, opt) {
    S.stats.rescue++;
    if (opt === "loan") { S.cash = r2(S.cash + 800); S.debt += 800; S.repay += 80; return "Rallonge de 800 € : ta caisse respire, ta dette grimpe, et l’échéance suivante augmente de 80 €."; }
    var v = 0; PIDS.forEach(function (p) { var n = stockCount(S, p); v += n * PR[p].cost * 0.5; S.stock[p] = []; });
    S.cash = r2(S.cash + v); S.stats.waste = r2(S.stats.waste + v);
    return "Tu liquides ton stock à moitié prix : +" + Math.round(v) + " € en caisse, et des étagères vides demain.";
  }

  function nextDay(S) { S.day++; S.journal = S.journal.filter(function (j) { return j.day >= S.day - 1; }); S.student.quit = S.student.quit && !S.student.hired; return S.day <= DAYS; }

  /* ---------- répliques de clients ---------- */
  function quips(S, res) {
    var q = [], w = res.weather, byP = {}; res.rows.forEach(function (r) { byP[r.p] = r; });
    var heatout = byP.glaces && byP.glaces.lostStock > 3 && (w === "heat" || w === "sun");
    if (w === "rain" && byP.para.lostStock > 0 && byP.para.left === 0) q.push([9, "« Il pleut et vous n’avez plus de parapluies ?! »", "Une cliente, trempée jusqu’aux os"]);
    if (w === "rain" && byP.para.avail === 0) q.push([10, "« Il pleut et vous n’avez pas de parapluies ?! »", "Un monsieur qui rentre chez lui à la nage"]);
    if (heatout) q.push([9, "« Plus de glaces ? Par cette chaleur ?! »", "Un enfant, au bord des larmes"]);
    if (w === "heat" && byP.glaces.sold > 25) q.push([6, "« Vos glaces sont la seule raison pour laquelle je ne fonds pas. »", "Un touriste anglais"]);
    if (res.capHit) q.push([8, "« Dix minutes d’attente pour un café ? Je vais voir ailleurs. »", "Une cliente pressée, déjà de dos"]);
    if (res.wasteVal > 15) q.push([7, "Tu jettes " + res.wasteVal.toFixed(2).replace(".", ",") + " € de marchandise périmée. Ça ne fait pas de bruit, mais ça se paie.", "La poubelle de l’arrière-boutique"]);
    if (S.plan.price.glaces === 2 && w !== "heat" && byP.glaces.sold < byP.glaces.wanted * 0.8 && byP.glaces.lostStock === 0) q.push([5, "« Cinq euros la boule ?! Je vais prendre une pomme. »", "Un client en survêtement"]);
    if (S.plan.price.sand === 0 && byP.sand.sold >= 18) q.push([4, "« Un sandwich à 4 €, je reviens demain avec mes collègues ! »", "Un employé de bureau"]);
    if (w === "cold" && byP.cafe.sold > 30) q.push([6, "« Une soupe bien chaude par ce froid : vous êtes mon héros. »", "Une dame avec trois écharpes"]);
    if (w === "grey") q.push([2, "« Il ne fait ni beau ni mauvais : c’est le temps idéal pour ne rien acheter. »", "Un habitué, philosophe"]);
    if (res.sold > 70) q.push([5, "« Quelle ambiance ! Vous avez de la chance d’avoir ce monde. »", "Le voisin du dessus"]);
    if (res.rev < 120) q.push([5, "« Il n’y avait personne aujourd’hui… »", "Toi, en comptant la caisse"]);
    if (S.student.hired && S.student.works && !S.flags.absent && S.student.loyal >= 3) q.push([3, "« Ton étudiant est vraiment sympa, on reviendra. »", "Une cliente fidèle"]);
    q.sort(function (a, b) { return b[0] - a[0]; });
    return q.slice(0, 3).map(function (x) { return { t: x[1], who: x[2] }; });
  }

  /* ---------- fin de partie ---------- */
  function finale(S) {
    var st = S.stats, endWorth = worth(S), profit = r2(endWorth - S.startWorth), hours = DAYS * OWNER_HOURS;
    var avgOrder = st.orderSum / DAYS;
    var sc = {
      prudent: (st.maxOrder < 200 ? 2 : 0) + (st.waste < 130 ? 2 : 0) + (st.invest < 400 ? 1 : 0) + (st.overdraft === 0 ? 1 : 0) + (st.bets === 0 ? 1 : 0),
      joueur: (st.bets >= 4 ? 3 : st.bets >= 2 ? 1 : 0) + (st.maxOrder >= 240 ? 2 : 0) + (st.waste >= 200 ? 1 : 0) + (st.overdraft > 0 ? 1 : 0),
      fidele: (S.rep >= 70 ? 3 : S.rep >= 60 ? 1 : 0) + (st.promo >= 15 ? 2 : 0) + (st.studentDays >= 8 ? 2 : 0),
      batisseur: (st.invest >= 1000 ? 4 : st.invest >= 600 ? 2 : 0) + (S.equip.machine ? 1 : 0) + (S.equip.freezer ? 1 : 0) + (S.equip.tables ? 1 : 0)
    };
    var best = "prudent", v = -1; ["prudent", "joueur", "fidele", "batisseur"].forEach(function (k) { if (sc[k] > v) { v = sc[k]; best = k; } });
    return { endWorth: endWorth, profit: profit, hours: hours, perHour: r2(profit / hours), style: best, scores: sc, avgOrder: avgOrder };
  }

  var KQ = {
    DAYS: DAYS, PIDS: PIDS, WIDS: WIDS, WN: WN, PR: PR, INVEST: INVEST, EVENTS: EVENTS, ABS: ABS, START_CASH: START_CASH, START_DEBT: START_DEBT,
    OWNER_CAP: OWNER_CAP, OWNER_HOURS: OWNER_HOURS, WAGE_H: WAGE_H, SHIFT_H: SHIFT_H, OVERDRAFT: OVERDRAFT, RESCUE_AT: RESCUE_AT, PLACE: PLACE,
    newGame: newGame, forecast: forecast, forecastRounded: forecastRounded, mostLikely: mostLikely, worth: worth, equipValue: equipValue, stockValue: stockValue, stockCount: stockCount,
    priceOf: priceOf, shelf: shelf, orderCost: orderCost, orderCostRaw: orderCostRaw, capacity: capacity, studentCost: studentCost,
    eventForDay: eventForDay, applyEvent: applyEvent, bankLoan: bankLoan, studentQuits: studentQuits,
    rollAbsence: rollAbsence, absenceChoices: absenceChoices, resolveAbsence: resolveAbsence,
    canBuy: canBuy, buy: buy, stopRent: stopRent, playDay: playDay, rescue: rescue, nextDay: nextDay, finale: finale, studentWorking: studentWorking
  };
  if (typeof module !== "undefined" && module.exports) module.exports = KQ; else g.KQ = KQ;
})(typeof window !== "undefined" ? window : this);
