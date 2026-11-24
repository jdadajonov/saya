import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Linking from 'expo-linking';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';

import { initI18n } from '@saya/i18n';
import { supabase } from '../src/platform/supabase';
import { useAuthStore } from '../src/features/family/stores/auth-store';
import { ThemeProvider, type ThemeName } from '../src/ui';
import { LoadingScreen } from '../src/ui/brand';

function extractTokensFromUrl(url: string): { accessToken?: string; refreshToken?: string } {
  const hashIndex = url.indexOf('#');
  if (hashIndex === -1) return {};

  const hash = url.substring(hashIndex + 1);
  const params = new URLSearchParams(hash);
  return {
    accessToken: params.get('access_token') ?? undefined,
    refreshToken: params.get('refresh_token') ?? undefined,
  };
}

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 2, staleTime: 60_000 },
  },
});

initI18n('ru');

function AuthGate() {
  const router = useRouter();
  const segments = useSegments();
  const { session, isLoading, setSession } = useAuthStore();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
    });
    void supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
    });
    return () => subscription.unsubscribe();
  }, [setSession]);

  useEffect(() => {
    const handleDeepLink = async (event: { url: string }) => {
      const { accessToken, refreshToken } = extractTokensFromUrl(event.url);
      if (accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      }
    };

    const subscription = Linking.addEventListener('url', handleDeepLink);

    void Linking.getInitialURL().then((url) => {
      if (url) void handleDeepLink({ url });
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    void SplashScreen.hideAsync();

    const inAuthGroup = segments[0] === '(auth)';
    const inOnboarding = segments[1] === 'onboarding';

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup && !inOnboarding) {
      router.replace('/(parent)');
    }
  }, [session, isLoading, segments, router]);

  return null;
}

function useThemeVariant(): ThemeName {
  const mode = useAuthStore((s) => s.mode);
  const ageBand = useAuthStore(
    (s) => s.children.find((c) => c.id === s.activeChildId)?.ageBand,
  );
  if (mode === 'child' && ageBand) return ageBand;
  return 'parent';
}

export default function RootLayout() {
  const themeVariant = useThemeVariant();
  const isLoading = useAuthStore((s) => s.isLoading);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider variant={themeVariant}>
        <StatusBar style="dark" />
        <AuthGate />
        {isLoading ? (
          <LoadingScreen />
        ) : (
          <Stack screenOptions={{ headerShown: false }} />
        )}
      </ThemeProvider>
    </QueryClientProvider>
  );
}
