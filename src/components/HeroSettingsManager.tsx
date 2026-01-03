import React, { useState, useEffect } from 'react';
import { Save, ArrowLeft, Image, Type, Link as LinkIcon, Sliders } from 'lucide-react';
import { useSiteSettings } from '../hooks/useSiteSettings';

interface HeroSettingsManagerProps {
    onBack: () => void;
}

interface HeroSettings {
    hero_title: string;
    hero_subtitle: string;
    hero_image_url: string;
    hero_video_url: string;
    hero_cta_text: string;
    hero_cta_link: string;
    hero_cta_secondary_text: string;
    hero_cta_secondary_link: string;
    hero_overlay_opacity: string;
    hero_overlay_color: string;
    hero_badge_text: string;
}

const HeroSettingsManager: React.FC<HeroSettingsManagerProps> = ({ onBack }) => {
    const { loading: settingsLoading } = useSiteSettings();
    const [settings, setSettings] = useState<HeroSettings>({
        hero_title: '',
        hero_subtitle: '',
        hero_image_url: '',
        hero_video_url: '',
        hero_cta_text: '',
        hero_cta_link: '',
        hero_cta_secondary_text: '',
        hero_cta_secondary_link: '',
        hero_overlay_opacity: '0',
        hero_overlay_color: '#000000',
        hero_badge_text: ''
    });
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Fetch hero settings from database
    useEffect(() => {
        const fetchHeroSettings = async () => {
            try {
                const { supabase } = await import('../lib/supabase');
                const { data, error } = await supabase
                    .from('site_settings')
                    .select('*')
                    .like('id', 'hero_%');

                if (error) throw error;

                const settingsMap: Record<string, string> = {};
                data?.forEach(setting => {
                    settingsMap[setting.id] = setting.value;
                });

                setSettings({
                    hero_title: settingsMap.hero_title || 'Welcome to The Peppy Lab',
                    hero_subtitle: settingsMap.hero_subtitle || 'At Peppy Lab, we offer high-quality peptides to support weight loss, glowing skin, wellness, and confidence.',
                    hero_image_url: settingsMap.hero_image_url || '',
                    hero_video_url: settingsMap.hero_video_url || '',
                    hero_cta_text: settingsMap.hero_cta_text || 'Shop All Products',
                    hero_cta_link: settingsMap.hero_cta_link || '/',
                    hero_cta_secondary_text: settingsMap.hero_cta_secondary_text || 'Start Assessment',
                    hero_cta_secondary_link: settingsMap.hero_cta_secondary_link || '/assessment',
                    hero_overlay_opacity: settingsMap.hero_overlay_opacity || '0',
                    hero_overlay_color: settingsMap.hero_overlay_color || '#000000',
                    hero_badge_text: settingsMap.hero_badge_text || '🧪 Peptides & Essentials'
                });
            } catch (err) {
                console.error('Error fetching hero settings:', err);
            }
        };

        fetchHeroSettings();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        setSaved(false);

        try {
            const { supabase } = await import('../lib/supabase');

            // Update each setting
            for (const [key, value] of Object.entries(settings)) {
                const { error } = await supabase
                    .from('site_settings')
                    .upsert({
                        id: key,
                        value: value,
                        type: key.includes('opacity') ? 'number' : key.includes('image') || key.includes('video') ? 'image' : 'text',
                        description: `Hero section ${key.replace('hero_', '').replace(/_/g, ' ')}`
                    }, { onConflict: 'id' });

                if (error) throw error;
            }

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error('Error saving hero settings:', err);
            alert('Failed to save settings. Please try again.');
        } finally {
            setSaving(false);
        }
    };

    if (settingsLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-theme-accent border-t-transparent rounded-full"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <button onClick={onBack} className="text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <h2 className="text-xl font-semibold text-theme-text">Hero Section Settings</h2>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="btn-primary flex items-center gap-2 disabled:opacity-50"
                >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
                </button>
            </div>

            {saved && (
                <div className="bg-green-50 text-green-600 p-3 rounded-lg">
                    Settings saved successfully!
                </div>
            )}

            <div className="grid md:grid-cols-2 gap-6">
                {/* Text Content Section */}
                <div className="md:col-span-2 bg-white rounded-lg border p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Type className="w-5 h-5 text-theme-accent" />
                        <h3 className="font-semibold text-theme-text">Text Content</h3>
                    </div>

                    <div className="space-y-4">
                        {/* Badge Text */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Badge Text</label>
                            <input
                                type="text"
                                value={settings.hero_badge_text}
                                onChange={(e) => setSettings({ ...settings, hero_badge_text: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-accent focus:border-transparent"
                                placeholder="🧪 Peptides & Essentials"
                            />
                            <p className="text-xs text-gray-500 mt-1">Small text shown above the headline</p>
                        </div>

                        {/* Title */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Headline</label>
                            <input
                                type="text"
                                value={settings.hero_title}
                                onChange={(e) => setSettings({ ...settings, hero_title: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-accent focus:border-transparent text-lg"
                                placeholder="Welcome to The Peppy Lab"
                            />
                        </div>

                        {/* Subtitle */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Sub-headline</label>
                            <textarea
                                value={settings.hero_subtitle}
                                onChange={(e) => setSettings({ ...settings, hero_subtitle: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-accent focus:border-transparent"
                                rows={3}
                                placeholder="Your compelling subheadline here..."
                            />
                        </div>
                    </div>
                </div>

                {/* Background Section */}
                <div className="bg-white rounded-lg border p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Image className="w-5 h-5 text-theme-accent" />
                        <h3 className="font-semibold text-theme-text">Background</h3>
                    </div>

                    <div className="space-y-4">
                        {/* Image URL */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Background Image URL</label>
                            <input
                                type="text"
                                value={settings.hero_image_url}
                                onChange={(e) => setSettings({ ...settings, hero_image_url: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-accent focus:border-transparent"
                                placeholder="https://..."
                            />
                            <p className="text-xs text-gray-500 mt-1">Leave empty to use gradient background</p>
                        </div>

                        {/* Video URL */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Background Video URL (optional)</label>
                            <input
                                type="text"
                                value={settings.hero_video_url}
                                onChange={(e) => setSettings({ ...settings, hero_video_url: e.target.value })}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-accent focus:border-transparent"
                                placeholder="https://..."
                            />
                        </div>

                        {/* Preview */}
                        {settings.hero_image_url && (
                            <div className="mt-3">
                                <p className="text-xs text-gray-500 mb-2">Preview:</p>
                                <img
                                    src={settings.hero_image_url}
                                    alt="Background preview"
                                    className="w-full h-32 object-cover rounded-lg"
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Overlay Section */}
                <div className="bg-white rounded-lg border p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Sliders className="w-5 h-5 text-theme-accent" />
                        <h3 className="font-semibold text-theme-text">Overlay</h3>
                    </div>

                    <div className="space-y-4">
                        {/* Overlay Color */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Overlay Color</label>
                            <div className="flex items-center gap-3">
                                <input
                                    type="color"
                                    value={settings.hero_overlay_color}
                                    onChange={(e) => setSettings({ ...settings, hero_overlay_color: e.target.value })}
                                    className="w-12 h-10 rounded border border-gray-300 cursor-pointer"
                                />
                                <input
                                    type="text"
                                    value={settings.hero_overlay_color}
                                    onChange={(e) => setSettings({ ...settings, hero_overlay_color: e.target.value })}
                                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-accent focus:border-transparent font-mono"
                                    placeholder="#000000"
                                />
                            </div>
                        </div>

                        {/* Overlay Opacity */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Overlay Opacity: {settings.hero_overlay_opacity}%
                            </label>
                            <input
                                type="range"
                                min="0"
                                max="100"
                                value={settings.hero_overlay_opacity}
                                onChange={(e) => setSettings({ ...settings, hero_overlay_opacity: e.target.value })}
                                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="flex justify-between text-xs text-gray-500">
                                <span>0% (None)</span>
                                <span>100% (Full)</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA Buttons Section */}
                <div className="md:col-span-2 bg-white rounded-lg border p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <LinkIcon className="w-5 h-5 text-theme-accent" />
                        <h3 className="font-semibold text-theme-text">Call-to-Action Buttons</h3>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Primary CTA */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-gray-600">Primary Button</h4>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Button Text</label>
                                <input
                                    type="text"
                                    value={settings.hero_cta_text}
                                    onChange={(e) => setSettings({ ...settings, hero_cta_text: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-accent focus:border-transparent"
                                    placeholder="Shop All Products"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Button Link</label>
                                <input
                                    type="text"
                                    value={settings.hero_cta_link}
                                    onChange={(e) => setSettings({ ...settings, hero_cta_link: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-accent focus:border-transparent"
                                    placeholder="/"
                                />
                            </div>
                        </div>

                        {/* Secondary CTA */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-gray-600">Secondary Button</h4>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Button Text</label>
                                <input
                                    type="text"
                                    value={settings.hero_cta_secondary_text}
                                    onChange={(e) => setSettings({ ...settings, hero_cta_secondary_text: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-accent focus:border-transparent"
                                    placeholder="Start Assessment"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Button Link</label>
                                <input
                                    type="text"
                                    value={settings.hero_cta_secondary_link}
                                    onChange={(e) => setSettings({ ...settings, hero_cta_secondary_link: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-theme-accent focus:border-transparent"
                                    placeholder="/assessment"
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeroSettingsManager;
