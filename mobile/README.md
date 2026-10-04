# CareerELO iOS wrapper

This Expo application wraps the existing responsive web app in a native iOS WebView. The web project itself remains unchanged.

## Configure the web app URL

Copy `.env.example` to `.env` and set `EXPO_PUBLIC_WEB_URL`.

- iOS Simulator: `http://localhost:5173` works when the Vite development server is running.
- Physical device: use the development computer's LAN address, for example `http://192.168.1.20:5173`, and make sure the phone and computer share a network.
- Preview and App Store builds: configure `EXPO_PUBLIC_WEB_URL` as an HTTPS URL for the deployed web app in the EAS environment.

Production Expo configuration refuses to build without an HTTPS web app URL. It will not silently use localhost.

## Run locally

```powershell
Copy-Item .env.example .env
npm install
npm start
```

For local iOS development, run the existing web and API servers in another terminal:

```powershell
npm --prefix ..\frontend run dev -- --host 0.0.0.0
npm --prefix ..\backend run dev
```

Then open the Expo project in iOS Simulator or scan its QR code from Expo Go on a device. For a custom native development build:

```powershell
npx eas-cli build --platform ios --profile development
```

## Build for TestFlight / App Store

Sign in to Expo and create or link an EAS project:

```powershell
npx eas-cli login
npx eas-cli init
```

Set `EXPO_PUBLIC_WEB_URL` in the EAS production environment to the deployed HTTPS app. Set `EAS_PROJECT_ID` to the linked project ID if the generated app config does not already provide it. Then run:

```powershell
npx eas-cli build --platform ios --profile production
```

After the build finishes, submit the build through App Store Connect:

```powershell
npx eas-cli submit --platform ios --profile production
```

Apple distribution requires an Apple Developer account and App Store Connect app record. Store listing metadata, privacy declarations, screenshots, age rating, and review submission remain App Store Connect tasks.

The WebView keeps navigation within the configured web-app origin. External web, email, and telephone links open in the system browser/apps. Android support is retained for local development but the shipping target is iOS.

Before publishing, review Apple's minimum-functionality requirements: a WebView-only app may be rejected unless the product provides app-like value beyond a repackaged website. App review approval cannot be guaranteed by the build configuration.
