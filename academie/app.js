/* Académie StartupScan — EPFC
   Application une page (routes en #/…), suivi partagé avec le cours e-commerce (même matricule + PIN). */
(function () {
"use strict";

/* ============ Configuration ============ */
var API = window.ACAD_API || "https://ecomlabo.be/api";
var ECOM_URL = "https://ecomlabo.be/";
var COURSE = "entr";
var PASS = 66;               // 2 bonnes réponses sur 3 = section acquise
var IMG = "academie/img/";
var A = window.ACAD || { modules: [], voies: [], exams: {}, ressources: [] };

var VOIE_LBL = { digital: "Créer ta plateforme digitale", commerce: "Ouvrir ton commerce", activite: "Lancer ton activité", reprise: "Reprendre une entreprise" };
var STATUTS = [
  ["etudiant", "Étudiant-indépendant", "Je teste pendant mes études"],
  ["complementaire", "Indépendant complémentaire", "J’ai un emploi à côté"],
  ["principal", "Indépendant à titre principal", "Ce sera mon activité principale"],
  ["ndef", "Je ne sais pas encore", "On en parle au module 4"]
];
var DEPARTS = [
  ["idee", "J’ai une idée", "Je veux la mettre à l’épreuve"],
  ["chercher", "Je cherche une idée", "Je veux trouver un projet qui me ressemble"],
  ["reprendre", "Je veux reprendre", "Racheter une entreprise qui tourne déjà"]
];
var COLORS = ["#004A93", "#2E75B6", "#1F3864", "#0E6BA8", "#3D5A99", "#00718F"];

/* ============ Petits outils ============ */
function $(s, r) { return (r || document).querySelector(s); }
function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]; }); }
function img(n) { return IMG + n + ".jpg"; }
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); return true; } catch (e) { return false; } }
function toast(msg) {
  var t = $("#toast"); t.innerHTML = msg; t.classList.add("show");
  clearTimeout(t._h); t._h = setTimeout(function () { t.classList.remove("show"); }, 2600);
}
function fmt(n) { return Number(n || 0).toLocaleString("fr-BE"); }

var I = {
  star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.5l2.9 6.1 6.6.8-4.9 4.6 1.3 6.6L12 17.3l-5.9 3.3 1.3-6.6L2.5 9.4l6.6-.8z"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
  menu: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 004 20.5v-15z"/><path d="M4 20.5A2.5 2.5 0 016.5 18H20v3H6.5"/></svg>',
  flag: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M5 21V4m0 0h11l-2 4 2 4H5"/></svg>',
  bulb: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18h6M10 21h4M12 3a6 6 0 00-3.5 10.9c.6.5 1 1.2 1 2V16h5v-.1c0-.8.4-1.5 1-2A6 6 0 0012 3z"/></svg>',
  talk: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M4 5h16v11H9l-5 4V5z"/></svg>',
  coin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="8.5"/><path d="M14.8 9a3 3 0 100 6M8 11h5M8 13.5h5" stroke-linecap="round"/></svg>',
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M4 20h16M7 16v-4M12 16V8M17 16v-7"/></svg>',
  mic: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0013 0M12 17.5V21"/></svg>',
  road: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 21L10 3M18 21L14 3M12 7v2M12 13v2M12 19v1"/></svg>',
  trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M8 4h8v5a4 4 0 01-8 0V4zM8 6H4.5a3 3 0 003.6 4M16 6h3.5a3 3 0 01-3.6 4M12 13v4M8.5 20h7l-1-3h-5z"/></svg>',
  user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0116 0" stroke-linecap="round"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"><path d="M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0112 7.5 4.3 4.3 0 0119.5 10c0 5.4-7.5 10-7.5 10z"/></svg>',
  quiz: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 114 2c-.9.6-1.5 1.1-1.5 2.2M12 17h.01"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 018 0v3"/></svg>'
};
function stars(n) { var h = ""; for (var i = 1; i <= 5; i++) h += '<span style="opacity:' + (i <= n ? 1 : .22) + '">' + I.star + "</span>"; return '<div class="stars" aria-label="' + n + ' sur 5">' + h + "</div>"; }

/* ============ Session & données ============ */
var SES = {};
try { SES = JSON.parse(lsGet("acad_session") || "{}") || {}; } catch (e) { SES = {}; }
function saveSes() { lsSet("acad_session", JSON.stringify(SES)); }
function logged() { return !!SES.token; }
var ME = null, DETAIL = {}, PROFILE = {}, MYT = null, POOLED = { ecom: 0, entr: 0, total: 0 }, PROOFS = {}, MYQ = [];

function api(path, body) {
  var opt = body ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) } : {};
  return fetch(API + "/" + path, opt).then(function (r) { return r.json().catch(function () { return { ok: false, error: "parse" }; }); })
    .catch(function () { return { ok: false, error: "network" }; });
}
function refresh() {
  if (!logged()) { ME = null; DETAIL = {}; PROFILE = {}; MYT = null; PROOFS = {}; MYQ = []; return Promise.resolve(); }
  return api("me.php", { token: SES.token, course: COURSE }).then(function (r) {
    if (r && r.ok) {
      ME = r.me; PROFILE = r.profile || {}; MYT = r.my_testimonial; POOLED = r.pooled || POOLED; ME.ranking = r.ranking; ME.participants = r.participants;
      PROOFS = {}; (r.proofs || []).forEach(function (p) { PROOFS[p.mission + "-" + p.step] = p; }); MYQ = r.my_questions || [];
      DETAIL = {}; (r.detail || []).forEach(function (d) { DETAIL[d.sid] = d; });
    } else if (r && (r.error === "bad_token" || r.error === "no_token")) {
      SES = {}; saveSes(); ME = null; DETAIL = {}; PROFILE = {};
    }
  });
}
function track(events) {
  if (!logged()) return Promise.resolve(false);
  return api("track.php", { token: SES.token, course: COURSE, events: events }).then(function () { return refresh(); }).then(function () { return true; });
}
function saveProfile(p) {
  if (!logged()) return Promise.resolve();
  p.token = SES.token;
  return api("profile.php", p).then(function (r) { if (r && r.ok) PROFILE = r.profile; });
}

/* ============ Profil local (photo) ============ */
function photoKey() { return "acad_photo_" + (SES.matricule || "x"); }
function photo() { return lsGet(photoKey()); }
function initials() {
  var p = (PROFILE.prenom || "").trim();
  if (p) return p.split(/\s+/).map(function (w) { return w[0]; }).join("").slice(0, 2).toUpperCase();
  return (SES.matricule || "?").slice(0, 2).toUpperCase();
}
function avatar(size) {
  var ph = photo(), c = PROFILE.couleur || "#2E75B6";
  return '<span class="av" style="width:' + size + "px;height:" + size + "px;font-size:" + Math.round(size * .38) + "px;background:" + esc(c) + '">' +
    (ph ? '<img src="' + ph + '" alt="">' : esc(initials())) + "</span>";
}
function displayName() { return PROFILE.prenom || ("Matricule " + (SES.matricule || "")); }

/* ============ Calculs de progression ============ */
function d(sid) { return DETAIL[sid]; }
function read(sid) { return !!d("ent-lr-" + sid); }
function best(sid) { var x = d(sid); return x && x.maxs > 0 ? Math.round(x.score / x.maxs * 100) : null; }
function acq(sid) { var b = best(sid); return b !== null && b >= PASS; }
function secPct(sid) { return (read(sid) ? 30 : 0) + (acq(sid) ? 70 : 0); }
function setProgress(sections) {
  if (!sections.length) return { pct: 0, acq: 0, n: 0 };
  var t = 0, a = 0; sections.forEach(function (s) { t += secPct(s.sid); if (acq(s.sid)) a++; });
  return { pct: Math.round(t / sections.length), acq: a, n: sections.length };
}
function modById(id) { for (var i = 0; i < A.modules.length; i++) if (A.modules[i].id === id) return A.modules[i]; return null; }
function voieById(id) { for (var i = 0; i < A.voies.length; i++) if (A.voies[i].id === id) return A.voies[i]; return null; }
function findSec(sid) {
  var r = null;
  A.modules.forEach(function (m) { m.sections.forEach(function (s, i) { if (s.sid === sid) r = { sec: s, i: i, parent: m, kind: "module" }; }); });
  A.voies.forEach(function (v) { (v.sections || []).forEach(function (s, i) { if (s.sid === sid) r = { sec: s, i: i, parent: v, kind: "voie" }; }); });
  return r;
}
function missionDone(num) { var c = 0; for (var j = 1; j <= 5; j++) if (d("ent-mi-" + num + "-" + j)) c++; return c; }
function modProgress(m) {
  var p = setProgress(m.sections);
  if (!m.mission) return { pct: p.pct, acq: p.acq, n: p.n, mission: null };
  var ms = missionDone(m.num);
  return { pct: Math.round(p.pct * 0.8 + ms / 5 * 20), acq: p.acq, n: p.n, mission: ms };
}
function voieProgress(v) {
  if (!v) return { pct: 0, acq: 0, n: 0 };
  if (v.id === "digital") return { pct: Math.min(100, POOLED.ecom || 0), acq: 0, n: 0 };
  return setProgress(v.sections || []);
}
function myVoie() { return PROFILE.voie ? voieById(PROFILE.voie) : null; }
function examBest(n) { return best("ent-exam-" + n); }
function nextItem() {
  for (var i = 0; i < A.modules.length; i++) {
    var m = A.modules[i];
    for (var j = 0; j < m.sections.length; j++) if (!acq(m.sections[j].sid)) return { parent: m, sec: m.sections[j], kind: "module" };
  }
  var v = myVoie();
  if (v && v.id !== "digital") for (var k = 0; k < v.sections.length; k++) if (!acq(v.sections[k].sid)) return { parent: v, sec: v.sections[k], kind: "voie" };
  return null;
}
function badges() {
  var out = [];
  function add(id, nom, ic, ok, quoi) { out.push({ id: id, nom: nom, ic: ic, ok: !!ok, quoi: quoi }); }
  var anyRead = Object.keys(DETAIL).some(function (k) { return k.indexOf("ent-lr-") === 0; });
  add("start", "Premiers pas", I.user, PROFILE.voie, "Choisir ta voie");
  add("read", "Première leçon", I.book, anyRead, "Lire une leçon");
  var names = ["Idée cadrée", "Terrain validé", "Premier euro", "Chiffres maîtrisés", "Prêt·e pour le jury", "Pilote de sa boîte"];
  var icons = [I.bulb, I.talk, I.coin, I.chart, I.mic, I.flag];
  A.modules.forEach(function (m, i) { var p = setProgress(m.sections); add(m.id, names[i], icons[i], p.acq === p.n, "Acquérir tout le module " + m.num); });
  var v = myVoie(), vp = voieProgress(v);
  add("voie", "Ta voie", I.road, v && (v.id === "digital" ? vp.pct >= 50 : vp.acq === vp.n && vp.n > 0), "Valider les sections de ta voie");
  var e1 = [1, 2, 3].filter(function (n) { return (examBest(n) || 0) >= 70; }).length;
  add("exam", "Examen réussi", I.trophy, e1 >= 1, "70 % à un examen");
  add("exam3", "Triple réussite", I.trophy, e1 === 3, "70 % aux 3 examens");
  var vids = Object.keys(DETAIL).filter(function (k) { return k.indexOf("ent-res-") === 0; }).length;
  add("curious", "Curieux·se", I.star, vids >= 5, "5 ressources vues");
  add("ambass", "Ambassadeur·rice", I.heart, MYT && MYT.status === "approved", "Témoignage publié");
  return out;
}

/* ============ En-tête & pied ============ */
function header(route) {
  var nav = [
    logged() ? ["espace", "Mon espace"] : ["accueil", "Présentation"],
    ["cours", "Le parcours"], ["voies", "Les voies"], ["calendrier", "Calendrier"], ["reperes", "Repères"], ["examens", "Examens"], ["ressources", "Ressources"], ["temoignages", "Témoignages"]
  ];
  var r = route.split("/")[0];
  var h = '<div class="wrap">' +
    '<a class="brand" href="#/"><img src="' + IMG + 'epfc_logo.svg" alt="EPFC" width="73" height="34"><span class="bt">Académie<span class="bt-x"> StartupScan</span><small>Cours Entrepreneuriat · EPFC</small></span></a>' +
    '<nav class="nav" id="nav">' + nav.map(function (n) {
      var on = (r === n[0]) || (n[0] === "cours" && (r === "module" || r === "lecon")) || (n[0] === "voies" && r === "voie") || (n[0] === "examens" && r === "examen");
      return '<a href="#/' + n[0] + '"' + (on ? ' class="on"' : "") + ">" + n[1] + "</a>";
    }).join("") + (logged() ? '<a class="m-only" href="#/profil">Mon profil</a>' : '<a class="m-only" href="#/connexion">Se connecter</a>') + "</nav>" +
    '<span class="sp"></span><div class="hdr-act">';
  if (logged() && ME) {
    h += '<a class="pts-pill" href="#/espace" title="Tes points">' + I.star + '<span class="num">' + fmt(ME.points) + '</span><span class="lbl">pts · ' + esc(ME.niveau.nom) + "</span></a>" +
      '<button class="avbtn" id="avbtn" aria-label="Mon compte">' + avatar(38) + "</button>";
  } else {
    h += '<a class="btn ghost sm" href="#/connexion">Se connecter</a><a class="btn sm" href="#/inscription">Commencer</a>';
  }
  h += '<button class="menu-tog" id="menutog" aria-label="Menu">' + I.menu + "</button></div></div>";
  $("#hdr").innerHTML = h;
  $("#menutog").onclick = function () { $("#nav").classList.toggle("open"); };
  var ab = $("#avbtn");
  if (ab) ab.onclick = function (e) {
    e.stopPropagation();
    var ex = $("#dd"); if (ex) { ex.remove(); return; }
    var dd = document.createElement("div"); dd.className = "dd"; dd.id = "dd";
    dd.innerHTML = '<div class="who"><b>' + esc(displayName()) + "</b><span>Matricule " + esc(SES.matricule) + "</span></div>" +
      '<a href="#/espace">Mon espace</a><a href="#/profil">Mon profil</a><a href="#/temoignages">Mon témoignage</a><button id="dd-out">Se déconnecter</button>';
    $("#hdr").appendChild(dd);
    $("#dd-out").onclick = logout;
    setTimeout(function () { document.addEventListener("click", function c() { var x = $("#dd"); if (x) x.remove(); document.removeEventListener("click", c); }); }, 0);
  };
}
function logout() { SES = {}; saveSes(); ME = null; DETAIL = {}; PROFILE = {}; MYT = null; location.hash = "#/accueil"; toast("À bientôt !"); }
function footer() {
  $("#ftr").innerHTML = '<div class="wrap">' +
    '<div><img src="' + IMG + 'epfc_logo.svg" alt="EPFC" style="height:40px;border-radius:6px;margin-bottom:14px"><p>L’Académie StartupScan est l’espace d’apprentissage du cours Entrepreneuriat de l’EPFC (Bruxelles) : un parcours unique, de l’idée aux premiers clients. Coordination : Olivier Willocx & Diego Mommaerts.</p></div>' +
    '<div><b>Apprendre</b><a href="#/cours">Le parcours</a><a href="#/voies">Les voies</a><a href="#/reperes">Les repères</a><a href="#/examens">Examens</a><a href="#/banc">Banc d’essai</a><a href="' + ECOM_URL + '" target="_blank" rel="noopener">Cours e-commerce ↗</a></div>' +
    '<div><b>S’inspirer</b><a href="fiches.html">Toutes les fiches d’entreprises</a><a href="revue.html">Le dernier numéro StartupScan</a><a href="modeles.html">Qui paie ? Les modèles</a><a href="jeux-de-role.html">Jeux de rôle</a><a href="glossaire.html">Glossaire</a></div>' +
    '<div class="bot">Suivi de progression optionnel · données minimales hébergées en Europe, hors du dossier web, effaçables à tout moment depuis ton profil · ta photo reste sur ton appareil.</div></div>';
}

