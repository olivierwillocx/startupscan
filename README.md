# StarupScan

Revue hebdomadaire de modÃ¨les d'affaires innovants â€” monde entier.  
Initiative EPFC Â· Olivier Willocx

---

## Mise en ligne â€” Guide pas Ã  pas

### 1. CrÃ©er le repo GitHub

1. Allez sur [github.com](https://github.com) et connectez-vous (via Google)
2. Cliquez **New repository**
3. Nom : `startupscan`
4. VisibilitÃ© : **Public** (ou Private, selon votre prÃ©fÃ©rence)
5. Ne pas initialiser avec README (on va pousser les fichiers)
6. Cliquez **Create repository**

### 2. Pousser les fichiers

Depuis votre terminal (ou via GitHub Desktop) :

```bash
cd startupscan/
git init
git add .
git commit -m "Initial commit â€” StarupScan"
git branch -M main
git remote add origin https://github.com/olivierwillocx/startupscan.git
git push -u origin main
```

### 3. Ajouter les secrets FTP OVH

1. Dans le repo GitHub â†’ **Settings** â†’ **Secrets and variables** â†’ **Actions**
2. Cliquez **New repository secret** et ajoutez ces 3 secrets :

| Nom | Valeur |
|-----|--------|
| `OVH_FTP_SERVER` | (ex: `ftp.cluster129.hosting.ovh.net`) |
| `OVH_FTP_USERNAME` | (votre login FTP OVH pour startupscan.eu) |
| `OVH_FTP_PASSWORD` | (votre mot de passe FTP OVH) |

> **OÃ¹ trouver ces infos ?**  
> OVH â†’ Mon compte â†’ HÃ©bergements â†’ startupscan.eu â†’ **FTP-SSH**

### 4. Configurer le multisite OVH

1. OVH â†’ HÃ©bergements â†’ startupscan.eu â†’ **Multisite**
2. Ajouter le domaine `startupscan.eu` avec le dossier racine `startupscan` (séparé de `www` qui héberge cityscan.be)
3. Activer le SSL Let's Encrypt

### 5. VÃ©rifier le dÃ©ploiement

AprÃ¨s chaque `git push`, allez dans votre repo GitHub â†’ **Actions** pour suivre le dÃ©ploiement. En cas de succÃ¨s âœ…, votre site est en ligne sur startupscan.eu.

---

## Mise Ã  jour hebdomadaire

Chaque semaine, Claude gÃ©nÃ¨re un nouveau fichier `data/week-YYYY-WW.json`  
et met Ã  jour `data/manifest.json`.  
Un simple `git push` dÃ©clenche la mise en ligne automatique.

## Structure du projet

```
startupscan/
â”œâ”€â”€ index.html              â† Site principal
â”œâ”€â”€ data/
â”‚   â”œâ”€â”€ manifest.json       â† Liste des semaines disponibles
â”‚   â””â”€â”€ week-2026-40.json   â† Fiches de la semaine 40/2026
â””â”€â”€ .github/
    â””â”€â”€ workflows/
        â””â”€â”€ deploy.yml      â† Pipeline FTP â†’ OVH
```
