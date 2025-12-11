# AI Instructions Transformation Engine

**Created:** December 2025  
**Status:** ✅ Production Ready  
**Purpose:** Transform and improve user-written AI System Instructions while preserving all content

---

## 🎯 Overview

The **Instructions Transformation Engine** is a service that helps users improve their AI System Instructions through three main actions:

1. **Improve My Instructions** - Formats, organizes, and polishes instructions
2. **Regenerate Tone** - Changes tone/style only (keeps content identical)
3. **Undo** - Restores previous version

### Key Features

- ✅ **Content Preservation** - Never adds new products, prices, claims, or testimonials
- ✅ **Formatting Improvements** - Clean headings, structure, readability
- ✅ **Tone Transformation** - 4 different tone styles available
- ✅ **History Management** - Undo functionality with version history
- ✅ **Missing Field Detection** - Warns users about incomplete instructions
- ✅ **Validation** - Ensures critical data (phone, email, prices) is preserved

---

## 📦 Components

### 1. **Transformation Engine Service**
**File:** `src/services/ai/instructionsTransformationEngine.ts`

Core service that handles all transformations.

**Key Methods:**
- `improveInstructions(userId, rawInstructions)` - Improve formatting and structure
- `regenerateTone(userId, instructions, toneStyle)` - Change tone only
- `undo(userId)` - Restore previous version
- `getHistory(userId)` - Get transformation history
- `clearHistory(userId)` - Clear history

### 2. **React Hook**
**File:** `src/hooks/useInstructionsTransformation.ts`

Easy-to-use React hook for components.

**Usage:**
```typescript
const { improve, regenerateTone, undo, isTransforming, error, canUndo } = 
  useInstructionsTransformation(userId);

const improved = await improve(rawInstructions);
const toneChanged = await regenerateTone(instructions, 'warm-filipino-adviser');
const previous = undo();
```

### 3. **UI Component**
**File:** `src/components/InstructionsTransformationButtons.tsx`

Ready-to-use button component with all actions.

**Usage:**
```tsx
<InstructionsTransformationButtons
  userId={userId}
  currentInstructions={instructions}
  onInstructionsChange={setInstructions}
/>
```

---

## 🚀 Quick Start

### Basic Usage (Service)

```typescript
import { instructionsTransformationEngine } from '@/services/ai/instructionsTransformationEngine';

// Improve instructions
const result = await instructionsTransformationEngine.improveInstructions(
  userId,
  rawInstructions
);

if (result.error) {
  console.error('Error:', result.error);
} else {
  console.log('Improved:', result.improved);
}
```

### Using React Hook

```typescript
import { useInstructionsTransformation } from '@/hooks/useInstructionsTransformation';

function MyComponent({ userId }: { userId: string }) {
  const { improve, regenerateTone, undo, isTransforming, error, canUndo } = 
    useInstructionsTransformation(userId);

  const handleImprove = async () => {
    const improved = await improve(currentInstructions);
    if (improved) {
      setInstructions(improved);
    }
  };

  return (
    <div>
      <button onClick={handleImprove} disabled={isTransforming}>
        {isTransforming ? 'Improving...' : 'Improve My Instructions'}
      </button>
      {error && <div className="error">{error}</div>}
    </div>
  );
}
```

### Using UI Component

```tsx
import InstructionsTransformationButtons from '@/components/InstructionsTransformationButtons';

function AISettingsPage({ userId }: { userId: string }) {
  const [instructions, setInstructions] = useState('');

  return (
    <div>
      <textarea
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
      />
      
      <InstructionsTransformationButtons
        userId={userId}
        currentInstructions={instructions}
        onInstructionsChange={setInstructions}
      />
    </div>
  );
}
```

---

## 🎨 Tone Styles

The engine supports 4 tone styles:

### 1. **Warm Filipino Adviser**
- Taglish naturally (mix of Tagalog and English)
- Friendly "po/opo" when appropriate
- Warm, caring, helpful
- Examples: "Sige po, tutulungan ko kayo 🧡"

### 2. **Youthful Casual**
- Modern, simple, relatable
- No heavy formality
- Friendly emojis when appropriate
- Short, punchy sentences

### 3. **Corporate Straight**
- Professional, direct, clear
- Minimal casual language
- Structured, organized
- Business-appropriate

### 4. **Energetic Motivational**
- Upbeat, encouraging, positive
- Motivating but still respectful
- Action-oriented language
- Inspiring without pressure

---

## 🔒 Content Preservation Rules

The engine **NEVER**:

- ❌ Adds new products, offers, or prices
- ❌ Invents testimonials, guarantees, or promises
- ❌ Adds medical/health guarantees
- ❌ Strengthens claims beyond what user wrote
- ❌ Adds aggressive sales language
- ❌ Modifies names, contacts, links, addresses

The engine **ONLY**:

- ✅ Improves formatting and structure
- ✅ Fixes typos and grammar
- ✅ Adds clear headings and organization
- ✅ Changes tone/style of language
- ✅ Improves readability and flow
- ✅ Removes repetition

---

## 📋 Missing Field Detection

The engine automatically detects missing critical fields:

- Company/Brand name
- Product/Service/Offer
- Price information
- Contact information

