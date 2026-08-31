export const START_URL = "https://www.refertrm.com/start";

export type UrlOpener = (url: string) => Promise<unknown>;

export async function openStartBridge(openUrl: UrlOpener): Promise<void> {
  await openUrl(START_URL);
}
