import * as FileSystem from "expo-file-system/legacy";
import type { NicknameBackend } from "../home/nickname";

const FILE_NAME = "refertrm.p1.nickname.v1.txt";

function fileUri(): string | null {
  const dir = FileSystem.documentDirectory;
  return dir ? `${dir}${FILE_NAME}` : null;
}

/** Same expo-file-system layer as catalogue persist — no MMKV, no AsyncStorage. */
export const fileNicknameBackend: NicknameBackend = {
  async read() {
    const uri = fileUri();
    if (!uri) return undefined;
    try {
      const info = await FileSystem.getInfoAsync(uri);
      if (!info.exists) return undefined;
      const raw = await FileSystem.readAsStringAsync(uri);
      return raw || undefined;
    } catch {
      return undefined;
    }
  },
  async write(value) {
    const uri = fileUri();
    if (!uri) return;
    try {
      await FileSystem.writeAsStringAsync(uri, value);
    } catch {
      /* best-effort */
    }
  },
  async remove() {
    const uri = fileUri();
    if (!uri) return;
    try {
      await FileSystem.deleteAsync(uri, { idempotent: true });
    } catch {
      /* best-effort */
    }
  },
};
