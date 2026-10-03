# -*- coding: utf-8 -*-
"""Genere les pages statiques du site : une page par fiche, les pages
permanentes (outils, glossaire, modeles, sans argent), l'index des archives
et le sitemap. Aucune IA ici, pure generation.

    python build\\build-pages.py
"""
import json, os, re, shutil, unicodedata
from datetime import date

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
V = "5"                      # version des scripts/styles (cache navigateur)
SITE = "https://startupscan.eu"


def J(p):
    return json.load(open(os.path.join(ROOT, p), encoding="utf-8"))


def slug(s):
    s = str(s).lower()
    s = "".join(c for c in unicodedata.normalize("NFD", s)
                if unicodedata.category(c) != "Mn")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")


def esc(s):
    return (str("" if s is None else s).replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace('"', "&quot;"))


def model_class(m):
    s = (m or "").lower()
    if "place de march" in s: return "market"
    if s.startswith("b2g"): return "b2g"
    if "b2b" in s: return "b2b"
    if "b2c" in s or "d2c" in s: return "b2c"
    return "other"


NAV = [("index.html", "Dernier numéro"), ("fiches.html", "Toutes les fiches"),
       ("modeles.html", "Qui paie ?"), ("outils.html", "Outils"),
       ("glossaire.html", "Glossaire"), ("sans-argent.html", "Sans argent"),
       ("jeux.html", "Les jeux"), ("archives.html", "Archives")]


def page(path, title, desc, tag, body, depth=0):
    """Ecrit une page complete. depth = nombre de dossiers de profondeur."""
    b = "../" * depth or "./"
    nav = "".join('<a href="%s%s"%s>%s</a>' % (b, h, ' class="active"' if h == os.path.basename(path) else "", esc(l))
                  for h, l in NAV)
    html = """<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>%(title)s</title>
  <meta name="description" content="%(desc)s">
  <link rel="canonical" href="%(canon)s">
  <link rel="icon" href="%(b)sfavicon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="%(b)sstyle.css?v=%(v)s">
</head>
<body>
<div id="app">
<header class="masthead"><div class="wrap">
  <a class="logo" href="%(b)sindex.html"><span class="logo-icon">S</span><span class="logo-text">Startup<span>Scan</span></span></a>
  <div class="issue-tag">%(tag)s</div>
</div></header>
<nav class="topnav"><div class="wrap">%(nav)s</div></nav>
<main>
%(body)s
</main>
<footer><div class="wrap">
  <b>StartupScan</b> est préparé par Olivier Willocx, enseignant en entrepreneuriat et business plan à l'EPFC · <a href="mailto:olwillocx@epfc.eu">olwillocx@epfc.eu</a><br>
  Montants et chiffres tels qu'annoncés par les entreprises ou la presse ; ce sont des données déclarées, pas des comptes audités.
</div></footer>
</div>
</body>
</html>
""" % dict(title=esc(title), desc=esc(desc), canon=SITE + "/" + path.replace(os.sep, "/"),
           b=b, v=V, tag=tag, nav=nav, body=body)
    full = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(full), exist_ok=True)
    open(full, "w", encoding="utf-8").write(html)
    return path


def sources_html(lst):
    return " · ".join('<a href="%s" target="_blank" rel="noopener">%s</a>'
                      % (esc(s.get("url", "#")), esc(s.get("label", ""))) for s in (lst or []))


