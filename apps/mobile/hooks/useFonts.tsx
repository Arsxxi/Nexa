import { useCallback } from 'react';
import { useFonts as useExpoFonts } from 'expo-font';

const FONT_FILES = {
  'SpaceGrotesk-Bold': require('../assets/Fonts/SpaceGrotesk-Bold.ttf'),
  'nimbus-mono.regular': require('../assets/Fonts/nimbus-mono.regular.otf'),
  'LiberationSans-Regular': require('../assets/Fonts/LiberationSans-Regular.ttf'),
};

export function useFonts() {
  const [fontsLoaded, error] = useExpoFonts(FONT_FILES);

  return { fontsLoaded, error };
}

export const FontNames = {
  h1: 'SpaceGrotesk-Bold',
  h2: 'nimbus-mono.regular',
  h3: 'LiberationSans-Regular',
} as const;