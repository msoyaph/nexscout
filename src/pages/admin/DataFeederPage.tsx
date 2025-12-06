import { useState, useEffect } from 'react';
import { Save, Sparkles, Building2, Plus, Trash2, Edit, ArrowLeft } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface CompanyTemplate {
  id: string;
  name: string;
  industry: string;
  short_description: string;
  logo_url?: string;
  website_url?: string;
  is_active: boolean;
  ai_instructions?: string;
}

export default function DataFeederPage() {
  const [templates, setTemplates] = useState<CompanyTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [shortDescription, setShortDescription] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [aiInstructions, setAiInstructions] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const { data } = await supabase.from('admin_companies').select('*').order('created_at', { ascending: false });
      const withInstructions = await Promise.all((data || []).map(async (c) => {
        const { data: ai } = await supabase.from('company_knowledge_posts').select('content').eq('admin_company_id', c.id).eq('post_type', 'ai_system_instructions').maybeSingle();
        return { ...c, ai_instructions: ai?.content || '' };
      }));
      setTemplates(withInstructions);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleNew = () => {
    setEditingId(null);
    setName('');
    setIndustry('');
    setShortDescription('');
    setLogoUrl('');
    setWebsiteUrl('');
    setAiInstructions('');
    setIsActive(true);
    setShowEditor(true);
  };

  const handleEdit = (t: CompanyTemplate) => {
    setEditingId(t.id);
    setName(t.name);
    setIndustry(t.industry);
    setShortDescription(t.short_description);
    setLogoUrl(t.logo_url || '');
    setWebsiteUrl(t.website_url || '');
    setAiInstructions(t.ai_instructions || '');
    setIsActive(t.is_active);
    setShowEditor(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return alert('Name required');
    setSaving(true);
    try {
      let companyId = editingId;
      if (editingId) {
        await supabase.from('admin_companies').update({ name, industry, short_description: shortDescription, logo_url: logoUrl, website_url: websiteUrl, is_active: isActive }).eq('id', editingId);
      } else {
        const { data } = await supabase.from('admin_companies').insert({ name, industry, short_description: shortDescription, logo_url: logoUrl, website_url: websiteUrl, is_active: isActive, owner_type: 'system' }).select().single();
        companyId = data?.id;
      }
      if (aiInstructions.trim() && companyId) {
        await supabase.from('company_knowledge_posts').upsert({ admin_company_id: companyId, title: `${name} AI Instructions`, content: aiInstructions, post_type: 'ai_system_instructions', status: 'published' }, { onConflict: 'admin_company_id,post_type' });
      }
      alert('✅ Saved!');
      setShowEditor(false);
      loadTemplates();
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t: CompanyTemplate) => {
    if (!confirm(`Delete ${t.name}?`)) return;
    await supabase.from('company_knowledge_posts').delete().eq('admin_company_id', t.id);
    await supabase.from('admin_companies').delete().eq('id', t.id);
    alert('Deleted');
    loadTemplates();
  };

  if (showEditor) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => setShowEditor(false)} className="flex items-center gap-2 text-gray-600 mb-4"><ArrowLeft className="size-5" />Back</button>
          <div className="bg-white rounded-xl shadow p-8 space-y-4">
            <h1 className="text-2xl font-bold">{editingId ? 'Edit' : 'New'} Template</h1>
            <div><label className="block text-sm font-semibold mb-2">Company Name *</label><input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-3 border rounded-lg" placeholder="e.g., Millennium Soya" /></div>
            <div><label className="block text-sm font-semibold mb-2">Industry</label><select value={industry} onChange={(e) => setIndustry(e.target.value)} className="w-full px-4 py-3 border rounded-lg"><option value="">Select...</option><option value="MLM">MLM</option><option value="Real Estate">Real Estate</option><option value="Insurance">Insurance</option><option value="Health & Wellness">Health & Wellness</option><option value="E-commerce">E-commerce</option></select></div>
            <div><label className="block text-sm font-semibold mb-2">Short Description</label><input type="text" value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} className="w-full px-4 py-3 border rounded-lg" /></div>
            <div><label className="block text-sm font-semibold mb-2">Logo URL</label><input type="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} className="w-full px-4 py-3 border rounded-lg" />{logoUrl && <img src={logoUrl} className="h-16 mt-2" />}</div>
            <div><label className="block text-sm font-semibold mb-2">Website URL</label><input type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} className="w-full px-4 py-3 border rounded-lg" /></div>
            <div><label className="block text-sm font-semibold mb-2 flex items-center gap-2"><Sparkles className="size-5 text-purple-600" />AI System Instructions</label><textarea value={aiInstructions} onChange={(e) => setAiInstructions(e.target.value)} rows={20} className="w-full px-4 py-3 border rounded-lg font-mono text-sm" placeholder="Paste full AI instructions..." /><p className="text-xs text-gray-500">{aiInstructions.length} chars</p></div>
            <label className="flex items-center gap-2"><input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />Active</label>
            <div className="flex justify-end gap-4 pt-4 border-t"><button onClick={() => setShowEditor(false)} className="px-6 py-3 text-gray-600">Cancel</button><button onClick={handleSave} disabled={saving} className="px-8 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2">{saving ? 'Saving...' : <><Save className="size-5" />Save</>}</button></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-3xl font-bold flex items-center gap-3"><Building2 className="size-8 text-blue-600" />Company Templates</h1><p className="text-gray-600 mt-1">Create templates for onboarding</p></div>
          <button onClick={handleNew} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-2"><Plus className="size-5" />New Template</button>
        </div>
        {loading ? <div className="text-center py-12">Loading...</div> : templates.length === 0 ? <div className="bg-white rounded-xl shadow p-12 text-center"><h3 className="text-xl font-bold mb-2">No Templates</h3><button onClick={handleNew} className="px-6 py-3 bg-blue-600 text-white rounded-lg">Create First</button></div> : <div className="grid gap-4">{templates.map((t) => (<div key={t.id} className="bg-white rounded-xl shadow p-6 flex items-start justify-between"><div className="flex gap-4 flex-1">{t.logo_url && <img src={t.logo_url} className="size-16 rounded" />}<div><h3 className="text-xl font-bold">{t.name}</h3><p className="text-gray-600">{t.short_description}</p><p className="text-sm text-gray-500 mt-1">{t.industry}</p></div></div><div className="flex gap-2"><button onClick={() => handleEdit(t)} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit className="size-5" /></button><button onClick={() => handleDelete(t)} className="p-2 text-red-600 hover:bg-red-50 rounded"><Trash2 className="size-5" /></button></div></div>))}</div>}
      </div>
    </div>
  );
}
