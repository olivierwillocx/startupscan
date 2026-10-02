# StarupScan

Revue hebdomadaire de modèles d'affaires innovants — monde entier.  
Initiative EPFC · Olivier Willocx

---

## Mise en ligne — Guide pas à pas

### 1. Créer le repo GitHub

1. Allez sur [github.com](https://github.com) et connectez-vous (via Google)
2. Cliquez **New repository**
3. Nom : `startupscan`
4. Visibilité : **Public** (ou Private, selon votre préférence)
5. Ne pas initialiser avec README (on va pousser les fichiers)
6. Cliquez **Create repository**

### 2. Pousser les fichiers

Depuis votre terminal (ou via GitHub Desktop) :

```bash
cd startupscan/
git init
git add .
git commit -m "Initial commit — StarupScan"
git branch -M main
git remote add origin https://github.com/olivierwillocx/startupscan.git
git push -u origin main
```

### 3. Ajouter les secrets FTP OVH

1. Dans le repo GitHub → **Settings** → **Secrets and variables** → **Actions**
2. Cliquez **New repository secret** et ajoutez ces 3 secrets :

| Nom | Valeur |
|-----|--------|
| `OVH_FTP_SERVER` | (ex: `ftp.cluster129.hosting.ovh.net`) |
| `OVH_FTP_USERNAME` | (votre login FTP OVH pour startupscan.eu) |
| `OVH_FTP_PASSWORD` | (votre mot de passe FTP OVH) |

> **Où trouver ces infos ?**  
> OVH → Mon compte → Hébergements → startupscan.eu → **FTP-SSH**

### 4. Configurer le multisite OVH

1. OVH → Hébergements → startupscan.eu → **Multisite**
2. Ajouter le domaine `startupscan.eu` avec le dossier racine `www`
3. Activer le SSL Let's Encrypt

### 5. Vérifier le déploiement

Après chaque `git push`, allez dans votre repo GitHub → **Actions** pour suivre le déploiement. En cas de succès ✅, votre site est en ligne sur startupscan.eu.

---

## Mise à jour hebdomadaire

Chaque numéro est un fichier `data/issues/nXX.json` (même structure que `n01.json`).
Pour publier le numéro N :

1. Créer `data/issues/nNN.json`
2. Créer `archives/nNN.html` (copie de `n01.html` avec `issue: 'nNN'` et le titre)
3. Ajouter le numéro dans `data/manifest.json` et mettre `latest` à `nNN`
4. `git add . && git commit -m "N° NN" && git push` — GitHub Actions déploie sur OVH

La page d'accueil affiche toujours `latest` ; chaque numéro reste accessible à `archives/nNN.html`.

## Structure du projet

```
startupscan/
├── index.html              ← Accueil : charge le dernier numéro
├── app.js                  ← Rendu de toutes les rubriques
├── style.css
├── favicon.svg
├── archives/
│   └── n01.html            ← Numéro 1, adresse permanente
├── data/
│   ├── manifest.json       ← Liste des numéros + latest
│   └── issues/n01.json     ← Contenu du numéro 1
└── .github/workflows/deploy.yml  ← Pipeline FTP → OVH
```