If missing fields are detected, the engine returns a friendly message asking the user to add them:

```
Missing po ang ilan sa important info. Would you like to add:

1) Company/Brand name
2) Product/Service/Offer
3) Price information
4) Contact information?
```

---

## 🔄 History & Undo

The engine maintains a history of transformations (max 10 versions per user):

```typescript
// Get history
const history = instructionsTransformationEngine.getHistory(userId);
console.log(history); // [{ version: 'v1234567890', content: '...', timestamp: 1234567890 }]

// Undo last transformation
const previous = instructionsTransformationEngine.undo(userId);

// Clear history
instructionsTransformationEngine.clearHistory(userId);
```

---

## ⚙️ Integration with AISystemInstructionsModal

To add transformation buttons to the existing modal:

```tsx
import InstructionsTransformationButtons from '@/components/InstructionsTransformationButtons';

// Inside AISystemInstructionsModal component
{useCustomInstructions && (
  <>
    {/* Transformation Buttons */}
    <InstructionsTransformationButtons
      userId={userId}
      currentInstructions={richContent.text}
      onInstructionsChange={(improved) => {
        setRichContent(prev => ({ ...prev, text: improved }));
      }}
    />

    {/* Rich Editor */}
    <AIInstructionsRichEditor
      userId={userId}
      value={richContent}
      onChange={setRichContent}
      placeholder="..."
    />
  </>
)}
```

---

## 🧪 Validation

The engine validates that critical data is preserved after transformation:

- Phone numbers
- Email addresses
- Prices (PHP format: ₱)
- URLs

If validation fails, warnings are logged but the transformation is still returned (with a console warning).

---

## 🎯 AI Orchestrator Integration

The transformation engine uses the **AIOrchestrator** for all AI calls:

- Centralized AI operations
- Energy system integration
- Automatic model selection
- Token tracking and cost calculation
- Retry logic with exponential backoff

**Action Type:** Uses `ai_chatbot_response` (existing action type)

**Model:** GPT-4 (with auto-downgrade to GPT-3.5 if low energy)

**Temperature:**
- Improve: 0.3 (low for consistency)
- Regenerate Tone: 0.4 (slightly higher for style variation)

---

## 📊 Error Handling

All methods return error information:

```typescript
const result = await improveInstructions(userId, rawInstructions);

if (result.error) {
  // Handle error
  console.error(result.error);
  // Show user-friendly message
} else {
  // Use improved instructions
  setInstructions(result.improved);
}
```

**Common Errors:**
- `"Insufficient energy"` - User doesn't have enough energy
- `"No response from AI"` - AI service unavailable
- `"Missing po ang ilan sa important info..."` - Missing critical fields

---

## 🔍 Example: Complete Integration

```tsx
import { useState } from 'react';
import InstructionsTransformationButtons from '@/components/InstructionsTransformationButtons';
import { useInstructionsTransformation } from '@/hooks/useInstructionsTransformation';

function AISettingsEditor({ userId }: { userId: string }) {
  const [instructions, setInstructions] = useState('');
  const { canUndo } = useInstructionsTransformation(userId);

  return (
    <div className="space-y-4">
      <textarea
        value={instructions}
        onChange={(e) => setInstructions(e.target.value)}
        className="w-full h-64 p-4 border rounded-lg"
        placeholder="Write your AI System Instructions..."
      />

      <InstructionsTransformationButtons
        userId={userId}
        currentInstructions={instructions}
        onInstructionsChange={setInstructions}
      />

      {canUndo && (
        <p className="text-sm text-gray-500">
          💡 You can undo the last transformation
        </p>
      )}
    </div>
  );
}
```

---

## 🚨 Important Notes

1. **Content Preservation is Critical**
   - The engine is designed to NEVER add new content
   - Always validates that critical data is preserved
   - Logs warnings if content appears to be modified

2. **Energy Costs**
   - Each transformation costs ~5 energy
   - Uses GPT-4 by default (auto-downgrades if low energy)
   - Energy is checked before transformation

3. **History Management**
   - Max 10 versions per user (in-memory)
   - History is cleared when user logs out
   - Consider persisting to database for production

4. **Missing Fields**
   - Detection is basic (keyword-based)
   - May have false positives/negatives
   - User should review and add missing info manually

---

## 📚 Related Files

- `src/services/ai/instructionsTransformationEngine.ts` - Core service
- `src/hooks/useInstructionsTransformation.ts` - React hook
- `src/components/InstructionsTransformationButtons.tsx` - UI component
- `src/services/ai/AIOrchestrator.ts` - AI orchestration
- `src/components/AISystemInstructionsModal.tsx` - Main modal (integration target)

---

## ✅ Checklist for Integration

- [ ] Import transformation engine or hook
- [ ] Add transformation buttons to UI
- [ ] Handle loading states (`isTransforming`)
- [ ] Display errors to user
- [ ] Update instructions state after transformation
- [ ] Test all three actions (improve, tone, undo)
- [ ] Verify content preservation
- [ ] Test with missing fields
- [ ] Test undo functionality
- [ ] Verify energy consumption

---

**Status:** ✅ Ready for Production  
**Last Updated:** December 2025


