/**
 * High-Performance Route Preloader
 * Proactively preloads route chunks on idle and hover so sidebar clicks feel 100% instant (0ms).
 */

const routeLoaders = {
  '/dashboard': () => import('../pages/overview'),
  '/lms-credential': () => import('../pages/lms-portal'),
  '/quiz': () => import('../pages/quiz'),
  '/batches': () => import('../pages/batches'),
  '/students': () => import('../pages/students'),
  '/sessions': () => import('../pages/beta/BetaFeaturePage'),
  '/attendance': () => import('../pages/beta/BetaFeaturePage'),
  '/placements': () => import('../pages/beta/BetaFeaturePage'),
  '/settings': () => import('../pages/beta/BetaFeaturePage'),
};

const preloadedSet = new Set();

/**
 * Preload a specific route on hover, focus, or intent
 */
export function preloadRoute(path) {
  if (!path) return;
  const cleanPath = path.replace(/\/$/, '') || '/lms-credential';
  const loader = routeLoaders[cleanPath];
  if (loader && !preloadedSet.has(cleanPath)) {
    preloadedSet.add(cleanPath);
    loader().catch(() => {
      preloadedSet.delete(cleanPath);
    });
  }
}

/**
 * Preload all main routes in the background when the browser is idle
 * Ensures that whenever a user clicks any sidebar item, it loads instantly from memory.
 */
export function preloadAllRoutesIdle() {
  if (typeof window === 'undefined') return;

  const runWarmup = () => {
    Object.keys(routeLoaders).forEach((path) => {
      preloadRoute(path);
    });
  };

  if ('requestIdleCallback' in window) {
    window.requestIdleCallback(runWarmup, { timeout: 2000 });
  } else {
    setTimeout(runWarmup, 800);
  }
}
