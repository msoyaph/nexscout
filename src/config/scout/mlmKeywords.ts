/**
 * MLM-specific keyword dictionaries for ScoutScore v2
 * Extracted from hardcoded values to enable future industry-specific configurations
 */

export const PHILIPPINE_MLM_KEYWORDS = {
  business: ['negosyo', 'business', 'sideline', 'extra income', 'kita', 'tubo', 'profit', 'entrepreneur'],
  finance: ['pera', 'money', 'income', 'sahod', 'salary', 'savings', 'ipon', 'utang', 'debt', 'financial'],
  career: ['trabaho', 'work', 'job', 'career', 'promotion', 'boss', 'office', 'company'],
  health: ['health', 'kalusugan', 'wellness', 'fit', 'sakit', 'hospital', 'insurance', 'protect'],
  family: ['pamilya', 'family', 'anak', 'children', 'baby', 'asawa', 'spouse', 'kabuhayan'],
  freedom: ['freedom', 'kalayaan', 'time', 'oras', 'flexible', 'pahinga', 'travel', 'bakasyon'],
  growth: ['goals', 'pangarap', 'dream', 'improve', 'progress', 'success', 'tagumpay'],
};

/**
 * Objection detection keywords by type
 */
export const OBJECTION_KEYWORDS = {
  budget: [
    'mahal', 'expensive', 'pricey', 'ang presyo', 'too much', 'sobrang mahal',
    'walang pera', 'wala pang pera', 'kulang', 'di kaya', 'afford', 'budget',
    'magkano', 'how much', 'cost', 'presyo'
  ],
  timing: [
    'next time', 'sa susunod', 'bukas', 'later', 'tom', 'next week', 'next month',
    'busy', 'di pa', 'wala pang', 'hindi pa', 'not now', 'bad timing'
  ],
  spouse: [
    'kakausapin ko muna', 'tanong ko muna asawa', 'tanong ko muna family',
    'consult muna', 'ask ko muna spouse', 'kailangan ko muna magtanong',
    'spouse approval', 'family decision', 'may asawa', 'may pamilya'
  ],
};


