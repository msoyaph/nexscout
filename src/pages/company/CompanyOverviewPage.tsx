import { useState, useEffect } from 'react';
import { ArrowLeft, Building2, Upload, Sparkles, Save } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { getCompanyProfile, upsertCompanyProfile } from '../../services/company/companyKnowledgeBase';
import type { CompanyProfile } from '../../services/company/companyKnowledgeBase';

interface CompanyOverviewPageProps {
  onBack?: () => void;
}

const industries = [
  'MLM / Network Marketing',
  'Insurance',
  'Real Estate',
  'Affiliate Marketing',
  'Direct Selling',
  'Coaching / Consulting',
  'E-commerce',
  'Other',
];

export default function CompanyOverviewPage({ onBack }: CompanyOverviewPageProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');

  const [formData, setFormData] = useState({
    companyName: '',
    companySlogan: '',
    industry: '',
    description: '',
    logoUrl: '',
  });

  const [aiSummary, setAiSummary] = useState('');

  useEffect(() => {
    loadCompanyProfile();
  }, [user]);

  async function loadCompanyProfile() {
    if (!user) return;

    try {
      const profile = await getCompanyProfile(user.id);

      if (profile) {
        setFormData({
          companyName: profile.companyName,
          companySlogan: profile.companySlogan || '',
          industry: profile.industry,
          description: profile.description || '',
          logoUrl: profile.logoUrl || '',
        });
        setLogoPreview(profile.logoUrl || '');
      }
    } catch (error) {
      console.error('Load profile error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleLogoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo file must be under 2MB');
      return;
    }

    setLogoFile(file);
    const preview = URL.createObjectURL(file);
    setLogoPreview(preview);
  }

  async function uploadLogo(): Promise<string | null> {
    if (!logoFile || !user) return null;

    try {
      const fileExt = logoFile.name.split('.').pop();
      const filePath = `${user.id}/logo.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('company-assets')
        .upload(filePath, logoFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('company-assets')
        .getPublicUrl(filePath);

      return urlData.publicUrl;
    } catch (error) {
      console.error('Logo upload error:', error);
      return null;
    }
  }

  async function handleSave() {
    if (!user) return;

    if (!formData.companyName || !formData.industry) {
      alert('Please fill in company name and industry');
      return;
    }

    setSaving(true);

    try {
      let logoUrl = formData.logoUrl;

      if (logoFile) {
        const uploaded = await uploadLogo();
        if (uploaded) logoUrl = uploaded;
      }

      const result = await upsertCompanyProfile(user.id, {
        companyName: formData.companyName,
        companySlogan: formData.companySlogan || null,
        industry: formData.industry,
        description: formData.description || null,
        logoUrl: logoUrl || null,
      });

      if (result.success) {
        alert('Company profile saved successfully!');
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  }

  async function handleAnalyze() {
    if (!formData.description) {
      alert('Please add a company description first');
      return;
    }

    setAnalyzing(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-company-overview`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            companyName: formData.companyName,
            industry: formData.industry,
            description: formData.description,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        setAiSummary(result.summary || 'Analysis complete.');
      } else {
        setAiSummary('AI analysis unavailable. Please try again later.');
      }
    } catch (error) {
      console.error('Analyze error:', error);
      setAiSummary('AI analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onBack?.()}
              className="flex items-center justify-center size-10 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <ArrowLeft className="size-5 text-slate-700" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-900">Company Overview</h1>
              <p className="text-sm text-slate-600">Tell NexScout AI about your company</p>
            </div>
            <Building2 className="size-6 text-blue-600" />
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Company Logo</h2>

          <div className="flex items-start gap-6">
            <div className="w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-slate-200">
              {logoPreview ? (
                <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <Building2 className="size-10 text-slate-400" />
              )}
            </div>

            <div className="flex-1">
              <label className="block">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                  className="hidden"
                  id="logo-upload"
                />
                <label
                  htmlFor="logo-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-medium cursor-pointer hover:bg-blue-700 transition-colors"
                >
                  <Upload className="size-4" />
                  Upload Logo
                </label>
              </label>
              <p className="text-sm text-slate-600 mt-2">PNG, JPG up to 2MB. Square format recommended.</p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
          <h2 className="text-lg font-semibold text-slate-900">Company Information</h2>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Company Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your Company Name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Brand Slogan</label>
            <input
              type="text"
              value={formData.companySlogan}
              onChange={(e) => setFormData({ ...formData, companySlogan: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Your inspiring tagline"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Industry <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.industry}
              onChange={(e) => setFormData({ ...formData, industry: e.target.value })}
              className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Industry</option>
              {industries.map((ind) => (
                <option key={ind} value={ind}>
                  {ind}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Company Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
              className="w-full px-4 py-3 bg-slate-50 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Tell us about your company, products, mission, and what makes you unique..."
            />
          </div>
        </section>

        {aiSummary && (
          <section className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-200">
            <h3 className="text-lg font-semibold text-purple-900 mb-3 flex items-center gap-2">
              <Sparkles className="size-5" />
              AI-Generated Summary
            </h3>
            <p className="text-slate-700 leading-relaxed whitespace-pre-line">{aiSummary}</p>
          </section>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={handleAnalyze}
            disabled={analyzing || !formData.description}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {analyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="size-5" />
                Analyze My Company
              </>
            )}
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="size-5" />
                Save & Update AI Context
              </>
            )}
          </button>
        </div>
      </main>
    </div>
  );
}
