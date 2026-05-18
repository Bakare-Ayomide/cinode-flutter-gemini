# Cinode Deployment Guide (Coolify + Self Hosting)

This guide explains how to deploy Cinode to your VPS using Coolify, including the Backend (Express), Frontend (React), and Database (MySQL).

## 1. Prerequisites
- A VPS with **Coolify** installed.
- Domain name pointed to your VPS (optional but recommended).

## 2. Infrastructure Setup (MySQL)
1. In Coolify, go to **Resources** -> **New Resource** -> **Databases** -> **MySQL**.
2. Give it a name (e.g., `cinode-db`).
3. Note down the **Internal Connection String** (it looks like `mysql://user:pass@host:port/db`).
4. (Optional) Set the **Root Password** and **Public Port** if you want to access it from home.

## 3. Application Deployment (The App)
1. Go to **Resources** -> **New Resource** -> **Private/Public Repository (GitHub)**.
2. Select this repository.
3. **Build Pack**: Keep it as **Nixpacks** (automatic detection) or select **Node.js**.
4. **Environment Variables**:
   Add the following in the "Environment Variables" tab:
   - `DATABASE_URL`: Paste the MySQL internal connection string here.
   - `GEMINI_API_KEY`: Your API key for recommendations.
   - `NODE_ENV`: `production`
   - `PORT`: `3000`
5. **Configuration**:
   - Ensure the port is set to `3000`.
   - Set the **Domain** you want to use (e.g., `https://cinode.yourdomain.com`).
6. **Deploy**: Click **Deploy**. Coolify will build the app using the `npm run build` script and start it with `npm start`.

## 4. Android / Android TV / PWA Build
Since you are using GitHub Actions for the APK/AAB:

### APK / AAB Generation
1. Ensure your GitHub Action uses `@capacitor/android`.
2. The `appId` is set to `com.cinode.app` (defined in `capacitor.config.ts`).
3. **Android TV**: To ensure it shows up on the TV home screen, when opening the project in Android Studio (or via CLI modifications):
   - In `AndroidManifest.xml`, ensure `<category android:name="android.intent.category.LEANBACK_LAUNCHER" />` is added to the main activity.
   - Set `android:banner` for the TV launcher icon.

### Assets
- **Icon**: Located at `/public/assets/icon.png`.
- **Favicon**: Automatically linked in `index.html`.

## 5. Summary of Values for Coolify
| Field | Value |
|-------|-------|
| Repository | (Your GitHub Repo URL) |
| Build Pack | Nixpacks |
| Install Command | `npm install` |
| Build Command | `npm run build` |
| Start Command | `npm start` |
| Port Mapping | `3000:3000` |
| `DATABASE_URL` | `mysql://user:password@cinode-db:3306/cinode` |
| `NODE_ENV` | `production` |

## 6. Troubleshooting
- **Database Offline**: Ensure the `DATABASE_URL` is correct and the MySQL service is "Healthy" in Coolify.
- **Login Issues**: The app now requires Username/Password. The first user to register will be recorded in the DB.
