import * as Clipboard from 'expo-clipboard';
import { Platform } from 'react-native';

export async function copyText(value: string): Promise<void> {
  await Clipboard.setStringAsync(value);
}

export function currentMapsPlatform(): 'ios' | 'android' {
  return Platform.OS === 'android' ? 'android' : 'ios';
}
