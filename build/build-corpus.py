# -*- coding: utf-8 -*-
"""Construit data/corpus.json : toutes les fiches de tous les numeros,
enrichies de mots-cles de recherche generes par le modele local (LM Studio).
Lancer depuis le dossier du depot :  python build\\build-corpus.py
"""
import json, os, re, sys, time, hashlib, urllib.request, urllib.error

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ISSUES = os.path.join(ROOT, "data", "issues")
CACHE_PATH = os.path.join(ROOT, "build", "keywords-cache.json")
OUT = os.path.join(ROOT, "data", "corpus.json")
API = "http://localhost:1234/v1/chat/completions"
MODEL = os.environ.get("SS_MODEL", "openai/gpt-oss-120b")

RUBRIQUES = [("levers", "Modele innovant"), ("fiches", "Fiche de la semaine"),
             ("pousses", "Petite pousse"), ("simples", "Modele simple")]

PROMPT = u"""Tu prepares le moteur de recherche d'un site pedagogique belge sur les modeles d'affaires, utilise par des etudiants qui redigent un business plan.

Pour la fiche ci-dessous, donne 10 expressions de recherche en francais qu'un etudiant pourrait taper pour tomber sur cette fiche. Inclus : le secteur en mots courants, le type de client, le mecanisme economique, le probleme resolu, et des synonymes. N'inclus PAS le nom de l'entreprise. Pas de mots anglais sauf s'ils sont d'usage courant en francais.

Reponds UNIQUEMENT par un objet JSON de la forme {"mots": ["...", "..."]}, sans aucun texte autour.

Fiche :
Nom : %(name)s
Lieu : %(place)s
Secteur : %(sector)s
Modele : %(model)s
Description : %(desc)s
Lecon : %(lesson)s
"""


def chat(prompt, retries=2):
    body = json.dumps({"model": MODEL,
                       "messages": [{"role": "user", "content": prompt}],
                       "temperature": 0.3, "max_tokens": 400}).encode("utf-8")
    for attempt in range(retries + 1):
        try:
            req = urllib.request.Request(API, data=body,
                                         headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=600) as r:
                return json.load(r)["choices"][0]["message"]["content"]
        except Exception as e:
            if attempt == retries:
                raise
            time.sleep(2)


def parse_words(txt):
    txt = re.sub(r"<think>.*?</think>", "", txt, flags=re.S)
    m = re.search(r"\{.*\}", txt, re.S)
    words = []
    if m:
        try:
            words = json.loads(m.group(0)).get("mots", [])
        except Exception:
            words = re.findall(r'"([^"\n]{3,60})"', m.group(0))
    if not words:
        # repli : une expression par ligne, puces ou numeros eventuels
        for line in txt.splitlines():
            line = re.sub(r'^\s*(?:[-*\u2022]|\d+[.)])\s*', '', line).strip(' ",')
            if 2 < len(line) < 60 and not line.startswith(("{", "}", "[", "]")) \
               and "mots" not in line.lower():
                words.append(line)
    out, seen = [], set()
    for w in words:
        w = re.sub(r"\s+", " ", str(w)).strip().lower()
        if 2 < len(w) < 60 and w not in seen:
            seen.add(w)
            out.append(w)
    return out[:12]


def main():
    cache = {}
    if os.path.exists(CACHE_PATH):
        cache = json.load(open(CACHE_PATH, encoding="utf-8"))

    issues = sorted(f for f in os.listdir(ISSUES) if f.endswith(".json"))
    fiches, miss = [], 0

    for fn in issues:
        d = json.load(open(os.path.join(ISSUES, fn), encoding="utf-8"))
        for key, label in RUBRIQUES:
            block = d.get(key)
            if isinstance(block, list):
                items = block
            elif isinstance(block, dict):
                items = block.get("cases") if key == "levers" else block.get("list")
            else:
                items = []
            for f in (items or []):
                e = dict(f)
                e["issue"] = d["number"]
                e["issueId"] = d["id"]
                e["issueLabel"] = d["weekLabel"]
                e["rubrique"] = label
                key_h = hashlib.sha1(
                    (f["name"] + "|" + f.get("desc", "")).encode("utf-8")).hexdigest()[:16]
                if key_h in cache:
                    e["kw"] = cache[key_h]
                else:
                    t = time.time()
                    try:
                        words = parse_words(chat(PROMPT % {
                            "name": f["name"], "place": f.get("place", ""),
                            "sector": f.get("sector", ""), "model": f.get("model", ""),
                            "desc": f.get("desc", ""), "lesson": f.get("lesson", "")}))
                    except Exception as err:
                        print("  ! %s : %s" % (f["name"], err)); words = []
                    if words:
                        cache[key_h] = words
                        json.dump(cache, open(CACHE_PATH, "w", encoding="utf-8"),
                                  ensure_ascii=False, indent=1)
                    else:
                        miss += 1
                    print("  %-34s %2d mots  %4.1fs" % (f["name"][:34], len(words), time.time() - t))
                    sys.stdout.flush()
                    e["kw"] = words
                fiches.append(e)

    json.dump({"generated": time.strftime("%Y-%m-%d"),
               "model": MODEL, "fiches": fiches},
              open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=1)
    print("\n%d fiches -> data/corpus.json (%d octets), %d sans mots-cles"
          % (len(fiches), os.path.getsize(OUT), miss))


if __name__ == "__main__":
    main()
