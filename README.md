# Portfolio JP AYIVI — version démo (site statique)

Aperçu dynamique du site **JP AYIVI — Créateur d'images**, à partager avec le client via une URL publique (GitHub Pages).

- `index.html` — page d'accueil
- `studio.html` — page intérieure « galerie mosaïque » (démo)
- `assets/` — CSS + polices
- `media/` — images et vidéos optimisées pour le web

> ⚠️ **Polices** : Jumper (« personal use only ») et Maison Neue sont ici à titre de démonstration.
> Pour une mise en ligne définitive/commerciale, acheter les licences webfont ou passer à des équivalents libres.

---

## Mettre en ligne sur GitHub Pages (≈ 5 min)

1. Créer un compte sur https://github.com (gratuit).
2. Cliquer **New repository** → nom : `jpayivi-site` → **Public** → *Create repository*.
3. Sur la page du dépôt : **Add file ▸ Upload files**, puis glisser **tout le contenu de ce dossier** (les fichiers `.html`, les dossiers `assets/` et `media/`, ainsi que `.nojekyll`). Valider avec **Commit changes**.
4. Aller dans **Settings ▸ Pages**.
5. Sous *Build and deployment ▸ Source*, choisir **Deploy from a branch**, branche **main**, dossier **/ (root)**, puis **Save**.
6. Patienter 1–2 min : GitHub affiche l'URL publique du type
   `https://<votre-nom>.github.io/jpayivi-site/`
7. Partager ce lien au client. ✅

### Alternative en ligne de commande (si Git installé)
```bash
cd site_github
git init
git add .
git commit -m "Site JP AYIVI — démo"
git branch -M main
git remote add origin https://github.com/<votre-nom>/jpayivi-site.git
git push -u origin main
```
Puis activer Pages via **Settings ▸ Pages** (étapes 4–6).

---

## Bon à savoir
- Le site est **statique** : c'est une démo de validation visuelle, pas encore le WordPress éditable.
- Les médias ont été **optimisés** (images redimensionnées, gros GIF convertis en vidéo MP4) → chargement rapide, dépôt léger (~9 Mo).
- Pour un nom de domaine personnalisé (ex. `jpayivi.fr`), c'est configurable dans **Settings ▸ Pages ▸ Custom domain**.
