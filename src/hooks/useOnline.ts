import { useEffect, useState } from "react";
import NetInfo from "@react-native-community/netinfo";

/** Start true so first paint matches a connected device; NetInfo corrects immediately. */
export function useOnline(): boolean {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    const sub = NetInfo.addEventListener((state) => {
      setOnline(state.isConnected !== false && state.isInternetReachable !== false);
    });
    void NetInfo.fetch().then((state) => {
      setOnline(state.isConnected !== false && state.isInternetReachable !== false);
    });
    return () => sub();
  }, []);
  return online;
}
