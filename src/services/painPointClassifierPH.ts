import { supabase } from '../lib/supabase';

export type PainPointCategory =
  | 'financial_struggle'
  | 'looking_for_extra_income'
  | 'time_poor_overworked'
  | 'family_responsibility'
  | 'health_concerns'
  | 'business_minded_but_stuck'
  | 'open_for_opportunities'
  | 'debt_or_utang'
  | 'saving_for_goal';

export type PainPointProfile = {
  categories: { [category: string]: number };
  dominantCategory: string | null;
  hasStrongSignal: boolean;
};

export class PainPointClassifierPH {
  private static readonly CATEGORY_KEYWORDS: Record<PainPointCategory, string[]> = {
    financial_struggle: [
      'walang pera', 'kulang sa pera', 'mahirap', 'struggling', 'gipit',
      'wala na', 'ubos na', 'hirap kumita', 'financial problem', 'broke',
      'walang pambili', 'walang pang', 'di afford', 'hindi afford',
    ],
    looking_for_extra_income: [
      'extra income', 'sideline', 'side line', 'raket', 'dagdag kita',
      'additional income', 'part time', 'paano kumita', 'how to earn',
      'kumita ng', 'kikitain', 'kita extra', 'passive income',
    ],
    time_poor_overworked: [
      'walang oras', 'busy', 'sobrang busy', 'puyat', 'pagod',
      'walang time', 'overtime', 'no time', 'hectic', 'stressed',
      'burnout', 'exhausted', 'walang pahinga', 'laging may work',
    ],
    family_responsibility: [
      'para sa pamilya', 'for my family', 'tuition', 'pang-aral',
      'pang-tuition', 'anak', 'mga anak', 'asawa', 'parents',
      'magulang', 'breadwinner', 'pabahay', 'pang-gastos',
    ],
    health_concerns: [
      'medical', 'hospital', 'ospital', 'sakit', 'health', 'insurance',
      'coverage', 'hospitalization', 'emergency', 'may sakit',
      'gamot', 'treatment', 'surgery', 'operation',
    ],
    business_minded_but_stuck: [
      'gusto mag-negosyo', 'want to start', 'mag-business', 'mag-invest',
      'walang capital', 'kulang capital', 'how to start', 'saan magsimula',
      'takot mag-start', 'hindi alam', 'paano mag-negosyo',
    ],
    open_for_opportunities: [
      'open for opportunity', 'looking for opportunity', 'opportunity',
      'interested', 'gusto ko', 'willing to try', 'willing ako',
      'open minded', 'try new', 'bagong opportunity', 'chance',
    ],
    debt_or_utang: [
      'utang', 'debt', 'loan', 'pautang', 'may utang', 'bayaran',
      'hulugan', 'sangla', 'credit card', 'installment',
      'babayaran', 'pagbabayad', 'nangungutang',
    ],
    saving_for_goal: [
      'ipon', 'saving', 'mag-ipon', 'target', 'goal', 'dream',
      'gusto bumili', 'gusto mag', 'plan', 'plano',
      'bahay', 'kotse', 'travel', 'business', 'future',
      'pangarap', 'investment', 'retirement',
    ],
  };

  private static readonly POSITIVE_MODIFIERS = [
    'excited', 'motivated', 'determined', 'ready', 'willing',
    'committed', 'focused', 'inspired', 'hopeful', 'optimistic',
  ];

  private static readonly NEGATIVE_MODIFIERS = [
    'struggling', 'difficult', 'hard', 'impossible', 'frustrated',
    'hopeless', 'wala na', 'hindi na kaya', 'give up', 'burnout',
  ];

  static async buildPainProfilesForScan(scanId: string): Promise<void> {
    const { data: items, error } = await supabase
      .from('scan_processed_items')
      .select('*')
      .eq('scan_id', scanId)
      .in('type', ['post', 'text', 'friend_list']);

    if (error || !items) {
      console.error('Failed to fetch scan items:', error);
      return;
    }

    const prospectMap = new Map<string, string[]>();

    for (const item of items) {
      const name = item.name || 'unknown';
      const texts = prospectMap.get(name) || [];
      texts.push(item.content || '');
      prospectMap.set(name, texts);
    }

    for (const [prospectName, texts] of prospectMap.entries()) {
      const profile = this.analyzePainPoints(texts);

      const { data: existingProspect } = await supabase
        .from('scan_processed_items')
        .select('id')
        .eq('scan_id', scanId)
        .eq('name', prospectName)
        .limit(1)
        .single();

      if (existingProspect) {
        await this.persistPainProfile(existingProspect.id, scanId, profile);
      }
    }
  }

  static analyzePainPoints(texts: string[]): PainPointProfile {
    const combinedText = texts.join(' ').toLowerCase();

    const categories: { [category: string]: number } = {};

    for (const [category, keywords] of Object.entries(this.CATEGORY_KEYWORDS)) {
      let score = 0;

      for (const keyword of keywords) {
        const regex = new RegExp(`\\b${keyword.replace(/\s+/g, '\\s+')}\\b`, 'i');
        const matches = combinedText.match(new RegExp(regex, 'gi'));

        if (matches) {
          score += matches.length * 10;
        }
      }

      const positiveBoost = this.POSITIVE_MODIFIERS.filter(mod =>
        combinedText.includes(mod)
      ).length * 5;

      const negativeBoost = this.NEGATIVE_MODIFIERS.filter(mod =>
        combinedText.includes(mod)
      ).length * 10;

      score += positiveBoost + negativeBoost;

      categories[category] = Math.min(score, 100);
    }

    let dominantCategory: string | null = null;
    let maxScore = 0;

    for (const [category, score] of Object.entries(categories)) {
      if (score > maxScore) {
        maxScore = score;
        dominantCategory = category;
      }
    }

    const hasStrongSignal = maxScore >= 70;

    return {
      categories,
      dominantCategory,
      hasStrongSignal,
    };
  }

  private static async persistPainProfile(
    prospectId: string,
    scanId: string,
    profile: PainPointProfile
  ): Promise<void> {
    const { error } = await supabase.from('prospect_pain_profiles').insert({
      prospect_id: prospectId,
      scan_id: scanId,
      categories: profile.categories,
      dominant_category: profile.dominantCategory,
      has_strong_signal: profile.hasStrongSignal,
    });

    if (error) {
      console.error('Failed to persist pain profile:', error);
    }
  }

  static getCategoryDisplayName(category: PainPointCategory): string {
    const displayNames: Record<PainPointCategory, string> = {
      financial_struggle: '💸 Financial Struggle',
      looking_for_extra_income: '💰 Looking for Extra Income',
      time_poor_overworked: '🕒 Time-Poor / Overworked',
      family_responsibility: '👨‍👩‍👧‍👦 Family Responsibility',
      health_concerns: '🏥 Health Concerns',
      business_minded_but_stuck: '💼 Business-Minded but Stuck',
      open_for_opportunities: '🔓 Open for Opportunities',
      debt_or_utang: '📊 Debt / Utang',
      saving_for_goal: '🎯 Saving for Goal',
    };

    return displayNames[category] || category;
  }

  static getCategoryEmoji(category: PainPointCategory): string {
    const emojis: Record<PainPointCategory, string> = {
      financial_struggle: '💸',
      looking_for_extra_income: '💰',
      time_poor_overworked: '🕒',
      family_responsibility: '👨‍👩‍👧‍👦',
      health_concerns: '🏥',
      business_minded_but_stuck: '💼',
      open_for_opportunities: '🔓',
      debt_or_utang: '📊',
      saving_for_goal: '🎯',
    };

    return emojis[category] || '📌';
  }
}
