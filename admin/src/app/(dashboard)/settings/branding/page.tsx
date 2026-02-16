'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { Loader2, Save, Palette, Upload, Eye, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/layout/page-header';
import { brandingApi, UpdateBrandingData } from '@/lib/api/branding.api';

const fontOptions = [
  { value: 'Inter', label: 'Inter' },
  { value: 'Roboto', label: 'Roboto' },
  { value: 'Open Sans', label: 'Open Sans' },
  { value: 'Lato', label: 'Lato' },
  { value: 'Poppins', label: 'Poppins' },
  { value: 'Montserrat', label: 'Montserrat' },
];

export default function BrandingPage() {
  const queryClient = useQueryClient();
  const [showPreview, setShowPreview] = useState(false);

  const { data: branding, isLoading } = useQuery({
    queryKey: ['branding'],
    queryFn: () => brandingApi.get(),
  });

  const { data: presets } = useQuery({
    queryKey: ['branding-presets'],
    queryFn: () => brandingApi.getPresets(),
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { isDirty },
  } = useForm<UpdateBrandingData>();

  useEffect(() => {
    if (branding) {
      reset({
        logoUrl: branding.logoUrl || '',
        faviconUrl: branding.faviconUrl || '',
        primaryColor: branding.primaryColor,
        secondaryColor: branding.secondaryColor,
        accentColor: branding.accentColor,
        backgroundColor: branding.backgroundColor,
        textColor: branding.textColor,
        borderRadius: branding.borderRadius,
        fontFamily: branding.fontFamily,
        customCss: branding.customCss || '',
      });
    }
  }, [branding, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: UpdateBrandingData) => brandingApi.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branding'] });
      toast.success('Branding saved successfully');
    },
    onError: () => {
      toast.error('Failed to save branding');
    },
  });

  const applyPresetMutation = useMutation({
    mutationFn: (presetId: string) => brandingApi.applyPreset(presetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['branding'] });
      toast.success('Preset applied');
    },
    onError: () => {
      toast.error('Failed to apply preset');
    },
  });

  const onSubmit = (data: UpdateBrandingData) => {
    updateMutation.mutate(data);
  };

  const watchedValues = watch();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Branding" description="Customize the look and feel of your app">
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="mr-2 h-4 w-4" />
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
          <Button onClick={handleSubmit(onSubmit)} disabled={!isDirty || updateMutation.isPending}>
            {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            <Save className="mr-2 h-4 w-4" />
            Save Changes
          </Button>
        </div>
      </PageHeader>

      <div className={`grid gap-6 ${showPreview ? 'lg:grid-cols-2' : ''}`}>
        <div className="space-y-6">
          <Tabs defaultValue="colors">
            <TabsList>
              <TabsTrigger value="colors">Colors</TabsTrigger>
              <TabsTrigger value="typography">Typography</TabsTrigger>
              <TabsTrigger value="logos">Logos</TabsTrigger>
              <TabsTrigger value="advanced">Advanced</TabsTrigger>
            </TabsList>

            <TabsContent value="colors" className="mt-6 space-y-6">
              {/* Presets */}
              <Card>
                <CardHeader>
                  <CardTitle>Color Presets</CardTitle>
                  <CardDescription>Quick-start with a pre-designed color scheme</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {(presets || [
                      { id: '1', name: 'Default', primaryColor: '#6366f1', secondaryColor: '#8b5cf6', accentColor: '#06b6d4', backgroundColor: '#ffffff', textColor: '#1e293b' },
                      { id: '2', name: 'Ocean', primaryColor: '#0ea5e9', secondaryColor: '#06b6d4', accentColor: '#10b981', backgroundColor: '#f0f9ff', textColor: '#0c4a6e' },
                      { id: '3', name: 'Forest', primaryColor: '#22c55e', secondaryColor: '#10b981', accentColor: '#eab308', backgroundColor: '#f0fdf4', textColor: '#14532d' },
                      { id: '4', name: 'Sunset', primaryColor: '#f97316', secondaryColor: '#ef4444', accentColor: '#eab308', backgroundColor: '#fff7ed', textColor: '#7c2d12' },
                      { id: '5', name: 'Dark', primaryColor: '#a855f7', secondaryColor: '#ec4899', accentColor: '#06b6d4', backgroundColor: '#18181b', textColor: '#fafafa' },
                    ]).map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyPresetMutation.mutate(preset.id)}
                        className="rounded-lg border p-3 text-left hover:bg-muted transition-colors"
                      >
                        <div className="flex gap-1 mb-2">
                          <div className="h-4 w-4 rounded" style={{ backgroundColor: preset.primaryColor }} />
                          <div className="h-4 w-4 rounded" style={{ backgroundColor: preset.secondaryColor }} />
                          <div className="h-4 w-4 rounded" style={{ backgroundColor: preset.accentColor }} />
                        </div>
                        <p className="text-sm font-medium">{preset.name}</p>
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Custom Colors */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    <CardTitle>Custom Colors</CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Primary Color</Label>
                      <div className="flex gap-2">
                        <Input type="color" {...register('primaryColor')} className="w-12 h-10 p-1" />
                        <Input {...register('primaryColor')} placeholder="#6366f1" className="flex-1" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Secondary Color</Label>
                      <div className="flex gap-2">
                        <Input type="color" {...register('secondaryColor')} className="w-12 h-10 p-1" />
                        <Input {...register('secondaryColor')} placeholder="#8b5cf6" className="flex-1" />
                      </div>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Accent Color</Label>
                      <div className="flex gap-2">
                        <Input type="color" {...register('accentColor')} className="w-12 h-10 p-1" />
                        <Input {...register('accentColor')} placeholder="#06b6d4" className="flex-1" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Background Color</Label>
                      <div className="flex gap-2">
                        <Input type="color" {...register('backgroundColor')} className="w-12 h-10 p-1" />
                        <Input {...register('backgroundColor')} placeholder="#ffffff" className="flex-1" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Text Color</Label>
                    <div className="flex gap-2">
                      <Input type="color" {...register('textColor')} className="w-12 h-10 p-1" />
                      <Input {...register('textColor')} placeholder="#1e293b" className="flex-1" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="typography" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Typography</CardTitle>
                  <CardDescription>Customize fonts and styling</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Font Family</Label>
                    <Controller
                      name="fontFamily"
                      control={control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value || 'Inter'}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select font" />
                          </SelectTrigger>
                          <SelectContent>
                            {fontOptions.map((font) => (
                              <SelectItem key={font.value} value={font.value}>
                                <span style={{ fontFamily: font.value }}>{font.label}</span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Border Radius: {watchedValues.borderRadius || 12}px</Label>
                    <Controller
                      name="borderRadius"
                      control={control}
                      render={({ field }) => (
                        <Slider
                          value={[field.value || 12]}
                          onValueChange={([value]) => field.onChange(value)}
                          min={0}
                          max={24}
                          step={1}
                        />
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="logos" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Logo & Icons</CardTitle>
                  <CardDescription>Upload your brand assets</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Logo URL</Label>
                    <div className="flex gap-2">
                      <Input {...register('logoUrl')} placeholder="https://..." className="flex-1" />
                      <Button variant="outline" type="button">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload
                      </Button>
                    </div>
                    {watchedValues.logoUrl && (
                      <div className="mt-2 rounded-lg border p-4">
                        <img
                          src={watchedValues.logoUrl}
                          alt="Logo preview"
                          className="max-h-16 object-contain"
                          onError={(e) => (e.currentTarget.style.display = 'none')}
                        />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label>Favicon URL</Label>
                    <div className="flex gap-2">
                      <Input {...register('faviconUrl')} placeholder="https://..." className="flex-1" />
                      <Button variant="outline" type="button">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="advanced" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Custom CSS</CardTitle>
                  <CardDescription>Add custom CSS for advanced styling</CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    {...register('customCss')}
                    placeholder={`/* Custom CSS */\n.my-class {\n  color: red;\n}`}
                    rows={10}
                    className="font-mono text-sm"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Use custom CSS to override default styles. Changes will be applied to both web and mobile apps.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="sticky top-6">
            <Card>
              <CardHeader>
                <CardTitle>Live Preview</CardTitle>
                <CardDescription>See how your branding looks</CardDescription>
              </CardHeader>
              <CardContent>
                <div
                  className="rounded-lg border overflow-hidden"
                  style={{
                    backgroundColor: watchedValues.backgroundColor,
                    color: watchedValues.textColor,
                    fontFamily: watchedValues.fontFamily,
                  }}
                >
                  {/* Header */}
                  <div
                    className="p-4"
                    style={{ backgroundColor: watchedValues.primaryColor }}
                  >
                    <div className="flex items-center gap-3">
                      {watchedValues.logoUrl ? (
                        <img src={watchedValues.logoUrl} alt="Logo" className="h-8" />
                      ) : (
                        <div className="h-8 w-8 rounded bg-white/20" />
                      )}
                      <span className="text-white font-semibold">FitStudio</span>
                    </div>
                  </div>
                  {/* Content */}
                  <div className="p-4 space-y-4">
                    <h3 className="text-lg font-semibold">Welcome Back!</h3>
                    <p className="text-sm opacity-70">Book your next class</p>
                    <button
                      className="px-4 py-2 rounded text-white text-sm font-medium"
                      style={{
                        backgroundColor: watchedValues.primaryColor,
                        borderRadius: `${watchedValues.borderRadius || 12}px`,
                      }}
                    >
                      Book Now
                    </button>
                    <button
                      className="ml-2 px-4 py-2 rounded text-sm font-medium border"
                      style={{
                        borderColor: watchedValues.secondaryColor,
                        color: watchedValues.secondaryColor,
                        borderRadius: `${watchedValues.borderRadius || 12}px`,
                      }}
                    >
                      View Schedule
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
