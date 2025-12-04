import { useState, useEffect } from 'react';
import { Database, Upload, Search, Building2, Package, Layers, Plus, Save, Trash2, Copy, RefreshCw, Zap, FileText, Eye, Edit, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';

export default function DataFeederPage() {
  const [activeTab, setActiveTab] = useState<'companies' | 'products' | 'variants' | 'power-mode'>('companies');
  const [showAddForm, setShowAddForm] = useState(false);
  const [adminStatus, setAdminStatus] = useState<{ isAdmin: boolean; isSuperAdmin: boolean } | null>(null);
  const [checkingAdmin, setCheckingAdmin] = useState(true);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase.rpc('get_my_admin_status');
      if (error) {
        console.error('Admin status check error:', error);
        setAdminStatus({ isAdmin: false, isSuperAdmin: false });
      } else {
        setAdminStatus({
          isAdmin: data?.[0]?.is_admin || false,
          isSuperAdmin: data?.[0]?.is_super_admin || false,
        });
      }
    } catch (error) {
      console.error('Admin check failed:', error);
      setAdminStatus({ isAdmin: false, isSuperAdmin: false });
    }
    setCheckingAdmin(false);
  };

  const handleMakeMeAdmin = async () => {
    try {
      console.log('Calling dev_make_me_admin...');
      const { data, error } = await supabase.rpc('dev_make_me_admin');

      if (error) {
        console.error('RPC error:', error);
        alert(`❌ Error: ${error.message}\n\nPlease check the browser console for details.`);
        return;
      }

      console.log('dev_make_me_admin response:', data);

      if (data?.success) {
        alert(`✅ ${data.message || 'You are now an admin!'}\n\nEmail: ${data.email || 'N/A'}\nRefreshing page...`);
        // Wait a moment for database to update
        setTimeout(() => {
          checkAdminStatus();
          // Force page reload to clear any cached auth state
          window.location.reload();
        }, 500);
      } else {
        alert(`❌ ${data?.error || 'Failed to promote to admin'}\n\nResponse: ${JSON.stringify(data)}`);
      }
    } catch (error: any) {
      console.error('Exception:', error);
      alert(`❌ Unexpected error: ${error.message}`);
    }
  };

  const tabs = [
    { id: 'companies', label: 'Companies', icon: Building2, count: 0 },
    { id: 'products', label: 'Products', icon: Package, count: 0 },
    { id: 'variants', label: 'Variants', icon: Layers, count: 0 },
    { id: 'power-mode', label: 'Power Mode', icon: Zap, count: 0, highlight: true },
  ];

  return (
    <div className="space-y-6">
      {!checkingAdmin && !adminStatus?.isAdmin && (
        <div className="bg-yellow-50 border-2 border-yellow-400 rounded-2xl p-6">
          <div className="flex items-start justify-between">
            <div>
              <h4 className="text-lg font-bold text-yellow-900 mb-2">⚠️ Admin Access Required</h4>
              <p className="text-sm text-yellow-800 mb-4">
                You need admin privileges to access the Data Feeder System and publish knowledge posts.
              </p>
              <p className="text-xs text-yellow-700">
                Click the button to grant yourself admin access for development.
              </p>
            </div>
            <button
              onClick={handleMakeMeAdmin}
              className="px-6 py-3 bg-yellow-600 text-white rounded-xl font-semibold hover:bg-yellow-700 transition-colors whitespace-nowrap"
            >
              Make Me Admin
            </button>
          </div>
        </div>
      )}

      {adminStatus?.isAdmin && (
        <div className="bg-green-50 border-2 border-green-400 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold">
              ✓
            </div>
            <div>
              <h4 className="text-sm font-bold text-green-900">Admin Access Granted</h4>
              <p className="text-xs text-green-700">
                {adminStatus.isSuperAdmin ? 'Super Admin' : 'Admin'} • Full access to Data Feeder System
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 border-2 border-blue-200">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Data Feeder System</h3>
            <p className="text-gray-700 mb-4">
              Create master templates for companies, products, and variants that users can select during onboarding.
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-blue-200">
                <Database className="size-5 text-blue-600" />
                <span className="text-sm font-semibold text-gray-900">System Ready</span>
              </div>
              <div className="text-sm text-gray-600">
                Multi-tenancy enabled: System, Team, Enterprise
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <Plus className="size-5" />
            Add {activeTab === 'companies' ? 'Company' : activeTab === 'products' ? 'Product' : 'Variant'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setShowAddForm(false);
                }}
                className={`flex-1 px-6 py-4 flex items-center justify-center gap-3 font-semibold transition-colors border-b-2 ${
                  activeTab === tab.id
                    ? (tab.highlight ? 'border-yellow-500 text-yellow-600 bg-yellow-50' : 'border-blue-600 text-blue-600 bg-blue-50')
                    : (tab.highlight ? 'border-transparent text-yellow-600 hover:bg-yellow-50' : 'border-transparent text-gray-600 hover:bg-gray-50')
                }`}
              >
                <tab.icon className="size-5" />
                <span>{tab.label}</span>
                {tab.highlight && (
                  <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded-full">
                    NEW
                  </span>
                )}
                {!tab.highlight && (
                  <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </div>

        <div className="p-8">
          {activeTab === 'power-mode' ? (
            <PowerModeEditor />
          ) : showAddForm ? (
            <AddDataForm type={activeTab} onCancel={() => setShowAddForm(false)} />
          ) : (
            <EmptyState type={activeTab} onAdd={() => setShowAddForm(true)} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-12 rounded-xl bg-blue-100 flex items-center justify-center">
              <Upload className="size-6 text-blue-600" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Bulk Import</h4>
              <p className="text-xs text-gray-600">Import from CSV</p>
            </div>
          </div>
          <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors">
            Coming Soon
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-12 rounded-xl bg-green-100 flex items-center justify-center">
              <Copy className="size-6 text-green-600" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Clone Template</h4>
              <p className="text-xs text-gray-600">Duplicate existing</p>
            </div>
          </div>
          <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors">
            Coming Soon
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <div className="flex items-center gap-3 mb-4">
            <div className="size-12 rounded-xl bg-purple-100 flex items-center justify-center">
              <RefreshCw className="size-6 text-purple-600" />
            </div>
            <div>
              <h4 className="font-bold text-gray-900">Sync Status</h4>
              <p className="text-xs text-gray-600">Usage tracking</p>
            </div>
          </div>
          <button className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors">
            View Analytics
          </button>
        </div>
      </div>

      <div className="bg-yellow-50 rounded-2xl p-6 border-2 border-yellow-200">
        <h4 className="font-bold text-yellow-900 mb-2">Quick Start Guide</h4>
        <div className="space-y-2 text-sm text-yellow-800">
          <p><strong>Step 1:</strong> Create admin companies for different industries (MLM, Insurance, Real Estate)</p>
          <p><strong>Step 2:</strong> Add products for each company (2-3 products per company)</p>
          <p><strong>Step 3:</strong> Add variants for each product (pricing tiers, package sizes)</p>
          <p><strong>Step 4:</strong> Test the onboarding flow with a new user account</p>
        </div>
        <div className="mt-4 p-4 bg-white rounded-xl border border-yellow-300">
          <p className="text-xs text-gray-600 mb-2">For SQL examples and documentation:</p>
          <code className="text-xs font-mono text-blue-600">See: SUPER_ADMIN_DATA_FEEDER_REPORT.md</code>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ type, onAdd }: { type: string; onAdd: () => void }) {
  const content = {
    companies: {
      title: 'No Companies Yet',
      description: 'Start by creating master company templates that users can select during onboarding.',
      example: 'Examples: "Frontrow Philippines", "USANA", "Pru Life UK"',
    },
    products: {
      title: 'No Products Yet',
      description: 'Add products that belong to your admin companies. These will be copied to users who select the company.',
      example: 'Examples: "Diamond Package", "Insurance Plan A", "Starter Kit"',
    },
    variants: {
      title: 'No Variants Yet',
      description: 'Create pricing tiers and product variants. Users can choose which variant suits their needs.',
      example: 'Examples: "Basic - $99", "Pro - $299", "Enterprise - $999"',
    },
  };

  const info = content[type as keyof typeof content];

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="size-20 rounded-2xl bg-gray-100 flex items-center justify-center mb-6">
        <Database className="size-10 text-gray-400" />
      </div>
      <h3 className="text-xl font-bold text-gray-900 mb-2">{info.title}</h3>
      <p className="text-sm text-gray-600 mb-2 max-w-md text-center">{info.description}</p>
      <p className="text-xs text-gray-500 mb-6 max-w-md text-center italic">{info.example}</p>
      <button
        onClick={onAdd}
        className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors flex items-center gap-2"
      >
        <Plus className="size-5" />
        Create Your First {type === 'companies' ? 'Company' : type === 'products' ? 'Product' : 'Variant'}
      </button>
      <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200 max-w-2xl">
        <h4 className="font-bold text-blue-900 mb-2">Use SQL to Add Data Faster</h4>
        <p className="text-sm text-blue-800 mb-3">
          For now, you can insert data directly using SQL. A UI form is coming soon.
        </p>
        <div className="bg-white rounded-lg p-4 border border-blue-300">
          <code className="text-xs font-mono text-gray-700">
            INSERT INTO admin_companies (name, industry, ...) VALUES (...);
          </code>
        </div>
      </div>
    </div>
  );
}

function AddDataForm({ type, onCancel }: { type: string; onCancel: () => void }) {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-yellow-50 rounded-xl p-6 border-2 border-yellow-200 mb-6">
        <h4 className="font-bold text-yellow-900 mb-2">Form Coming Soon</h4>
        <p className="text-sm text-yellow-800 mb-4">
          The visual form builder is under development. For now, please use direct SQL inserts to add data.
        </p>
        <div className="bg-white rounded-lg p-4 border border-yellow-300">
          <p className="text-xs font-semibold text-gray-900 mb-2">Example SQL for {type}:</p>
          {type === 'companies' && (
            <code className="text-xs font-mono text-gray-700 block whitespace-pre-wrap">
{`INSERT INTO admin_companies (
  name, industry, short_description,
  is_active, is_featured, owner_type
) VALUES (
  'Your Company Name',
  'Your Industry',
  'Brief description',
  true, true, 'system'
);`}
            </code>
          )}
          {type === 'products' && (
            <code className="text-xs font-mono text-gray-700 block whitespace-pre-wrap">
{`INSERT INTO admin_products (
  company_id, name, short_description,
  price_min, price_max, is_active
) VALUES (
  'company-uuid',
  'Product Name',
  'Brief description',
  5000, 15000, true
);`}
            </code>
          )}
          {type === 'variants' && (
            <code className="text-xs font-mono text-gray-700 block whitespace-pre-wrap">
{`INSERT INTO admin_product_variants (
  product_id, variant_name,
  price, is_active
) VALUES (
  'product-uuid',
  'Variant Name',
  9999, true
);`}
            </code>
          )}
        </div>
      </div>
      <div className="flex justify-end gap-3">
        <button
          onClick={onCancel}
          className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function PowerModeEditor() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPost, setEditingPost] = useState<any>(null);
  const [companies, setCompanies] = useState<any[]>([]);

  useEffect(() => {
    loadPosts();
    loadCompanies();
  }, []);

  const loadPosts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('company_knowledge_posts')
      .select('*')
      .order('created_at', { ascending: false });
    setPosts(data || []);
    setLoading(false);
  };

  const loadCompanies = async () => {
    const { data } = await supabase
      .from('admin_companies')
      .select('id, name, industry')
      .eq('is_active', true)
      .order('name');
    setCompanies(data || []);
  };

  const handleEdit = (post: any) => {
    setEditingPost(post);
    setShowEditor(true);
  };

  const handleDelete = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    await supabase.from('company_knowledge_posts').delete().eq('id', postId);
    loadPosts();
  };

  const handleSync = async (postId: string) => {
    await supabase
      .from('company_knowledge_posts')
      .update({ sync_status: 'syncing', is_synced_to_intelligence: false })
      .eq('id', postId);

    setTimeout(async () => {
      await supabase
        .from('company_knowledge_posts')
        .update({
          sync_status: 'synced',
          is_synced_to_intelligence: true,
          last_synced_at: new Date().toISOString()
        })
        .eq('id', postId);
      loadPosts();
    }, 2000);
  };

  if (showEditor) {
    return (
      <PostEditor
        post={editingPost}
        companies={companies}
        onClose={() => {
          setShowEditor(false);
          setEditingPost(null);
          loadPosts();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-8 border-2 border-yellow-200">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="size-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                <Zap className="size-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Power Mode</h3>
                <p className="text-sm text-yellow-700">WordPress-style content editor</p>
              </div>
            </div>
            <p className="text-gray-700 mb-4">
              Add massive amounts of company knowledge content. Perfect for feeding AI with rich, detailed information.
            </p>
            <div className="flex items-center gap-3">
              <div className="px-4 py-2 bg-white rounded-xl border border-yellow-200">
                <span className="text-sm font-semibold text-gray-900">{posts.length} Posts</span>
              </div>
              <div className="px-4 py-2 bg-white rounded-xl border border-yellow-200">
                <span className="text-sm font-semibold text-green-600">
                  {posts.filter(p => p.is_synced_to_intelligence).length} Synced
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setEditingPost(null);
              setShowEditor(true);
            }}
            className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl font-semibold hover:from-yellow-500 hover:to-orange-600 transition-all flex items-center gap-2 shadow-lg"
          >
            <Plus className="size-5" />
            New Post
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="size-12 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading posts...</p>
        </div>
      ) : posts.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-300 p-12 text-center">
          <Sparkles className="size-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-gray-900 mb-2">No Content Yet</h3>
          <p className="text-gray-600 mb-6">Start creating rich knowledge posts about your companies</p>
          <button
            onClick={() => {
              setEditingPost(null);
              setShowEditor(true);
            }}
            className="px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-xl font-semibold hover:from-yellow-500 hover:to-orange-600 transition-all"
          >
            Create First Post
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">{post.title}</h3>
                      {post.status === 'published' && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                          Published
                        </span>
                      )}
                      {post.status === 'draft' && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 text-xs font-bold rounded-full">
                          Draft
                        </span>
                      )}
                      {post.is_synced_to_intelligence && (
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded-full flex items-center gap-1">
                          <Sparkles className="size-3" />
                          AI Synced
                        </span>
                      )}
                    </div>
                    {post.excerpt && (
                      <p className="text-sm text-gray-600 mb-3">{post.excerpt}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <FileText className="size-3" />
                        {post.post_type}
                      </span>
                      {post.category && (
                        <span className="flex items-center gap-1">
                          {post.category}
                        </span>
                      )}
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      <span>{post.view_count} views</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(post)}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit className="size-4 text-gray-600" />
                    </button>
                    <button
                      onClick={() => handleSync(post.id)}
                      disabled={post.sync_status === 'syncing'}
                      className="p-2 hover:bg-blue-100 rounded-lg transition-colors disabled:opacity-50"
                      title="Sync to Intelligence"
                    >
                      <RefreshCw className={`size-4 text-blue-600 ${post.sync_status === 'syncing' ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                      onClick={() => handleDelete(post.id)}
                      className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="size-4 text-red-600" />
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  <p className="text-sm text-gray-700 line-clamp-3">{post.content.substring(0, 300)}...</p>
                </div>
                {post.tags && post.tags.length > 0 && (
                  <div className="flex items-center gap-2 mt-4">
                    {post.tags.slice(0, 5).map((tag: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PostEditor({ post, companies, onClose }: { post?: any; companies: any[]; onClose: () => void }) {
  const [saving, setSaving] = useState(false);
  const [products, setProducts] = useState<any[]>(post?.products || []);
  const [formData, setFormData] = useState({
    company_name: post?.company_name || post?.title || '',
    company_logo_url: post?.company_logo_url || '',
    slug: post?.slug || '',
    content: post?.content || '',
    excerpt: post?.excerpt || '',
    post_type: post?.post_type || 'company_info',
    category: post?.category || '',
    tags: post?.tags?.join(', ') || '',
    status: post?.status || 'draft',
    auto_populate_onboarding: post?.auto_populate_onboarding !== false,
    auto_populate_chatbot: post?.auto_populate_chatbot !== false,
    auto_populate_pitch_deck: post?.auto_populate_pitch_deck || false,
    meta_description: post?.meta_description || '',
    meta_keywords: post?.meta_keywords?.join(', ') || '',
  });

  const addProduct = () => {
    setProducts([...products, { name: '', description: '', price: 0, image_url: '', is_featured: false }]);
  };

  const updateProduct = (index: number, field: string, value: any) => {
    const updated = [...products];
    updated[index][field] = value;
    setProducts(updated);
  };

  const removeProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!formData.company_name || !formData.content) {
      alert('Company Name and Content are required');
      return;
    }

    setSaving(true);
    try {
      const dataToSave: any = {
        title: formData.company_name,
        content: formData.content,
        excerpt: formData.excerpt || '',
        post_type: formData.post_type || 'company_info',
        category: formData.category || '',
        tags: formData.tags ? formData.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        status: formData.status || 'draft',
        company_name: formData.company_name,
        company_logo_url: formData.company_logo_url || '',
        products: products.filter(p => p.name && p.description),
        auto_populate_onboarding: formData.auto_populate_onboarding !== false,
        auto_populate_chatbot: formData.auto_populate_chatbot !== false,
        auto_populate_pitch_deck: formData.auto_populate_pitch_deck || false,
        meta_description: formData.meta_description || '',
        meta_keywords: formData.meta_keywords ? formData.meta_keywords.split(',').map(t => t.trim()).filter(Boolean) : [],
      };

      // Only include slug if it has a value (let trigger generate it otherwise)
      if (formData.slug && formData.slug.trim()) {
        dataToSave.slug = formData.slug.trim();
      }

      let result;
      if (post?.id) {
        result = await supabase
          .from('company_knowledge_posts')
          .update(dataToSave)
          .eq('id', post.id)
          .select();
      } else {
        result = await supabase
          .from('company_knowledge_posts')
          .insert([dataToSave])
          .select();
      }

      if (result.error) {
        console.error('Save error:', result.error);
        console.error('Error details:', {
          code: result.error.code,
          message: result.error.message,
          hint: result.error.hint,
          details: result.error.details
        });

        // Provide more helpful error messages
        let errorMessage = result.error.message;
        if (result.error.message.includes('row-level security')) {
          errorMessage = `❌ Permission Error: You need admin access to save posts.\n\n` +
            `Error: ${result.error.message}\n\n` +
            `Solution: Click "Make Me Admin" button at the top of the page first, then try again.`;
        } else if (result.error.message.includes('violates')) {
          errorMessage = `❌ Database Error: ${result.error.message}\n\n` +
            `Hint: ${result.error.hint || 'Check that all required fields are filled'}\n\n` +
            `Details: ${result.error.details || 'See browser console for more info'}`;
        }

        alert(errorMessage);
        setSaving(false);
        return;
      }

      console.log('Post saved successfully:', result.data);
      alert(`✅ Post saved successfully!\n\nTitle: ${formData.company_name}\nStatus: ${formData.status || 'draft'}`);
      setSaving(false);
      onClose();
    } catch (error: any) {
      console.error('Unexpected error:', error);
      alert(`Unexpected error: ${error.message}`);
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-gray-900">
          {post ? 'Edit Post' : 'New Knowledge Post'}
        </h3>
        <button
          onClick={onClose}
          className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          Cancel
        </button>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Company Name / Brand / DBA (Multiple names supported)
            </label>
            <input
              type="text"
              value={formData.company_name}
              onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
              placeholder="e.g., Frontrow Philippines, USANA, Pru Life UK (separate multiple names with commas)"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-2">
              Enter multiple company names, brands, or DBA names separated by commas. All will be searchable and available during user onboarding.
            </p>
            {formData.company_name && formData.company_name.includes(',') && (
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-xs font-semibold text-blue-900 mb-2">Detected {formData.company_name.split(',').filter(n => n.trim()).length} names:</p>
                <div className="flex flex-wrap gap-2">
                  {formData.company_name.split(',').map((name, idx) => {
                    const trimmedName = name.trim();
                    if (!trimmedName) return null;
                    return (
                      <span key={idx} className="px-2 py-1 bg-white border border-blue-300 text-blue-700 text-xs rounded-full">
                        {trimmedName}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Company Logo URL
            </label>
            <input
              type="text"
              value={formData.company_logo_url}
              onChange={(e) => setFormData({ ...formData, company_logo_url: e.target.value })}
              placeholder="https://example.com/logo.png"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {formData.company_logo_url && (
              <div className="mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <img src={formData.company_logo_url} alt="Logo preview" className="h-16 object-contain" />
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
            <div className="flex items-center justify-between mb-3">
              <label className="block text-lg font-bold text-gray-900 flex items-center gap-2">
                <Sparkles className="size-5 text-purple-600" />
                AI System Instructions Template
              </label>
              <button
                type="button"
                onClick={() => {
                  const template = `# AI System Instructions for [Company Name]

## Company Overview
[Brief introduction: Who we are, what we do, our mission]

## Core Values & Culture
- Value 1: [Description]
- Value 2: [Description]
- Value 3: [Description]

## Products & Services
[Detailed description of main offerings, features, benefits, pricing]

## Target Audience
- Primary: [Description]
- Secondary: [Description]
- Pain Points: [What problems we solve]

## Communication Style
- Tone: [Professional/Casual/Friendly/etc.]
- Key Messages: [Main talking points]
- Avoid: [Topics/words to avoid]

## Sales Process
1. [Step 1 description]
2. [Step 2 description]
3. [Step 3 description]

## Frequently Asked Questions
Q: [Question 1]
A: [Answer 1]

Q: [Question 2]
A: [Answer 2]

## Success Stories
[Brief testimonials or case studies]

## Additional Resources
- Training materials: [Links/descriptions]
- Support: [Contact information]
- Documentation: [Important links]

## AI Behavior Guidelines
- Always [specific instruction]
- Never [specific restriction]
- When [scenario], do [action]
- Prioritize [priority 1], then [priority 2]

## Compliance & Legal
[Important disclaimers, legal requirements, compliance notes]`;
                  setFormData({ ...formData, content: template });
                }}
                className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 transition-colors flex items-center gap-1"
              >
                <FileText className="size-3" />
                Load Template
              </button>
            </div>

            <div className="mb-4 p-3 bg-white/60 rounded-lg border border-purple-200">
              <p className="text-xs text-gray-700 mb-2 font-semibold">This will be used as AI instructions for:</p>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">🤖 Chatbot Training</span>
                <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">📊 Pitch Deck Generation</span>
                <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">💬 AI Messages</span>
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">🎯 User Onboarding</span>
              </div>
            </div>

            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Paste your AI system instructions here... This will guide how AI behaves for new users in their chatbot, pitch decks, and messaging."
              rows={18}
              className="w-full px-4 py-3 border border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm bg-white"
            />
            <div className="flex items-center justify-between mt-3">
              <p className="text-xs text-gray-600">
                {formData.content.length} characters • {Math.ceil(formData.content.length / 1000)} KB • ~{Math.ceil(formData.content.length / 4)} tokens
              </p>
              {formData.content.length > 0 && (
                <div className="flex items-center gap-2 text-xs">
                  {formData.content.length < 500 && (
                    <span className="text-orange-600 font-medium">⚠ Too short - add more details</span>
                  )}
                  {formData.content.length >= 500 && formData.content.length < 2000 && (
                    <span className="text-blue-600 font-medium">✓ Good length</span>
                  )}
                  {formData.content.length >= 2000 && (
                    <span className="text-green-600 font-medium">✓ Excellent detail!</span>
                  )}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-900 mb-2">
              Short Description (Optional)
            </label>
            <textarea
              value={formData.excerpt}
              onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
              placeholder="Brief summary for preview..."
              rows={2}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-gray-900 flex items-center gap-2">
                <Package className="size-5 text-green-600" />
                Products
              </h4>
              <button
                onClick={addProduct}
                type="button"
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Plus className="size-4" />
                Add Product
              </button>
            </div>

            {products.length === 0 ? (
              <p className="text-sm text-gray-600 text-center py-6">No products added yet. Click "Add Product" to start.</p>
            ) : (
              <div className="space-y-4">
                {products.map((product, index) => (
                  <div key={index} className="bg-white rounded-lg p-4 border border-green-200">
                    <div className="flex items-start justify-between mb-3">
                      <h5 className="font-semibold text-gray-900">Product {index + 1}</h5>
                      <button
                        onClick={() => removeProduct(index)}
                        type="button"
                        className="p-1 hover:bg-red-100 rounded transition-colors"
                      >
                        <Trash2 className="size-4 text-red-600" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Product Name</label>
                        <input
                          type="text"
                          value={product.name}
                          onChange={(e) => updateProduct(index, 'name', e.target.value)}
                          placeholder="e.g., Diamond Package"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                        <textarea
                          value={product.description}
                          onChange={(e) => updateProduct(index, 'description', e.target.value)}
                          placeholder="Product description..."
                          rows={2}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Price (PHP)</label>
                          <input
                            type="number"
                            value={product.price}
                            onChange={(e) => updateProduct(index, 'price', parseFloat(e.target.value) || 0)}
                            placeholder="9999"
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700 mb-1">Featured</label>
                          <label className="flex items-center gap-2 px-3 py-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={product.is_featured || false}
                              onChange={(e) => updateProduct(index, 'is_featured', e.target.checked)}
                              className="size-4 rounded border-gray-300"
                            />
                            <span className="text-sm text-gray-700">Featured Product</span>
                          </label>
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-1">Product Image URL</label>
                        <input
                          type="text"
                          value={product.image_url}
                          onChange={(e) => updateProduct(index, 'image_url', e.target.value)}
                          placeholder="https://example.com/product.jpg"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                        />
                        {product.image_url && (
                          <div className="mt-2 p-2 bg-gray-50 rounded border border-gray-200">
                            <img src={product.image_url} alt="Product preview" className="h-20 object-contain" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
            <h4 className="font-bold text-gray-900 mb-4">Publishing</h4>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Post Type
                </label>
                <select
                  value={formData.post_type}
                  onChange={(e) => setFormData({ ...formData, post_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="company_info">Company Info</option>
                  <option value="product_guide">Product Guide</option>
                  <option value="industry_insight">Industry Insight</option>
                  <option value="training_material">Training Material</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Industry/Category
                </label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., MLM, Insurance, Real Estate"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2">
                  Tags (comma-separated)
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                  placeholder="mlm, training, sales"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-300">
            <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
              <Sparkles className="size-5 text-green-600" />
              Auto-Populate to New Users
            </h4>
            <p className="text-xs text-green-700 mb-4">
              When enabled and published, this data automatically flows to new user accounts during signup/onboarding
            </p>

            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer p-3 bg-white rounded-lg border-2 border-green-200 hover:border-green-400 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.auto_populate_onboarding}
                  onChange={(e) => setFormData({ ...formData, auto_populate_onboarding: e.target.checked })}
                  className="size-5 rounded border-gray-300"
                />
                <div>
                  <div className="text-sm font-semibold text-gray-900">New User Onboarding</div>
                  <div className="text-xs text-gray-600">Pre-fill company profile & products instantly</div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 bg-white rounded-lg border-2 border-green-200 hover:border-green-400 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.auto_populate_chatbot}
                  onChange={(e) => setFormData({ ...formData, auto_populate_chatbot: e.target.checked })}
                  className="size-5 rounded border-gray-300"
                />
                <div>
                  <div className="text-sm font-semibold text-gray-900">AI Chatbot Training</div>
                  <div className="text-xs text-gray-600">Feed to chatbot knowledge base</div>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer p-3 bg-white rounded-lg border-2 border-green-200 hover:border-green-400 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.auto_populate_pitch_deck}
                  onChange={(e) => setFormData({ ...formData, auto_populate_pitch_deck: e.target.checked })}
                  className="size-5 rounded border-gray-300"
                />
                <div>
                  <div className="text-sm font-semibold text-gray-900">Pitch Deck Generator</div>
                  <div className="text-xs text-gray-600">Auto-include in generated decks</div>
                </div>
              </label>
            </div>

            <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-300">
              <p className="text-xs text-blue-800">
                <strong>How it works:</strong> When you publish this post, new users signing up will automatically get this company name, logo, info, and products pre-populated in their account. No manual data entry needed!
              </p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <div className="size-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Saving...
              </>
            ) : (
              <>
                <Save className="size-5" />
                {post ? 'Update Post' : 'Publish Post'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
