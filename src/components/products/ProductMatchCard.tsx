import { Package, TrendingUp, CheckCircle, X, ExternalLink } from 'lucide-react';

interface ProductMatchCardProps {
  match: {
    id: string;
    product_id: string;
    match_score: number;
    confidence_level: string;
    match_reasons: string[];
    persona_match: string | null;
    pain_points_matched: string[];
    benefits_aligned: string[];
    status: string;
    products?: {
      id: string;
      name: string;
      short_description: string;
      image_url: string;
      base_price: number;
      product_url: string;
    };
  };
  onOffer?: () => void;
  onReject?: () => void;
}

export default function ProductMatchCard({ match, onOffer, onReject }: ProductMatchCardProps) {
  const product = match.products;
  if (!product) return null;

  const getConfidenceColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'medium':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'low':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600';
    if (score >= 40) return 'text-blue-600';
    return 'text-gray-600';
  };

  return (
    <div className="bg-white rounded-[24px] p-6 border border-[#E5E7EB] shadow-sm hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start gap-4 mb-4">
        {product.image_url ? (
          <img
            src={product.image_url}
            alt={product.name}
            className="size-16 rounded-[12px] object-cover"
          />
        ) : (
          <div className="size-16 rounded-[12px] bg-blue-100 flex items-center justify-center">
            <Package className="size-8 text-blue-600" />
          </div>
        )}

        <div className="flex-1">
          <h3 className="text-lg font-bold text-[#111827] mb-1">{product.name}</h3>
          <p className="text-sm text-[#6B7280] line-clamp-2">{product.short_description}</p>
        </div>

        <div className="text-right">
          <div className={`text-2xl font-bold ${getScoreColor(match.match_score)}`}>
            {match.match_score}
          </div>
          <div className="text-xs text-[#6B7280]">Match Score</div>
        </div>
      </div>

      {/* Confidence Badge */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold border ${getConfidenceColor(
            match.confidence_level
          )}`}
        >
          {match.confidence_level.toUpperCase()} CONFIDENCE
        </span>
        {match.persona_match && (
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            {match.persona_match}
          </span>
        )}
      </div>

      {/* Match Reasons */}
      {match.match_reasons && match.match_reasons.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="size-4 text-blue-600" />
            <span className="text-sm font-semibold text-[#111827]">Why This Matches:</span>
          </div>
          <ul className="space-y-1">
            {match.match_reasons.map((reason, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-[#6B7280]">
                <CheckCircle className="size-4 text-green-600 flex-shrink-0 mt-0.5" />
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pain Points Matched */}
      {match.pain_points_matched && match.pain_points_matched.length > 0 && (
        <div className="mb-4">
          <span className="text-xs font-semibold text-[#6B7280] uppercase">Addresses:</span>
          <div className="flex flex-wrap gap-2 mt-2">
            {match.pain_points_matched.map((pain, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-red-50 text-red-700 text-xs rounded-[8px] border border-red-200"
              >
                {pain}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Benefits */}
      {match.benefits_aligned && match.benefits_aligned.length > 0 && (
        <div className="mb-4">
          <span className="text-xs font-semibold text-[#6B7280] uppercase">Key Benefits:</span>
          <div className="flex flex-wrap gap-2 mt-2">
            {match.benefits_aligned.map((benefit, index) => (
              <span
                key={index}
                className="px-2 py-1 bg-green-50 text-green-700 text-xs rounded-[8px] border border-green-200"
              >
                {benefit}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Price */}
      {product.base_price && (
        <div className="mb-4 p-3 bg-[#F9FAFB] rounded-[12px]">
          <span className="text-sm text-[#6B7280]">Price: </span>
          <span className="text-lg font-bold text-[#111827]">
            ₱{product.base_price.toLocaleString()}
          </span>
        </div>
      )}

      {/* Actions */}
      {match.status === 'pending' && (
        <div className="flex gap-3">
          <button
            onClick={onOffer}
            className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-[16px] font-semibold shadow-lg hover:from-blue-700 hover:to-blue-600 transition-all flex items-center justify-center gap-2"
          >
            <CheckCircle className="size-5" />
            Offer This Product
          </button>
          <button
            onClick={onReject}
            className="px-4 py-3 bg-[#F3F4F6] text-[#6B7280] rounded-[16px] font-semibold hover:bg-[#E5E7EB] transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>
      )}

      {match.status === 'offered' && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-[12px] text-center">
          <span className="text-sm font-semibold text-blue-700">Offered to Prospect</span>
        </div>
      )}

      {match.status === 'accepted' && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-[12px] text-center">
          <span className="text-sm font-semibold text-green-700">Accepted by Prospect</span>
        </div>
      )}

      {/* Product Link */}
      {product.product_url && (
        <a
          href={product.product_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 mt-3 py-2 text-sm text-blue-600 hover:text-blue-700 transition-colors"
        >
          <ExternalLink className="size-4" />
          View Product Page
        </a>
      )}
    </div>
  );
}
