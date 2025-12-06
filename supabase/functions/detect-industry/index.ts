import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { description } = await req.json();

    console.log('[DetectIndustry] Input:', description);

    // Use simple keyword matching for now (can upgrade to OpenAI later)
    const industryKeywords: Record<string, string[]> = {
      'mlm': ['mlm', 'network marketing', 'aim global', 'frontrow', 'direct selling', 'wellness business', 'health products', 'distributor', 'downline', 'upline'],
      'insurance': ['insurance', 'life insurance', 'health insurance', 'pru life', 'sun life', 'coverage', 'policy', 'protection', 'assurance'],
      'real_estate': ['real estate', 'property', 'condo', 'house and lot', 'ayala land', 'vista land', 'broker', 'realtor', 'listings'],
      'online_seller': ['online seller', 'ecommerce', 'shopee', 'lazada', 'online shop', 'dropshipping', 'reseller', 'retail'],
      'coaching': ['coaching', 'consultant', 'mentoring', 'training', 'life coach', 'business coach', 'advisor'],
      'service': ['virtual assistant', 'freelancer', 'service provider', 'web design', 'graphic design', 'va'],
      'health': ['health', 'wellness', 'fitness', 'nutrition', 'gym', 'personal trainer', 'supplements'],
      'food': ['restaurant', 'food', 'catering', 'cafe', 'bakery', 'food business', 'delivery'],
      'beauty': ['beauty', 'salon', 'spa', 'cosmetics', 'skincare', 'makeup', 'aesthetic'],
      'tech': ['software', 'tech', 'saas', 'app', 'development', 'it services', 'technology'],
    };

    const descLower = description.toLowerCase();
    let detectedIndustry = 'others';
    let highestScore = 0;

    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      const score = keywords.filter(keyword => descLower.includes(keyword)).length;
      if (score > highestScore) {
        highestScore = score;
        detectedIndustry = industry;
      }
    }

    console.log('[DetectIndustry] Detected:', detectedIndustry, 'Score:', highestScore);

    // Map to our industry values
    const industryMap: Record<string, string> = {
      'mlm': 'MLM / Network Marketing',
      'insurance': 'Insurance',
      'real_estate': 'Real Estate',
      'online_seller': 'Online Seller',
      'coaching': 'Coaching / Consulting',
      'service': 'Service Provider',
      'health': 'Health & Wellness',
      'food': 'Food & Beverage',
      'beauty': 'Beauty & Personal Care',
      'tech': 'Technology / SaaS',
    };

    const finalIndustry = industryMap[detectedIndustry] || description;

    return new Response(
      JSON.stringify({
        success: true,
        industry: finalIndustry,
        detected_from: detectedIndustry,
        confidence: highestScore > 0 ? 'high' : 'low'
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error: any) {
    console.error('[DetectIndustry] Error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        industry: 'others'
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

