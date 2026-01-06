/**
 * Industry Packs - Pre-built industry configurations
 *
 * Export all available industry packs for registration with IndustryRegistry.
 */

// Gaming Pack
export { GamingPack, loadGamingPack } from './gaming';

// SaaS Pack
export { SaaSPack, loadSaaSPack } from './saas';

// E-commerce Pack
export { EcommercePack, loadEcommercePack } from './ecommerce';

// Fintech Pack
export { FintechPack, loadFintechPack } from './fintech';

// Initialize all built-in packs
import { IndustryRegistry } from '../IndustryRegistry';
import { GamingPack } from './gaming';
import { SaaSPack } from './saas';
import { EcommercePack } from './ecommerce';
import { FintechPack } from './fintech';

/**
 * Register all built-in industry packs
 */
export function registerBuiltInPacks(): void {
  const registry = IndustryRegistry.getInstance();

  // Only register if not already registered
  if (!registry.hasPack('gaming')) {
    registry.registerPack(GamingPack);
  }

  if (!registry.hasPack('saas')) {
    registry.registerPack(SaaSPack);
  }

  if (!registry.hasPack('ecommerce')) {
    registry.registerPack(EcommercePack);
  }

  if (!registry.hasPack('fintech')) {
    registry.registerPack(FintechPack);
  }
}

/**
 * Get all built-in packs
 */
export function getBuiltInPacks() {
  return [GamingPack, SaaSPack, EcommercePack, FintechPack];
}
