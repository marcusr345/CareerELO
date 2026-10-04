import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  Linking,
  Platform,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View
} from 'react-native';
import Constants from 'expo-constants';
import * as SplashScreen from 'expo-splash-screen';
import { WebView, type WebViewNavigation } from 'react-native-webview';

void SplashScreen.preventAutoHideAsync();

const COLORS = {
  background: '#07111f',
  panel: '#0f172a',
  text: '#e2e8f0',
  muted: '#94a3b8',
  accent: '#38bdf8'
};

function getStartUrl(): string {
  const configuredUrl = Constants.expoConfig?.extra?.webUrl;
  if (typeof configuredUrl === 'string' && configuredUrl.trim()) {
    return configuredUrl.trim();
  }

  if (!__DEV__) {
    throw new Error('Configure EXPO_PUBLIC_WEB_URL before building the mobile app.');
  }

  return Platform.select({
    ios: 'http://localhost:5173',
    android: 'http://10.0.2.2:5173',
    default: 'http://localhost:5173'
  }) || 'http://localhost:5173';
}

function isSameOrigin(candidate: string, expected: string): boolean {
  try {
    const candidateUrl = new URL(candidate);
    const expectedUrl = new URL(expected);
    return candidateUrl.origin === expectedUrl.origin;
  } catch {
    return false;
  }
}

export default function App() {
  const startUrl = useMemo(() => getStartUrl(), []);
  const webViewRef = useRef<WebView>(null);
  const canGoBackRef = useRef(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasLoadError, setHasLoadError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const hideNativeSplash = useCallback(() => {
    void SplashScreen.hideAsync();
  }, []);

  const handleNavigationChange = useCallback((navigation: WebViewNavigation) => {
    canGoBackRef.current = navigation.canGoBack;
  }, []);

  const handleShouldStartLoad = useCallback((request: { url: string }) => {
    const { url } = request;
    if (isSameOrigin(url, startUrl)) return true;

    if (/^(https?:|mailto:|tel:)/i.test(url)) {
      void Linking.openURL(url);
    }
    return false;
  }, [startUrl]);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (canGoBackRef.current) {
        webViewRef.current?.goBack();
        return true;
      }
      return false;
    });

    return () => subscription.remove();
  }, []);

  const retry = () => {
    setHasLoadError(false);
    setIsLoading(true);
    setReloadKey((current) => current + 1);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={styles.container}>
        {hasLoadError ? (
          <View style={styles.errorPanel}>
            <View style={styles.brandMark}><Text style={styles.brandMarkText}>CV</Text></View>
            <Text style={styles.title}>Can’t connect right now</Text>
            <Text style={styles.description}>
              Check your internet connection and try loading CareerELO again.
            </Text>
            <Pressable accessibilityRole="button" style={styles.retryButton} onPress={retry}>
              <Text style={styles.retryText}>Try again</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <WebView
              key={reloadKey}
              ref={webViewRef}
              source={{ uri: startUrl }}
              style={styles.webView}
              containerStyle={styles.webViewContainer}
              originWhitelist={['http://*', 'https://*']}
              onLoadStart={() => {
                setIsLoading(true);
                setHasLoadError(false);
              }}
              onLoadEnd={() => {
                setIsLoading(false);
                hideNativeSplash();
              }}
              onError={() => {
                setIsLoading(false);
                setHasLoadError(true);
                hideNativeSplash();
              }}
              onHttpError={(event) => {
                if (event.nativeEvent.statusCode >= 500) {
                  setIsLoading(false);
                  setHasLoadError(true);
                }
              }}
              onNavigationStateChange={handleNavigationChange}
              onShouldStartLoadWithRequest={handleShouldStartLoad}
              javaScriptEnabled
              domStorageEnabled
              sharedCookiesEnabled
              thirdPartyCookiesEnabled={false}
              setSupportMultipleWindows={false}
              allowsBackForwardNavigationGestures
              pullToRefreshEnabled
              applicationNameForUserAgent="CVRanker-iOS"
              renderLoading={() => (
                <View style={styles.loading}>
                  <ActivityIndicator size="large" color={COLORS.accent} />
                  <Text style={styles.loadingText}>Loading your career profile…</Text>
                </View>
              )}
              startInLoadingState
            />
            {isLoading ? (
              <View pointerEvents="none" style={styles.loadingOverlay}>
                <ActivityIndicator size="small" color={COLORS.accent} />
              </View>
            ) : null}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  webViewContainer: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  webView: {
    flex: 1,
    backgroundColor: COLORS.background
  },
  loading: {
    ...StyleSheet.absoluteFill,
    zIndex: 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    backgroundColor: COLORS.background
  },
  loadingOverlay: {
    position: 'absolute',
    top: 12,
    right: 14,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 17,
    backgroundColor: COLORS.panel
  },
  loadingText: {
    color: COLORS.muted,
    fontSize: 14
  },
  errorPanel: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28
  },
  brandMark: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 22,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    borderRadius: 20,
    backgroundColor: 'rgba(56, 189, 248, 0.1)'
  },
  brandMarkText: {
    color: COLORS.accent,
    fontSize: 21,
    fontWeight: '800'
  },
  title: {
    color: COLORS.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center'
  },
  description: {
    maxWidth: 340,
    marginTop: 10,
    color: COLORS.muted,
    fontSize: 15,
    lineHeight: 23,
    textAlign: 'center'
  },
  retryButton: {
    marginTop: 24,
    paddingVertical: 13,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: COLORS.accent
  },
  retryText: {
    color: COLORS.background,
    fontSize: 15,
    fontWeight: '800'
  }
});
