import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Sparkles, Users, Home, PlusCircle, TrendingUp, MoreHorizontal, Check, Menu, Building2, FileText, Upload, RefreshCw, Save, Eye, Globe, Copy, MessageSquare } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import ActionPopup from '../components/ActionPopup';
import SlideInMenu from '../components/SlideInMenu';
import PaywallModal from '../components/PaywallModal';
import LibraryMenu from '../components/LibraryMenu';
import { useSubscription } from '../hooks/useSubscription';
import { coinTransactionService } from '../services/coinTransactionService';

interface AIMessageSequencerPageProps {
  onNavigateToHome?: () => void;
  onNavigateToProspects?: () => void;
  onNavigateToPipeline?: () => void;
  onNavigateToMore?: () => void;
  onNavigateToPitchDeck?: () => void;
  onNavigateToMessageSequencer?: () => void;
  onNavigateToRealTimeScan?: () => void;
  onNavigateToDeepScan?: () => void;
  onNavigate?: (page: string) => void;
}

interface Prospect {
  id: string;
  full_name: string;
  company_name?: string;
  job_title?: string;
  pain_points?: string[];
  interests?: string[];
}

interface CompanyIntelligence {
  id: string;
  company_name: string;
  company_description: string;
  value_propositions: string[];
  products_services: string[];
  target_audience: string;
}

interface GeneratedMessage {
  id: string;
  title: string;
  content: string;
  scenario: string;
  context: string;
}

