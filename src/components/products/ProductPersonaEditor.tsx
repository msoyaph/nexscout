import { Plus, X, Target, Brain, AlertCircle } from 'lucide-react';

export interface PersonaData {
  personas: string[];
  pains: string[];
  desires: string[];
  objections: string[];
}

interface ProductPersonaEditorProps {
  data: PersonaData;
  onDataChange: (data: PersonaData) => void;
  onGenerateScript?: (persona: string) => void;
}

const COMMON_PERSONAS = [
  'OFW',
  'Breadwinner',
  'Mompreneur',
  'Side Hustler',
  'Freelancer',
  'Student',
  'Team Leader',
  'Professional',
  'Business Owner',
  'Retiree',
];

export default function ProductPersonaEditor({ data, onDataChange, onGenerateScript }: ProductPersonaEditorProps) {
  const addItem = (field: keyof PersonaData, value: string) => {
    if (!value.trim()) return;
    onDataChange({
      ...data,
      [field]: [...data[field], value],
    });
  };

  const removeItem = (field: keyof PersonaData, index: number) => {
    onDataChange({
      ...data,
      [field]: data[field].filter((_, i) => i !== index),
    });
  };

  const togglePersona = (persona: string) => {
    if (data.personas.includes(persona)) {
      onDataChange({
        ...data,
        personas: data.personas.filter(p => p !== persona),
      });
    } else {
      onDataChange({
        ...data,
        personas: [...data.personas, persona],
      });
    }
  };

  return (
    <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="size-12 rounded-full bg-blue-100 flex items-center justify-center">
          <Target className="size-6 text-blue-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Target Personas & Messaging</h2>
          <p className="text-sm text-[#6B7280]">Who is this for? What do they need?</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Personas */}
        <div>
          <label className="block text-sm font-semibold text-[#111827] mb-2">
            Target Personas *
          </label>
          <div className="flex flex-wrap gap-2 mb-3">
            {COMMON_PERSONAS.map((persona) => (
              <button
                key={persona}
                type="button"
                onClick={() => togglePersona(persona)}
                className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
                  data.personas.includes(persona)
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB]'
                }`}
              >
                {persona}
              </button>
            ))}
          </div>
          {data.personas.length > 0 && onGenerateScript && (
            <div className="flex flex-wrap gap-2 mt-3">
              {data.personas.map((persona) => (
                <button
                  key={persona}
                  type="button"
                  onClick={() => onGenerateScript(persona)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-[12px] text-sm font-semibold hover:from-blue-700 hover:to-blue-600 transition-colors"
                >
                  <Brain className="size-4" />
                  Generate Script for {persona}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Pain Points */}
        <div>
          <label className="block text-sm font-semibold text-[#111827] mb-2">
            Pain Points (What problems do they have?)
          </label>
          {data.pains.map((pain, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={pain}
                readOnly
                className="flex-1 px-3 py-2 border border-[#E5E7EB] rounded-[12px] text-sm bg-[#F9FAFB]"
              />
              <button
                type="button"
                onClick={() => removeItem('pains', index)}
                className="size-8 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"
              >
                <X className="size-4 text-red-600" />
              </button>
            </div>
          ))}
          <input
            type="text"
            placeholder="Add pain point (e.g., 'No time for side income')"
            className="w-full px-3 py-2 border-2 border-dashed border-[#E5E7EB] rounded-[12px] text-sm focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addItem('pains', e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
          <p className="text-xs text-[#6B7280] mt-1">Press Enter to add</p>
        </div>

        {/* Desires */}
        <div>
          <label className="block text-sm font-semibold text-[#111827] mb-2">
            Desires (What do they want to achieve?)
          </label>
          {data.desires.map((desire, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={desire}
                readOnly
                className="flex-1 px-3 py-2 border border-[#E5E7EB] rounded-[12px] text-sm bg-[#F9FAFB]"
              />
              <button
                type="button"
                onClick={() => removeItem('desires', index)}
                className="size-8 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"
              >
                <X className="size-4 text-red-600" />
              </button>
            </div>
          ))}
          <input
            type="text"
            placeholder="Add desire (e.g., 'Extra PHP 10k monthly')"
            className="w-full px-3 py-2 border-2 border-dashed border-[#E5E7EB] rounded-[12px] text-sm focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addItem('desires', e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
          <p className="text-xs text-[#6B7280] mt-1">Press Enter to add</p>
        </div>

        {/* Objections */}
        <div>
          <label className="block text-sm font-semibold text-[#111827] mb-2">
            Common Objections (What might they say no to?)
          </label>
          {data.objections.map((objection, index) => (
            <div key={index} className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={objection}
                readOnly
                className="flex-1 px-3 py-2 border border-[#E5E7EB] rounded-[12px] text-sm bg-[#F9FAFB]"
              />
              <button
                type="button"
                onClick={() => removeItem('objections', index)}
                className="size-8 rounded-full bg-red-50 flex items-center justify-center hover:bg-red-100 transition-colors"
              >
                <X className="size-4 text-red-600" />
              </button>
            </div>
          ))}
          <input
            type="text"
            placeholder="Add objection (e.g., 'Too expensive', 'No time')"
            className="w-full px-3 py-2 border-2 border-dashed border-[#E5E7EB] rounded-[12px] text-sm focus:ring-2 focus:ring-blue-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addItem('objections', e.currentTarget.value);
                e.currentTarget.value = '';
              }
            }}
          />
          <p className="text-xs text-[#6B7280] mt-1">Press Enter to add</p>
        </div>

        <div className="p-4 bg-blue-50 rounded-[16px] border border-blue-200">
          <div className="flex items-start gap-2">
            <AlertCircle className="size-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-blue-900 font-semibold mb-1">Why this matters</p>
              <p className="text-sm text-blue-900">
                Understanding your personas helps the AI chatbot sell better. It will use these insights to craft personalized pitches that resonate with each type of prospect.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
