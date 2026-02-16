import { apiGet, apiPut, apiPost } from './client';

export interface BrandingSettings {
  id: string;
  tenantId: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  borderRadius: number;
  fontFamily: string;
  customCss?: string;
  emailHeaderHtml?: string;
  emailFooterHtml?: string;
  loginBackgroundUrl?: string;
  appIconUrl?: string;
  splashScreenUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateBrandingData {
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  backgroundColor?: string;
  textColor?: string;
  borderRadius?: number;
  fontFamily?: string;
  customCss?: string;
  emailHeaderHtml?: string;
  emailFooterHtml?: string;
  loginBackgroundUrl?: string;
  appIconUrl?: string;
  splashScreenUrl?: string;
}

export interface BrandingPreset {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
}

export const brandingApi = {
  get: () => apiGet<BrandingSettings>('/branding'),

  update: (data: UpdateBrandingData) => apiPut<BrandingSettings>('/branding', data),

  getPresets: () => apiGet<BrandingPreset[]>('/branding/presets'),

  applyPreset: (presetId: string) =>
    apiPost<BrandingSettings>(`/branding/presets/${presetId}/apply`),

  generateCss: () => apiGet<{ css: string }>('/branding/css'),

  uploadLogo: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiPost<{ url: string }>('/branding/upload/logo', formData);
  },

  uploadFavicon: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiPost<{ url: string }>('/branding/upload/favicon', formData);
  },
};