# ---------------------------------------------------------------- une fiche
def fiche_page(f, voisines, urls):
    mc = model_class(f.get("model"))
    facts = "".join("<span>%s</span>" % esc(x) for x in (f.get("facts") or []))
    rec = f.get("recap") or {}
    body = """
<div class="hero fiche-hero"><div class="wrap">
  <div class="kicker"><a href="../archives/%(iid)s.html">N° %(num)s · %(ilab)s</a> · %(rub)s</div>
  <h1>%(name)s</h1>
  <p class="lead">%(desc)s</p>
  <div class="game-meta"><span>%(place)s</span><span>%(sector)s</span><span>%(model)s</span>%(levee)s</div>
</div></div>

<section class="block"><div class="wrap">
  %(flow)s
  <h2>Les chiffres</h2>
  <div class="facts facts-big">%(facts)s</div>
  <h2>La leçon</h2>
  <p class="fiche-lesson">%(lesson)s</p>
  <p class="small-src">Source%(s)s : %(sources)s</p>
  <p class="note">Chiffres déclarés par l'entreprise ou repris par la presse, relus contre leur source à la parution du numéro %(num)s. Vérifiez avant de réutiliser.</p>
</div></section>

<section class="block"><div class="wrap">
  <h2>À lire à côté</h2>
  <p class="intro">Les fiches du même chapitre du business plan.</p>
  <div class="grid">%(voisines)s</div>
  <p><a class="lib-link" href="../fiches.html?ch=%(ch)s">Toutes les fiches du chapitre →</a> &nbsp; <a class="lib-link" href="../fiches.html">La bibliothèque complète →</a></p>
</div></section>
""" % dict(
        iid=esc(f["issueId"]), num=f["issue"], ilab=esc(f["issueLabel"]), rub=esc(f.get("rubrique", "")),
        name=esc(f["name"]), desc=esc(f.get("desc", "")), place=esc(f.get("place", "")),
        sector=esc(f.get("sector", "")), model=esc(f.get("model", "")),
        levee=("<span>%s</span>" % esc(rec.get("levee")) if rec.get("levee") and rec["levee"] != "—" else ""),
        flow=('<div class="flow flow-big">%s</div>' % f["flow"]) if f.get("flow") else "",
        facts=facts, lesson=esc(f.get("lesson", "")),
        s="s" if len(f.get("sources") or []) > 1 else "", sources=sources_html(f.get("sources")),
        voisines="".join(mini_card(v, urls) for v in voisines), ch=esc(f.get("chapter", "")))
    return page(urls[id(f)], "%s — StartupScan" % f["name"],
                "%s %s · %s. %s" % (f.get("place", ""), f.get("sector", ""), f.get("model", ""), f.get("desc", ""))[:300],
                "<b>Fiche</b><br>N° %s · %s" % (f["issue"], esc(f["issueLabel"])), body, depth=1)


def mini_card(f, urls):
    mc = model_class(f.get("model"))
    return """
<article class="card %s fiche mini">
  <div class="bar"></div>
  <div class="body">
    <div class="head"><h3><a href="../%s">%s</a></h3><span class="tag %s">%s</span></div>
    <div class="meta">%s · %s</div>
    <p class="desc">%s</p>
  </div>
</article>""" % (mc, urls[id(f)], esc(f["name"]), mc, esc(f.get("model", "")),
                 esc(f.get("place", "")), esc(f.get("sector", "")), esc(f.get("desc", ""))[:160])


# -------------------------------------------------------- pages permanentes
def page_modeles(site):
    m = site["models"]
    cards = "".join("""
    <div class="model %s"><h3>%s</h3><p>%s</p>
      <dl><dt>Prix</dt><dd>%s</dd><dt>Vente</dt><dd>%s</dd><dt>Atout</dt><dd>%s</dd><dt>Piège</dt><dd>%s</dd></dl>
      <p><a class="lib-link" href="./fiches.html?model=%s">Les fiches de ce modèle →</a></p>
    </div>""" % (esc(x["key"]), esc(x["title"]), esc(x["desc"]), esc(x["prix"]),
                 esc(x["vente"]), esc(x["atout"]), esc(x["piege"]), esc(x["key"]))
        for x in m["list"])
    others = "".join("<div><b>%s</b> — %s</div>" % (esc(o["title"]), esc(o["text"])) for o in m.get("others", []))
    body = """
<div class="hero"><div class="wrap">
  <div class="kicker">Les fondamentaux</div><h1>Qui paie ?</h1>
  <p class="lead">%s</p>
</div></div>
<section class="block"><div class="wrap">
  <div class="models">%s</div>
  <h3 style="font-size:16px;color:var(--navy);margin:22px 0 8px">Et les autres</h3>
  <div class="others">%s</div>
</div></section>""" % (esc(m["intro"]), cards, others)
    return page("modeles.html", "Qui paie ? Les modèles d'affaires — StartupScan",
                "B2B, B2C, B2G, place de marché : à qui vend-on, à quel prix, avec quel atout et quel piège.",
                "<b>Les fondamentaux</b><br>Les modèles d'affaires", body)


def page_glossaire(site):
    g = site["glossary"]
    body = """
<div class="hero"><div class="wrap">
  <div class="kicker">Les fondamentaux</div><h1>Glossaire</h1>
  <p class="lead">%s Il compte aujourd'hui %d entrées.</p>
</div></div>
<section class="block"><div class="wrap">
  <input id="glo-q" type="search" placeholder="Chercher un mot…" autocomplete="off">
  <dl class="glossary" id="glo-list">%s</dl>
  <p class="note" id="glo-count"></p>
</div></section>
<script>
(function(){var q=document.getElementById('glo-q'),l=document.getElementById('glo-list'),c=document.getElementById('glo-count');
var n=function(s){return s.toLowerCase().normalize('NFD').replace(/[\\u0300-\\u036f]/g,'')};
var pairs=[];var k=l.children;for(var i=0;i<k.length;i+=2)pairs.push([k[i],k[i+1]]);
q.addEventListener('input',function(){var v=n(q.value),m=0;
pairs.forEach(function(p){var ok=!v||n(p[0].textContent+' '+p[1].textContent).indexOf(v)>-1;
p[0].classList.toggle('hidden',!ok);p[1].classList.toggle('hidden',!ok);if(ok)m++;});
c.textContent=v?m+' terme'+(m>1?'s':'')+' sur '+pairs.length:'';});})();
</script>""" % (esc(g["intro"]), len(g["terms"]),
                "".join("<dt>%s</dt><dd>%s</dd>" % (esc(t["term"]), esc(t["def"])) for t in g["terms"]))
    return page("glossaire.html", "Glossaire — StartupScan",
                "Les mots des fiches expliqués en une phrase : amorçage, valorisation, B2G, place de marché, point mort…",
                "<b>Les fondamentaux</b><br>%d termes" % len(g["terms"]), body)


