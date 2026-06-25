# Deploy en VPS + dominios para landings

El panel y las landings corren en **un solo proceso Next** (puerto **4010**) detrás de **nginx**.
> El 4010 es a propósito: el VPS ya tiene otras apps en 3000/3010, así tapsur no las pisa.
nginx pasa *todos* los dominios a Next, y el **middleware** decide por el `Host`:

- `APP_HOST` (ej. `app.tapsur.com`) → el **panel** (con login).
- `<slug>.LANDING_BASE` (ej. `uk-marzo.tapsur.com`) → la **landing** de ese slug (automático).
- Dominios custom del map `LANDING_DOMAINS` (ej. `playgames.com`) → la landing del slug mapeado.

No hace falta nada por campaña para los subdominios: el subdominio **es** el slug.

---

## 1. Servidor (una vez)

```bash
# Node 20 + pm2 + nginx + certbot
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx certbot python3-certbot-nginx
sudo npm i -g pm2
```

## 2. El proyecto

```bash
cd ~/tapsur
git clone https://github.com/valentinvardev/landing-page-generator.git
cd landing-page-generator        # el proyecto está en la raíz del repo

# variables de entorno
cp .env.example .env
nano .env        # completá todo (ver sección 3)

npm ci
npx prisma generate
npm run build
```

## 3. `.env` clave para el VPS

```ini
# Base
DATABASE_URL="...supabase pooler..."
DIRECT_URL="...supabase directo..."
SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_* / NEXTAUTH_SECRET

# Panel (en la raíz tapsur.com)
NEXTAUTH_URL="https://tapsur.com"

# Routing por dominio
APP_HOST="tapsur.com"                                       # la raíz es el panel; los subdominios son landings
LANDING_BASE="tapsur.com"                                   # uk-marzo.tapsur.com → /landing/uk-marzo
LANDING_DOMAINS={"playgames.com":"uk-marzo","ganaplata.net":"ar-abril"}

# APIs
TAPRAIN_API_KEY, SMM_KEY, TAPRAIN_SUITE_BASE
```

> `NEXTAUTH_URL` tiene que ser la URL real del panel (https) o el login falla.

## 4. Levantar con pm2

```bash
pm2 start deploy/ecosystem.config.cjs
pm2 save
pm2 startup        # seguí la línea que imprime (arranca solo al reiniciar el VPS)
pm2 logs tapsur    # ver logs
```

## 5. nginx

```bash
sudo cp deploy/nginx-tapsur.conf /etc/nginx/sites-available/tapsur
sudo nano /etc/nginx/sites-available/tapsur     # ajustá server_name a tus dominios
sudo ln -s /etc/nginx/sites-available/tapsur /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 6. DNS

En tu proveedor de DNS, A records → IP del VPS:

| Tipo | Nombre | Valor |
|---|---|---|
| A | `@` (tapsur.com — panel) | IP del VPS |
| A | `www` | IP del VPS |
| A | `*` (wildcard, subdominios = landings) | IP del VPS |

Para un **dominio custom de cliente**: que apunten su `A @` y `A www` a la IP del VPS, agregalo a `LANDING_DOMAINS` y a `server_name` de nginx.

## 7. SSL (https)

```bash
# Panel (raíz) + www
sudo certbot --nginx -d tapsur.com -d www.tapsur.com

# Wildcard *.tapsur.com (subdominios) requiere reto DNS-01:
sudo certbot certonly --manual --preferred-challenges dns -d "*.tapsur.com"
#   (seguí las instrucciones: te pide crear un TXT _acme-challenge)

# Cada dominio custom
sudo certbot --nginx -d playgames.com -d www.playgames.com
```

---

## Conectar un dominio nuevo (resumen)

**Subdominio** (`nuevo.tapsur.com`): nada — ya funciona si tenés el wildcard DNS + cert. El slug es `nuevo`.

**Dominio custom** (`midominio.com`):
1. El cliente apunta `A @` y `A www` → IP del VPS.
2. Agregalo a `LANDING_DOMAINS` en `.env`: `{"midominio.com":"slug-de-la-campaña"}`.
3. Agregalo al `server_name` de nginx (o un server block nuevo) y `sudo certbot --nginx -d midominio.com -d www.midominio.com`.
4. `pm2 restart tapsur` (para tomar el `.env` nuevo) y `sudo systemctl reload nginx`.

## Actualizar el código

```bash
cd ~/tapsur/landing-page-generator
git pull
npm ci
npx prisma generate
npm run build
pm2 restart tapsur
```

> Las migraciones de DB ya están aplicadas en Supabase; `prisma generate` alcanza.
