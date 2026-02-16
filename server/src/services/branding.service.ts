import { prisma } from '../lib/prisma.js';

// ============================================
// THEME / BRANDING
// ============================================

export interface BrandingConfig {
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  customCss?: string;
}

export const getBranding = async (tenantId: string): Promise<BrandingConfig> => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      logoUrl: true,
      primaryColor: true,
      secondaryColor: true,
      accentColor: true,
      fontFamily: true,
      customCss: true,
    },
  });

  return tenant || {};
};

export const updateBranding = async (
  tenantId: string,
  branding: BrandingConfig
): Promise<BrandingConfig> => {
  const tenant = await prisma.tenant.update({
    where: { id: tenantId },
    data: {
      logoUrl: branding.logoUrl,
      primaryColor: branding.primaryColor,
      secondaryColor: branding.secondaryColor,
      accentColor: branding.accentColor,
      fontFamily: branding.fontFamily,
      customCss: branding.customCss,
    },
    select: {
      logoUrl: true,
      primaryColor: true,
      secondaryColor: true,
      accentColor: true,
      fontFamily: true,
      customCss: true,
    },
  });

  return tenant;
};

// ============================================
// THEME PRESETS
// ============================================

export const themePresets: Record<string, BrandingConfig> = {
  default: {
    primaryColor: '#6366f1',
    secondaryColor: '#4f46e5',
    accentColor: '#818cf8',
    fontFamily: 'Inter',
  },
  dark: {
    primaryColor: '#1f2937',
    secondaryColor: '#374151',
    accentColor: '#60a5fa',
    fontFamily: 'Inter',
  },
  minimal: {
    primaryColor: '#000000',
    secondaryColor: '#333333',
    accentColor: '#666666',
    fontFamily: 'Helvetica Neue',
  },
  warm: {
    primaryColor: '#f59e0b',
    secondaryColor: '#d97706',
    accentColor: '#fbbf24',
    fontFamily: 'Poppins',
  },
  cool: {
    primaryColor: '#0ea5e9',
    secondaryColor: '#0284c7',
    accentColor: '#38bdf8',
    fontFamily: 'Roboto',
  },
  nature: {
    primaryColor: '#10b981',
    secondaryColor: '#059669',
    accentColor: '#34d399',
    fontFamily: 'Open Sans',
  },
};

export const getPresets = () => {
  return Object.entries(themePresets).map(([key, config]) => ({
    id: key,
    name: key.charAt(0).toUpperCase() + key.slice(1),
    ...config,
  }));
};

export const applyPreset = async (tenantId: string, presetId: string) => {
  const preset = themePresets[presetId];
  if (!preset) {
    throw new Error(`Unknown preset: ${presetId}`);
  }
  return updateBranding(tenantId, preset);
};

// ============================================
// CSS GENERATION
// ============================================

export const generateCssVariables = (branding: BrandingConfig): string => {
  return `:root {
  --primary-color: ${branding.primaryColor || '#6366f1'};
  --secondary-color: ${branding.secondaryColor || '#4f46e5'};
  --accent-color: ${branding.accentColor || '#818cf8'};
  --font-family: ${branding.fontFamily || 'Inter'}, sans-serif;
}`;
};

export const getFullCss = async (tenantId: string): Promise<string> => {
  const branding = await getBranding(tenantId);
  const variables = generateCssVariables(branding);
  const custom = branding.customCss || '';
  return `${variables}\n\n${custom}`;
};

// ============================================
// APP BUILD CONFIG (for white-label apps)
// ============================================

export interface AppBuildConfig {
  tenantId: string;
  tenantSlug: string;
  appName: string;
  bundleId: string;
  branding: BrandingConfig;
  features: {
    gamification: boolean;
    video: boolean;
    content: boolean;
  };
}

export const generateAppBuildConfig = async (tenantId: string): Promise<AppBuildConfig> => {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: {
      id: true,
      slug: true,
      name: true,
      tier: true,
      logoUrl: true,
      primaryColor: true,
      secondaryColor: true,
      accentColor: true,
      fontFamily: true,
      customCss: true,
    },
  });

  if (!tenant) throw new Error('Tenant not found');

  const isPremium = tenant.tier === 'PREMIUM';
  const isMid = tenant.tier === 'MID' || isPremium;

  return {
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    appName: tenant.name,
    bundleId: `com.fitstudio.${tenant.slug.replace(/-/g, '')}`,
    branding: {
      logoUrl: tenant.logoUrl || undefined,
      primaryColor: tenant.primaryColor,
      secondaryColor: tenant.secondaryColor,
      accentColor: tenant.accentColor,
      fontFamily: tenant.fontFamily,
      customCss: tenant.customCss || undefined,
    },
    features: {
      gamification: isPremium,
      video: isPremium,
      content: isMid,
    },
  };
};

export const brandingService = {
  getBranding,
  updateBranding,
  getPresets,
  applyPreset,
  generateCssVariables,
  getFullCss,
  generateAppBuildConfig,
};
