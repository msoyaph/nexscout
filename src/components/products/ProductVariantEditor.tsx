import { Plus, X, Grid } from 'lucide-react';

export type ProductVariant = {
  id: string;
  name: string;
  sku: string;
  price: string;
  attributes: Record<string, string>;
};

interface ProductVariantEditorProps {
  variants: ProductVariant[];
  onVariantsChange: (variants: ProductVariant[]) => void;
}

export default function ProductVariantEditor({ variants, onVariantsChange }: ProductVariantEditorProps) {
  const addVariant = () => {
    const newVariant: ProductVariant = {
      id: `temp-${Date.now()}`,
      name: '',
      sku: '',
      price: '',
      attributes: {},
    };
    onVariantsChange([...variants, newVariant]);
  };

  const removeVariant = (id: string) => {
    onVariantsChange(variants.filter((v) => v.id !== id));
  };

  const updateVariant = (id: string, field: keyof ProductVariant, value: any) => {
    onVariantsChange(
      variants.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  return (
    <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="size-12 rounded-full bg-blue-100 flex items-center justify-center">
          <Grid className="size-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Product Variants</h2>
          <p className="text-sm text-[#6B7280]">Optional: Add sizes, flavors, or plans</p>
        </div>
      </div>

      <div className="space-y-4">
        {variants.length === 0 ? (
          <div className="p-6 bg-[#F3F4F6] rounded-[16px] text-center">
            <p className="text-sm text-[#6B7280] mb-4">
              No variants yet. Add variants if your product comes in different sizes, flavors, or plans.
            </p>
            <button
              type="button"
              onClick={addVariant}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-[12px] font-semibold hover:bg-blue-700 transition-colors"
            >
              <Plus className="size-4" />
              Add First Variant
            </button>
          </div>
        ) : (
          <>
            {variants.map((variant) => (
              <div key={variant.id} className="p-4 border border-[#E5E7EB] rounded-[16px]">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="font-semibold text-[#111827]">Variant</h4>
                  <button
                    type="button"
                    onClick={() => removeVariant(variant.id)}
                    className="size-8 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"
                  >
                    <X className="size-4 text-red-600" />
                  </button>
                </div>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={variant.name}
                    onChange={(e) => updateVariant(variant.id, 'name', e.target.value)}
                    placeholder="Variant name (e.g., Small, Medium, Large)"
                    className="w-full px-3 py-2 border border-[#E5E7EB] rounded-[12px] text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={variant.sku}
                      onChange={(e) => updateVariant(variant.id, 'sku', e.target.value)}
                      placeholder="SKU (optional)"
                      className="flex-1 px-3 py-2 border border-[#E5E7EB] rounded-[12px] text-sm focus:ring-2 focus:ring-blue-500"
                    />
                    <input
                      type="number"
                      value={variant.price}
                      onChange={(e) => updateVariant(variant.id, 'price', e.target.value)}
                      placeholder="Price"
                      className="flex-1 px-3 py-2 border border-[#E5E7EB] rounded-[12px] text-sm focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={addVariant}
              className="w-full py-3 border-2 border-dashed border-[#E5E7EB] rounded-[16px] text-[#6B7280] hover:border-blue-300 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
            >
              <Plus className="size-5" />
              Add Another Variant
            </button>
          </>
        )}

        <div className="p-4 bg-blue-50 rounded-[16px] border border-blue-200">
          <p className="text-sm text-blue-900">
            💡 <strong>Example:</strong> Small (500g) - PHP 299, Medium (1kg) - PHP 499, Large (2kg) - PHP 899
          </p>
        </div>
      </div>
    </div>
  );
}
