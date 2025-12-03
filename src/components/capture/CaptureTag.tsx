interface CaptureTagProps {
  tag: string;
  onRemove?: () => void;
}

export default function CaptureTag({ tag, onRemove }: CaptureTagProps) {
  const displayTag = tag.replace(/_/g, ' ');

  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
      {displayTag}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-1 hover:text-blue-900 transition-colors"
          aria-label="Remove tag"
        >
          ×
        </button>
      )}
    </span>
  );
}
