import { useANetStoreWithDefault } from "@/store/StoreProvider.js";

export function useIsOfficeMode(): boolean {
  return useANetStoreWithDefault((state) => state.interfaceMode === "office", false);
}
