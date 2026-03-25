/**
 * App-level hook surface.
 *
 * Keep this focused on hooks that are safe to import from feature and route
 * code. Lower-level store/context helpers should stay on their own modules
 * until they have a dedicated hook wrapper.
 */

export { useCommandPalette } from './useCommandPalette';
export { useKeyboardShortcuts } from './useKeyboardShortcuts';
export { useOnboarding } from './useOnboarding';
export { useDashboards } from './useDashboards';
export { useSidebarSettings } from './useSidebarSettings';
export { useGameData } from './useGameData';
export { useAnalytics } from './useAnalytics';
