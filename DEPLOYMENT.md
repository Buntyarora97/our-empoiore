# Our Empire — Deployment Guide

## Architecture Overview

```
[Player App (Expo/APK)]  →  [API Server on Render]  →  [Neon PostgreSQL]
[Admin Panel (Hostinger)]  →  [API Server on Render]
```

---

## ✅ Status

| Step | Status | Notes |
|------|--------|-------|
| Neon Database | ✅ Done | All tables created |
| API Server | ✅ Ready | Deploy to Render |
| Admin Panel | ✅ Ready | Upload to Hostinger |
| Player App | ✅ Ready | Build APK with EAS |

---

## 1. Neon Database (✅ Already Set Up)

Your Neon database is provisioned and all tables are created.

**Connection String** (keep this secret):
```
postgresql://neondb_owner:****@ep-muddy-pond-aqvn8uhn.c-8.us-east-1.aws.neon.tech/neondb?sslmode=require
```

Tables created: `users`, `markets`, `bets`, `transactions`, `results`, `admins`, `settings`, `notifications`, `otps`

> **Security:** Reset your Neon password at neon.tech → Dashboard → Settings

---

## 2. Render — API Server Deployment

1. Go to [render.com](https://render.com) → Sign up with GitHub
2. Click **New** → **Web Service**
3. Connect your GitHub repo: `Buntyarora97/our-empoiore`
4. Set **Root Directory**: `artifacts/api-server`
5. Set **Build Command**: `npm install && npm run build`
6. Set **Start Command**: `npm run start`
7. Set these **Environment Variables**:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | Your full Neon connection string |
| `JWT_SECRET` | Click "Generate" in Render |
| `ADMIN_DEFAULT_PASSWORD` | Your admin password |
| `NODE_ENV` | `production` |
| `PORT` | `10000` |

8. Click **Deploy** → wait ~3 min

Your API will be at: `https://your-app.onrender.com`

> **Note:** Free tier sleeps after 15 min inactivity. Upgrade to Starter ($7/mo) for always-on.

---

## 3. Admin Panel — Hostinger Deployment

### Step 1: Set your Render API URL in the admin panel

Edit `artifacts/admin-panel/src/main.tsx` — find and update:
```typescript
setBaseUrl("https://YOUR-RENDER-APP.onrender.com");
```

### Step 2: Build the admin panel
```bash
pnpm --filter @workspace/admin-panel run build
```
Built files: `artifacts/admin-panel/dist/`

### Step 3: Upload to Hostinger
1. Login to Hostinger → hPanel → **File Manager**
2. Go to `public_html/`
3. Upload ALL files from `artifacts/admin-panel/dist/`
4. Create `.htaccess` file in `public_html/`:
```apache
Options -MultiViews
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^ index.html [QSA,L]
```

Admin panel live at: `https://yourdomain.com/`

---

## 4. Landing Page — Hostinger

1. In `landing-page/index.html` update:
   - WhatsApp: `https://wa.me/91XXXXXXXXXX`
   - Telegram: `https://t.me/yourchannel`
2. Rename your APK file to `OurEmpire.apk`
3. Upload `index.html` + `OurEmpire.apk` to Hostinger `public_html/`

Landing page at: `https://yourdomain.com/`

---

## 5. Player App — APK Build

### Set your API URL in player app:
Create `artifacts/player-app/.env`:
```
EXPO_PUBLIC_API_URL=https://YOUR-RENDER-APP.onrender.com
EXPO_PUBLIC_WHATSAPP_NUMBER=91XXXXXXXXXX
EXPO_PUBLIC_TELEGRAM_LINK=https://t.me/yourchannel
```

### Build APK with Expo EAS:
```bash
npm install -g eas-cli
eas login
cd artifacts/player-app
eas build --platform android --profile preview
```

Download APK from Expo dashboard → upload to Hostinger as `OurEmpire.apk`

---

## 6. CORS Setup (Required for Production)

Edit `artifacts/api-server/src/app.ts` — update CORS to allow your Hostinger domain:
```typescript
cors({ origin: ["https://yourdomain.com", "https://your-render-app.onrender.com"] })
```

---

## 7. First Login

- **Admin Panel URL**: `https://yourdomain.com/`
- **Username**: `admin`  
- **Password**: value of `ADMIN_DEFAULT_PASSWORD` (default: `admin123`)

After login → **Settings** → Add your UPI IDs → Save

---

## Tech Stack

| Component | Tech | Host |
|-----------|------|------|
| Database | PostgreSQL (Drizzle ORM) | Neon (free) |
| API Server | Node.js + Express 5 | Render |
| Admin Panel | React + Vite + Tailwind | Hostinger |
| Landing Page | HTML/CSS | Hostinger |
| Player App | Expo React Native | APK download |
