import { useState } from 'react';
import { ArrowLeft, Package, Target, Link as LinkIcon, Sparkles, Check } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import ProductVariantEditor, { ProductVariant } from '../../components/products/ProductVariantEditor';
import ProductPersonaEditor, { PersonaData } from '../../components/products/ProductPersonaEditor';

interface AddProductPageProps {
  onBack: () => void;
  onNavigate: (page: string, params?: any) => void;
}

type ProductFormData = {
  name: string;
  product_type: string;
  main_category: string;
  short_description: string;
  primary_promise: string;
  key_benefits: string[];
  ideal_prospect_tags: string[];
  currency: string;
  price_min: string;
  price_max: string;
  product_url: string;
  sales_page_url: string;
  image_url: string;
  video_url: string;
  variants: ProductVariant[];
  personaData: PersonaData;
};

const PRODUCT_TYPES = ['Product', 'Service', 'Package', 'Membership'];

const MAIN_CATEGORIES = [
  'MLM / Network Marketing',
  'Insurance / Financial Planning',
  'Real Estate',
  'Online Selling / Physical Products',
  'Coaching / Services',
  'Health Supplements',
  'Beauty Products',
  'Digital Services',
  'Other',
];

const PROSPECT_TAGS = [
  'OFW',
  'Breadwinner',
  'Freelancer',
  'Mompreneur',
  'Student',
  'Side Hustler',
  'Team Leader',
  'Retiree',
  'Professional',
  'Business Owner',
];

