import { useSyncExternalStore } from 'react';
import { usePrefersReducedMotion } from './usePrefersReducedMotion';
import { useWebGLSupport } from './useWebGLSupport';

/** The slice of the Network Information API we read (not in TS's DOM lib). */
export interface NetworkInformationLike {
  readonly saveData?: boolean;
  readonly effectiveType?: string;
  addEventListener?: (type: 'change', listener: () => void) => void;
  removeEventListener?: (type: 'change', listener: () => void) => void;
}

type NavigatorWithConnection = Navigator & { readonly connection?: NetworkInformationLike };

const SLOW_CONNECTIONS = new Set(['slow-2g', '2g']);

function getConnection(): NetworkInformationLike | undefined {
  return typeof navigator === 'undefined' ? undefined : (navigator as NavigatorWithConnection).connection;
}

/** True when the user asked to save data or is on a 2g / slow-2g link. */
export function isConstrainedConnection(connection: NetworkInformationLike | undefined = getConnection()): boolean {
  if (!connection) return false;
  return connection.saveData === true || (connection.effectiveType !== undefined && SLOW_CONNECTIONS.has(connection.effectiveType));
}

function subscribe(onChange: () => void): () => void {
  const connection = getConnection();
  connection?.addEventListener?.('change', onChange);
  return () => connection?.removeEventListener?.('change', onChange);
}

const getSnapshot = (): boolean => isConstrainedConnection();
const getServerSnapshot = (): boolean => true;

/**
 * Whether it's appropriate to download and run heavy decorative media (the 3D
 * hero, the WebGL atmosphere): motion allowed, no data-saver / slow link, and
 * WebGL available. False until the WebGL probe has run.
 */
export function useCanLoadHeavyMedia(): boolean {
  const reduced = usePrefersReducedMotion();
  const constrained = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const webgl = useWebGLSupport(!reduced && !constrained);
  return !reduced && !constrained && webgl === true;
}
