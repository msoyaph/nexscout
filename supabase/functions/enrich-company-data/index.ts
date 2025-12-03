import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface CompanyEnrichmentRequest {
  companyName: string;
  companyDomain?: string;
}

interface CompanyData {
  name: string;
  domain?: string;
  description?: string;
  industry?: string;
  size?: string;
  founded?: number;
  location?: string;
  products?: Array<{ name: string; description: string }>;
  faqs?: Array<{ question: string; answer: string }>;
  valuePropositions?: string[];
  targetAudience?: string;
  socialMedia?: { [key: string]: string };
  websiteContent?: string;
}

async function enrichCompanyData(companyName: string, domain?: string): Promise<CompanyData> {
  try {
    // Simulate AI enrichment - In production, this would call real APIs
    // like Clearbit, Apollo.io, or custom web scraping services
    
    const enrichedData: CompanyData = {
      name: companyName,
      domain: domain || `${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
      description: `${companyName} is a leading company providing innovative solutions to businesses worldwide.`,
      industry: 'Technology',
      size: '50-200 employees',
      location: 'United States',
      products: [
        {
          name: 'Core Product',
          description: `${companyName}'s flagship product offering`
        }
      ],
      faqs: [
        {
          question: `What does ${companyName} do?`,
          answer: `${companyName} provides cutting-edge solutions to help businesses grow and succeed.`
        },
        {
          question: 'How can I get started?',
          answer: 'Contact our sales team to schedule a demo and learn more about our offerings.'
        },
        {
          question: 'What industries do you serve?',
          answer: 'We serve clients across various industries including technology, finance, healthcare, and more.'
        }
      ],
      valuePropositions: [
        'Innovative solutions tailored to your needs',
        'Proven track record of success',
        'Dedicated customer support',
        'Scalable and flexible platform'
      ],
      targetAudience: 'Small to medium-sized businesses looking to scale their operations',
      socialMedia: {
        linkedin: `https://linkedin.com/company/${companyName.toLowerCase().replace(/\s+/g, '-')}`,
        twitter: `https://twitter.com/${companyName.toLowerCase().replace(/\s+/g, '')}`,
        facebook: `https://facebook.com/${companyName.toLowerCase().replace(/\s+/g, '')}`
      },
      websiteContent: `${companyName} - About Us\n\nWe are ${companyName}, committed to delivering exceptional value to our clients through innovative products and services. Our team of experts works tirelessly to ensure your success.\n\nOur Products:\n- Feature-rich solutions\n- Easy to use interface\n- Enterprise-grade security\n\nWhy Choose Us:\n- Industry expertise\n- Customer-first approach\n- Continuous innovation`
    };

    return enrichedData;
  } catch (error) {
    console.error('Error enriching company data:', error);
    throw error;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from JWT token
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized - No authorization header' }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Create a client with the user's token to verify auth
    const supabaseClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: {
        headers: { Authorization: authHeader }
      }
    });

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized', details: authError?.message }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { companyName, companyDomain }: CompanyEnrichmentRequest = await req.json();

    if (!companyName) {
      return new Response(
        JSON.stringify({ error: 'Company name is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Enrich company data using AI
    const enrichedData = await enrichCompanyData(companyName, companyDomain);

    // Store enriched data in database
    const { data, error } = await supabase
      .from('company_profiles')
      .upsert(
        {
          user_id: user.id,
          company_name: enrichedData.name,
          company_domain: enrichedData.domain,
          company_description: enrichedData.description,
          industry: enrichedData.industry,
          company_size: enrichedData.size,
          founded_year: enrichedData.founded,
          location: enrichedData.location,
          products: enrichedData.products,
          faqs: enrichedData.faqs,
          value_propositions: enrichedData.valuePropositions,
          target_audience: enrichedData.targetAudience,
          social_media: enrichedData.socialMedia,
          website_content: enrichedData.websiteContent,
          ai_enriched_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id',
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error storing company data:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to store company data', details: error.message }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: enrichedData }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in enrich-company-data function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});