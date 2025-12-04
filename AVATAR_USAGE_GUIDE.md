# ProspectAvatar Component - Quick Usage Guide

## 🎯 Quick Start

```tsx
import ProspectAvatar from '../components/ProspectAvatar';

// Minimal usage
<ProspectAvatar prospect={prospect} />

// With score ring
<ProspectAvatar prospect={prospect} score={85} />

// Full featured
<ProspectAvatar
  prospect={prospect}
  score={90}
  userTier="elite"
  platform="linkedin"
  industry="insurance"
  size="lg"
/>
```

---

## 📊 Score-Based Rings

### Hot Prospects (80-100)
```tsx
<ProspectAvatar prospect={prospect} score={85} />
```
**Result:** Red ring (#FF4D4F) with glow

### Warm Prospects (50-79)
```tsx
<ProspectAvatar prospect={prospect} score={65} />
```
**Result:** Golden ring (#FFC53D) with glow

### Cold Prospects (0-49)
```tsx
<ProspectAvatar prospect={prospect} score={35} />
```
**Result:** Blue ring (#40A9FF) no glow

### Auto-Detection
```tsx
// Automatically determines bucket from score
<ProspectAvatar prospect={prospect} score={72} />
// Will show golden "warm" ring
```

---

## ✨ Elite User Features

```tsx
<ProspectAvatar
  prospect={prospect}
  score={90}
  userTier="elite"  // Required for glow + sparkle
  size="lg"
/>
```

**Elite Features:**
- ✨ AI Sparkle badge (top-left)
- 🌟 Pulsing glow animation
- 💫 Premium visual treatment

**Conversion Strategy:**
Only Elite users see these features, creating upgrade incentive!

---

## 🏢 Industry Badges

```tsx
<ProspectAvatar
  prospect={prospect}
  industry="insurance"  // Shows shield icon
  showBadges={true}
/>
```

**Available Industries:**
- `insurance` → 🛡️ Shield
- `mlm` → 👥 Team
- `realestate` → 🏠 House
- `coaching` → ⭐ Star

**Position:** Top-right corner

---

## 📱 Platform Badges

```tsx
<ProspectAvatar
  prospect={prospect}
  platform="facebook"
  showBadges={true}
/>
```

**Supported Platforms:**
- `facebook` → Blue circle with "F"
- `instagram` → Gradient circle with "I"
- `linkedin` → Blue circle with "L"
- `twitter` → Blue circle with "T"
- `tiktok` → Black circle with "T"

**Position:** Bottom-right corner

---

## 🔄 Pipeline Stages

```tsx
<ProspectAvatar
  prospect={prospect}
  pipelineStage="closing"
/>
```

**Stage Effects:**
- `discover` → Neutral (no tint)
- `contacted` → Blue tint
- `warm` → Enhanced saturation
- `closing` → Green tint

**Visual:** Subtle color adjustments to reinforce progress

---

## 📏 Size Variants

```tsx
// Small - 32px (list views)
<ProspectAvatar prospect={prospect} size="sm" />

// Medium - 48px (cards) - DEFAULT
<ProspectAvatar prospect={prospect} size="md" />

// Large - 64px (detail views)
<ProspectAvatar prospect={prospect} size="lg" />

// Extra Large - 96px (profile headers)
<ProspectAvatar prospect={prospect} size="xl" />
```

**Badge Sizes Scale Automatically:**
- sm → 12px badges
- md → 14px badges
- lg → 16px badges
- xl → 20px badges

---

## 🎨 Styling & Classes

```tsx
<ProspectAvatar
  prospect={prospect}
  className="border-2 border-white shadow-lg"
  size="lg"
/>
```

**Common Patterns:**

```tsx
// With border
className="border-2 border-white"

// With shadow
className="shadow-lg"

// With margin
className="mr-4"

// Custom ring (overrides score ring)
className="ring-4 ring-purple-500"
```

---

## 🖱️ Interactions

```tsx
// Enable hover effects (default: true)
<ProspectAvatar
  prospect={prospect}
  enableHover={true}
/>

// Disable hover (for non-clickable avatars)
<ProspectAvatar
  prospect={prospect}
  enableHover={false}
/>
```

**Hover Effects:**
- Lift animation (translateY -2px)
- Shadow intensifies
- Smooth transition

---

## 🎯 Common Use Cases

### 1. Prospect List Card
```tsx
<ProspectAvatar
  prospect={prospect}
  score={prospect.score}
  platform={prospect.platform}
  size="md"
  className="mr-3"
/>
```

### 2. Swipe Card
```tsx
<ProspectAvatar
  prospect={prospect}
  score={prospect.score}
  bucket={prospect.bucket}
  userTier={userTier}
  size="xl"
  className="mb-4"
/>
```

### 3. Pipeline View
```tsx
<ProspectAvatar
  prospect={prospect}
  pipelineStage={prospect.stage}
  size="sm"
  showBadges={false}  // Clean pipeline view
/>
```

### 4. Detail Page Header
```tsx
<ProspectAvatar
  prospect={prospect}
  score={prospect.score}
  userTier={userTier}
  platform={prospect.platform}
  industry={prospect.industry}
  size="xl"
  className="ring-2 ring-white/30"
/>
```

### 5. Top Prospects Widget (Home)
```tsx
<ProspectAvatar
  prospect={prospect}
  score={prospect.score}
  size="md"
  className="border-2 border-gray-200"
  showBadges={false}
/>
```

### 6. Team Dashboard
```tsx
<ProspectAvatar
  prospect={prospect}
  score={prospect.score}
  industry={prospect.industry}
  size="sm"
  enableHover={false}
/>
```

---

## 🔧 Advanced Configuration

### Full Feature Demo
```tsx
<ProspectAvatar
  prospect={{
    id: '123',
    full_name: 'Maria Santos',
    uploaded_image_url: null,
    social_image_url: 'https://...',
    avatar_seed: 'abc123'
  }}
  score={92}
  bucket="hot"
  userTier="elite"
  platform="linkedin"
  industry="insurance"
  pipelineStage="closing"
  showBadges={true}
  enableHover={true}
  size="lg"
  className="border-2 border-white shadow-xl"
/>
```

**Result:**
- ✅ Hot red ring with glow
- ✅ Elite sparkle badge
- ✅ Shield industry icon
- ✅ LinkedIn platform badge
- ✅ Closing stage tint (green)
- ✅ Hover lift effect
- ✅ 64px size
- ✅ Custom styling

---

## 🚫 What NOT to Do

```tsx
// ❌ Don't hardcode avatar URLs
<img src="https://..." />

// ✅ Use ProspectAvatar
<ProspectAvatar prospect={prospect} />

// ❌ Don't mix old and new
<img src={getProspectAvatar(prospect)} />

// ✅ Use the component
<ProspectAvatar prospect={prospect} />

// ❌ Don't add badges manually
<div className="relative">
  <img ... />
  <div className="badge">FB</div>
</div>

// ✅ Use built-in badges
<ProspectAvatar
  prospect={prospect}
  platform="facebook"
  showBadges={true}
/>
```

---

## 🎨 Design Tips

### 1. Consistency
Always use the same size for the same context:
- Lists: `sm`
- Cards: `md`
- Details: `lg`
- Headers: `xl`

### 2. Badge Control
Hide badges in dense layouts:
```tsx
showBadges={layout === 'dense' ? false : true}
```

### 3. Elite Differentiation
Always pass user tier for proper rendering:
```tsx
userTier={profile?.subscription_tier || 'free'}
```

### 4. Platform Data
Only show platform badge if data exists:
```tsx
platform={prospect.platform || undefined}
```

### 5. Score Priority
Score takes precedence over manual bucket:
```tsx
// Score auto-calculates bucket
<ProspectAvatar prospect={prospect} score={85} />

// Manual bucket (for edge cases)
<ProspectAvatar prospect={prospect} bucket="hot" />
```

---

## 📱 Mobile Best Practices

```tsx
// Use appropriate sizes
<ProspectAvatar
  prospect={prospect}
  size="md"  // 48px - Good for mobile
  enableHover={false}  // Disable on touch devices
  showBadges={!isMobile}  // Optional: hide on small screens
/>
```

**Mobile Optimization:**
- Use `md` or `sm` sizes
- Disable hover on touch devices
- Consider hiding badges on very small screens
- Ensure 44x44px minimum tap target

---

## 🔍 Debugging

### Avatar Not Showing?
```tsx
// Check prospect data structure
console.log('Prospect:', prospect);

// Verify avatar service
import { getProspectAvatar } from '../services/avatarService';
console.log('Avatar URL:', getProspectAvatar(prospect));
```

### Badges Not Appearing?
```tsx
// Verify showBadges is true
showBadges={true}

// Check data exists
platform={prospect.platform}  // Must have value
industry={prospect.industry}  // Must have value
```

### Ring Not Showing?
```tsx
// Verify score is provided
score={prospect.score}  // Required for ring

// Or explicit bucket
bucket="hot"  // Alternative to score
```

### Glow Not Animating?
```tsx
// Must be Elite tier
userTier="elite"

// Check CSS is loaded
// Animation classes: avatar-glow-hot, avatar-glow-warm
```

---

## 🎯 Performance Tips

1. **Lazy Loading:** Built-in (`loading="lazy"`)
2. **Memoization:** Use React.memo if rendering many
3. **Badge Control:** Disable badges in large lists
4. **Hover Control:** Disable in non-interactive contexts

```tsx
// Optimized list rendering
const AvatarMemo = React.memo(ProspectAvatar);

{prospects.map(p => (
  <AvatarMemo
    key={p.id}
    prospect={p}
    size="sm"
    showBadges={false}
    enableHover={false}
  />
))}
```

---

## ✅ Quick Reference

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `prospect` | `ProspectAvatarData` | Required | Prospect data |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Avatar size |
| `score` | `number` | - | Scout score (0-100) |
| `bucket` | `'hot' \| 'warm' \| 'cold'` | Auto | Manual bucket |
| `userTier` | `'free' \| 'pro' \| 'elite'` | `'free'` | User tier |
| `platform` | `string` | - | Social platform |
| `industry` | `string` | - | Industry type |
| `pipelineStage` | `string` | - | Pipeline stage |
| `showBadges` | `boolean` | `true` | Show badges |
| `enableHover` | `boolean` | `true` | Enable hover |
| `className` | `string` | `''` | Custom classes |

---

**Happy Coding! 🚀**

For questions or issues, check:
- `AVATAR_ENHANCEMENTS_V2_COMPLETE.md` - Full documentation
- `src/components/ProspectAvatar.tsx` - Source code
- `src/services/avatarService.ts` - Avatar utilities
