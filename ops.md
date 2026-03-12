# Ops - Mon P'tit Poulet

## Architecture

- **Front** : React/Vite, statique servi par Vercel (`dist/`)
- **API** : Serverless functions Vercel (`api/*.js`)
- **Stockage config** : Redis (via `REDIS_URL` env var sur Vercel)
- **Domaine** : `www.mppp.fr` (`mppp.fr` redirige vers `www`)

## Admin Settings (horaires, fermeture, etc.)

Les settings admin vivent a **3 niveaux** — attention a la priorite :

1. **Redis** (`mpp:admin:settings`) — source de verite en prod, lue par l'API
2. **localStorage** (`mpp_admin_settings`) — cache navigateur, rafraichi depuis l'API au chargement
3. **Code defaults** (`src/data/constants.ts`, `api/admin-config.js`) — fallback si Redis est vide

### Changer les horaires

**Via le panel admin** (prefere) :
- Aller sur `/admin`, se connecter, modifier les horaires → ca ecrit dans Redis via `POST /api/admin-config`

**Via curl** (si le panel deconne) :
```bash
curl -sL -X POST "https://www.mppp.fr/api/admin-config" \
  -H "Content-Type: application/json" \
  -d @payload.json
```

Ou `payload.json` :
```json
{
  "email": "contact@mppp.fr",
  "password": "<ADMIN_PASSWORD>",
  "config": {
    "isClosed": false,
    "closedMessage": "",
    "businessHours": {
      "weekdays": {
        "lunch": { "opening": 12, "closing": 14 },
        "dinner": { "opening": 19, "closing": 21 }
      },
      "sunday": { "opening": 12, "closing": 15 },
      "closedDays": [1]
    },
    "preorderMinutes": 30,
    "lastOrderMinutes": 30
  }
}
```

**Piege connu** : changer les defaults dans le code (`constants.ts`, `admin-config.js`) ne suffit PAS si Redis a deja des donnees. Redis prend toujours la priorite. Il faut soit :
- Mettre a jour Redis (admin panel ou curl)
- Soit vider la cle Redis pour retomber sur les defaults

### Verifier l'etat actuel

```bash
curl -sL "https://www.mppp.fr/api/admin-config" | python3 -m json.tool
```

## Deploiement

- Push sur `main` → Vercel deploy automatique
- Les fonctions API sont dans `api/` (ESM, `@vercel/node`)
- Le front est build via `vite build` → `dist/`

## Points d'attention

- `mppp.fr` (sans www) redirige, toujours utiliser `www.mppp.fr` pour les appels API
- Le `-d` inline dans curl peut foirer avec les quotes shell — preferer `-d @fichier.json`
- Le localStorage peut avoir des donnees stale ; l'API le rafraichit au chargement de la page, mais un visiteur qui ne refresh pas garde les anciennes valeurs en cache
