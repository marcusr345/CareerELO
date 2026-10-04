const appUrl = process.env.EXPO_PUBLIC_WEB_URL || '';
const buildProfile = process.env.EAS_BUILD_PROFILE || 'development';
const requiresHttps = buildProfile === 'preview' || buildProfile === 'production';
const allowsLocalHttp = buildProfile === 'development';

if (requiresHttps) {
  let parsedUrl;
  try {
    parsedUrl = new URL(appUrl);
  } catch {
    throw new Error('Set EXPO_PUBLIC_WEB_URL to the deployed HTTPS web app before creating a production iOS build.');
  }

  if (parsedUrl.protocol !== 'https:') {
    throw new Error('EXPO_PUBLIC_WEB_URL must use HTTPS for production iOS builds.');
  }
}

module.exports = {
  expo: {
    name: 'CareerELO',
    slug: 'cv-ranker',
    scheme: 'cvranker',
    version: '1.0.0',
    orientation: 'portrait',
    userInterfaceStyle: 'dark',
    icon: './assets/app-icon.png',
    splash: {
      image: './assets/splash.png',
      resizeMode: 'contain',
      backgroundColor: '#07111f'
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: 'com.cvranker.mobile',
      buildNumber: '1',
      infoPlist: {
        ...(allowsLocalHttp ? {
          NSAppTransportSecurity: { NSAllowsArbitraryLoads: true }
        } : {})
      }
    },
    android: {
      package: 'com.cvranker.mobile',
      adaptiveIcon: {
        foregroundImage: './assets/app-icon.png',
        backgroundColor: '#07111f'
      },
      usesCleartextTraffic: allowsLocalHttp
    },
    plugins: [
      [
        'expo-splash-screen',
        {
          image: './assets/splash.png',
          imageWidth: 200,
          resizeMode: 'contain',
          backgroundColor: '#07111f'
        }
      ]
    ],
    extra: {
      webUrl: appUrl,
      eas: {
        projectId: process.env.EAS_PROJECT_ID || ''
      }
    }
  }
};