def page_sans_argent(site):
    nm = site["noMoney"]
    br = nm.get("brussels") or {}
    body = """
<div class="hero"><div class="wrap">
  <div class="kicker">Se lancer</div><h1>Pas d'argent ? Par où commencer</h1>
  <p class="lead">%s</p>
</div></div>
<section class="block"><div class="wrap">
  <h2>Six pistes qui ne demandent presque rien</h2>
  <div class="ideas">%s</div>
  <h2>Quatre réflexes</h2>
  <div class="steps">%s</div>
  <div class="callout"><b>À éviter.</b> %s</div>
  <div class="bxl"><div class="kicker-sm">Bruxelles en chiffres</div><h3>%s</h3><p>%s Source : <a href="%s" target="_blank" rel="noopener">%s</a></p></div>
</div></section>""" % (
        esc(nm["intro"]),
        "".join("<div><b>%s</b>%s</div>" % (esc(i["title"]), esc(i["text"])) for i in nm.get("ideas", [])),
        "".join('<div class="step"><h3>%s</h3>%s</div>' % (esc(s["title"]), esc(s["text"])) for s in nm.get("steps", [])),
        esc(nm.get("avoid", "")), esc(br.get("title", "")), esc(br.get("text", "")),
        esc((br.get("source") or {}).get("url", "#")), esc((br.get("source") or {}).get("label", "")))
    return page("sans-argent.html", "Pas d'argent ? Par où commencer — StartupScan",
                "Démarrer sans capital : prévendre, louer plutôt qu'acheter, commencer à côté, se faire accompagner.",
                "<b>Se lancer</b><br>Sans capital de départ", body)


def page_outils(site):
    be, pa = site["breakeven"], site["parcours"]
    d = be["defaults"]
    chapters = "".join('<li><b>%s</b> — <a href="./fiches.html?ch=%s">voir les fiches</a></li>'
                       % (esc(c["label"]), esc(c["key"])) for c in pa.get("chapters", []))
    body = """
<div class="hero"><div class="wrap">
  <div class="kicker">Outils</div><h1>Deux outils pour votre projet</h1>
  <p class="lead">Le point mort répond à la seule question qui compte avant d'ouvrir : combien de clients par jour pour tenir. La grille de fiche vous fait écrire votre projet dans le même format que les entreprises du site — c'est le meilleur test de clarté qui soit.</p>
</div></div>

<section class="block"><div class="wrap">
  <div class="tool" id="point-mort">
    <div class="kicker-sm">Outil · le point mort</div>
    <h3>%(betitle)s</h3>
    <div class="tool-grid">
      <div><label>Frais fixes par mois (€)</label><input type="number" id="be-fixed" value="%(fixed)s" min="0"></div>
      <div><label>Prix moyen d'une vente (€)</label><input type="number" id="be-price" value="%(price)s" min="0" step="0.5"></div>
      <div><label>Coût de cette vente (€)</label><input type="number" id="be-cost" value="%(cost)s" min="0" step="0.5"></div>
      <div><label>Jours ouverts par mois</label><input type="number" id="be-days" value="%(days)s" min="1" max="31"></div>
    </div>
    <div class="tool-out">
      <div><b id="be-margin">—</b><span>Marge par vente</span></div>
      <div><b id="be-sales">—</b><span>Ventes par mois</span></div>
      <div><b id="be-daily" class="hot">—</b><span>Clients par jour</span></div>
    </div>
    <p class="note">%(benote)s</p>
  </div>
</div></section>

<section class="block" id="parcours"><div class="wrap">
  <h2>Parcours business plan</h2>
  <p class="intro">%(paintro)s</p>
  <ul class="rules">%(chapters)s</ul>
  <div class="myfiche">
    <div class="kicker-sm">Votre fiche · même grille que les autres</div>
    <h3>%(formtitle)s</h3>
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
    <p class="note">%(formnote)s</p>
  </div>
</div></section>
<script src="./outils.js?v=%(v)s"></script>""" % dict(
        betitle=esc(be["title"]), benote=esc(be["note"]), fixed=d["fixed"], price=d["price"],
        cost=d["cost"], days=d["days"], paintro=esc(pa["intro"]), chapters=chapters,
        formtitle=esc(pa["form"]["title"]), formnote=esc(pa["form"]["note"]), v=V)
    return page("outils.html", "Outils : point mort et grille de fiche — StartupScan",
                "Calculez combien de clients par jour couvrent vos frais fixes, et écrivez votre projet dans la grille StartupScan.",
                "<b>Outils</b><br>Point mort · votre fiche", body)