/* ============ Routeur ============ */
var ROUTES = {
  "": function () { return logged() ? vEspace() : vLanding(); },
  accueil: function () { return vLanding(); },
  inscription: function () { return vWizard(); },
  connexion: function () { return vLogin(); },
  espace: function () { return logged() ? vEspace() : (location.hash = "#/inscription", ""); },
  cours: function () { return vCours(); },
  module: function (a) { return vModule(a); },
  lecon: function (a) { return vLecon(a); },
  voies: function () { return vVoies(); },
  voie: function (a) { return vVoie(a); },
  examens: function () { return vExamens(); },
  examen: function (a) { return vExamen(a); },
  banc: function () { return vBanc(); },
  ressources: function () { return vRessources(); },
  temoignages: function () { return vTemoignages(); },
  profil: function () { return logged() ? vProfil() : (location.hash = "#/connexion", ""); },
  calendrier: function () { return vCalendrier(); },
  reperes: function (a) { return vReperes(a); },
  attestation: function () { return logged() ? vAttestation() : (location.hash = "#/connexion", ""); }
};
var CUR = "";
var LASTR = 0;
function route() {
  var h = (location.hash || "").replace(/^#\/?/, "");
  if (logged() && h !== CUR && Date.now() - LASTR > 1500) {
    // données fraîches à chaque changement de page (preuves validées, réponses du prof, points)
    LASTR = Date.now(); CUR = h;
    refresh().then(function () { CUR = ""; route(); });
    return;
  }
  var parts = h.split("/"), key = parts[0] || "", arg = parts.slice(1).join("/");
  if (!ROUTES.hasOwnProperty(key)) key = "";
  CUR = h;
  header(key === "banc" ? "ressources" : h);
  PUBQ = null;
  var out = ROUTES[key](decodeURIComponent(arg || ""));
  if (typeof out === "string" && out) {
    $("#main").innerHTML = out;
    if (AFTER) { var f = AFTER; AFTER = null; f(); }
  }
  window.scrollTo(0, 0);
}
var AFTER = null;   // câblage à exécuter après rendu
function after(fn) { AFTER = fn; }
function go(h) { if (location.hash === h) route(); else location.hash = h; }

/* ============ Vues : Présentation ============ */
var TESTI = null;
function loadTestimonials() {
  if (TESTI) return Promise.resolve(TESTI);
  return api("testimonials.php").then(function (r) { TESTI = (r && r.ok) ? r.testimonials : []; return TESTI; });
}
function testimonialCards(list, max) {
  if (!list || !list.length) {
    return '<div class="card pad how" style="gap:24px">' +
      '<img src="' + img("temoignages") + '" alt="" style="border-radius:12px">' +
      '<div><h3 class="h3">Les premiers témoignages arrivent avec la promotion 2026-2027</h3><p class="sub" style="margin-top:8px;font-size:15px">Tu suis le parcours ? Raconte ce qu’il t’a apporté : ton témoignage sera publié ici après relecture par l’équipe pédagogique.</p>' +
      '<a class="btn" style="margin-top:16px" href="#/temoignages">Partager mon expérience</a></div></div>';
  }
  return '<div class="grid g3">' + list.slice(0, max || 6).map(function (t) {
    var nm = t.prenom || "Étudiant·e de l’Académie";
    var ini = t.prenom ? t.prenom.slice(0, 1).toUpperCase() : "★";
    return '<div class="tcard">' + (t.note ? stars(t.note) : "") + "<q>" + esc(t.texte) + '</q><div class="who"><span class="av" style="width:42px;height:42px;font-size:16px">' + esc(ini) + "</span><div><b>" + esc(nm) + "</b><span>" + (t.voie ? esc(VOIE_LBL[t.voie]) : "Promotion 2026-2027") + "</span></div></div></div>";
  }).join("") + "</div>";
}
function moduleCard(m) {
  var p = logged() ? modProgress(m) : null;
  return '<a class="ccard" href="#/module/' + m.id + '"><div class="ph"><img src="' + img(m.img) + '" alt="" loading="lazy"><span class="chip solid tag">Module ' + m.num + "</span></div>" +
    '<div class="bd"><span class="k">' + esc(m.sprint) + " · " + m.sections.length + " leçons</span><h3>" + esc(m.titre) + "</h3><p>" + esc(m.accroche) + "</p>" +
    (p ? '<div class="pbar' + (p.pct >= 100 ? " done" : "") + '" style="margin-top:6px"><i style="width:' + p.pct + '%"></i></div>' : "") +
    '<div class="ft"><span>' + esc(m.duree) + "</span><span>" + (p ? '<b class="num" style="color:var(--epfc)">' + p.pct + " %</b>" : "Commencer →") + "</span></div></div></a>";
}
function voieCard(v, compact) {
  var mine = PROFILE.voie === v.id;
  return '<a class="vcard' + (mine ? " mine" : "") + '" href="#/voie/' + v.id + '">' + (mine ? '<span class="chip solid mine-tag">Ta voie</span>' : "") +
    '<div class="ph"><img src="' + img(v.img) + '" alt="" loading="lazy"></div><div class="bd"><span class="eyebrow">Voie</span><h3>' + esc(v.titre) + "</h3><p>" + esc(v.accroche) + "</p>" +
    (compact ? "" : "<ul>" + v.ce_que_tu_feras.slice(0, 3).map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>") + "</div></a>";
}
function vLanding() {
  var nSec = A.modules.reduce(function (a, m) { return a + m.sections.length; }, 0) + A.voies.reduce(function (a, v) { return a + (v.sections || []).length; }, 0);
  var h = '<section class="hero"><div class="wrap"><div>' +
    '<span class="eyebrow">Académie StartupScan · Cours Entrepreneuriat de l’EPFC</span>' +
    '<h1 class="h1" style="margin-top:14px">Crée ton business.<br>Trouve tes premiers clients.</h1>' +
    '<p class="lead">Un vrai parcours, à ton rythme : tu apprends, tu passes à l’action sur ton propre projet, tu valides tes compétences — et tu choisis ta voie : commerce, activité indépendante, plateforme digitale ou reprise d’entreprise.</p>' +
    '<div class="hero-ctas">' + (logged() ? '<a class="btn white lg" href="#/espace">Continuer mon parcours</a>' : '<a class="btn white lg" href="#/inscription">Commencer mon parcours</a><a class="btn outline-w lg" href="#/connexion">J’ai déjà un compte</a>') + "</div>" +
    '<div class="hero-meta"><span><b>12 nov. 2026 → 13 mai 2027</b> · 25 journées</span><span><b>160 périodes</b></span><span><b>EPFC</b> · Bruxelles</span><a href="#/calendrier" style="color:#fff;font-weight:700">Voir le calendrier →</a></div>' +
    '</div><div class="hero-img"><img src="' + img("hero") + '" alt="Trois jeunes entrepreneurs lancent leur projet"></div></div></section>';
  h += '<section class="statbar"><div class="wrap">' +
    '<div class="s"><b>' + A.modules.length + '</b><span>modules de tronc commun</span></div><div class="s"><b>4</b><span>voies au choix</span></div><div class="s"><b>' + nSec + '</b><span>leçons + QCM</span></div><div class="s"><b>5</b><span>missions terrain</span></div><div class="s"><b>3</b><span>examens à volonté</span></div></div></section>';
  h += '<section class="sec"><div class="wrap how"><div><span class="eyebrow">Comment ça marche</span><h2 class="h2">Un parcours qui s’adapte à toi</h2>' +
    '<div class="steps">' +
    '<div class="step"><span class="n">1</span><div><b>Crée ton profil en 2 minutes</b><span>Ton matricule EPFC, un code PIN, ta photo si tu veux. Le même compte vaut pour le cours e-commerce.</span></div></div>' +
    '<div class="step"><span class="n">2</span><div><b>Dis-nous d’où tu pars, choisis ta voie</b><span>Tu as une idée, tu en cherches une, ou tu veux reprendre ? Commerce, activité, plateforme digitale ou reprise : ton parcours se construit sur mesure.</span></div></div>' +
    '<div class="step"><span class="n">3</span><div><b>Apprends, puis passe à l’action</b><span>Chaque leçon se termine par un QCM de compétence et chaque module par une mission sur le terrain.</span></div></div>' +
    '<div class="step"><span class="n">4</span><div><b>Suis tes progrès, gagne des points</b><span>Niveaux, badges, classement anonyme — et 3 examens à repasser autant que tu veux avant le jury final.</span></div></div>' +
    '</div></div><div><img src="' + img("methode") + '" alt="Apprentissage par problèmes en équipe" style="border-radius:18px"></div></div></section>';
  h += '<section class="sec alt"><div class="wrap"><div class="sec-head"><div><span class="eyebrow">Le tronc commun</span><h2 class="h2">' + A.modules.length + ' modules pour passer de l’idée aux premiers clients — et piloter ta boîte</h2><p class="lead">Obligatoires pour tous, dans l’ordre conseillé — mais tu restes libre de naviguer.</p></div><a class="btn ghost" href="#/cours">Voir tout le parcours</a></div>' +
    '<div class="grid g3">' + A.modules.map(moduleCard).join("") + "</div></div></section>";
  h += '<section class="sec"><div class="wrap"><div class="sec-head"><div><span class="eyebrow">Ta voie</span><h2 class="h2">Plusieurs chemins pour entreprendre</h2><p class="lead">Tu n’es pas obligé·e de tout faire : choisis la voie qui correspond à ton projet. Tu peux en explorer d’autres quand tu veux.</p></div></div>' +
    '<div class="grid g2">' + A.voies.map(function (v) { return voieCard(v); }).join("") + "</div></div></section>";
  h += '<section class="sec alt"><div class="wrap how"><div><img src="' + img("profil") + '" alt="" style="border-radius:18px"></div><div><span class="eyebrow">Ton espace</span><h2 class="h2">Tu vois toujours où tu en es</h2>' +
    '<div class="steps">' +
    '<div class="step"><span class="n">' + '<span style="width:20px;height:20px;display:block">' + I.road + "</span>" + '</span><div><b>Une feuille de route personnelle</b><span>Les 5 modules, ta voie, les examens et le jury : chaque étape s’allume à mesure que tu avances.</span></div></div>' +
    '<div class="step"><span class="n"><span style="width:20px;height:20px;display:block">' + I.star + '</span></span><div><b>Points, niveaux et badges</b><span>De « Explorateur » à « Mentor ». Tes points se cumulent avec le cours e-commerce.</span></div></div>' +
    '<div class="step"><span class="n"><span style="width:20px;height:20px;display:block">' + I.user + '</span></span><div><b>Un profil à ton image</b><span>Ta photo ou tes initiales, ta voie, ton statut, ton idée en une ligne — modifiables à tout moment.</span></div></div>' +
    "</div></div></div></section>";
  h += '<section class="sec"><div class="wrap"><div class="sec-head"><div><span class="eyebrow">Repères</span><h2 class="h2">À relire quand tu doutes</h2></div><a class="btn ghost" href="#/reperes">Tous les repères</a></div><div class="grid g' + ((A.reperes || []).length === 4 ? 2 : 3) + '">' + (A.reperes || []).map(function (r) { return '<a class="ccard" href="#/reperes/' + r.id + '"><div class="ph"><img src="' + img(r.img) + '" alt="" loading="lazy"></div><div class="bd"><span class="k">' + esc(r.k) + "</span><h3>" + esc(r.titre) + "</h3><p>" + esc(r.sous) + "</p></div></a>"; }).join("") + "</div></div></section>";
  h += '<section class="sec alt"><div class="wrap"><div class="sec-head"><div><span class="eyebrow">Témoignages</span><h2 class="h2">Ils et elles ont suivi le parcours</h2></div><a class="btn ghost" href="#/temoignages">Tous les témoignages</a></div><div id="testi-land"><div class="loading">Chargement…</div></div></div></section>';
  h += '<section class="sec alt"><div class="wrap"><div class="grid g2" style="align-items:start"><div><span class="eyebrow">L’équipe</span><h2 class="h2">Des praticiens, pas seulement des profs</h2>' +
    '<div class="card pad" style="margin-top:20px"><div class="team"><span class="av" style="width:56px;height:56px;font-size:20px;background:var(--epfc)">OW</span><div><b>Olivier Willocx</b><div class="sub">Coordination · vente, modèles, pilotage, jury. Ancien CEO de BECI, près de 20 ans d’enseignement du business plan.</div></div></div></div>' +
    '<div class="card pad" style="margin-top:12px"><div class="team"><span class="av" style="width:56px;height:56px;font-size:20px;background:var(--blue)">DM</span><div><b>Diego Mommaerts</b><div class="sub">Co-coordination · cadre juridique et création d’entreprise.</div></div></div></div>' +
    '</div><div><span class="eyebrow">Questions fréquentes</span><h2 class="h2">Bon à savoir</h2>' +
    '<details class="faq"><summary>Dois-je déjà avoir une idée ?</summary><p>Non. Le module 1 t’aide à en trouver une, notamment grâce aux dizaines de fiches d’entreprises de StartupScan.</p></details>' +
    '<details class="faq"><summary>Dois-je faire toutes les voies ?</summary><p>Non. Tu choisis la voie qui correspond à ton projet (commerce, activité, plateforme digitale ou reprise) et tu peux en explorer d’autres si tu le souhaites.</p></details>' +
    '<details class="faq"><summary>Les examens comptent-ils dans ma note ?</summary><p>Ce sont des tests d’entraînement, repassables autant de fois que tu veux. L’évaluation finale, c’est la présentation de ton projet devant le jury.</p></details>' +
    '<details class="faq"><summary>Que devient mon matricule ? Et ma photo ?</summary><p>Seuls ton matricule et ta progression sont enregistrés, sur un serveur en Europe, jusqu’à la fin de l’année académique. Ta photo ne quitte jamais ton appareil. Tu peux tout effacer d’un clic depuis ton profil.</p></details>' +
    '<details class="faq"><summary>Et l’intelligence artificielle ?</summary><p>Tu l’utiliseras comme un outil — pour préparer, chiffrer, rédiger. Mais l’IA n’est jamais le livrable : ce que tu vends, ce sont tes clients, ta marge et ta capacité à convaincre.</p></details>' +
    "</div></div></div></section>";
  h += '<section class="sec"><div class="wrap"><div class="cta-band"><div><h2 class="h2" style="margin:0">Prêt·e à te lancer ?</h2><p style="margin-top:8px">Crée ton profil et découvre ton parcours sur mesure.</p></div>' +
    (logged() ? '<a class="btn white lg" href="#/espace">Aller à mon espace</a>' : '<a class="btn white lg" href="#/inscription">Commencer maintenant</a>') + "</div></div></section>";
  after(function () { loadTestimonials().then(function (l) { var b = $("#testi-land"); if (b) b.innerHTML = testimonialCards(l, 3); }); });
  return h;
}

/* ============ Vue : Connexion ============ */
function vLogin() {
  if (logged()) { go("#/espace"); return ""; }
  var h = '<section class="sec"><div class="wrap"><div class="grid g2" style="align-items:center"><div><img src="' + img("profil") + '" alt="" style="border-radius:18px"></div>' +
    '<div class="card pad" style="padding:30px"><span class="eyebrow">Content de te revoir</span><h1 class="h2">Se connecter</h1><p class="sub" style="margin-top:6px">Avec ton matricule EPFC et ton code PIN — les mêmes que pour le cours e-commerce.</p>' +
    '<form id="lf"><div class="fld"><label for="l-m">Matricule</label><input class="inp" id="l-m" autocomplete="username" required></div>' +
    '<div class="fld"><label for="l-p">Code PIN</label><input class="inp" id="l-p" type="password" autocomplete="current-password" required></div>' +
    '<div id="l-err"></div><button class="btn lg" style="margin-top:20px;width:100%" type="submit">Se connecter</button></form>' +
    '<p class="note">Pas encore de compte ? <a href="#/inscription">Crée ton profil</a>. PIN oublié ? Demande à ton professeur de réinitialiser ton compte.</p></div></div></div></section>';
  after(function () {
    $("#lf").onsubmit = function (e) {
      e.preventDefault();
      var m = $("#l-m").value.trim(), p = $("#l-p").value;
      api("auth.php", { matricule: m, pin: p, consent: false }).then(function (r) {
        if (r && r.ok) {
          SES = { token: r.token, matricule: m }; saveSes();
          refresh().then(function () { toast("Bienvenue " + esc(displayName()) + " !"); go(PROFILE.voie ? "#/espace" : "#/inscription"); });
        } else {
          $("#l-err").innerHTML = '<p class="err">' + (r && r.error === "consent_required" ? "Ce matricule n’a pas encore de compte : crée ton profil." : r && r.error === "bad_pin" ? "Code PIN incorrect." : "Connexion impossible pour l’instant.") + "</p>";
        }
      });
    };
  });
  return h;
}

/* ============ Vue : Inscription en étapes ============ */
var WZ = { step: 1 };
function vWizard() {
  if (logged() && WZ.step === 1) WZ.step = 2;
  var total = 6, s = WZ.step;
  var bar = '<div class="wiz-steps">' + Array.apply(null, Array(total)).map(function (_, i) { return '<i class="' + (i < s ? "on" : "") + '"></i>'; }).join("") + "</div>";
  var body = "";
  if (s === 1) {
    body = '<span class="eyebrow">Étape 1 sur 6 · Ton compte</span><h1 class="h2">Crée ton profil d’apprenant·e</h1>' +
      '<p class="sub" style="margin-top:6px;font-size:15px">Ton matricule EPFC et un code PIN que tu choisis. Un seul compte pour l’Académie et le cours e-commerce : tes points se cumulent.</p>' +
      '<form id="wf"><div class="fld"><label for="w-m">Matricule EPFC</label><input class="inp" id="w-m" autocomplete="username" placeholder="ex. 12-3456-78" required></div>' +
      '<div class="grid g2" style="gap:12px"><div class="fld"><label for="w-p">Code PIN <span class="hint">(4 caractères min.)</span></label><input class="inp" id="w-p" type="password" autocomplete="new-password" required></div>' +
      '<div class="fld"><label for="w-p2">Confirme ton PIN</label><input class="inp" id="w-p2" type="password" autocomplete="new-password" required></div></div>' +
      '<label class="check"><input type="checkbox" id="w-c"><span>J’accepte que ma progression (matricule et activité, sans nom ni email) soit enregistrée pour mon suivi pédagogique, sur un serveur en Europe, jusqu’à la fin de l’année académique. Je peux tout effacer à tout moment.</span></label>' +
      '<div id="w-err"></div><div style="display:flex;gap:10px;margin-top:22px;flex-wrap:wrap"><button class="btn lg" type="submit">Créer mon compte</button><a class="btn ghost lg" href="#/connexion">J’ai déjà un compte</a></div></form>';
  } else if (s === 2) {
    var c = PROFILE.couleur || COLORS[0];
    body = '<span class="eyebrow">Étape 2 sur 6 · Qui es-tu ?</span><h1 class="h2">Personnalise ton profil</h1>' +
      '<div class="avedit" style="margin-top:20px"><span id="w-av">' + avatar(96) + '</span><div><label class="btn ghost sm" for="w-ph" style="cursor:pointer">Ajouter une photo</label><input type="file" id="w-ph" accept="image/*" hidden> ' +
      (photo() ? '<button class="link" id="w-phx" style="margin-left:8px">Retirer</button>' : "") + '<p class="note" style="margin-top:8px">Facultatif. Ta photo reste sur ton appareil, elle n’est jamais envoyée au serveur.</p></div></div>' +
      '<div class="fld"><label>Ou choisis ta couleur</label><div class="swatches">' + COLORS.map(function (x) { return '<button class="sw' + (x === c ? " on" : "") + '" data-c="' + x + '" style="background:' + x + '" aria-label="Couleur ' + x + '"></button>'; }).join("") + "</div></div>" +
      '<div class="fld"><label for="w-pr">Ton prénom <span class="hint">(facultatif — pour te saluer, et sur ton témoignage si tu le souhaites)</span></label><input class="inp" id="w-pr" maxlength="40" value="' + esc(PROFILE.prenom || "") + '"></div>' +
      '<div style="display:flex;gap:10px;margin-top:24px"><button class="btn lg" id="w-next">Continuer</button></div>';
  } else if (s === 3) {
    body = '<span class="eyebrow">Étape 3 sur 6 · Ton point de départ</span><h1 class="h2">D’où pars-tu ?</h1><div class="opts" style="margin-top:18px">' +
      DEPARTS.map(function (x) { return '<button class="opt' + (PROFILE.depart === x[0] ? " on" : "") + '" data-dep="' + x[0] + '"><b>' + x[1] + "</b><span>" + x[2] + "</span></button>"; }).join("") + "</div>" +
      '<div class="fld"><label for="w-id">Ton idée en une ligne <span class="hint">(facultatif — pour qui, quel problème, quelle solution)</span></label><textarea class="inp" id="w-id" maxlength="200" style="min-height:80px">' + esc(PROFILE.idee || "") + "</textarea></div>" +
      '<div style="display:flex;gap:10px;margin-top:24px"><button class="btn ghost lg" data-back>Retour</button><button class="btn lg" id="w-next">Continuer</button></div>';
  } else if (s === 4) {
    var pre = PROFILE.voie || (PROFILE.depart === "reprendre" ? "reprise" : "");
    body = '<span class="eyebrow">Étape 4 sur 6 · Ta voie</span><h1 class="h2">Quel type d’entreprise veux-tu créer ?</h1><p class="sub" style="margin-top:6px;font-size:15px">Le tronc commun est le même pour tous ; ta voie ajoute les leçons propres à ton projet. Tu pourras changer plus tard.</p>' +
      '<div class="opts" style="grid-template-columns:repeat(auto-fill,minmax(min(100%,300px),1fr));margin-top:18px">' +
      A.voies.map(function (v) { return '<button class="opt img' + (pre === v.id ? " on" : "") + '" data-voie="' + v.id + '"><img src="' + img(v.img) + '" alt=""><div class="o-bd"><b>' + esc(v.titre) + "</b><span>" + esc(v.pour_qui) + "</span></div></button>"; }).join("") +
      '<button class="opt' + (PROFILE.voie === null && WZ.voieUndef ? " on" : "") + '" data-voie=""><b>Je ne sais pas encore</b><span>Je choisirai après le module 1</span></button></div>' +
      '<div style="display:flex;gap:10px;margin-top:24px"><button class="btn ghost lg" data-back>Retour</button><button class="btn lg" id="w-next">Continuer</button></div>';
    WZ.voie = pre;
  } else if (s === 5) {
    body = '<span class="eyebrow">Étape 5 sur 6 · Ton statut</span><h1 class="h2">Comment envisages-tu de te lancer ?</h1><div class="opts" style="margin-top:18px">' +
      STATUTS.map(function (x) { return '<button class="opt' + (PROFILE.statut === x[0] ? " on" : "") + '" data-st="' + x[0] + '"><b>' + x[1] + "</b><span>" + x[2] + "</span></button>"; }).join("") + "</div>" +
      '<div style="display:flex;gap:10px;margin-top:24px"><button class="btn ghost lg" data-back>Retour</button><button class="btn lg" id="w-next">Voir mon parcours</button></div>';
  } else {
    var v = myVoie();
    body = '<span class="eyebrow">Étape 6 sur 6 · C’est prêt</span><h1 class="h2">Ton parcours est prêt' + (PROFILE.prenom ? ", " + esc(PROFILE.prenom) : "") + " !</h1>" +
      '<p class="lead">Voici ta feuille de route. Commence par le module 1 — ou va directement là où tu en as besoin.</p>' +
      '<div class="card pad" style="margin-top:20px">' + roadmap() + "</div>" +
      '<div style="display:flex;gap:10px;margin-top:24px;flex-wrap:wrap"><a class="btn lg" href="#/espace">Aller à mon espace</a><a class="btn ghost lg" href="#/lecon/' + A.modules[0].sections[0].sid + '">Commencer la première leçon</a></div>' +
      (v ? "" : '<p class="note">Tu n’as pas encore choisi ta voie : tu pourras le faire depuis ton profil ou la page « Les voies ».</p>');
  }
  var h = '<section class="sec" style="padding-top:44px"><div class="wrap"><div class="wiz">' + bar + '<div class="card pad" style="padding:32px">' + body + "</div></div></div></section>";
  after(function () { wireWizard(); });
  return h;
}
function wizNext() { WZ.step++; route(); }
function wireWizard() {
  $$("[data-back]").forEach(function (b) { b.onclick = function () { WZ.step = Math.max(2, WZ.step - 1); route(); }; });
  var s = WZ.step;
  if (s === 1) {
    $("#wf").onsubmit = function (e) {
      e.preventDefault();
      var m = $("#w-m").value.trim(), p = $("#w-p").value, p2 = $("#w-p2").value, c = $("#w-c").checked, er = $("#w-err");
      if (!/^[A-Za-z0-9._\-]{3,32}$/.test(m)) { er.innerHTML = '<p class="err">Matricule invalide (3 à 32 caractères : lettres, chiffres, tirets).</p>'; return; }
      if (p.length < 4) { er.innerHTML = '<p class="err">Ton code PIN doit faire au moins 4 caractères.</p>'; return; }
      if (p !== p2) { er.innerHTML = '<p class="err">Les deux codes PIN ne correspondent pas.</p>'; return; }
      if (!c) { er.innerHTML = '<p class="err">Merci d’accepter l’enregistrement de ta progression pour continuer.</p>'; return; }
      api("auth.php", { matricule: m, pin: p, consent: true }).then(function (r) {
        if (r && r.ok) {
          SES = { token: r.token, matricule: m }; saveSes();
          refresh().then(function () {
            if (!r.new && PROFILE.voie) { toast("Tu avais déjà un compte : bienvenue !"); go("#/espace"); return; }
            toast(r.new ? "Compte créé !" : "Compte retrouvé."); wizNext();
          });
        } else {
          er.innerHTML = '<p class="err">' + (r && r.error === "bad_pin" ? "Ce matricule existe déjà avec un autre PIN. Connecte-toi, ou demande une réinitialisation à ton professeur." : "Création impossible pour l’instant. Réessaie dans un instant.") + "</p>";
        }
      });
    };
  } else if (s === 2) {
    $$(".sw").forEach(function (b) { b.onclick = function () { PROFILE.couleur = b.getAttribute("data-c"); $$(".sw").forEach(function (x) { x.classList.toggle("on", x === b); }); $("#w-av").innerHTML = avatar(96); }; });
    $("#w-ph").onchange = function (e) { loadPhoto(e.target.files[0], function () { route(); }); };
    var x = $("#w-phx"); if (x) x.onclick = function () { lsSet(photoKey(), null); route(); };
    $("#w-next").onclick = function () { saveProfile({ prenom: $("#w-pr").value, couleur: PROFILE.couleur || COLORS[0] }).then(wizNext); };
  } else if (s === 3) {
    var dep = PROFILE.depart;
    $$("[data-dep]").forEach(function (b) { b.onclick = function () { dep = b.getAttribute("data-dep"); $$("[data-dep]").forEach(function (x) { x.classList.toggle("on", x === b); }); }; });
    $("#w-next").onclick = function () { saveProfile({ depart: dep || null, idee: $("#w-id").value }).then(wizNext); };
  } else if (s === 4) {
    $$("[data-voie]").forEach(function (b) { b.onclick = function () { WZ.voie = b.getAttribute("data-voie"); WZ.voieUndef = !WZ.voie; $$("[data-voie]").forEach(function (x) { x.classList.toggle("on", x === b); }); }; });
    $("#w-next").onclick = function () { saveProfile({ voie: WZ.voie || null }).then(wizNext); };
  } else if (s === 5) {
    var st = PROFILE.statut;
    $$("[data-st]").forEach(function (b) { b.onclick = function () { st = b.getAttribute("data-st"); $$("[data-st]").forEach(function (x) { x.classList.toggle("on", x === b); }); }; });
    $("#w-next").onclick = function () { saveProfile({ statut: st || "ndef" }).then(function () { return refresh(); }).then(wizNext); };
  }
}
function loadPhoto(file, done) {
  if (!file) return;
  var fr = new FileReader();
  fr.onload = function () {
    var im = new Image();
    im.onload = function () {
      var S = 256, cv = document.createElement("canvas"); cv.width = S; cv.height = S;
      var k = Math.max(S / im.width, S / im.height), w = im.width * k, hh = im.height * k;
      cv.getContext("2d").drawImage(im, (S - w) / 2, (S - hh) / 2, w, hh);
      if (!lsSet(photoKey(), cv.toDataURL("image/jpeg", .85))) toast("Photo trop lourde pour ce navigateur.");
      else toast("Photo enregistrée sur ton appareil");
      done && done();
    };
    im.src = fr.result;
  };
  fr.readAsDataURL(file);
}

/* ============ Calendrier de cohorte ============ */
var MOIS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
function fdate(iso) { var p = iso.split("-"); return parseInt(p[2], 10) + " " + MOIS[parseInt(p[1], 10) - 1] + " " + p[0]; }
function today() { var t = new Date(); return t.getFullYear() + "-" + String(t.getMonth() + 1).padStart(2, "0") + "-" + String(t.getDate()).padStart(2, "0"); }
function nextSession() { var t = today(); for (var i = 0; i < A.calendrier.length; i++) if (A.calendrier[i].date >= t) return A.calendrier[i]; return null; }
function daysUntil(iso) { var a = new Date(iso + "T12:00:00"), b = new Date(); b.setHours(12, 0, 0, 0); return Math.round((a - b) / 86400000); }
function weekBanner() {
  var s = nextSession(); if (!s) return "";
  var m = modById(s.module), n = daysUntil(s.date);
  var when = n === 0 ? "aujourd’hui" : n === 1 ? "demain" : "dans " + n + " jours";
  return '<div class="card pad week"><div><span class="eyebrow">Prochaine séance · ' + when + '</span><h2 class="h3" style="margin-top:4px">Journée ' + s.n + "/25 — " + esc(s.titre) + '</h2><p class="sub" style="margin-top:4px">' + s.jour + " " + fdate(s.date) + " · Sprint " + s.sprint + (m ? " · " + esc(m.titre) : "") + '</p><p style="margin-top:8px;font-size:14.5px"><b>Avant la séance :</b> ' + esc(s.avant) + '</p></div><div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">' + (m ? '<a class="btn sm" href="#/module/' + m.id + '">Ouvrir le module ' + m.num + "</a>" : "") + '<a class="btn ghost sm" href="#/calendrier">Tout le calendrier</a></div></div>';
}
function vCalendrier() {
  var t = today(), nx = nextSession();
  var h = '<section class="pagehead"><div class="wrap"><div class="crumbs"><a href="#/">Accueil</a> · Calendrier</div><h1>Le calendrier de la promotion 2026-2027</h1><p>25 journées, de novembre à mai, surtout le jeudi et quelques samedis. Chaque séance s’appuie sur les leçons à lire avant, et avance la mission du sprint.</p></div></section>';
  h += '<section class="sec tight"><div class="wrap">' + (logged() ? weekBanner() : "") + '<p class="note" style="margin:14px 0 18px">Dates prévisionnelles — l’horaire officiel de l’EPFC fait foi.</p>';
  var cur = 0;
  A.calendrier.forEach(function (s) {
    if (s.sprint !== cur) { if (cur) h += "</div>"; cur = s.sprint; var m = modById(s.module); h += '<div class="chap"><span class="eyebrow">Sprint ' + s.sprint + '</span><h2 class="h3" style="margin:4px 0 10px">' + (m ? esc(m.titre) : "") + " · " + (m ? '<a class="link" href="#/module/' + m.id + '">module ' + m.num + "</a>" : "") + "</h2>"; }
    var past = s.date < t, isNext = nx && nx.n === s.n;
    h += '<div class="cal' + (past ? " past" : "") + (isNext ? " next" : "") + '"><div class="cd"><b>' + fdate(s.date).split(" ")[0] + "</b><span>" + fdate(s.date).split(" ")[1] + "</span></div><div class=\"ct\"><b>Journée " + s.n + " — " + esc(s.titre) + "</b><span>" + s.jour + " · avant la séance : " + esc(s.avant) + "</span></div>" + (isNext ? '<span class="chip solid">prochaine</span>' : past ? '<span class="chip grey">passée</span>' : "") + "</div>";
  });
  h += "</div></div></section>";
  return h;
}

/* ============ Repères (pages de référence) ============ */
function vReperes(which) {
  var R = A.reperes || [];
  var cur = null; R.forEach(function (r) { if (r.id === which) cur = r; });
  var h = '<section class="pagehead"><div class="wrap"><div class="crumbs"><a href="#/">Accueil</a> · Repères' + (cur ? " · " + esc(cur.titre) : "") + "</div><h1>" + (cur ? esc(cur.titre) : "Les repères") + "</h1><p>" + (cur ? esc(cur.sous) : "Quatre pages à relire quand tu doutes : les erreurs qui tuent les boîtes, ce qui fait réussir les entrepreneurs bruxellois, ce qui arrive en 2027, et douze terrains où te lancer.") + "</p></div></section>";
  if (!cur) {
    h += '<section class="sec tight"><div class="wrap"><div class="grid g' + (R.length === 4 ? 2 : 3) + '">' + R.map(function (r) { return '<a class="ccard" href="#/reperes/' + r.id + '"><div class="ph"><img src="' + img(r.img) + '" alt="" loading="lazy"></div><div class="bd"><span class="k">' + esc(r.k) + "</span><h3>" + esc(r.titre) + "</h3><p>" + esc(r.sous) + "</p></div></a>"; }).join("") + "</div></div></section>";
    return h;
  }
  h += '<section class="sec tight"><div class="wrap"><div class="rep-grid"><div>';
  h += '<img src="' + img(cur.img) + '" alt="" style="border-radius:16px;margin-bottom:22px">';
  if (cur.intro) h += '<p class="lead" style="margin:0 0 18px">' + cur.intro + "</p>";
  if (cur.items_titre) h += '<h2 class="rep-h">' + esc(cur.items_titre) + "</h2>";
  cur.items.forEach(function (it, i) {
    h += '<div class="rep-item"><span class="rep-n">' + (i + 1) + '</span><div><h3>' + esc(it.t) + "</h3><p>" + it.d + "</p>" + (it.src ? '<p class="rep-src">' + it.src + "</p>" : "") + "</div></div>";
  });
  if (cur.methode) {
    var M = cur.methode;
    h += '<h2 class="rep-h">' + esc(M.titre) + '</h2><div class="card pad rep-meth"><p>' + M.intro + '</p><div class="rep-cols"><div><h4>' + esc(M.filtres_t) + "</h4><ol>" + M.filtres.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ol></div><div><h4>" + esc(M.questions_t) + "</h4><ol>" + M.questions.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ol></div></div></div>";
  }
  if (cur.verticales) {
    h += '<h2 class="rep-h">' + esc(cur.verticales_titre) + '</h2><p class="rep-note">' + esc(cur.verticales_note) + "</p>";
    cur.verticales.forEach(function (v, i) {
      var c = v.cas;
      h += '<details class="vt" id="vt-' + v.id + '"><summary><span class="vt-n">' + (i + 1) + '</span><span class="vt-h"><b>' + esc(v.nom) + "</b><em>" + esc(v.pistes[0]) + "</em></span></summary><div class=\"vt-b\">";
      h += '<p class="vt-d">' + esc(v.demande) + "</p>";
      h += "<h5>Trois pistes pour démarrer</h5><ul>" + v.pistes.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul>";
      h += '<div class="vt-grid"><div class="vt-box ok"><h5>Pour bien le faire</h5><p>' + esc(v.bien) + '</p></div><div class="vt-box warn"><h5>Le piège</h5><p>' + esc(v.piege) + "</p></div></div>";
      h += '<p class="vt-prof"><b>Le profil qui s’y retrouve :</b> ' + esc(v.profil) + "</p>";
      h += '<div class="vt-cas"><h5>Cas inventé · ' + esc(c.qui) + "</h5><p>" + esc(c.scenario) + "</p><table>" + c.lignes.map(function (l) { return "<tr><td>" + esc(l[0]) + "</td><td>" + esc(l[1]) + "</td></tr>"; }).join("") + '</table><p class="vt-concl">' + c.conclusion + "</p></div>";
      h += '<p class="rep-src">Pour s’entraîner : ' + v.lecons.join(" · ") + "</p></div></details>";
    });
  }
  if (cur.sources && cur.sources.length) h += '<div class="card pad" style="margin-top:22px"><span class="eyebrow">Sources</span><ul class="rep-sources">' + cur.sources.map(function (s) { return "<li>" + s + "</li>"; }).join("") + "</ul></div>";
  h += '</div><aside><div class="card pad" style="position:sticky;top:88px"><span class="eyebrow">Les autres repères</span>' + R.filter(function (r) { return r.id !== cur.id; }).map(function (r) { return '<a class="rep-side" href="#/reperes/' + r.id + '"><b>' + esc(r.titre) + "</b><span>" + esc(r.k) + "</span></a>"; }).join("") + '<a class="btn ghost sm" style="margin-top:14px" href="#/module/m6">Module 6 · Piloter sa boîte</a></div></aside></div></div></section>';
  return h;
}

/* ============ Attestation ============ */
function attestationOk() {
  var p = setProgress(A.modules.reduce(function (a, m) { return a.concat(m.sections); }, []));
  var v = myVoie(), vp = voieProgress(v);
  var ex = [1, 2, 3].filter(function (n) { return (examBest(n) || 0) >= 70; }).length;
  return { trunk: p.acq === p.n, voie: !!v && (v.id === "digital" ? vp.pct >= 50 : vp.acq === vp.n && vp.n > 0), exams: ex === 3, missions: ME ? ME.mission_steps >= 20 : false, exN: ex };
}
function vAttestation() {
  var ok = attestationOk(), all = ok.trunk && ok.voie && ok.exams && ok.missions;
  var v = myVoie();
  var h = '<section class="pagehead"><div class="wrap"><div class="crumbs"><a href="#/espace">Mon espace</a> · Attestation</div><h1>Ton attestation de parcours</h1><p>Délivrée quand le tronc commun, ta voie, les 3 examens et au moins 20 étapes de mission sont validés. Elle atteste du parcours suivi sur l’Académie ; l’évaluation officielle reste celle du jury de l’EPFC.</p></div></section><section class="sec tight"><div class="wrap">';
  h += '<div class="grid g4" style="margin-bottom:24px">' + [["Tronc commun", ok.trunk], ["Ta voie", ok.voie], ["3 examens ≥ 70 %", ok.exams], ["20 étapes de mission", ok.missions]].map(function (c) { return '<div class="card pad" style="display:flex;gap:12px;align-items:center"><span class="st ' + (c[1] ? "on" : "") + '">' + (c[1] ? I.check : "") + "</span><b>" + c[0] + "</b></div>"; }).join("") + "</div>";
  if (all) {
    h += '<div class="attest" id="attest"><img src="' + IMG + 'epfc_logo.svg" alt="EPFC"><span class="eyebrow">Académie StartupScan · EPFC</span><h2>Attestation de parcours</h2><p>Ce document atteste que</p><div class="nm">' + esc(PROFILE.prenom || '') + ' <span>matricule ' + esc(SES.matricule) + '</span></div>'
      + '<p>a suivi l’intégralité du parcours <b>Entrepreneuriat — de l’idée aux premiers clients</b>, voie « ' + esc(v.titre) + ' », et validé ses compétences par les 3 examens de l’Académie.</p>'
      + '<p class="d">Bruxelles, le ' + new Date().toLocaleDateString('fr-BE') + ' · ' + ME.points + ' points · niveau ' + esc(ME.niveau.nom) + '</p><p class="sg">Olivier Willocx & Diego Mommaerts — coordination du cours</p></div>'
      + '<div style="margin-top:16px;display:flex;gap:10px"><button class="btn" id="att-print">Imprimer / enregistrer en PDF</button></div>';
  } else {
    h += '<div class="card pad empty"><img src="' + img("m5") + '" alt="" style="max-width:420px;margin:0 auto 14px;border-radius:12px"><h2 class="h3">Encore un peu de chemin</h2><p class="sub" style="margin-top:6px">Continue ton parcours : ton attestation apparaîtra ici dès que les quatre conditions seront remplies.</p><a class="btn" style="margin-top:14px" href="#/espace">Retour à mon espace</a></div>';
  }
  after(function () { var b = $("#att-print"); if (b) b.onclick = function () { window.print(); }; });
  return h + "</div></section>";
}

/* ============ Feuille de route ============ */
function roadmap() {
  var h = '<div class="road">';
  A.modules.forEach(function (m) {
    var p = logged() ? modProgress(m) : { pct: 0, acq: 0, n: m.sections.length, mission: 0 };
    var st = p.pct >= 100 ? "done" : p.pct > 0 ? "doing" : "";
    h += '<a class="rn ' + st + '" href="#/module/' + m.id + '"><span class="dot">' + (st === "done" ? '<span style="width:20px;height:20px">' + I.check + "</span>" : m.num) + '</span><div class="t"><b>' + esc(m.titre) + "</b><span>" + p.acq + "/" + p.n + " leçons acquises" + (p.mission === null ? "" : " · mission " + p.mission + "/5") + "</span>" +
      '<div class="pbar"><i style="width:' + p.pct + '%"></i></div></div><span class="r">' + p.pct + " %</span></a>";
  });
  h += '<div class="fork">Ta voie</div>';
  var v = myVoie();
  if (v) {
    var vp = voieProgress(v), vst = vp.pct >= 100 ? "done" : vp.pct > 0 ? "doing" : "";
    h += '<a class="rn ' + vst + '" href="#/voie/' + v.id + '"><span class="dot"><span style="width:22px;height:22px">' + I.road + '</span></span><div class="t"><b>' + esc(v.titre) + "</b><span>" + (v.id === "digital" ? "Progression du cours e-commerce" : vp.acq + "/" + vp.n + " leçons acquises") + '</span><div class="pbar"><i style="width:' + vp.pct + '%"></i></div></div><span class="r">' + vp.pct + " %</span></a>";
  } else {
    h += '<a class="rn" href="#/voies"><span class="dot">?</span><div class="t"><b>Choisis ta voie</b><span>Commerce, activité, plateforme digitale ou reprise</span></div></a>';
  }
  var ed = [1, 2, 3].filter(function (n) { return examBest(n) !== null; }).length;
  var ep = [1, 2, 3].filter(function (n) { return (examBest(n) || 0) >= 70; }).length;
  h += '<a class="rn ' + (ep === 3 ? "done" : ed ? "doing" : "") + '" href="#/examens"><span class="dot"><span style="width:22px;height:22px">' + I.trophy + '</span></span><div class="t"><b>Les 3 examens</b><span>' + ep + "/3 réussis (70 %) · " + ed + '/3 passés</span></div><span class="r">' + ep + "/3</span></a>";
  h += '<div class="rn"><span class="dot"><span style="width:22px;height:22px">' + I.mic + '</span></span><div class="t"><b>Jury final</b><span>Présente ton projet — création ou reprise — devant profs et professionnels</span></div></div>';
  if (logged()) { var ao = attestationOk(), aok = ao.trunk && ao.voie && ao.exams && ao.missions; h += '<a class="rn ' + (aok ? "done" : "") + '" href="#/attestation"><span class="dot"><span style="width:22px;height:22px">' + I.flag + '</span></span><div class="t"><b>Attestation de parcours</b><span>' + (aok ? "Disponible — imprime-la" : "Tronc commun + voie + 3 examens + 20 étapes de mission") + "</span></div></a>"; }
  return h + "</div>";
}

/* ============ Vue : Mon espace ============ */
function vEspace() {
  if (!ME) return '<div class="loading">Chargement de ton espace…</div>';
  var lv = ME.niveau, toNext = lv.next_min ? Math.round((ME.points - lv.min) / (lv.next_min - lv.min) * 100) : 100;
  var hello = new Date().getHours() < 18 ? "Bonjour" : "Bonsoir";
  var h = '<section class="welcome"><div class="wrap">' + avatar(84) +
    '<div><h1>' + hello + " " + esc(PROFILE.prenom || "") + (PROFILE.prenom ? "" : "à toi") + '</h1><p>' + (myVoie() ? "Ta voie : <b>" + esc(myVoie().titre) + "</b>" : 'Tu n’as pas encore choisi ta voie — <a href="#/voies" style="color:#fff">découvre-les</a>') +
    (PROFILE.idee ? '<br><span style="opacity:.85">« ' + esc(PROFILE.idee) + " »</span>" : "") + '</p><p style="margin-top:8px"><a href="#/profil" style="color:#fff;font-weight:700">Modifier mon profil</a></p></div>' +
    '<div class="lvl"><span>Niveau</span><br><b>' + esc(lv.nom) + '</b> · <span class="num">' + fmt(ME.points) + " points</span>" +
    '<div class="pbar"><i style="width:' + Math.max(3, toNext) + '%"></i></div><span>' + (lv.next_nom ? fmt(lv.next_min - ME.points) + " points avant « " + esc(lv.next_nom) + " »" : "Niveau maximum atteint") + "</span></div></div></section>";
  var nx = nextItem();
  var left = weekBanner();
  if (nx) {
    left += '<div class="card resume"><div class="ph"><img src="' + img(nx.parent.img) + '" alt=""></div><div class="bd"><span class="eyebrow">Reprendre là où tu t’es arrêté·e</span>' +
      '<h2 class="h3" style="margin-top:6px">' + esc(nx.sec.titre) + '</h2><p class="sub" style="margin-top:4px">' + (nx.kind === "module" ? "Module " + nx.parent.num + " · " : "Ta voie · ") + esc(nx.parent.titre) + " · " + esc(nx.sec.duree) + "</p>" +
      '<div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap"><a class="btn" href="#/lecon/' + nx.sec.sid + '">' + (read(nx.sec.sid) ? "Passer le QCM" : "Commencer la leçon") + '</a><a class="btn ghost" href="#/' + (nx.kind === "module" ? "module/" : "voie/") + nx.parent.id + '">Voir le module</a></div></div></div>';
  } else {
    left += '<div class="card pad"><span class="eyebrow">Bravo</span><h2 class="h3" style="margin-top:6px">Toutes tes leçons sont acquises !</h2><p class="sub" style="margin-top:6px">Place aux examens et à la préparation du jury.</p><a class="btn" style="margin-top:14px" href="#/examens">Passer les examens</a></div>';
  }
  left += '<div class="card pad"><div class="sec-head" style="margin-bottom:14px"><div><span class="eyebrow">Ta feuille de route</span><h2 class="h3" style="margin-top:4px">Où tu en es</h2></div><a class="link" href="#/cours">Tout le parcours →</a></div>' + roadmap() + "</div>";
  var right = '<div class="card pad"><span class="eyebrow">Ta progression</span><div style="display:flex;gap:20px;align-items:center;flex-wrap:wrap;margin-top:12px">' +
    '<div class="ring" style="--p:' + Math.min(100, ME.global) + '"><div><b>' + ME.global + '%</b><small>progression</small></div></div>' +
    '<div class="kv"><div><span>Compétence</span><b>' + ME.competence + ' %</b></div><div><span>Tronc commun</span><b>' + ME.sections_acquises + "/" + ME.sections_total + '</b></div><div><span>Examens réussis</span><b>' + ME.exams_done + "/" + ME.exams_total + '</b></div><div><span>Missions</span><b>' + ME.mission_steps + "/" + ME.mission_steps_total + "</b></div></div></div>" +
    '<p class="note">La progression peut dépasser 100 % (jusqu’à 120 %) grâce aux ressources consultées. Avec le cours e-commerce, ton compte cumule : entrepreneuriat ' + POOLED.entr + " % + e-commerce " + POOLED.ecom + " %.</p></div>";
  var bd = badges(), got = bd.filter(function (b) { return b.ok; }).length;
  right += '<div class="card pad"><div class="sec-head" style="margin-bottom:14px"><div><span class="eyebrow">Badges</span><h2 class="h3" style="margin-top:4px">' + got + " sur " + bd.length + '</h2></div></div><div class="badges">' +
    bd.map(function (b) { return '<div class="bdg' + (b.ok ? "" : " off") + '" title="' + esc(b.ok ? b.nom : "Pour l’obtenir : " + b.quoi) + '"><div class="ic">' + (b.ok ? b.ic : I.lock) + "</div>" + esc(b.nom) + "</div>"; }).join("") + "</div></div>";
  if (ME.ranking) {
    var r = ME.ranking, mx = Math.max.apply(null, r.buckets) || 1;
    right += '<div class="card pad"><span class="eyebrow">Où tu te situes</span><p style="margin-top:8px">Tu fais mieux que <b>' + r.percentile + " %</b> des " + r.n + ' participant·es. Classement anonyme : seule ta position est marquée.</p><div class="rank">' +
      r.buckets.map(function (b, i) { return '<div class="bk' + (i === r.your_bucket ? " you" : "") + '" style="height:' + Math.max(6, Math.round(b / mx * 90)) + 'px">' + (i === r.your_bucket ? "<span>toi</span>" : "") + "</div>"; }).join("") +
      '</div><div class="rank-l"><div>0-20</div><div>20-40</div><div>40-60</div><div>60-80</div><div>80+</div></div></div>';
  } else {
    right += '<div class="card pad"><span class="eyebrow">Où tu te situes</span><p class="sub" style="margin-top:8px">Le classement anonyme apparaîtra dès que 5 étudiant·es auront commencé (' + (ME.participants || 1) + " pour l’instant).</p></div>";
  }
  var ao = attestationOk();
  right += '<div class="card pad"><span class="eyebrow">Attestation de parcours</span><p class="sub" style="margin-top:8px">' + [ao.trunk, ao.voie, ao.exams, ao.missions].filter(Boolean).length + '/4 conditions remplies.</p><a class="btn ghost sm" style="margin-top:12px" href="#/attestation">Voir les conditions</a></div>';
  right += '<div class="card pad"><span class="eyebrow">Ton témoignage</span><p class="sub" style="margin-top:8px">' + (MYT ? (MYT.status === "approved" ? "Ton témoignage est publié. Merci !" : MYT.status === "pending" ? "Ton témoignage est en attente de relecture." : "Ton témoignage n’a pas été retenu — tu peux le reformuler.") : "Partage ce que le parcours t’apporte (+30 points une fois publié).") + '</p><a class="btn ghost sm" style="margin-top:12px" href="#/temoignages">' + (MYT ? "Voir / modifier" : "Écrire mon témoignage") + "</a></div>";
  return h + '<section class="sec tight"><div class="wrap dash"><div>' + left + "</div><div>" + right + "</div></div></section>";
}

/* ============ Vue : Le parcours (catalogue) ============ */
function vCours() {
  var h = '<section class="pagehead"><div class="wrap"><div class="crumbs"><a href="#/">Accueil</a> · Le parcours</div><h1>Le parcours complet</h1><p>5 modules de tronc commun, puis ta voie, les examens et le jury final. Suis l’ordre conseillé ou navigue librement.</p></div></section>';
  h += '<section class="sec tight"><div class="wrap"><div class="grid g3">' + A.modules.map(moduleCard).join("") + "</div>";
  h += '<div class="sec-head" style="margin-top:44px"><div><span class="eyebrow">Ensuite</span><h2 class="h2">Ta voie — au choix</h2></div><a class="btn ghost" href="#/voies">Comparer les voies</a></div><div class="grid g4">' +
    A.voies.map(function (v) { return voieCard(v, true); }).join("") + "</div>";
  h += '<div class="grid g2" style="margin-top:44px"><a class="ccard" href="#/examens"><div class="ph"><img src="' + img("m4") + '" alt=""></div><div class="bd"><span class="k">Valider</span><h3>Les 3 examens</h3><p>90 questions plus exigeantes, à repasser autant de fois que tu veux.</p></div></a>' +
    '<a class="ccard" href="#/module/m5"><div class="ph"><img src="' + img("m5") + '" alt=""></div><div class="bd"><span class="k">Évaluation finale</span><h3>Le jury</h3><p>Ton projet — création ou reprise — présenté devant profs et professionnels. On évalue des preuves, pas des promesses.</p></div></a></div>';
  return h + "</div></section>";
}

/* ============ Vue : Module ============ */
function itemRow(s, parentHref) {
  var a = acq(s.sid), r = read(s.sid), b = best(s.sid);
  var cls = a ? "done" : r ? "half" : "";
  return '<a class="item ' + cls + '" href="#/lecon/' + s.sid + '"><span class="st">' + (a ? I.check : "") + '</span><div class="t"><b>' + esc(s.titre) + "</b><span>Leçon · " + esc(s.duree) + " · QCM 3 questions" + (b !== null ? " · meilleur score " + b + " %" : "") + "</span></div>" +
    (a ? '<span class="chip ok">Acquis</span>' : r ? '<span class="chip">QCM à faire</span>' : '<span class="chip grey">À faire</span>') + "</a>";
}
function vModule(id) {
  var m = modById(id);
  if (!m) return vCours();
  var p = logged() ? modProgress(m) : null;
  var h = '<section class="mhead"><div class="wrap"><div><div class="crumbs"><a href="#/">Accueil</a> · <a href="#/cours">Le parcours</a> · Module ' + m.num + "</div>" +
    '<span class="eyebrow" style="color:#9CC7F0">Module ' + m.num + " · " + esc(m.sprint) + "</span><h1>" + esc(m.titre) + '</h1><p style="margin-top:10px;font-size:17px">' + esc(m.accroche) + "</p>" +
    (p ? '<div class="prog"><div class="pbar big"><i style="width:' + p.pct + '%"></i></div><span>' + p.pct + " % · " + p.acq + "/" + p.n + " leçons acquises" + (p.mission === null ? "" : " · mission " + p.mission + "/5") + "</span></div>" : '<div style="margin-top:20px"><a class="btn white" href="#/inscription">Créer mon profil pour suivre ma progression</a></div>') +
    '</div><div class="ph"><img src="' + img(m.img) + '" alt=""></div></div></section>';
  h += '<section class="sec tight"><div class="wrap mod"><div>' +
    '<div class="card"><div class="pad" style="border-bottom:1px solid var(--line-2)"><span class="eyebrow">Contenu du module</span><h2 class="h3" style="margin-top:4px">' + m.sections.length + ' leçons · chaque leçon se valide par un QCM</h2></div><div class="items">' + m.sections.map(function (s) { return itemRow(s); }).join("") + "</div></div>" +
    (m.mission ? missionCard(m) : "") + questionsBlock(m.id) + "</div>" +
    '<div style="display:grid;gap:20px"><div class="card pad"><span class="eyebrow">À la fin de ce module</span><ul class="obj" style="margin-top:12px">' + m.objectifs.map(function (o) { return "<li>" + esc(o) + "</li>"; }).join("") + "</ul></div>" +
    '<div class="card pad"><span class="eyebrow">Compétences</span><div class="chips" style="margin-top:10px">' + m.competences.map(function (c) { return '<span class="chip">' + esc(c) + "</span>"; }).join("") + '</div><p class="note">' + esc(m.duree) + "</p></div>" +
    '<div class="card pad"><span class="eyebrow">Navigation</span><div style="display:grid;gap:8px;margin-top:10px">' +
    (m.num > 1 ? '<a class="btn ghost sm" href="#/module/m' + (m.num - 1) + '">← Module ' + (m.num - 1) + "</a>" : "") +
    (m.num < A.modules.length ? '<a class="btn sm" href="#/module/m' + (m.num + 1) + '">Module ' + (m.num + 1) + " →</a>" : '<a class="btn sm" href="#/voies">Choisir / suivre ma voie →</a>') + "</div></div></div></div></section>";
  after(wireMission);
  return h;
}
function missionCard(m) {
  var mi = m.mission, n = missionDone(m.num);
  return '<div class="card pad mission" style="margin-top:20px"><div style="display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;align-items:center"><div><span class="eyebrow">Mission terrain · ' + esc(mi.escalier) + '</span><h2 class="h3" style="margin-top:4px">' + esc(mi.titre) + "</h2></div>" +
    '<span class="chip ' + (n === 5 ? "solid" : "") + '">' + n + "/5 étapes</span></div>" +
    '<div class="prob"><b>Le problème.</b> ' + esc(mi.probleme) + '</div><p style="margin-top:10px;font-size:14.5px"><b style="color:var(--epfc)">Preuve attendue :</b> ' + esc(mi.preuve) + "</p>" +
    mi.etapes.map(function (e, j) {
      var key = m.num + "-" + (j + 1), ok = !!d("ent-mi-" + key), p = PROOFS[key];
      var st = ok ? '<span class="chip ok">Validée · +20</span>' : p ? (p.status === "pending" ? '<span class="chip">En relecture</span>' : '<span class="chip" style="background:var(--ko-bg);color:var(--ko)">À refaire</span>') : '<span class="chip grey">À déposer</span>';
      return '<div class="pstep' + (ok ? " d" : "") + '"><div class="pstep-h"><b>' + (j + 1) + ". " + esc(e) + "</b>" + st + "</div>" +
        (p && p.comment ? '<p class="pcmt' + (p.status === "rejected" ? " rej" : "") + '">Commentaire du prof : « ' + esc(p.comment) + " »</p>" : "") +
        (ok ? '<p class="sub" style="font-size:13px">' + esc(p ? p.texte : "Validée en séance.") + "</p>" :
          '<details class="pform"' + (p && p.status === "rejected" ? " open" : "") + "><summary>" + (p ? "Modifier ma preuve" : "Déposer ma preuve") + '</summary><textarea class="inp" data-ptxt="' + key + '" maxlength="1500" placeholder="Qu’as-tu fait concrètement ? Avec qui, quand, quel résultat ?">' + esc(p ? p.texte : "") + '</textarea><input class="inp" data-plink="' + key + '" placeholder="Lien facultatif (document, photo, page…)" value="' + esc(p ? p.lien || "" : "") + '"><button class="btn sm" data-psend="' + key + '">Envoyer pour validation</button></details>') + "</div>";
    }).join("") +
    '<p class="note">Chaque étape se valide par une preuve que ton professeur relit (+20 points une fois validée). Les preuves sont aussi discutées en séance.</p></div>';
}
function wireMission() {
  $$("button[data-psend]").forEach(function (b) {
    b.onclick = function () {
      if (!logged()) { needAccount(); return; }
      var key = b.getAttribute("data-psend"), tx = $('[data-ptxt="' + key + '"]').value.trim(), ln = $('[data-plink="' + key + '"]').value.trim();
      if (tx.length < 15) { toast("Décris ce que tu as fait (15 caractères minimum)."); return; }
      b.disabled = true;
      api("proof.php", { token: SES.token, mission: +key.split("-")[0], step: +key.split("-")[1], texte: tx, lien: ln }).then(function (r) {
        if (r && r.ok) { refresh().then(function () { toast("Preuve envoyée — ton professeur la relit."); route(); }); }
        else { b.disabled = false; toast(r && r.error === "lien" ? "Le lien doit commencer par http(s)://" : "Envoi impossible pour l’instant."); }
      });
    };
  });
  wireQuestions();
}
function questionsBlock(moduleId) {
  var mine = MYQ.filter(function (q) { return q.module === moduleId; });
  return '<div class="card pad" style="margin-top:20px" id="qa"><div class="sec-head" style="margin-bottom:10px"><div><span class="eyebrow">Questions au professeur</span><h2 class="h3" style="margin-top:4px">Un point pas clair ? Demande.</h2></div></div>' +
    '<div id="qa-pub"><p class="sub">Chargement des réponses publiées…</p></div>' +
    (logged() ? (mine.length ? '<div class="qa-mine">' + mine.map(function (q) { return '<div class="qa-item mine"><b>Ta question</b><p>' + esc(q.texte) + "</p>" + (q.status === "answered" ? '<div class="qa-a"><b>Réponse</b><p>' + esc(q.reponse) + "</p></div>" : '<span class="chip">En attente de réponse</span>') + "</div>"; }).join("") + "</div>" : "") +
      '<div style="margin-top:12px"><textarea class="inp" id="qa-txt" maxlength="800" placeholder="Ta question sur ce module (10 à 800 caractères)"></textarea><button class="btn sm" id="qa-send" data-mod="' + moduleId + '" style="margin-top:8px">Poser ma question</button><p class="note">Le professeur répond depuis son tableau de bord ; s’il publie la réponse, elle apparaît ici pour tous, sans ton nom.</p></div>' :
      '<p class="sub"><a href="#/connexion">Connecte-toi</a> pour poser une question.</p>') + "</div>";
}
var PUBQ = null;
function wireQuestions() {
  var box = $("#qa-pub"); if (!box) return;
  var modId = $("#qa-send") ? $("#qa-send").getAttribute("data-mod") : box.getAttribute("data-mod");
  function render(list) {
    var mineTxt = MYQ.map(function (q) { return q.texte; });
    var l = list.filter(function (q) { return (!modId || q.module === modId) && mineTxt.indexOf(q.q) < 0; });
    box.innerHTML = l.length ? l.map(function (q) { return '<div class="qa-item"><b>Q.</b><p>' + esc(q.q) + '</p><div class="qa-a"><b>R.</b><p>' + esc(q.a) + "</p></div></div>"; }).join("") : '<p class="sub">Pas encore de réponse publiée pour ce module.</p>';
  }
  if (PUBQ) render(PUBQ); else api("questions.php").then(function (r) { PUBQ = (r && r.ok) ? r.questions : []; render(PUBQ); });
  var s = $("#qa-send");
  if (s) s.onclick = function () {
    var tx = $("#qa-txt").value.trim(); if (tx.length < 10) { toast("Écris au moins 10 caractères."); return; }
    s.disabled = true;
    api("question.php", { token: SES.token, module: s.getAttribute("data-mod"), texte: tx }).then(function (r) {
      if (r && r.ok) refresh().then(function () { toast("Question envoyée au professeur."); route(); });
      else { s.disabled = false; toast(r && r.error === "trop" ? "Tu as déjà 5 questions en attente." : "Envoi impossible."); }
    });
  };
}
function needAccount() { toast('Crée ton profil pour enregistrer ta progression — <a href="#/inscription" style="color:#fff;font-weight:800">S’inscrire</a>'); }

/* ============ Vue : Leçon (façon Coursera) ============ */
var QZ = {};
function vLecon(sid) {
  var f = findSec(sid);
  if (!f) return vCours();
  var s = f.sec, par = f.parent, list = par.sections, isMod = f.kind === "module";
  var href = isMod ? "#/module/" + par.id : "#/voie/" + par.id;
  var prev = list[f.i - 1], next = list[f.i + 1];
  var nextHref = next ? "#/lecon/" + next.sid : (isMod ? (par.num < A.modules.length ? "#/module/m" + (par.num + 1) : "#/voies") : "#/examens");
  var aside = '<aside><div class="card"><div class="pad" style="padding:16px 16px 12px"><a class="link" href="' + href + '">← ' + (isMod ? "Module " + par.num : "Voie") + "</a><b style=\"display:block;margin-top:6px;font-size:15px\">" + esc(par.titre) + '</b></div><div class="items">' +
    list.map(function (x) { var a = acq(x.sid), r = read(x.sid); return '<a class="item ' + (a ? "done" : r ? "half" : "") + (x.sid === sid ? " cur" : "") + '" href="#/lecon/' + x.sid + '"><span class="st">' + (a ? I.check : "") + '</span><div class="t"><b>' + esc(x.titre) + "</b><span>" + esc(x.duree) + "</span></div></a>"; }).join("") + "</div></div></aside>";
  var b = best(sid), r = read(sid);
  var reader = '<article class="card reader"><div class="meta"><span class="chip">' + (isMod ? "Module " + par.num : "Voie · " + esc(par.titre)) + '</span><span class="chip grey">Leçon ' + (f.i + 1) + "/" + list.length + " · " + esc(s.duree) + "</span>" + (acq(sid) ? '<span class="chip ok">Compétence acquise</span>' : "") + "</div>" +
    "<h1>" + esc(s.titre) + '</h1><div class="prose">' + s.lecon_html + "</div>" +
    '<div class="box keep"><h4>À retenir</h4><ul>' + s.a_retenir.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + "</ul></div>" +
    '<div class="box act"><h4>Passe à l’action sur ton projet</h4><p>' + esc(s.action) + "</p></div>" + mediaBlock(sid) +
    '<div style="margin-top:18px;display:flex;gap:12px;align-items:center;flex-wrap:wrap">' + (r ? '<span class="chip ok">Leçon lue ✓</span>' : '<button class="btn ghost" id="mark-read">Marquer comme lue (+10 points)</button>') + "</div>" +
    '<div class="quiz" id="quiz"><span class="eyebrow">Valide ta compétence</span><h2 class="h3" style="margin-top:4px">QCM — 3 questions</h2><p class="sub" style="margin-top:4px">2 bonnes réponses sur 3 pour acquérir la compétence (+50 points). Tu peux recommencer autant de fois que tu veux' + (b !== null ? " · ton meilleur score : " + b + " %" : "") + ".</p>" +
    qcmHtml(s.qcm, sid) + '<div id="qres"></div><button class="btn lg" id="qgo" style="margin-top:18px">Valider mes réponses</button></div>' +
    '<div class="nextprev">' + (prev ? '<a class="btn ghost" href="#/lecon/' + prev.sid + '">← ' + esc(prev.titre) + "</a>" : '<a class="btn ghost" href="' + href + '">← Retour au module</a>') +
    '<a class="btn" href="' + nextHref + '">' + (next ? esc(next.titre) + " →" : "Étape suivante →") + "</a></div></article>";
  var h = '<section class="sec tight"><div class="wrap"><div class="crumbs" style="color:var(--muted);margin-bottom:14px"><a style="color:var(--epfc)" href="#/cours">Le parcours</a> · <a style="color:var(--epfc)" href="' + href + '">' + esc(par.titre) + "</a> · " + esc(s.titre) + '</div><div class="lesson">' + aside + reader + "</div></div></section>";
  after(function () {
    var mr = $("#mark-read");
    if (mr) mr.onclick = function () {
      if (!logged()) { needAccount(); return; }
      mr.disabled = true; track([{ kind: "read", sid: "ent-lr-" + sid }]).then(function () { toast("+10 points · leçon lue"); mr.outerHTML = '<span class="chip ok">Leçon lue ✓</span>'; header(CUR); });
    };
    wireQcm(sid, s.qcm, false);
    $$("input[data-res]").forEach(function (c) { c.onchange = function () { if (!logged()) { c.checked = false; needAccount(); return; } c.disabled = true; track([{ kind: "video", sid: "ent-res-" + c.getAttribute("data-res") }]).then(function () { toast("+10 points · ressource vue"); header(CUR); }); }; });
  });
  return h;
}
function mediaBlock(sid) {
  var md = (A.media || {})[sid]; if (!md) return "";
  var h = "";
  if (md.videos && md.videos.length) {
    h += '<div class="media"><span class="eyebrow">À regarder</span>' + md.videos.map(function (v) {
      var seen = !!d("ent-res-" + v[3]);
      var frame = v[1] === "yt" ? '<div class="vid"><iframe src="https://www.youtube-nocookie.com/embed/' + v[2] + '" title="' + esc(v[0]) + '" loading="lazy" allowfullscreen allow="encrypted-media; picture-in-picture"></iframe></div>'
        : v[1] === "ted" ? '<div class="vid"><iframe src="https://embed.ted.com/talks/' + v[2] + '" title="' + esc(v[0]) + '" loading="lazy" allowfullscreen></iframe></div>'
        : '<a class="btn ghost sm" href="' + esc(v[2]) + '" target="_blank" rel="noopener">Ouvrir la lecture ↗</a>';
      return '<div class="media-item"><b>' + esc(v[0]) + "</b>" + frame + '<label class="check" style="margin-top:8px"><input type="checkbox" data-res="' + v[3] + '"' + (seen ? " checked disabled" : "") + "><span>" + (seen ? "Vu ✓" : "J’ai regardé (+10 points)") + "</span></label></div>";
    }).join("") + "</div>";
  }
  if (md.fiches && md.fiches.length) {
    h += '<div class="box fiches"><h4>À lire sur StartupScan</h4><div class="chips">' + md.fiches.map(function (f) { return '<a class="chip" href="f/' + f[0] + '.html" target="_blank" rel="noopener">' + esc(f[1]) + " ↗</a>"; }).join("") + "</div></div>";
  }
  return h;
}
function qcmHtml(qcm, sid) {
  return qcm.map(function (q, qi) {
    return '<div class="q" data-qi="' + qi + '"><h3>' + (qi + 1) + ". " + esc(q.q) + "</h3>" +
      q.choices.map(function (c, ci) { return '<label><input type="radio" name="' + sid + "-" + qi + '" value="' + ci + '"><span>' + esc(c) + "</span></label>"; }).join("") +
      '<div class="ex">' + esc(q.explain) + "</div></div>";
  }).join("");
}
function wireQcm(sid, qcm, isExam) {
  $$(".q label").forEach(function (l) { l.onclick = function () { var q = l.closest(".q"); if (q.classList.contains("done")) return; $$("label", q).forEach(function (x) { x.classList.toggle("sel", x === l); }); }; });
  $$(".q input").forEach(function (i) { i.onchange = function () { var c = $("#qcount"); if (c) c.textContent = $$(".q input:checked").length; }; });
  var go2 = $("#qgo");
  go2.onclick = function () {
    if (go2.dataset.done) { $$(".q").forEach(function (q) { q.classList.remove("done"); $$("label", q).forEach(function (l) { l.classList.remove("ok", "ko", "sel"); }); $$("input", q).forEach(function (i) { i.checked = false; i.disabled = false; }); }); $("#qres").innerHTML = ""; go2.textContent = isExam ? "Rendre mon examen" : "Valider mes réponses"; delete go2.dataset.done; var c = $("#qcount"); if (c) c.textContent = 0; return; }
    var answered = $$(".q input:checked").length;
    if (answered < qcm.length && !confirmInline(go2, qcm.length - answered)) return;
    var ok = 0, ev = [];
    qcm.forEach(function (q, qi) {
      var box = $('.q[data-qi="' + qi + '"]'), labels = $$("label", box), sel = $("input:checked", box);
      box.classList.add("done"); $$("input", box).forEach(function (i) { i.disabled = true; });
      labels.forEach(function (l) { l.classList.remove("sel"); });
      if (labels[q.answer]) labels[q.answer].classList.add("ok");
      if (sel) { var ci = +sel.value, good = ci === q.answer; if (good) ok++; else labels[ci].classList.add("ko"); ev.push({ kind: "answer", sid: sid, qidx: qi, correct: good ? 1 : 0 }); }
    });
    var pct = Math.round(ok / qcm.length * 100), pass = isExam ? pct >= 70 : pct >= PASS;
    var wasAcq = acq(sid);
    $("#qres").innerHTML = '<div class="result' + (pass ? " pass" : "") + '"><b class="num">' + ok + " / " + qcm.length + "</b><span>" +
      (isExam ? (pass ? "Examen réussi (" + pct + " %) — bravo !" : pct + " % — relis les explications et retente quand tu veux.") : (pass ? "Compétence acquise ! Les explications sont affichées sous chaque question." : "Pas encore — lis les explications, puis retente.")) + "</span></div>";
    go2.textContent = "Recommencer"; go2.dataset.done = "1";
    if (logged()) {
      ev.unshift({ kind: "quiz", sid: sid, score: ok, max: qcm.length });
      track(ev).then(function () {
        header(CUR);
        if (!isExam && pass && !wasAcq) toast("+50 points · compétence acquise");
        else if (isExam) toast("Résultat enregistré (+" + pct + " points max)");
      });
    } else { needAccount(); }
    $("#qres").scrollIntoView({ behavior: "smooth", block: "center" });
  };
}
function confirmInline(btn, missing) {
  if (btn.dataset.warned) { delete btn.dataset.warned; return true; }
  btn.dataset.warned = "1";
  $("#qres").innerHTML = '<p class="err">Il te reste ' + missing + " question" + (missing > 1 ? "s" : "") + " sans réponse. Clique à nouveau pour valider quand même.</p>";
  return false;
}

/* ============ Vues : Voies ============ */
function vVoies() {
  var h = '<section class="pagehead"><div class="wrap"><div class="crumbs"><a href="#/">Accueil</a> · Les voies</div><h1>Plusieurs chemins pour entreprendre</h1><p>Le tronc commun est le même pour tous. Ta voie ajoute les leçons propres à ton type de projet. Choisis-en une — tu peux en explorer d’autres quand tu veux.</p></div></section>';
  h += '<section class="sec tight"><div class="wrap"><div class="grid g2">' + A.voies.map(function (v) { return voieCard(v); }).join("") + "</div></div></section>";
  return h;
}
function vVoie(id) {
  var v = voieById(id);
  if (!v) return vVoies();
  var mine = PROFILE.voie === v.id, vp = logged() ? voieProgress(v) : null;
  var h = '<section class="mhead"><div class="wrap"><div><div class="crumbs"><a href="#/">Accueil</a> · <a href="#/voies">Les voies</a> · ' + esc(v.titre) + '</div><span class="eyebrow" style="color:#9CC7F0">Voie' + (mine ? " · ta voie" : "") + "</span><h1>" + esc(v.titre) + '</h1><p style="margin-top:10px;font-size:17px">' + esc(v.accroche) + "</p>" +
    (vp && mine ? '<div class="prog"><div class="pbar big"><i style="width:' + vp.pct + '%"></i></div><span>' + vp.pct + " %" + (v.id === "digital" ? " · progression du cours e-commerce" : " · " + vp.acq + "/" + vp.n + " leçons acquises") + "</span></div>" : "") +
    '<div style="margin-top:20px;display:flex;gap:10px;flex-wrap:wrap">' + (logged() ? (mine ? '<span class="chip solid" style="padding:8px 14px">C’est ta voie</span>' : '<button class="btn white" id="pick">Choisir cette voie</button>') : '<a class="btn white" href="#/inscription">Créer mon profil</a>') + "</div>" +
    '</div><div class="ph"><img src="' + img(v.img) + '" alt=""></div></div></section>';
  h += '<section class="sec tight"><div class="wrap mod"><div>';
  if (v.id === "digital") {
    h += '<div class="card pad"><span class="eyebrow">Un cours complet dédié</span><h2 class="h3" style="margin-top:4px">« E-commerce à l’international » — 12 chapitres, QCM, vidéos, 3 examens</h2>' +
      '<p style="margin-top:10px">Cette voie s’appuie sur le cours e-commerce de l’EPFC. Connecte-toi là-bas avec <b>le même matricule et le même code PIN</b> : ta progression y est suivie et s’ajoute à tes points de l’Académie.</p>' +
      '<div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap"><a class="btn" href="' + ECOM_URL + '" target="_blank" rel="noopener">Ouvrir le cours e-commerce ↗</a></div>' +
      (vp ? '<p class="note">Ta progression e-commerce actuelle : <b>' + (POOLED.ecom || 0) + " %</b>.</p>" : "") + "</div>";
  } else {
    h += '<div class="card"><div class="pad" style="border-bottom:1px solid var(--line-2)"><span class="eyebrow">Contenu de la voie</span><h2 class="h3" style="margin-top:4px">' + v.sections.length + ' leçons spécifiques</h2></div><div class="items">' + v.sections.map(function (s) { return itemRow(s); }).join("") + "</div></div>";
  }
  h += questionsBlock(v.id);
  h += '</div><div style="display:grid;gap:20px"><div class="card pad"><span class="eyebrow">Pour qui ?</span><p style="margin-top:8px">' + esc(v.pour_qui) + '</p></div><div class="card pad"><span class="eyebrow">Ce que tu feras</span><ul class="obj" style="margin-top:12px">' + v.ce_que_tu_feras.map(function (x) { return "<li>" + esc(x) + "</li>"; }).join("") + '</ul></div><div class="card pad"><span class="eyebrow">Exemples de projets</span><div class="chips" style="margin-top:10px">' + v.exemples.map(function (x) { return '<span class="chip">' + esc(x) + "</span>"; }).join("") + "</div></div></div></div></section>";
  after(function () { wireQuestions(); var p = $("#pick"); if (p) p.onclick = function () { saveProfile({ voie: v.id }).then(refresh).then(function () { toast("C’est noté : " + esc(v.titre)); route(); }); }; });
  return h;
}

/* ============ Vues : Examens ============ */
function vExamens() {
  var h = '<section class="pagehead"><div class="wrap"><div class="crumbs"><a href="#/">Accueil</a> · Examens</div><h1>Les examens</h1><p>Trois épreuves de 30 questions pour vérifier que tu maîtrises l’ensemble du cours. Ce sont des tests d’entraînement : repasse-les autant de fois que tu veux — seul ton meilleur score compte.</p></div></section>';
  h += '<section class="sec tight"><div class="wrap"><div class="grid g3">' + [1, 2, 3].map(function (n) {
    var e = A.exams["ent-exam-" + n]; if (!e) return "";
    var b = examBest(n);
    return '<a class="ccard" href="#/examen/' + n + '"><div class="ph"><img src="' + img(e.img) + '" alt=""><span class="chip solid tag">Examen ' + n + '</span></div><div class="bd"><h3>' + esc(e.titre.replace(/^Examen \d+ — /, "")) + "</h3><p>" + e.qcm.length + " questions · environ 30 minutes</p>" +
      (b !== null ? '<div class="pbar' + (b >= 70 ? " done" : "") + '"><i style="width:' + b + '%"></i></div>' : "") +
      '<div class="ft"><span>' + (b !== null ? "Meilleur score : <b class=\"num\" style=\"color:var(--epfc)\">" + b + " %</b>" : "Pas encore passé") + "</span><span>" + (b !== null ? "Repasser →" : "Commencer →") + "</span></div></div></a>";
  }).join("") + "</div></div></section>";
  return h;
}
function vExamen(n) {
  var key = "ent-exam-" + n, e = A.exams[key];
  if (!e) return vExamens();
  var h = '<section class="pagehead"><div class="wrap"><div class="crumbs"><a href="#/">Accueil</a> · <a href="#/examens">Examens</a> · Examen ' + n + "</div><h1>" + esc(e.titre) + "</h1><p>" + e.qcm.length + ' questions · 70 % pour réussir · résultats et explications à la fin.</p></div></section>' +
    '<section class="sec tight"><div class="wrap" style="max-width:860px"><div class="card reader" style="padding-top:20px"><div style="position:sticky;top:76px;background:#fff;padding:10px 0;z-index:5;border-bottom:1px solid var(--line-2);display:flex;justify-content:space-between;gap:10px;align-items:center"><b><span id="qcount" class="num">0</span> / ' + e.qcm.length + ' réponses</b><span class="sub">Meilleur score : ' + (examBest(n) !== null ? examBest(n) + " %" : "—") + "</span></div>" +
    '<div class="quiz" style="border:0;margin-top:0;padding-top:4px">' + qcmHtml(e.qcm, key) + '<div id="qres"></div><button class="btn lg" id="qgo" style="margin-top:18px">Rendre mon examen</button></div></div></div></section>';
  after(function () { wireQcm(key, e.qcm, true); });
  return h;
}

/* ============ Vue : Banc d'essai ============ */
function vBanc() {
  var b = {}; try { b = JSON.parse(lsGet("acad_banc") || "{}") || {}; } catch (e) { b = {}; }
  function f(k, l, hint) { return '<div class="fld"><label for="b-' + k + '">' + l + (hint ? ' <span class="hint">' + hint + "</span>" : "") + '</label><input class="inp num" id="b-' + k + '" inputmode="decimal" value="' + esc(b[k] || "") + '"></div>'; }
  var h = '<section class="pagehead"><div class="wrap"><div class="crumbs"><a href="#/">Accueil</a> · Banc d’essai</div><h1>Le banc d’essai</h1><p>Entre tes chiffres : l’outil calcule combien de ventes il te faut pour couvrir tes charges <b>et</b> te payer. Pas de sermon — rien que l’arithmétique.</p></div></section>' +
    '<section class="sec tight"><div class="wrap bench"><div class="card pad">' + f("prix", "Prix de vente", "par unité ou prestation, HTVA") + f("cout", "Coût variable", "par unité") + f("charges", "Charges fixes", "par mois") + f("salaire", "Ton salaire cible", "par mois") + f("ventes", "Ventes espérées", "par mois (facultatif)") +
    '</div><div><div id="b-out"></div><p class="note">Indicatif, hors TVA et cotisations sociales — on affine en atelier et au module 4.</p></div></div></section>';
  after(function () {
    function n(v) { var x = parseFloat(String(v || "").replace(",", ".")); return isNaN(x) ? 0 : x; }
    function eur(x) { return Math.round(x).toLocaleString("fr-BE") + " €"; }
    function calc() {
      ["prix", "cout", "charges", "salaire", "ventes"].forEach(function (k) { b[k] = $("#b-" + k).value; });
      lsSet("acad_banc", JSON.stringify(b));
      var p = n(b.prix), c = n(b.cout), ch = n(b.charges), s = n(b.salaire), v = n(b.ventes), o = $("#b-out");
      if (p <= 0) { o.innerHTML = '<div class="card pad empty">Entre au moins un prix de vente pour voir le verdict.</div>'; return; }
      var m = p - c, need = ch + s, seuil = m > 0 ? Math.ceil(need / m) : null;
      var html = '<div class="tiles"><div class="tile"><span>Marge par vente</span><b>' + eur(m) + '</b></div><div class="tile"><span>Taux de marge</span><b>' + Math.round(m / p * 100) + ' %</b></div><div class="tile"><span>Ventes / mois pour te payer</span><b>' + (seuil !== null ? fmt(seuil) : "∞") + '</b></div><div class="tile"><span>Chiffre d’affaires nécessaire</span><b>' + (seuil !== null ? eur(seuil * p) : "—") + "</b></div></div>";
      var msg, warn = false;
      if (m <= 0) { msg = "Tu perds de l’argent à chaque vente : augmente ton prix, baisse ton coût ou change de modèle."; warn = true; }
      else if (v > 0) { var r = v * m - need; msg = r >= 0 ? "À " + fmt(v) + " ventes par mois, ton activité te paie et dégage " + eur(r) + " de plus. Modèle viable — travaille maintenant ta marge et ta récurrence." : "À " + fmt(v) + " ventes par mois, il manque " + eur(-r) + " pour couvrir tes charges et ton salaire. Il t’en faut " + fmt(seuil) + "."; warn = r < 0; }
      else { msg = "Il te faut " + fmt(seuil) + " ventes par mois (soit " + eur(seuil * p) + " de chiffre d’affaires) pour couvrir tes charges et te verser " + eur(s) + ". " + (seuil > 200 ? "C’est beaucoup : ton modèle doit changer d’échelle ou de prix." : seuil > 60 ? "Exigeant mais possible." : "Atteignable — passe à la validation terrain."); warn = seuil > 200; }
      o.innerHTML = html + '<div class="verdict' + (warn ? " warn" : "") + '">' + msg + "</div>";
    }
    $$(".bench input").forEach(function (i) { i.oninput = calc; }); calc();
  });
  return h;
}

/* ============ Vue : Ressources ============ */
function vRessources() {
  var cards = [
    ["#/banc", "m4", "Outil", "Le banc d’essai", "Combien de ventes pour couvrir tes charges et te payer ? Le calcul en direct."],
    ["#/reperes", "rep_erreurs", "Repères", "10 erreurs, 10 facteurs de succès, tendances 2027, 12 terrains où entreprendre", "Quatre pages chiffrées et sourcées, à relire quand tu doutes."],
    ["fiches.html", "m1", "Inspiration", "Toutes les fiches d’entreprises", "Des dizaines d’entreprises décortiquées : de quoi trouver et cadrer ton idée."],
    ["revue.html", "hero", "Chaque semaine", "Le dernier numéro StartupScan", "La revue hebdo des modèles qui inspirent."],
    ["modeles.html", "voie_digital", "Modèles", "Qui paie ? Les modèles d’affaires", "Comprendre qui paie quoi, et pourquoi."],
    ["jeux-de-role.html", "methode", "Pratique", "Jeux de rôle", "Incarner les rôles de l’entreprise et décider sous contrainte."],
    ["sans-argent.html", "m2", "Se lancer", "Sans argent", "Démarrer avec peu : idées et étapes concrètes."],
    ["glossaire.html", "m5", "Référence", "Glossaire", "Tous les termes du business plan, expliqués simplement."]
  ];
  var h = '<section class="pagehead"><div class="wrap"><div class="crumbs"><a href="#/">Accueil</a> · Ressources</div><h1>Ressources</h1><p>La matière première de StartupScan, à utiliser à chaque étape — et une sélection de vidéos et lectures (+10 points chacune).</p></div></section>';
  h += '<section class="sec tight"><div class="wrap"><div class="grid g3">' + cards.map(function (c) { return '<a class="ccard" href="' + c[0] + '"><div class="ph"><img src="' + img(c[1]) + '" alt="" loading="lazy"></div><div class="bd"><span class="k">' + c[2] + "</span><h3>" + c[3] + " →</h3><p>" + c[4] + "</p></div></a>"; }).join("") + "</div>";
  h += '<div class="card pad" style="margin-top:32px"><span class="eyebrow">À voir, à lire</span><h2 class="h3" style="margin-top:4px">Coche ce que tu as vu</h2>' +
    A.ressources.map(function (r) { var seen = !!d("ent-res-" + r.k); return '<div class="res"><input type="checkbox" data-res="' + r.k + '"' + (seen ? " checked disabled" : "") + ' aria-label="Vu"><span class="lng' + (r.lng === "FR" ? " fr" : "") + '">' + r.lng + '</span><div><a href="' + esc(r.u) + '" target="_blank" rel="noopener">' + esc(r.t) + ' ↗</a><div class="d">' + esc(r.c) + " · " + esc(r.d) + "</div></div></div>"; }).join("") + "</div></div></section>";
  after(function () {
    $$("input[data-res]").forEach(function (c) { c.onchange = function () { if (!logged()) { c.checked = false; needAccount(); return; } c.disabled = true; track([{ kind: "video", sid: "ent-res-" + c.getAttribute("data-res") }]).then(function () { toast("+10 points · ressource vue"); header(CUR); }); }; });
  });
  return h;
}

/* ============ Vue : Témoignages ============ */
function vTemoignages() {
  var h = '<section class="pagehead"><div class="wrap"><div class="crumbs"><a href="#/">Accueil</a> · Témoignages</div><h1>Témoignages</h1><p>Ce que le parcours apporte, raconté par celles et ceux qui le suivent. Chaque témoignage est relu par l’équipe pédagogique avant publication.</p></div></section>';
  h += '<section class="sec tight"><div class="wrap"><div class="mod"><div id="t-list"><div class="loading">Chargement…</div></div><div>';
  if (logged()) {
    var t = MYT || {}, note = t.note || 0;
    h += '<div class="card pad"><span class="eyebrow">Ton témoignage</span>' +
      (MYT ? '<p style="margin-top:8px"><span class="chip ' + (MYT.status === "approved" ? "solid" : "") + '">' + (MYT.status === "approved" ? "Publié" : MYT.status === "pending" ? "En attente de relecture" : "Non retenu") + "</span></p>" : "") +
      '<div class="fld"><label>Ta note du parcours</label><div class="starsel" id="t-stars">' + [1, 2, 3, 4, 5].map(function (i) { return '<button type="button" data-s="' + i + '" class="' + (i <= note ? "on" : "") + '" aria-label="' + i + ' étoiles">' + I.star + "</button>"; }).join("") + "</div></div>" +
      '<div class="fld"><label for="t-txt">Ce que le parcours t’a apporté <span class="hint">(20 à 800 caractères)</span></label><textarea class="inp" id="t-txt" maxlength="800">' + esc(t.texte || "") + "</textarea></div>" +
      '<label class="check"><input type="checkbox" id="t-name"' + (t.show_name || !MYT ? " checked" : "") + "><span>Afficher mon prénom" + (PROFILE.prenom ? " (« " + esc(PROFILE.prenom) + " »)" : " — ajoute-le dans ton profil") + ". Sinon : « Étudiant·e de l’Académie ». Ton matricule n’est jamais affiché.</span></label>" +
      '<div id="t-err"></div><div style="display:flex;gap:10px;margin-top:18px;flex-wrap:wrap"><button class="btn" id="t-go">' + (MYT ? "Mettre à jour" : "Envoyer mon témoignage") + "</button>" + (MYT ? '<button class="btn ghost" id="t-del">Retirer</button>' : "") + "</div>" +
      '<p class="note">Une modification repasse en relecture. +30 points une fois publié.</p></div>';
  } else {
    h += '<div class="card pad"><img src="' + img("temoignages") + '" alt="" style="border-radius:10px"><h2 class="h3" style="margin-top:14px">Tu suis le parcours ?</h2><p class="sub" style="margin-top:6px">Connecte-toi pour partager ton expérience.</p><a class="btn" style="margin-top:14px" href="#/connexion">Se connecter</a></div>';
  }
  h += "</div></div></div></section>";
  after(function () {
    TESTI = null;
    loadTestimonials().then(function (l) {
      var b = $("#t-list"); if (!b) return;
      if (!l.length) { b.innerHTML = testimonialCards([]); return; }
      b.innerHTML = testimonialCards(l, 40);
    });
    var note = (MYT && MYT.note) || 0;
    $$("#t-stars button").forEach(function (bt) { bt.onclick = function () { note = +bt.getAttribute("data-s"); $$("#t-stars button").forEach(function (x) { x.classList.toggle("on", +x.getAttribute("data-s") <= note); }); }; });
    var g = $("#t-go");
    if (g) g.onclick = function () {
      var tx = $("#t-txt").value.trim();
      if (tx.length < 20) { $("#t-err").innerHTML = '<p class="err">Écris au moins 20 caractères.</p>'; return; }
      api("testimonial.php", { token: SES.token, texte: tx, note: note, show_name: $("#t-name").checked }).then(function (r) {
        if (r && r.ok) { refresh().then(function () { toast("Merci ! Ton témoignage sera publié après relecture."); route(); }); }
        else $("#t-err").innerHTML = '<p class="err">Envoi impossible pour l’instant.</p>';
      });
    };
    var del = $("#t-del");
    if (del) del.onclick = function () {
      if (!del.dataset.c) { del.dataset.c = 1; del.textContent = "Confirmer le retrait"; return; }
      api("testimonial.php", { token: SES.token, "delete": true }).then(function () { refresh().then(function () { toast("Témoignage retiré"); route(); }); });
    };
  });
  return h;
}

/* ============ Vue : Profil ============ */
function vProfil() {
  var c = PROFILE.couleur || COLORS[0];
  var h = '<section class="pagehead"><div class="wrap"><div class="crumbs"><a href="#/espace">Mon espace</a> · Mon profil</div><h1>Mon profil</h1><p>Personnalise ton espace. Tout est facultatif et modifiable à tout moment.</p></div></section>';
  h += '<section class="sec tight"><div class="wrap mod"><div class="card pad" style="padding:28px">' +
    '<div class="avedit"><span id="p-av">' + avatar(104) + '</span><div><label class="btn ghost sm" for="p-ph" style="cursor:pointer">' + (photo() ? "Changer la photo" : "Ajouter une photo") + '</label><input type="file" id="p-ph" accept="image/*" hidden>' + (photo() ? ' <button class="link" id="p-phx" style="margin-left:8px">Retirer</button>' : "") +
    '<p class="note" style="margin-top:8px">Ta photo reste sur cet appareil ; elle n’est jamais envoyée au serveur.</p><div class="swatches">' + COLORS.map(function (x) { return '<button class="sw' + (x === c ? " on" : "") + '" data-c="' + x + '" style="background:' + x + '" aria-label="Couleur"></button>'; }).join("") + "</div></div></div>" +
    '<div class="fld"><label for="p-pr">Prénom</label><input class="inp" id="p-pr" maxlength="40" value="' + esc(PROFILE.prenom || "") + '"></div>' +
    '<div class="fld"><label for="p-vo">Ma voie</label><select class="inp" id="p-vo"><option value="">Je ne sais pas encore</option>' + A.voies.map(function (v) { return '<option value="' + v.id + '"' + (PROFILE.voie === v.id ? " selected" : "") + ">" + esc(v.titre) + "</option>"; }).join("") + "</select></div>" +
    '<div class="fld"><label for="p-de">Mon point de départ</label><select class="inp" id="p-de"><option value="">—</option>' + DEPARTS.map(function (x) { return '<option value="' + x[0] + '"' + (PROFILE.depart === x[0] ? " selected" : "") + ">" + x[1] + "</option>"; }).join("") + "</select></div>" +
    '<div class="fld"><label for="p-id">Mon idée en une ligne</label><textarea class="inp" id="p-id" maxlength="200" style="min-height:80px">' + esc(PROFILE.idee || "") + "</textarea></div>" +
    '<div class="fld"><label for="p-st">Statut envisagé</label><select class="inp" id="p-st">' + STATUTS.map(function (x) { return '<option value="' + x[0] + '"' + (PROFILE.statut === x[0] ? " selected" : "") + ">" + x[1] + "</option>"; }).join("") + "</select></div>" +
    '<button class="btn lg" id="p-save" style="margin-top:22px">Enregistrer</button></div>' +
    '<div style="display:grid;gap:20px"><div class="card pad"><span class="eyebrow">Mon compte</span><p style="margin-top:8px">Matricule <b>' + esc(SES.matricule) + "</b></p><p class=\"sub\">Le même compte sert pour le cours e-commerce.</p></div>" +
    '<div class="card pad"><span class="eyebrow">Mon rapport</span><p class="sub" style="margin-top:6px">Un résumé de ta progression à copier pour ton professeur.</p><button class="btn ghost sm" id="p-rep" style="margin-top:12px">Générer mon rapport</button><textarea class="inp" id="p-rtx" hidden style="margin-top:12px;font-size:13px;min-height:200px"></textarea></div>' +
    '<div class="card pad"><span class="eyebrow">Mes données</span><p class="sub" style="margin-top:6px">Effacer définitivement ton compte, ta progression et ton témoignage (e-commerce compris).</p><button class="btn ghost sm" id="p-del" style="margin-top:12px;color:var(--ko)">Effacer mes données</button></div>' +
    '<button class="btn ghost" id="p-out">Se déconnecter</button></div></div></section>';
  after(function () {
    $$(".sw").forEach(function (b) { b.onclick = function () { PROFILE.couleur = b.getAttribute("data-c"); $$(".sw").forEach(function (x) { x.classList.toggle("on", x === b); }); $("#p-av").innerHTML = avatar(104); }; });
    $("#p-ph").onchange = function (e) { loadPhoto(e.target.files[0], function () { route(); }); };
    var x = $("#p-phx"); if (x) x.onclick = function () { lsSet(photoKey(), null); route(); };
    $("#p-save").onclick = function () {
      saveProfile({ prenom: $("#p-pr").value, voie: $("#p-vo").value || null, depart: $("#p-de").value || null, idee: $("#p-id").value, statut: $("#p-st").value, couleur: PROFILE.couleur || COLORS[0] })
        .then(refresh).then(function () { toast("Profil enregistré"); route(); });
    };
    $("#p-rep").onclick = function () {
      var t = $("#p-rtx"), L = [];
      L.push("RAPPORT DE PROGRÈS — Académie StartupScan (EPFC)");
      L.push("Matricule : " + SES.matricule + (PROFILE.prenom ? " (" + PROFILE.prenom + ")" : ""));
      L.push("Date : " + new Date().toLocaleDateString("fr-BE"));
      L.push("Voie : " + (myVoie() ? myVoie().titre : "non choisie"));
      L.push("");
      L.push("Progression : " + ME.global + " % · Compétence : " + ME.competence + " % · Niveau : " + ME.niveau.nom + " (" + ME.points + " points)");
      A.modules.forEach(function (m) { var p = modProgress(m); L.push("  Module " + m.num + " — " + m.titre + " : " + p.pct + " % (" + p.acq + "/" + p.n + " leçons" + (p.mission === null ? "" : ", mission " + p.mission + "/5") + ")"); });
      var v = myVoie(); if (v) L.push("  Voie — " + v.titre + " : " + voieProgress(v).pct + " %");
      [1, 2, 3].forEach(function (n) { var b = examBest(n); L.push("  Examen " + n + " : " + (b !== null ? b + " %" : "non passé")); });
      L.push("");
      L.push("Points toutes formations : " + POOLED.total + " (e-commerce " + POOLED.ecom + " % + entrepreneuriat " + POOLED.entr + " %)");
      t.hidden = false; t.value = L.join("\n"); t.focus(); t.select();
    };
    var del = $("#p-del");
    del.onclick = function () {
      if (!del.dataset.c) { del.dataset.c = 1; del.textContent = "Confirmer : tout effacer définitivement"; return; }
      api("forget.php", { token: SES.token }).then(function () { lsSet(photoKey(), null); SES = {}; saveSes(); ME = null; DETAIL = {}; PROFILE = {}; MYT = null; toast("Tes données ont été effacées."); go("#/accueil"); });
    };
    $("#p-out").onclick = logout;
  });
  return h;
}

/* ============ Démarrage ============ */
footer();
window.addEventListener("hashchange", route);
refresh().then(route);
})();
