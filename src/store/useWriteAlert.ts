import { useSyncExternalStore } from "react";
import { subscribeWriteAlert, writeAlert } from "./writes";

/** Message d'échec d'écriture à afficher, ou null. */
export const useWriteAlert = () => useSyncExternalStore(subscribeWriteAlert, writeAlert, () => null);
