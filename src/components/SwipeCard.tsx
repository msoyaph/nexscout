import { useState, useRef, useEffect } from 'react';
import { Star, Sparkles } from 'lucide-react';
import ProspectAvatar from './ProspectAvatar';

interface SwipeCardProps {
  prospect: {
    id: number;
    name: string;
    image?: string;
    uploaded_image_url?: string | null;
    social_image_url?: string | null;
    avatar_seed?: string | null;
    title: string;
    company: string;
    score: number;
    platforms: string[];
    insights: Array<{
      text: string;
      type: 'hot' | 'warm' | 'cold';
    }>;
    tags: string[];
    locked?: boolean;
  };
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  isLocked?: boolean;
  lockedContent?: React.ReactNode;
  style?: React.CSSProperties;
  zIndex?: number;
}

export default function SwipeCard({
  prospect,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  isLocked,
  lockedContent,
  style,
  zIndex = 0,
}: SwipeCardProps) {
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | 'up' | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const getInsightColor = (type: string) => {
    if (type === 'hot') return 'bg-green-500';
    if (type === 'warm') return 'bg-amber-500';
    return 'bg-gray-400';
  };

  const handleDragStart = (clientX: number, clientY: number) => {
    if (isLocked) return;
    setIsDragging(true);
    setDragStart({ x: clientX, y: clientY });
  };

  const handleDragMove = (clientX: number, clientY: number) => {
    if (!isDragging || isLocked) return;

    const deltaX = clientX - dragStart.x;
    const deltaY = clientY - dragStart.y;

    setDragOffset({ x: deltaX, y: deltaY });

    const threshold = 50;
    if (Math.abs(deltaY) > threshold && Math.abs(deltaY) > Math.abs(deltaX)) {
      setSwipeDirection(deltaY < 0 ? 'up' : null);
    } else if (Math.abs(deltaX) > threshold) {
      setSwipeDirection(deltaX > 0 ? 'right' : 'left');
    } else {
      setSwipeDirection(null);
    }
  };

  const handleDragEnd = () => {
    if (!isDragging || isLocked) return;

    const swipeThreshold = 100;
    const velocityThreshold = 0.5;

    const velocity = Math.sqrt(dragOffset.x ** 2 + dragOffset.y ** 2);
    const absX = Math.abs(dragOffset.x);
    const absY = Math.abs(dragOffset.y);

    if (absY > swipeThreshold && absY > absX && dragOffset.y < 0) {
      animateSwipeOut('up');
    } else if (absX > swipeThreshold) {
      if (dragOffset.x > 0) {
        animateSwipeOut('right');
      } else {
        animateSwipeOut('left');
      }
    } else {
      setDragOffset({ x: 0, y: 0 });
      setSwipeDirection(null);
    }

    setIsDragging(false);
  };

  const animateSwipeOut = (direction: 'left' | 'right' | 'up') => {
    const card = cardRef.current;
    if (!card) return;

    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    let finalX = 0;
    let finalY = 0;

    if (direction === 'left') {
      finalX = -windowWidth - 100;
      finalY = dragOffset.y;
    } else if (direction === 'right') {
      finalX = windowWidth + 100;
      finalY = dragOffset.y;
    } else if (direction === 'up') {
      finalX = dragOffset.x;
      finalY = -windowHeight - 100;
    }

    card.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
    card.style.transform = `translate(${finalX}px, ${finalY}px) rotate(${finalX * 0.1}deg)`;
    card.style.opacity = '0';

    setTimeout(() => {
      if (direction === 'left' && onSwipeLeft) onSwipeLeft();
      if (direction === 'right' && onSwipeRight) onSwipeRight();
      if (direction === 'up' && onSwipeUp) onSwipeUp();

      card.style.transition = '';
      card.style.transform = '';
      card.style.opacity = '1';
      setDragOffset({ x: 0, y: 0 });
      setSwipeDirection(null);
    }, 300);
  };

  const rotation = dragOffset.x * 0.1;
  const opacity = 1 - Math.abs(dragOffset.x) / 500 - Math.abs(dragOffset.y) / 500;

  const overlayOpacity = Math.min(Math.abs(dragOffset.x) / 150, Math.abs(dragOffset.y) / 150, 0.9);

  return (
    <div
      ref={cardRef}
      style={{
        ...style,
        transform: isDragging
          ? `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`
          : 'translate(0, 0) rotate(0deg)',
        transition: isDragging ? 'none' : 'transform 0.3s ease-out',
        cursor: isLocked ? 'default' : 'grab',
        zIndex,
        touchAction: 'none',
        opacity: isDragging ? opacity : 1,
      }}
      className="absolute w-full h-full bg-white rounded-[28px] shadow-xl border border-gray-200 overflow-hidden select-none"
      onMouseDown={(e) => handleDragStart(e.clientX, e.clientY)}
      onMouseMove={(e) => handleDragMove(e.clientX, e.clientY)}
      onMouseUp={handleDragEnd}
      onMouseLeave={handleDragEnd}
      onTouchStart={(e) => {
        const touch = e.touches[0];
        handleDragStart(touch.clientX, touch.clientY);
      }}
      onTouchMove={(e) => {
        const touch = e.touches[0];
        handleDragMove(touch.clientX, touch.clientY);
      }}
      onTouchEnd={handleDragEnd}
    >
      {swipeDirection === 'left' && (
        <div
          className="absolute inset-0 bg-red-500/20 flex items-center justify-center pointer-events-none z-10"
          style={{ opacity: overlayOpacity }}
        >
          <div className="transform rotate-12 border-4 border-red-500 text-red-500 text-5xl font-bold px-8 py-4 rounded-2xl">
            PASS
          </div>
        </div>
      )}

      {swipeDirection === 'right' && (
        <div
          className="absolute inset-0 bg-green-500/20 flex items-center justify-center pointer-events-none z-10"
          style={{ opacity: overlayOpacity }}
        >
          <div className="transform -rotate-12 border-4 border-green-500 text-green-500 text-5xl font-bold px-8 py-4 rounded-2xl">
            PIPELINE
          </div>
        </div>
      )}

      {swipeDirection === 'up' && (
        <div
          className="absolute inset-0 bg-orange-500/20 flex items-center justify-center pointer-events-none z-10"
          style={{ opacity: overlayOpacity }}
        >
          <div className="border-4 border-orange-500 text-orange-500 text-5xl font-bold px-8 py-4 rounded-2xl">
            HOT
          </div>
        </div>
      )}

      {isLocked ? (
        lockedContent
      ) : (
        <>
          <div className="h-[180px] bg-gradient-to-br from-nexscout-blue/10 to-nexscout-blue/5 flex items-center justify-center relative">
            <ProspectAvatar
              prospect={{
                id: prospect.id.toString(),
                full_name: prospect.name,
                uploaded_image_url: prospect.uploaded_image_url,
                social_image_url: prospect.social_image_url,
                avatar_seed: prospect.avatar_seed
              }}
              score={prospect.score}
              platform={prospect.platforms[0]}
              size="xl"
              className="border-4 border-white shadow-xl pointer-events-none"
              enableHover={false}
            />
            <div className="absolute bottom-4 left-4 bg-green-500 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
              <Star className="size-4 text-white" fill="white" />
              <span className="text-sm font-bold text-white">
                AI Score: {prospect.score}
              </span>
            </div>
          </div>

          <div className="p-6 space-y-4 overflow-y-auto max-h-[340px]">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900">
                {prospect.name}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {prospect.title} • {prospect.company}
              </p>
              <div className="flex items-center justify-center gap-3 mt-4">
                {prospect.platforms.map((platform) => (
                  <div
                    key={platform}
                    className="size-8 rounded-full bg-nexscout-blue/10 flex items-center justify-center"
                  >
                    <div className="size-5 rounded-full bg-nexscout-blue" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-3xl p-4 border border-gray-200">
              <div className="flex items-start gap-3">
                <Sparkles className="size-5 text-nexscout-blue shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-gray-900 mb-2">
                    AI Insights
                  </p>
                  <div className="space-y-1.5">
                    {prospect.insights.map((insight, idx) => (
                      <div key={idx} className="flex items-start gap-2">
                        <div
                          className={`size-1.5 rounded-full ${getInsightColor(
                            insight.type
                          )} shrink-0 mt-1.5`}
                        />
                        <p className="text-xs text-gray-600">{insight.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              {prospect.tags.map((tag, idx) => (
                <div
                  key={idx}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold ${
                    tag.includes('Hot')
                      ? 'bg-red-500/10 text-red-600'
                      : tag.includes('Warm')
                      ? 'bg-amber-500/10 text-amber-600'
                      : 'bg-blue-500/10 text-blue-600'
                  }`}
                >
                  {tag}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