export default function AIMessageSequencerPage({
  onNavigateToHome,
  onNavigateToProspects,
  onNavigateToPipeline,
  onNavigateToMore,
  onNavigateToPitchDeck,
  onNavigateToMessageSequencer,
  onNavigateToRealTimeScan,
  onNavigateToDeepScan,
  onNavigate,
}: AIMessageSequencerPageProps) {
  const { user } = useAuth();
  const { tier } = useSubscription();
  const [step, setStep] = useState(1);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);
  const [messageType, setMessageType] = useState<'outreach' | 'followup' | 'company_product' | 'brochure'>('outreach');
  const [language, setLanguage] = useState<'english' | 'taglish' | 'tagalog' | 'cebuano'>('english');
  const [companyIntelligence, setCompanyIntelligence] = useState<CompanyIntelligence | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [generating, setGenerating] = useState(false);
  const [generatedMessages, setGeneratedMessages] = useState<GeneratedMessage[]>([]);
  const [showActionPopup, setShowActionPopup] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLibraryMenu, setShowLibraryMenu] = useState(false);
  const [userCoins, setUserCoins] = useState(0);
  const [loadingProspects, setLoadingProspects] = useState(false);

  useEffect(() => {
    if (user) {
      loadProspects();
      loadCompanyIntelligence();
      loadUserCoins();
    }
  }, [user]);

  const loadUserCoins = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .select('coin_balance')
      .eq('id', user.id)
      .single();
    if (data) {
      setUserCoins(data.coin_balance || 0);
      console.log('Loaded coins:', data.coin_balance);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        loadUserCoins();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [user]);

  const loadProspects = async () => {
    if (!user) return;

    setLoadingProspects(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('prospects')
        .select('id, full_name, occupation, platform, bio_text, location, metadata')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error loading prospects:', error);
        setError(`Failed to load prospects: ${error.message}`);
        setProspects([]);
        return;
      }

      if (!data || data.length === 0) {
        console.log('No prospects found for user');
        setProspects([]);
        return;
      }

      const formatted = data.map((p: any) => ({
        id: p.id,
        full_name: p.full_name || 'Unknown',
        company_name: p.occupation || p.location || '',
        job_title: p.occupation || '',
        pain_points: p.metadata?.pain_points || [],
        interests: p.metadata?.interests || [],
      }));

      console.log(`Loaded ${formatted.length} prospects:`, formatted);
      setProspects(formatted);
    } catch (err: any) {
      console.error('Exception loading prospects:', err);
      setError(`Failed to load prospects: ${err.message}`);
      setProspects([]);
    } finally {
      setLoadingProspects(false);
    }
  };

  const loadCompanyIntelligence = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('company_profiles')
      .select('id, company_name, company_description, value_propositions, products_services, target_audience')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setCompanyIntelligence(data);
    }
  };

  const filteredProspects = prospects.filter(
    (p) =>
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.company_name && p.company_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.job_title && p.job_title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
    }
  };

  const generateMessageVariants = async () => {
    if (!user || !selectedProspect) return;

    if (tier === 'free') {
      setShowPaywall(true);
      return;
    }

    if (userCoins < 10) {
      setError('Insufficient coins. Need 10 coins to generate messages.');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      await coinTransactionService.deductCoins(user.id, 10, 'ai_message_generation', {
        prospect_id: selectedProspect.id,
        message_type: messageType,
        language: language,
      });

      await loadUserCoins();

      const scenarios = [
        {
          id: '1',
          title: 'Morning Energy Boost',
          scenario: 'Early morning message, starting the day with positivity',
          context: 'Sent at 8:00 AM, capitalizing on morning motivation and fresh start mindset',
        },
        {
          id: '2',
          title: 'Social Proof & FOMO',
          scenario: 'Highlighting recent success stories and community growth',
          context: 'Uses social validation and fear of missing out on trending opportunity',
        },
        {
          id: '3',
          title: 'Problem-Solution Focus',
          scenario: 'Addresses specific pain points with tailored solution',
          context: 'Empathetic approach focusing on prospect\'s challenges and offering help',
        },
      ];

      const messages: GeneratedMessage[] = scenarios.map((scenario) => ({
        ...scenario,
        content: generateMessageContent(scenario, selectedProspect, messageType, language),
      }));

      setGeneratedMessages(messages);
      setStep(4);
    } catch (err: any) {
      setError(err.message || 'Failed to generate messages');
    } finally {
      setGenerating(false);
    }
  };

  const generateMessageContent = (
    scenario: any,
    prospect: Prospect,
    type: string,
    lang: string
  ): string => {
    const name = prospect.full_name.split(' ')[0];
    const companyInfo = companyIntelligence?.company_name || 'our company';
    const products = companyIntelligence?.products_services?.[0] || 'our products';

    const templates: Record<string, Record<string, string>> = {
      outreach: {
        english: `Hi ${name}! 👋\n\n${scenario.id === '1'
          ? `Hope you're having an amazing morning! I came across your profile and was really impressed by your background in ${prospect.job_title || 'your field'}.\n\nI'm reaching out because I think you'd be a perfect fit for what we're building at ${companyInfo}. We're helping people like you achieve financial freedom while making a real impact.`
          : scenario.id === '2'
          ? `Hey ${name}! I had to reach out - our community just hit a major milestone and I immediately thought of you!\n\n50+ people joined us this month alone, and the energy is incredible. With your experience in ${prospect.company_name || 'your industry'}, you'd be an amazing addition to our growing team at ${companyInfo}.`
          : `Hi ${name}, I hope this message finds you well.\n\nI've been thinking about the challenges in ${prospect.company_name || 'your industry'}, especially around work-life balance and income stability. I've found something that's been a game-changer for me, and I'd love to share it with you.`
        }\n\nWould you be open to a quick 15-minute chat this week? No pressure, just curious if this resonates with you! 😊`,
        taglish: `Hi ${name}! Kumusta? 👋\n\n${scenario.id === '1'
          ? `Hope you're having a great morning! Napansin ko profile mo and I'm really impressed with your background sa ${prospect.job_title || 'field mo'}.\n\nI'm reaching out kasi I think perfect ka for what we're building sa ${companyInfo}. We're helping people achieve financial freedom habang making a real impact.`
          : scenario.id === '2'
          ? `Hey ${name}! Kailangan kitang i-message - our community just reached a milestone and naisip ko agad ikaw!\n\n50+ na tao ang sumali this month, and sobrang ganda ng energy. With your experience sa ${prospect.company_name || 'industry mo'}, you'd be perfect sa growing team namin at ${companyInfo}.`
          : `Hi ${name}, I hope you're doing well.\n\nNaisip ko yung challenges sa ${prospect.company_name || 'industry mo'}, lalo na about work-life balance and income stability. May nahanap ako na life-changing for me, and I'd love to share it with you.`
        }\n\nGame ka ba for a quick 15-minute chat this week? Walang pressure, curious lang if this resonates sayo! 😊`,
        tagalog: `Kumusta ${name}! 👋\n\n${scenario.id === '1'
          ? `Umaasa akong maganda ang iyong umaga! Napansin ko ang iyong profile at talagang na-impress ako sa iyong background sa ${prospect.job_title || 'larangan mo'}.\n\nNagmemensahe ako dahil sa tingin ko perpekto ka para sa ginagawa namin sa ${companyInfo}. Tinutulungan namin ang mga tao na makamit ang financial freedom habang gumagawa ng tunay na impact.`
          : scenario.id === '2'
          ? `Kamusta ${name}! Kailangan kitang sabihan - ang aming komunidad ay umabot na sa malaking milestone at agad kitang naisip!\n\n50+ na tao ang sumali ngayong buwan, at napakaganda ng energy. Sa iyong karanasan sa ${prospect.company_name || 'industriya mo'}, magiging napakagaling mong addition sa lumalaking team namin sa ${companyInfo}.`
          : `Kumusta ${name}, umaasa akong mabuti ka.\n\nNaisip ko ang mga hamon sa ${prospect.company_name || 'industriya mo'}, lalo na tungkol sa work-life balance at katatagan ng kita. May natuklasan akong nagbago sa buhay ko, at gusto kong ibahagi ito sa iyo.`
        }\n\nPuwede ka bang mag-usap nang 15 minuto ngayong linggo? Walang pressure, curious lang kung interesado ka! 😊`,
        cebuano: `Kumusta ${name}! 👋\n\n${scenario.id === '1'
          ? `Nanghinaut ko nga maayo imong buntag! Nakita nako imong profile ug impressed gyud ko sa imong background sa ${prospect.job_title || 'field nimo'}.\n\nNag-message ko tungod kay sa akong hunahuna perpekto ka para sa among gihimo sa ${companyInfo}. Gitabang namo ang mga tawo nga makab-ot ang financial freedom samtang naghimo og tinuod nga impact.`
          : scenario.id === '2'
          ? `Uy ${name}! Kinahanglan tika sabtan - ang among komunidad miabot na sa dakong milestone ug ikaw dayon akong nahunahunaan!\n\n50+ na tawo ang miapil karong buwana, ug maayo kaayo ang energy. Uban sa imong kasinatian sa ${prospect.company_name || 'industriya nimo'}, maayo kaayo ka nga addition sa among nagtubo nga team sa ${companyInfo}.`
          : `Kumusta ${name}, nanghinaut ko nga maayo ka.\n\nNahunahuna nako ang mga hagit sa ${prospect.company_name || 'industriya nimo'}, labi na bahin sa work-life balance ug stability sa kita. Nakit-an nako ang usa ka butang nga life-changing para nako, ug gusto nako ipaambit kanimo.`
        }\n\nPwede ka ba og quick 15-minute chat karon semanaha? Walay pressure, curious lang ko kung interested ka! 😊`,
      },
      followup: {
        english: `Hey ${name}! 👋\n\n${scenario.id === '1'
          ? `I wanted to follow up on our last conversation. I've been thinking about what you mentioned regarding ${prospect.pain_points?.[0] || 'your goals'}, and I have some exciting updates to share!\n\nOur team at ${companyInfo} just launched something new that directly addresses this. Would love to catch up!`
          : scenario.id === '2'
          ? `Quick update for you! Remember when we talked about ${products}? Well, 3 more people in your area just joined, and they're already seeing amazing results.\n\nI don't want you to miss out on this momentum. Can we hop on a quick call to discuss next steps?`
          : `Hi ${name}! Just checking in - how have things been going with ${prospect.company_name || 'work'}?\n\nI know you mentioned you were considering our opportunity at ${companyInfo}. I'd love to answer any questions you might have and see if now might be a better time.`
        }\n\nLet me know what works for you! 😊`,
        taglish: `Hey ${name}! 👋\n\n${scenario.id === '1'
          ? `I wanted to follow up sa last conversation natin. Na-isip ko yung sinabi mo about ${prospect.pain_points?.[0] || 'goals mo'}, and may exciting updates ako to share!\n\nOur team sa ${companyInfo} just launched something new na directly nag-address nito. Would love to catch up!`
          : scenario.id === '2'
          ? `Quick update for you! Remember nung nag-usap tayo about ${products}? Well, 3 more people sa area mo just joined, and they're already seeing amazing results.\n\nAyoko naman na ma-miss mo yung momentum na to. Pwede ba tayo mag-quick call to discuss next steps?`
          : `Hi ${name}! Just checking in - kumusta na ba ang things with ${prospect.company_name || 'work'}?\n\nI know you mentioned na you were considering our opportunity sa ${companyInfo}. I'd love to answer any questions mo and see if ngayon might be a better time.`
        }\n\nLet me know what works para sayo! 😊`,
        tagalog: `Kumusta ${name}! 👋\n\n${scenario.id === '1'
          ? `Gusto kong mag-follow up sa ating huling pag-uusap. Naisip ko ang sinabi mo tungkol sa ${prospect.pain_points?.[0] || 'mga layunin mo'}, at mayroon akong mga exciting na update na ibabahagi!\n\nAng aming team sa ${companyInfo} ay naglabas ng bagong bagay na direktang tumutugon dito. Gusto kong mag-catch up!`
          : scenario.id === '2'
          ? `Mabilis na update para sa iyo! Naaalala mo ba nang nag-usap tayo tungkol sa ${products}? Well, 3 pang tao sa iyong lugar ang sumali, at nakikita na nila ang kahanga-hangang resulta.\n\nAyokong ma-miss mo ang momentum na ito. Pwede ba tayong mag-quick call para pag-usapan ang susunod na hakbang?`
          : `Kumusta ${name}! Nag-check in lang - kumusta na ang mga bagay sa ${prospect.company_name || 'trabaho'}?\n\nAlam kong nabanggit mo na ikaw ay nag-iisip tungkol sa aming opportunity sa ${companyInfo}. Gusto kong sagutin ang anumang tanong mo at tingnan kung ngayon ay mas magandang panahon.`
        }\n\nSabihan mo lang ako kung ano ang pwede sa iyo! 😊`,
        cebuano: `Kumusta ${name}! 👋\n\n${scenario.id === '1'
          ? `Gusto kong mag-follow up sa atong katapusang panagsulti. Nahunahuna nako ang imong gisulti bahin sa ${prospect.pain_points?.[0] || 'mga tumong nimo'}, ug naa koy exciting nga updates nga ipaambit!\n\nAng among team sa ${companyInfo} bag-o lang naglansad og bag-o nga butang nga direkta nga nagtubag niini. Gusto kong mag-catch up!`
          : scenario.id === '2'
          ? `Dali nga update para nimo! Nahinumduman mo ba sa dihang nag-istorya kita bahin sa ${products}? Aw, 3 pa ka tawo sa imong lugar ang miapil, ug nakita na nila ang talagsaon nga resulta.\n\nDili nako gusto nga ma-miss nimo kining momentum. Pwede ba kita og quick call aron hisgutan ang sunod nga lakang?`
          : `Kumusta ${name}! Nag-check in lang - unsaon na man ang mga butang sa ${prospect.company_name || 'trabaho'}?\n\nNasayud ko nga nakaingon ka nga ikaw nag-isip bahin sa among opportunity sa ${companyInfo}. Gusto kong tubagon ang bisan unsang pangutana nimo ug tan-awon kung karon basin mas maayo nga panahon.`
        }\n\nPasabta lang ko unsay pwede nimo! 😊`,
      },
      company_product: {
        english: `Hi ${name}! 👋\n\n${scenario.id === '1'
          ? `I hope this message finds you well! I wanted to personally share something exciting from ${companyInfo}.\n\n${companyIntelligence?.company_description || 'We specialize in helping people achieve their goals through innovative solutions.'}\n\nOur flagship offering, ${products}, has been transforming lives. Given your background in ${prospect.job_title || 'your field'}, I think you'd find incredible value in this.`
          : scenario.id === '2'
          ? `Great news, ${name}! ${companyInfo} just announced something that I think you'll love.\n\nWe're expanding our ${products} line with exclusive benefits for early adopters. Your experience with ${prospect.company_name || 'your industry'} makes you an ideal candidate for this opportunity.\n\n${companyIntelligence?.value_propositions?.[0] || 'We offer unmatched value and support to our partners.'}`
          : `Hi ${name}, I wanted to reach out because I see strong alignment between your goals and what ${companyInfo} offers.\n\n${companyIntelligence?.value_propositions?.[0] || 'Our value proposition is built on trust, quality, and results.'}\n\nSpecifically with ${products}, we're addressing exactly what you mentioned about ${prospect.pain_points?.[0] || 'achieving better results'}.`
        }\n\nInterested in learning more? I'd love to show you how this works! 🚀`,
        taglish: `Hi ${name}! 👋\n\n${scenario.id === '1'
          ? `I hope you're doing well! Gusto ko personally i-share sa iyo ang something exciting from ${companyInfo}.\n\n${companyIntelligence?.company_description || 'Nag-specialize kami sa pagtulong sa mga tao na makamit ang kanilang mga goals through innovative solutions.'}\n\nAng aming flagship offering, ${products}, has been transforming lives. Given your background sa ${prospect.job_title || 'field mo'}, I think you'd find incredible value dito.`
          : scenario.id === '2'
          ? `Great news, ${name}! ${companyInfo} just announced something na sa tingin ko magugustuhan mo.\n\nWe're expanding our ${products} line with exclusive benefits for early adopters. Your experience with ${prospect.company_name || 'industry mo'} makes you an ideal candidate para sa opportunity na ito.\n\n${companyIntelligence?.value_propositions?.[0] || 'Nag-offer kami ng unmatched value and support sa aming partners.'}`
          : `Hi ${name}, I wanted to reach out kasi I see strong alignment between your goals and what ${companyInfo} offers.\n\n${companyIntelligence?.value_propositions?.[0] || 'Ang value proposition namin is built on trust, quality, and results.'}\n\nSpecifically with ${products}, we're addressing exactly what you mentioned about ${prospect.pain_points?.[0] || 'achieving better results'}.`
        }\n\nInterested ka ba to learn more? I'd love to show you how this works! 🚀`,
        tagalog: `Kumusta ${name}! 👋\n\n${scenario.id === '1'
          ? `Umaasa akong mabuti ka! Gusto kong personal na ibahagi sa iyo ang isang exciting mula sa ${companyInfo}.\n\n${companyIntelligence?.company_description || 'Nag-specialize kami sa pagtulong sa mga tao na makamit ang kanilang mga layunin sa pamamagitan ng mga makabagong solusyon.'}\n\nAng aming pangunahing alok, ${products}, ay nagbabago ng mga buhay. Given ang iyong background sa ${prospect.job_title || 'larangan mo'}, sa tingin ko makakakita ka ng napakahalagang halaga dito.`
          : scenario.id === '2'
          ? `Magandang balita, ${name}! ${companyInfo} ay nag-anunsyo ng isang bagay na sa tingin ko magugustuhan mo.\n\nPinalalawig namin ang aming ${products} line na may eksklusibong benepisyo para sa mga unang adopters. Ang iyong karanasan sa ${prospect.company_name || 'industriya mo'} ay ginagawa kang perpektong kandidato para sa opportunity na ito.\n\n${companyIntelligence?.value_propositions?.[0] || 'Nag-aalok kami ng walang kapantay na halaga at suporta sa aming mga kasosyo.'}`
          : `Kumusta ${name}, gusto kong makipag-ugnayan dahil nakikita ko ang malakas na pagkakatugma sa pagitan ng iyong mga layunin at kung ano ang inaalok ng ${companyInfo}.\n\n${companyIntelligence?.value_propositions?.[0] || 'Ang aming value proposition ay itinayo sa tiwala, kalidad, at mga resulta.'}\n\nPartikular sa ${products}, tinutugunan namin ang eksakto kung ano ang binanggit mo tungkol sa ${prospect.pain_points?.[0] || 'pagkamit ng mas magagandang resulta'}.`
        }\n\nInteresado ka bang matuto ng higit pa? Gusto kong ipakita sa iyo kung paano ito gumagana! 🚀`,
        cebuano: `Kumusta ${name}! 👋\n\n${scenario.id === '1'
          ? `Nanghinaut ko nga maayo ka! Gusto kong personal nga ipaambit kanimo ang usa ka exciting gikan sa ${companyInfo}.\n\n${companyIntelligence?.company_description || 'Nag-specialize mi sa pagtabang sa mga tawo nga makab-ot ang ilang mga tumong pinaagi sa mga bag-ong solusyon.'}\n\nAng among flagship nga gitanyag, ${products}, nagbag-o sa mga kinabuhi. Given ang imong background sa ${prospect.job_title || 'field nimo'}, sa akong hunahuna makakita ka og talagsaon nga bili dinhi.`
          : scenario.id === '2'
          ? `Maayong balita, ${name}! ${companyInfo} bag-o lang nag-anunsyo og usa ka butang nga sa akong hunahuna ganahan ka.\n\nGipadako namo ang among ${products} line nga adunay eksklusibong benepisyo para sa mga unang nag-adopt. Ang imong kasinatian sa ${prospect.company_name || 'industriya nimo'} naghimo kanimo nga perpekto nga kandidato para niini nga oportunidad.\n\n${companyIntelligence?.value_propositions?.[0] || 'Nag-offer mi og walay kapareha nga bili ug suporta sa among mga kauban.'}`
          : `Kumusta ${name}, gusto kong makig-uban tungod kay nakita nako ang lig-on nga alignment tali sa imong mga tumong ug unsay gitanyag sa ${companyInfo}.\n\n${companyIntelligence?.value_propositions?.[0] || 'Ang among value proposition gitukod sa pagsalig, kalidad, ug resulta.'}\n\nPartikular sa ${products}, among gitubag ang eksakto kung unsa ang imong gihisgutan bahin sa ${prospect.pain_points?.[0] || 'pagkab-ot og mas maayo nga resulta'}.`
        }\n\nInteresado ka ba nga mahibal-an ang dugang? Gusto kong ipakita kanimo kon unsaon kini paglihok! 🚀`,
      },
      brochure: {
        english: `Hi ${name}! 👋\n\nI hope you're having a great day! I wanted to share something special with you.\n\nI've attached our latest company brochure that showcases everything about ${companyInfo} - our products, success stories, and the incredible opportunity we're offering.\n\nWhat makes this perfect for you:\n✅ ${companyIntelligence?.value_propositions?.[0] || 'Proven track record of success'}\n✅ ${companyIntelligence?.value_propositions?.[1] || 'Comprehensive training and support'}\n✅ ${companyIntelligence?.value_propositions?.[2] || 'Flexible business model'}\n\nTake a look at the brochure and let me know what catches your eye. I'd be happy to answer any questions! 📄✨`,
        taglish: `Hi ${name}! 👋\n\nI hope you're having a great day! Gusto ko i-share sa iyo ang something special.\n\nI've attached our latest company brochure na nag-showcase ng everything about ${companyInfo} - ang aming products, success stories, and the incredible opportunity we're offering.\n\nWhat makes this perfect para sayo:\n✅ ${companyIntelligence?.value_propositions?.[0] || 'Proven track record ng success'}\n✅ ${companyIntelligence?.value_propositions?.[1] || 'Comprehensive training and support'}\n✅ ${companyIntelligence?.value_propositions?.[2] || 'Flexible business model'}\n\nTingin mo sa brochure and let me know kung ano ang nag-catch ng eye mo. I'd be happy to answer any questions! 📄✨`,
        tagalog: `Kumusta ${name}! 👋\n\nUmaasa akong maganda ang iyong araw! Gusto kong ibahagi sa iyo ang isang espesyal.\n\nNaka-attach ang aming pinakabagong company brochure na nagpapakita ng lahat tungkol sa ${companyInfo} - ang aming mga produkto, mga kuwento ng tagumpay, at ang kahanga-hangang oportunidad na inaalok namin.\n\nAng nagpaperpekto nito para sa iyo:\n✅ ${companyIntelligence?.value_propositions?.[0] || 'Napatunayang track record ng tagumpay'}\n✅ ${companyIntelligence?.value_propositions?.[1] || 'Komprehensibong pagsasanay at suporta'}\n✅ ${companyIntelligence?.value_propositions?.[2] || 'Flexible na modelo ng negosyo'}\n\nTingnan mo ang brochure at sabihan mo ako kung ano ang nakuha ng iyong pansin. Masaya akong sagutin ang anumang tanong! 📄✨`,
        cebuano: `Kumusta ${name}! 👋\n\nNanghinaut ko nga maayo imong adlaw! Gusto kong ipaambit kanimo ang usa ka espesyal.\n\nNaa dinhi ang among pinakabag-o nga company brochure nga nagpakita sa tanan bahin sa ${companyInfo} - among mga produkto, mga istorya sa kalampusan, ug ang talagsaon nga oportunidad nga among gitanyag.\n\nUnsay naghimo niini nga perpekto para nimo:\n✅ ${companyIntelligence?.value_propositions?.[0] || 'Napamatud-an nga track record sa kalampusan'}\n✅ ${companyIntelligence?.value_propositions?.[1] || 'Kompleto nga pagbansay ug suporta'}\n✅ ${companyIntelligence?.value_propositions?.[2] || 'Flexible nga modelo sa negosyo'}\n\nTan-awa ang brochure ug sabta ko unsay nakadani sa imong mata. Malipay ko nga tubagon ang bisan unsang pangutana! 📄✨`,
      },
    };

    return templates[type]?.[lang] || templates[type]['english'];
  };

  const handleRegenerate = async (messageId: string) => {
    if (!user) return;

    if (userCoins < 5) {
      setError('Insufficient coins. Need 5 coins to regenerate.');
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      await coinTransactionService.deductCoins(user.id, 5, 'ai_message_regeneration', {
        message_id: messageId,
      });

      await loadUserCoins();

      const messageIndex = generatedMessages.findIndex((m) => m.id === messageId);
      if (messageIndex !== -1) {
        const message = generatedMessages[messageIndex];
        const newContent = generateMessageContent(message, selectedProspect!, messageType, language);

        const updatedMessages = [...generatedMessages];
        updatedMessages[messageIndex] = { ...message, content: newContent };
        setGeneratedMessages(updatedMessages);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to regenerate message');
    } finally {
      setGenerating(false);
    }
  };

  const handleCopyToClipboard = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      alert('Message copied to clipboard!');
    } catch (err) {
      setError('Failed to copy to clipboard');
    }
  };

  const handleSaveToLibrary = async (message: GeneratedMessage) => {
    if (!user || !selectedProspect) return;

    try {
      const { error } = await supabase.from('ai_messages_library').insert({
        user_id: user.id,
        prospect_id: selectedProspect.id,
        prospect_name: selectedProspect.full_name,
        message_type: messageType,
        language: language,
        title: message.title,
        content: message.content,
        scenario: message.scenario,
        context: message.context,
        status: 'saved',
      });

      if (error) throw error;

      alert('Message saved to library!');
    } catch (err: any) {
      setError(err.message || 'Failed to save message');
    }
  };

  return (
    <div className="bg-white min-h-screen text-gray-900 relative overflow-hidden pb-24">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150%] h-[500px] bg-gradient-to-br from-blue-100 via-purple-50 to-blue-50 blur-[120px] rounded-full pointer-events-none" />

      <header className="relative z-10 px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onNavigateToHome}
            className="flex items-center justify-center w-11 h-11 rounded-xl bg-white shadow-sm border border-gray-200"
          >
            <ArrowLeft className="w-6 h-6 text-gray-900" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">AI Message</h1>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 bg-gradient-to-r from-amber-50 to-yellow-50 border-2 border-amber-200 rounded-xl px-3 py-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span className="text-lg font-bold text-gray-900">{userCoins}</span>
            </div>
            <button
              onClick={() => setShowLibraryMenu(true)}
              className="flex items-center justify-center w-11 h-11 rounded-xl bg-white shadow-sm border border-gray-200 hover:bg-slate-50 transition-colors"
            >
              <Menu className="w-6 h-6 text-gray-900" />
            </button>
          </div>
        </div>
      </header>

      {step === 1 && (
        <div className="px-6 space-y-6 relative z-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">1</div>
              <div className="text-xs font-medium text-gray-900 ml-2">Prospect</div>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-500 flex items-center justify-center text-sm font-bold">2</div>
              <div className="text-xs font-medium text-gray-400 ml-2">Type</div>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-500 flex items-center justify-center text-sm font-bold">3</div>
              <div className="text-xs font-medium text-gray-400 ml-2">Language</div>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-500 flex items-center justify-center text-sm font-bold">4</div>
              <div className="text-xs font-medium text-gray-400 ml-2">Generate</div>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-lg">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Step 1: Select Prospect</h2>
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search prospects..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {loadingProspects ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Loading prospects...</p>
                </div>
              ) : filteredProspects.length > 0 ? (
                filteredProspects.map((prospect) => (
                  <button
                    key={prospect.id}
                    onClick={() => setSelectedProspect(prospect)}
                    className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${
                      selectedProspect?.id === prospect.id
                        ? 'bg-blue-50 border-blue-500'
                        : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="flex-1 text-left">
                      <h3 className="text-sm font-bold text-gray-900">{prospect.full_name}</h3>
                      <p className="text-xs text-gray-500">
                        {prospect.job_title && prospect.company_name
                          ? `${prospect.job_title} @ ${prospect.company_name}`
                          : prospect.company_name || prospect.job_title || 'No details'}
                      </p>
                    </div>
                    {selectedProspect?.id === prospect.id && (
                      <Check className="w-5 h-5 text-blue-600" />
                    )}
                  </button>
                ))
              ) : searchQuery ? (
                <div className="text-center py-8 text-gray-500">
                  <Search className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="font-medium">No prospects match "{searchQuery}"</p>
                  <p className="text-xs mt-1">Try a different search term</p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                  <p className="font-medium">No prospects yet</p>
                  <p className="text-xs mt-1">Add prospects to your list first</p>
                  <button
                    onClick={onNavigateToProspects}
                    className="mt-3 text-sm text-blue-600 hover:underline"
                  >
                    Go to Prospects
                  </button>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={!selectedProspect}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next: Choose Message Type
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="px-6 space-y-6 relative z-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">✓</div>
              <div className="text-xs font-medium text-gray-900 ml-2">Prospect</div>
            </div>
            <div className="w-8 h-0.5 bg-green-600"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">2</div>
              <div className="text-xs font-medium text-gray-900 ml-2">Type</div>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-500 flex items-center justify-center text-sm font-bold">3</div>
              <div className="text-xs font-medium text-gray-400 ml-2">Language</div>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-500 flex items-center justify-center text-sm font-bold">4</div>
              <div className="text-xs font-medium text-gray-400 ml-2">Generate</div>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Step 2: Message Type</h2>
              <button
                onClick={() => setStep(1)}
                className="text-sm text-blue-600 hover:underline"
              >
                Back
              </button>
            </div>
            <div className="space-y-3">
              <button
                onClick={() => setMessageType('outreach')}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  messageType === 'outreach'
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Users className="w-5 h-5 text-blue-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Outreach Message</h3>
                      <p className="text-xs text-gray-600 mt-1">First contact with new prospects</p>
                    </div>
                  </div>
                  {messageType === 'outreach' && <Check className="w-5 h-5 text-blue-600" />}
                </div>
              </button>

              <button
                onClick={() => setMessageType('followup')}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  messageType === 'followup'
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TrendingUp className="w-5 h-5 text-green-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Follow-up Sequence</h3>
                      <p className="text-xs text-gray-600 mt-1">Continue conversation with existing prospects</p>
                    </div>
                  </div>
                  {messageType === 'followup' && <Check className="w-5 h-5 text-blue-600" />}
                </div>
              </button>

              <button
                onClick={() => setMessageType('company_product')}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  messageType === 'company_product'
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-purple-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Company & Product Message</h3>
                      <p className="text-xs text-gray-600 mt-1">Use company intelligence data</p>
                    </div>
                  </div>
                  {messageType === 'company_product' && <Check className="w-5 h-5 text-blue-600" />}
                </div>
              </button>

              <button
                onClick={() => setMessageType('brochure')}
                className={`w-full p-4 rounded-xl border-2 text-left transition-all ${
                  messageType === 'brochure'
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-orange-600" />
                    <div>
                      <h3 className="font-semibold text-gray-900">Upload Company Brochure</h3>
                      <p className="text-xs text-gray-600 mt-1">Message with brochure attachment</p>
                    </div>
                  </div>
                  {messageType === 'brochure' && <Check className="w-5 h-5 text-blue-600" />}
                </div>
              </button>
            </div>

            {messageType === 'brochure' && (
              <div className="mt-4">
                <label className="block w-full p-4 border-2 border-dashed border-gray-300 rounded-xl text-center cursor-pointer hover:border-blue-500 transition-all">
                  <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <span className="text-sm text-gray-600">
                    {uploadedFile ? uploadedFile.name : 'Click to upload brochure (PDF, DOCX, JPG)'}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.docx,.jpg,.jpeg,.png"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>

          <button
            onClick={() => setStep(3)}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg"
          >
            Next: Choose Language
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="px-6 space-y-6 relative z-10">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">✓</div>
              <div className="text-xs font-medium text-gray-900 ml-2">Prospect</div>
            </div>
            <div className="w-8 h-0.5 bg-green-600"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">✓</div>
              <div className="text-xs font-medium text-gray-900 ml-2">Type</div>
            </div>
            <div className="w-8 h-0.5 bg-green-600"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">3</div>
              <div className="text-xs font-medium text-gray-900 ml-2">Language</div>
            </div>
            <div className="w-8 h-0.5 bg-gray-300"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-gray-300 text-gray-500 flex items-center justify-center text-sm font-bold">4</div>
              <div className="text-xs font-medium text-gray-400 ml-2">Generate</div>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Step 3: Select Language</h2>
              <button
                onClick={() => setStep(2)}
                className="text-sm text-blue-600 hover:underline"
              >
                Back
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setLanguage('english')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  language === 'english'
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">English</h3>
                    <p className="text-xs text-gray-600">Professional English</p>
                  </div>
                  {language === 'english' && <Check className="w-4 h-4 text-blue-600 ml-auto" />}
                </div>
              </button>

              <button
                onClick={() => setLanguage('taglish')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  language === 'taglish'
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Globe className="w-5 h-5 text-green-600" />
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">Taglish</h3>
                    <p className="text-xs text-gray-600">Tagalog + English</p>
                  </div>
                  {language === 'taglish' && <Check className="w-4 h-4 text-blue-600 ml-auto" />}
                </div>
              </button>

              <button
                onClick={() => setLanguage('tagalog')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  language === 'tagalog'
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Globe className="w-5 h-5 text-purple-600" />
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">Tagalog</h3>
                    <p className="text-xs text-gray-600">Pure Tagalog</p>
                  </div>
                  {language === 'tagalog' && <Check className="w-4 h-4 text-blue-600 ml-auto" />}
                </div>
              </button>

              <button
                onClick={() => setLanguage('cebuano')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  language === 'cebuano'
                    ? 'bg-blue-50 border-blue-500'
                    : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <Globe className="w-5 h-5 text-orange-600" />
                  <div className="text-left">
                    <h3 className="font-semibold text-gray-900">Cebuano</h3>
                    <p className="text-xs text-gray-600">Bisaya/Visayan</p>
                  </div>
                  {language === 'cebuano' && <Check className="w-4 h-4 text-blue-600 ml-auto" />}
                </div>
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <button
            onClick={generateMessageVariants}
            disabled={generating}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Sparkles className="w-5 h-5" />
            {generating ? 'Generating Messages...' : 'Generate AI Messages (10 Coins)'}
          </button>
        </div>
      )}

      {step === 4 && generatedMessages.length > 0 && (
        <div className="px-6 space-y-6 relative z-10 pb-32">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">✓</div>
              <div className="text-xs font-medium text-gray-900 ml-2">Prospect</div>
            </div>
            <div className="w-8 h-0.5 bg-green-600"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">✓</div>
              <div className="text-xs font-medium text-gray-900 ml-2">Type</div>
            </div>
            <div className="w-8 h-0.5 bg-green-600"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">✓</div>
              <div className="text-xs font-medium text-gray-900 ml-2">Language</div>
            </div>
            <div className="w-8 h-0.5 bg-green-600"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">4</div>
              <div className="text-xs font-medium text-gray-900 ml-2">Generate</div>
            </div>
          </div>
          <div className="bg-white rounded-3xl p-6 border border-gray-200 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">Generated Messages</h2>
              <button
                onClick={() => {
                  setStep(1);
                  setGeneratedMessages([]);
                  setSelectedProspect(null);
                }}
                className="text-sm text-blue-600 hover:underline"
              >
                Start Over
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              For: <span className="font-semibold text-gray-900">{selectedProspect?.full_name}</span>
            </p>
          </div>

          {generatedMessages.map((message, index) => (
            <div key={message.id} className="bg-white rounded-3xl p-6 border border-gray-200 shadow-lg">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-bold text-gray-900 mb-1">{message.title}</h3>
                  <p className="text-xs text-blue-600 mb-1">{message.scenario}</p>
                  <p className="text-xs text-gray-500">{message.context}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">{index + 1}</span>
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-4 relative">
                <p className="text-sm text-gray-800 whitespace-pre-wrap">{message.content}</p>
                <button
                  onClick={() => handleCopyToClipboard(message.content)}
                  className="absolute top-2 right-2 p-2 bg-white hover:bg-gray-100 rounded-lg shadow-sm border border-gray-200 transition-colors"
                  title="Copy to clipboard"
                >
                  <Copy className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleRegenerate(message.id)}
                  disabled={generating}
                  className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-1.5 disabled:opacity-50 hover:shadow-md transition-shadow"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Regenerate (5)</span>
                </button>
                <button
                  onClick={() => handleSaveToLibrary(message)}
                  className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-medium text-sm flex items-center justify-center gap-1.5 hover:shadow-md transition-shadow"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showPaywall && (
        <PaywallModal
          isOpen={showPaywall}
          onClose={() => setShowPaywall(false)}
          onUpgrade={() => onNavigate?.('pricing')}
          feature="AI Message Generator"
          requiredTier="pro"
          currentTier={tier || 'free'}
        />
      )}

      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 shadow-lg">
        <div className="flex items-center justify-between px-6 h-18">
          <button
            onClick={onNavigateToHome}
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-600 transition-colors"
          >
            <Home className="w-6 h-6" />
            <span className="text-xs font-medium">Home</span>
          </button>
          <button
            onClick={onNavigateToProspects}
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-600 transition-colors"
          >
            <Users className="w-6 h-6" />
            <span className="text-xs font-medium">Prospects</span>
          </button>
          <button
            onClick={() => onNavigate?.('chatbot-sessions')}
            className="relative -top-6 bg-[#1877F2] text-white w-14 h-14 rounded-full shadow-[0px_8px_24px_rgba(24,119,242,0.4)] flex items-center justify-center border-4 border-white transition-transform active:scale-95"
          >
            <MessageSquare className="w-7 h-7" />
          </button>
          <button
            onClick={onNavigateToPipeline}
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-600 transition-colors"
          >
            <TrendingUp className="w-6 h-6" />
            <span className="text-xs font-medium">Pipeline</span>
          </button>
          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col items-center gap-1 text-gray-400 hover:text-blue-600 transition-colors"
          >
            <MoreHorizontal className="w-6 h-6" />
            <span className="text-xs font-medium">More</span>
          </button>
        </div>
        <ActionPopup
          isOpen={showActionPopup}
          onClose={() => setShowActionPopup(false)}
          onNavigateToPitchDeck={onNavigateToPitchDeck || (() => {})}
          onNavigateToMessageSequencer={onNavigateToMessageSequencer}
          onNavigateToRealTimeScan={onNavigateToRealTimeScan}
          onNavigateToDeepScan={onNavigateToDeepScan}
        />
      </nav>

      <SlideInMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={(page) => {
          setMenuOpen(false);
          if (onNavigate) {
            onNavigate(page);
          } else if (page === 'home') {
            onNavigateToHome?.();
          }
        }}
      />

      <LibraryMenu
        isOpen={showLibraryMenu}
        onClose={() => setShowLibraryMenu(false)}
        type="ai_message"
        onView={(id) => {
          setShowLibraryMenu(false);
        }}
        onEdit={(id) => {
          setShowLibraryMenu(false);
        }}
      />
    </div>
  );
}