def page_archives(manifest, fiches):
    rows = "".join("""<a href="./archives/%s.html"><b>N° %s</b> · %s<br><span>%s fiches</span></a>"""
                   % (esc(i["id"]), i["number"], esc(i["weekLabel"]), i.get("fiches", ""))
                   for i in sorted(manifest["issues"], key=lambda x: -x["number"]))
    body = """
<div class="hero"><div class="wrap">
  <div class="kicker">Archives</div><h1>Tous les numéros</h1>
  <p class="lead">Chaque numéro reste à son adresse propre. Pour chercher une entreprise précise plutôt que de parcourir les numéros, passez par <a href="./fiches.html">la bibliothèque</a> : %d fiches, filtrables.</p>
</div></div>
<section class="block"><div class="wrap">
  <div class="archives archives-big">%s</div>
</div></section>""" % (len(fiches), rows)
    return page("archives.html", "Archives — StartupScan",
                "Tous les numéros de StartupScan, du premier au dernier.",
                "<b>Archives</b><br>%d numéros" % len(manifest["issues"]), body)


def main():
    site = J("data/site.json")
    manifest = J("data/manifest.json")
    corpus = J("data/corpus.json")
    fiches = corpus["fiches"]

    # une URL par fiche, collisions resolues par le numero
    urls, taken = {}, {}
    for f in fiches:
        s = slug(f["name"])
        if s in taken:
            s = "%s-n%02d" % (s, f["issue"])
        taken[s] = True
        urls[id(f)] = "f/%s.html" % s
        f["url"] = urls[id(f)]

    written = []
    for f in fiches:
        same = [v for v in fiches
                if v is not f and v.get("chapter") == f.get("chapter")][:3]
        if len(same) < 3:
            same += [v for v in fiches if v is not f and v not in same][:3 - len(same)]
        written.append(fiche_page(f, same, urls))

    written += [page_modeles(site), page_glossaire(site), page_sans_argent(site),
                page_outils(site), page_archives(manifest, fiches)]

    # l'index des fiches sert aussi a la bibliotheque : on y ecrit les URL
    json.dump(corpus, open(os.path.join(ROOT, "data/corpus.json"), "w", encoding="utf-8"),
              ensure_ascii=False, indent=1)

    # chaque numero recoit aussi l'URL de la page de ses fiches
    by_name = {(f["issue"], f["name"]): f["url"] for f in fiches}
    idir = os.path.join(ROOT, "data", "issues")
    for fn in sorted(os.listdir(idir)):
        if not fn.endswith(".json"):
            continue
        d = json.load(open(os.path.join(idir, fn), encoding="utf-8"))
        for key in ("levers", "fiches", "pousses", "simples"):
            block = d.get(key)
            items = block if isinstance(block, list) else (
                (block or {}).get("cases") if key == "levers" else (block or {}).get("list"))
            for it in (items or []):
                u = by_name.get((d["number"], it["name"]))
                if u:
                    it["url"] = u
        json.dump(d, open(os.path.join(idir, fn), "w", encoding="utf-8"),
                  ensure_ascii=False, indent=2)

    # sitemap
    pages = ["index.html", "fiches.html", "jeux.html"] + [p for p in written] \
            + ["archives/%s.html" % i["id"] for i in manifest["issues"]]
    today = date.today().isoformat()
    sm = ['<?xml version="1.0" encoding="UTF-8"?>',
          '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for p in dict.fromkeys(pages):
        sm.append("  <url><loc>%s/%s</loc><lastmod>%s</lastmod></url>" % (SITE, p, today))
    sm.append("</urlset>")
    open(os.path.join(ROOT, "sitemap.xml"), "w", encoding="utf-8").write("\n".join(sm))
    open(os.path.join(ROOT, "robots.txt"), "w", encoding="utf-8").write(
        "User-agent: *\nAllow: /\nSitemap: %s/sitemap.xml\n" % SITE)

    print("%d pages de fiches + %d pages permanentes" % (len(fiches), len(written) - len(fiches)))
    print("sitemap : %d URL" % len(dict.fromkeys(pages)))


if __name__ == "__main__":
    main()