export default function AddProductPage({ onBack, onNavigate }: AddProductPageProps) {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [runIntel, setRunIntel] = useState(false);
  const [productId, setProductId] = useState<string | null>(null);
  const [generatedScripts, setGeneratedScripts] = useState<any[]>([]);
  const [generatingScript, setGeneratingScript] = useState(false);

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    product_type: 'Product',
    main_category: '',
    short_description: '',
    primary_promise: '',
    key_benefits: ['', '', ''],
    ideal_prospect_tags: [],
    currency: 'PHP',
    price_min: '',
    price_max: '',
    product_url: '',
    sales_page_url: '',
    image_url: '',
    video_url: '',
    variants: [],
    personaData: {
      personas: [],
      pains: [],
      desires: [],
      objections: [],
    },
  });

  const updateField = (field: keyof ProductFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const updateBenefit = (index: number, value: string) => {
    const newBenefits = [...formData.key_benefits];
    newBenefits[index] = value;
    updateField('key_benefits', newBenefits);
  };

  const toggleTag = (tag: string) => {
    const current = formData.ideal_prospect_tags;
    if (current.includes(tag)) {
      updateField(
        'ideal_prospect_tags',
        current.filter((t) => t !== tag)
      );
    } else {
      updateField('ideal_prospect_tags', [...current, tag]);
    }
  };

  const canProceed = () => {
    if (step === 1) {
      return formData.name && formData.product_type && formData.main_category && formData.short_description;
    }
    if (step === 2) {
      return formData.primary_promise && formData.key_benefits.filter((b) => b).length > 0;
    }
    if (step === 3) {
      return true;
    }
    return true;
  };

  const handleNext = async () => {
    if (!canProceed()) return;

    // Save basics after step 1 or 2 to get productId
    if ((step === 1 || step === 2) && !productId && user) {
      setSaving(true);
      try {
        const { data: session } = await supabase.auth.getSession();
        const token = session?.session?.access_token;

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/product-wizard-save-basics`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: formData.name,
              tagline: formData.primary_promise,
              category: formData.main_category,
              description: formData.short_description,
              basePrice: formData.price_min ? parseFloat(formData.price_min) : null,
            }),
          }
        );

        const result = await response.json();
        if (result.ok && result.productId) {
          setProductId(result.productId);
        }
      } catch (error) {
        console.error('Error saving basics:', error);
      } finally {
        setSaving(false);
      }
    }

    setStep(step + 1);
  };

  const handleSave = async (withIntel: boolean) => {
    if (!user) return;

    setSaving(true);
    try {
      const productData = {
        user_id: user.id,
        name: formData.name,
        product_type: formData.product_type.toLowerCase(),
        main_category: formData.main_category,
        short_description: formData.short_description,
        primary_promise: formData.primary_promise,
        key_benefits: formData.key_benefits.filter((b) => b),
        ideal_prospect_tags: formData.ideal_prospect_tags,
        currency: formData.currency,
        price_min: formData.price_min ? parseFloat(formData.price_min) : null,
        price_max: formData.price_max ? parseFloat(formData.price_max) : null,
        product_url: formData.product_url || null,
        sales_page_url: formData.sales_page_url || null,
        image_url: formData.image_url || null,
        video_url: formData.video_url || null,
        personas: formData.personaData.personas,
        pains: formData.personaData.pains,
        desires: formData.personaData.desires,
        objections: formData.personaData.objections,
        active: true,
        intel_enabled: withIntel,
        is_complete: true,
      };

      let product;

      if (productId) {
        const { data, error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', productId)
          .select()
          .single();

        if (error) throw error;
        product = data;
      } else {
        const { data, error } = await supabase
          .from('products')
          .insert(productData)
          .select()
          .single();

        if (error) throw error;
        product = data;
      }

      // Save variants if any
      if (product && formData.variants.length > 0) {
        const variantsToInsert = formData.variants.map((v, index) => ({
          product_id: product.id,
          name: v.name,
          sku: v.sku || null,
          price_override: v.price ? parseFloat(v.price) : null,
          attributes: v.attributes,
          sort_order: index,
          status: 'active',
        }));

        const { error: variantsError } = await supabase
          .from('product_variants')
          .insert(variantsToInsert);

        if (variantsError) {
          console.error('Error saving variants:', variantsError);
        }
      }

      if (withIntel && product) {
        alert('Product saved! Intelligence analysis will start shortly.');
      } else {
        alert('Product saved successfully!');
      }

      onNavigate('products-list');
    } catch (error) {
      console.error('Error saving product:', error);
      alert('Failed to save product. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] pb-24">
      <header className="bg-white px-6 py-6 shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between">
          <button
            onClick={onBack}
            className="size-10 rounded-full bg-white flex items-center justify-center border border-[#E5E7EB] shadow-sm"
          >
            <ArrowLeft className="size-5 text-[#111827]" />
          </button>
          <h1 className="text-xl font-bold">Add Product</h1>
          <div className="size-10" />
        </div>

        <div className="flex items-center gap-2 mt-6">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div
              key={s}
              className={`flex-1 h-1 rounded-full ${
                s <= step ? 'bg-blue-600' : 'bg-[#E5E7EB]'
              }`}
            />
          ))}
        </div>
        <p className="text-sm text-[#6B7280] text-center mt-2">
          Step {step} of 6
        </p>
      </header>

      <main className="px-6 pt-6">
        {step === 1 && (
          <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Package className="size-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Basic Info</h2>
                <p className="text-sm text-[#6B7280]">Tell us about your product</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#111827] mb-2">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g., C24/7 Premium Health Supplement"
                  className="w-full px-4 py-3 border border-[#E5E7EB] rounded-[16px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-[#6B7280] mt-1">
                  Halimbawa: "Premium health supplement for busy OFWs"
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#111827] mb-2">
                  Product Type *
                </label>
                <select
                  value={formData.product_type}
                  onChange={(e) => updateField('product_type', e.target.value)}
                  className="w-full px-4 py-3 border border-[#E5E7EB] rounded-[16px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {PRODUCT_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#111827] mb-2">
                  Main Category *
                </label>
                <select
                  value={formData.main_category}
                  onChange={(e) => updateField('main_category', e.target.value)}
                  className="w-full px-4 py-3 border border-[#E5E7EB] rounded-[16px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select category...</option>
                  {MAIN_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#111827] mb-2">
                  Short Description *
                </label>
                <textarea
                  value={formData.short_description}
                  onChange={(e) => updateField('short_description', e.target.value)}
                  placeholder="1-2 sentences about your product"
                  rows={3}
                  className="w-full px-4 py-3 border border-[#E5E7EB] rounded-[16px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <p className="text-xs text-[#6B7280] mt-1">
                  Halimbawa: "Affordable term life plan for breadwinners"
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-12 rounded-full bg-blue-100 flex items-center justify-center">
                <Target className="size-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Benefits & Niche</h2>
                <p className="text-sm text-[#6B7280]">What makes it special?</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#111827] mb-2">
                  Primary Promise *
                </label>
                <input
                  type="text"
                  value={formData.primary_promise}
                  onChange={(e) => updateField('primary_promise', e.target.value)}
                  placeholder="What problem does this solve?"
                  className="w-full px-4 py-3 border border-[#E5E7EB] rounded-[16px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#111827] mb-2">
                  Top 3 Key Benefits
                </label>
                {[0, 1, 2].map((i) => (
                  <input
                    key={i}
                    type="text"
                    value={formData.key_benefits[i]}
                    onChange={(e) => updateBenefit(i, e.target.value)}
                    placeholder={`Benefit ${i + 1}`}
                    className="w-full px-4 py-3 border border-[#E5E7EB] rounded-[16px] focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-2"
                  />
                ))}
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#111827] mb-2">
                  Ideal Prospect Tags
                </label>
                <div className="flex flex-wrap gap-2">
                  {PROSPECT_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                        formData.ideal_prospect_tags.includes(tag)
                          ? 'bg-blue-600 text-white'
                          : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#111827] mb-2">
                  Price Range
                </label>
                <div className="flex items-center gap-3">
                  <select
                    value={formData.currency}
                    onChange={(e) => updateField('currency', e.target.value)}
                    className="px-4 py-3 border border-[#E5E7EB] rounded-[16px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="PHP">PHP</option>
                    <option value="USD">USD</option>
                  </select>
                  <input
                    type="number"
                    value={formData.price_min}
                    onChange={(e) => updateField('price_min', e.target.value)}
                    placeholder="Min"
                    className="flex-1 px-4 py-3 border border-[#E5E7EB] rounded-[16px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-[#6B7280]">-</span>
                  <input
                    type="number"
                    value={formData.price_max}
                    onChange={(e) => updateField('price_max', e.target.value)}
                    placeholder="Max"
                    className="flex-1 px-4 py-3 border border-[#E5E7EB] rounded-[16px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <ProductPersonaEditor
              data={formData.personaData}
              onDataChange={(data) => updateField('personaData', data)}
              onGenerateScript={async (persona) => {
                if (!productId) {
                  alert('Please save product basics first (Step 1-2) before generating scripts');
                  return;
                }

                setGeneratingScript(true);
                try {
                  const { data: session } = await supabase.auth.getSession();
                  const token = session?.session?.access_token;

                  const response = await fetch(
                    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/product-wizard-generate-persona-scripts`,
                    {
                      method: 'POST',
                      headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        productId,
                        persona,
                      }),
                    }
                  );

                  const result = await response.json();

                  if (result.ok && result.script) {
                    setGeneratedScripts(prev => [...prev, result.script]);
                    alert(`Script generated for ${persona}! Scroll down to see it.`);
                  } else {
                    throw new Error(result.error || 'Failed to generate script');
                  }
                } catch (error) {
                  console.error('Error generating script:', error);
                  alert('Failed to generate script. Please try again.');
                } finally {
                  setGeneratingScript(false);
                }
              }}
            />

            {generatedScripts.length > 0 && (
              <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
                <h3 className="text-lg font-bold mb-4">Generated Scripts</h3>
                <div className="space-y-4">
                  {generatedScripts.map((script, index) => (
                    <div key={index} className="p-4 bg-[#F9FAFB] rounded-[16px] border border-[#E5E7EB]">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-blue-600">
                          {script.persona}
                        </span>
                        <span className="text-xs text-[#6B7280]">
                          AI Generated
                        </span>
                      </div>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="font-semibold text-[#111827]">Icebreaker:</span>
                          <p className="text-[#6B7280] mt-1">{script.icebreaker}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-[#111827]">Pain Trigger:</span>
                          <p className="text-[#6B7280] mt-1">{script.pain_trigger}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-[#111827]">Benefit Punchline:</span>
                          <p className="text-[#6B7280] mt-1">{script.benefit_punchline}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-[#111827]">Objection Handler:</span>
                          <p className="text-[#6B7280] mt-1">{script.objection_handler}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-[#111827]">Close Attempt:</span>
                          <p className="text-[#6B7280] mt-1">{script.close_attempt}</p>
                        </div>
                        <div>
                          <span className="font-semibold text-[#111827]">CTA:</span>
                          <p className="text-[#6B7280] mt-1">{script.cta}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {generatingScript && (
              <div className="text-center py-4">
                <div className="inline-block size-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-[#6B7280] mt-2">Generating script...</p>
              </div>
            )}
          </div>
        )}

        {step === 4 && (
          <ProductVariantEditor
            variants={formData.variants}
            onVariantsChange={(variants) => updateField('variants', variants)}
          />
        )}

        {step === 5 && (
          <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-12 rounded-full bg-blue-100 flex items-center justify-center">
                <LinkIcon className="size-6 text-blue-600" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Links & Media</h2>
                <p className="text-sm text-[#6B7280]">Optional but recommended</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[#111827] mb-2">
                  Product Website URL
                </label>
                <input
                  type="url"
                  value={formData.product_url}
                  onChange={(e) => updateField('product_url', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 border border-[#E5E7EB] rounded-[16px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#111827] mb-2">
                  Sales Page URL
                </label>
                <input
                  type="url"
                  value={formData.sales_page_url}
                  onChange={(e) => updateField('sales_page_url', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 border border-[#E5E7EB] rounded-[16px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#111827] mb-2">
                  Product Image URL
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => updateField('image_url', e.target.value)}
                  placeholder="https://..."
                  className="w-full px-4 py-3 border border-[#E5E7EB] rounded-[16px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#111827] mb-2">
                  YouTube Video Link
                </label>
                <input
                  type="url"
                  value={formData.video_url}
                  onChange={(e) => updateField('video_url', e.target.value)}
                  placeholder="https://youtube.com/..."
                  className="w-full px-4 py-3 border border-[#E5E7EB] rounded-[16px] focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-[16px] border border-blue-200">
                <p className="text-sm text-blue-900">
                  💡 <strong>Pro Tip:</strong> The smarter the data, the better your AI sales scripts and chatbot become.
                </p>
              </div>
            </div>
          </div>
        )}

        {step === 6 && (
          <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="size-12 rounded-full bg-gradient-to-br from-blue-600 to-blue-500 flex items-center justify-center">
                <Sparkles className="size-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Product Intelligence Boost</h2>
                <p className="text-sm text-[#6B7280]">Let AI analyze your product</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-[20px] border border-blue-200">
                <h3 className="font-bold text-[#111827] mb-2">What is Product Intelligence?</h3>
                <p className="text-sm text-[#6B7280] mb-4">
                  We'll scan your product, find online competitors, and suggest better pitches, angles, and pricing insights.
                </p>
                <ul className="space-y-2 text-sm text-[#6B7280]">
                  <li className="flex items-start gap-2">
                    <Check className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>Competitor analysis & positioning</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>AI-generated sales scripts & pitches</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>Objection handling suggestions</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>Upsell & cross-sell recommendations</span>
                  </li>
                </ul>
              </div>

              <label className="flex items-center gap-3 p-4 border-2 border-[#E5E7EB] rounded-[16px] cursor-pointer hover:border-blue-300 transition-colors">
                <input
                  type="checkbox"
                  checked={runIntel}
                  onChange={(e) => setRunIntel(e.target.checked)}
                  className="size-5 text-blue-600 rounded border-[#E5E7EB] focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <p className="font-semibold text-[#111827]">Run Product Intelligence now</p>
                  <p className="text-xs text-[#6B7280]">Free for Pro+ users</p>
                </div>
              </label>
            </div>
          </div>
        )}

        <div className="mt-6 flex gap-3">
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex-1 py-3 border-2 border-[#E5E7EB] text-[#111827] rounded-[16px] font-semibold hover:bg-[#F3F4F6] transition-colors"
            >
              Back
            </button>
          )}
          {step < 6 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex-1 py-3 bg-blue-600 text-white rounded-[16px] font-semibold shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          ) : (
            <>
              <button
                onClick={() => handleSave(false)}
                disabled={saving}
                className="flex-1 py-3 border-2 border-blue-600 text-blue-600 rounded-[16px] font-semibold hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Only'}
              </button>
              <button
                onClick={() => handleSave(runIntel)}
                disabled={saving}
                className="flex-1 py-3 bg-blue-600 text-white rounded-[16px] font-semibold shadow-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? 'Saving...' : runIntel ? 'Save + Run Intel' : 'Save Product'}
              </button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
