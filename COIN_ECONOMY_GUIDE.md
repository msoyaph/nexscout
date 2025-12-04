# Coin Economy & Subscription System Guide

## Overview
This guide explains the complete coin economy and subscription system integrated throughout the application.

## Subscription Tiers

### Free Tier (₱0/month)
- **Daily Limits:**
  - 3 AI Prospect Scans/day
  - 2 AI Messages/day
  - 1 AI Presentation/week
- **Coin Earning:**
  - 10-15 daily login bonus (randomized)
  - 3 coins per ad watch (max 2 ads/day = 6 coins)
  - **Total daily earning potential: 21 coins max**
- **Features:**
  - Basic 3-stage pipeline
  - 1 visible prospect card
  - Watch ads for bonus coins

### Pro Tier (₱199/month or ₱1,990/year)
- **Unlimited:** Scans, Messages
- **Limits:** 5 AI Presentations/week
- **Weekly Coins:** 150 coins automatically added
- **Features:**
  - No Ads
  - Partial AI DeepScan
  - Extended personality detection
  - Full 6-stage pipeline
  - 2 visible prospect cards
  - ALL basic templates
  - Priority AI queue

### Elite Tier (₱499/month or ₱4,990/year)
- **Unlimited Everything**
- **Weekly Coins:** 500 coins automatically added
- **Exclusive Features:**
  - AI DeepScan 2.0
  - AI Affordability Score
  - AI Leadership Potential
  - Multi-Step Sequences (4-7 steps)
  - Advanced Elite templates
  - ALL cards unlocked
  - Personalized AI insights
  - Lead Timeline & Affinity
  - Early access features

### Team Tier (₱1,490/month or ₱14,900/year)
- 5 Pro seats included
- **Weekly Coins:** 750 coins (distributed among team)
- **Team Features:**
  - Shared Team Dashboard
  - Shared Pipeline
  - Team Missions
  - Leaderboard
  - Team Coaching AI
  - Training deck generator
  - Performance analytics

## Coin Costs (Economically Balanced)

### Core Actions
- **Reveal Prospect:** 10 coins (2 per day with free tier earnings)
- **Extra Message:** 5 coins (extend daily limit)
- **Extra Presentation:** 15 coins (premium action)
- **Speed Scan:** 8 coins (convenience feature)

### Premium Unlocks
- **Unlock Add-on:** 20 coins
- **Unlock Deep Scan (one-time):** 25 coins
- **Unlock Elite Template (one-time):** 20 coins

## Economic Design Philosophy

### Free Tier Balance
- Daily earning potential: 21 coins
- Primary action cost (Reveal Prospect): 10 coins
- This allows free users to:
  - Reveal 2 prospects per day, OR
  - Reveal 1 prospect + 2 extra messages, OR
  - Save coins for premium unlocks (2-3 days of saving)

### Paid Tier Value
- Pro: ₱199/month = 150 coins/week = ~21 coins/day equivalent
- Elite: ₱499/month = 500 coins/week = ~71 coins/day equivalent
- Team: ₱1,490/month = 750 coins/week for 5 users

## Database Functions

### Coin Management
- `record_coin_transaction()` - Safely handle all coin transactions
- `get_coin_balance()` - Get user's current coin balance
- `can_afford_action()` - Check if user can afford an action
- `award_daily_bonus()` - Award daily login bonus

### Usage Tracking
- `reset_daily_limits()` - Reset daily usage counters
- `reset_weekly_limits()` - Reset weekly usage counters
- Automatic tracking of scans, messages, presentations, ads watched

## Integration Points

### 1. Subscription Purchase Flow
- User browses plans (PricingPage or SubscriptionPage)
- Clicks "Get Started"
- Redirected to SubscriptionCheckoutPage
- Selects payment method
- Confirms purchase
- Profile updated with new tier
- Weekly coins automatically added

### 2. Paywall System
- When user tries to access premium feature
- PaywallModal shows required tier and benefits
- "Upgrade" button redirects to checkout
- Seamless upgrade flow

### 3. Coin Usage
- Check balance before action: `can_afford_action()`
- Deduct coins: `record_coin_transaction(user_id, -cost, 'spend', description)`
- Add coins: `record_coin_transaction(user_id, +amount, 'earn'/'bonus', description)`
- Track all transactions in coin_transactions table

### 4. Daily/Weekly Resets
- Automatically resets limits based on last_daily_reset and last_weekly_reset
- Free tier: Reset daily scans, messages, ads watched
- All tiers: Reset weekly presentations
- Functions are called on app load and before actions

## UI Components

### TierBadge Component
```tsx
<TierBadge tier={profile.subscription_tier} size="md" showIcon={true} />
```
- Displays beautiful tier badge with icon
- Sizes: 'sm', 'md', 'lg'
- Auto-styled per tier (Pro = Blue, Elite = Purple gradient, Team = Green)

### Current Plan Display
- Shows at top of PricingPage and SubscriptionPage
- Displays: Tier badge, billing cycle, renewal date, active status
- Only shown for paid tiers

## Security Features

### Row Level Security (RLS)
- coin_transactions table: Users can only view/insert their own transactions
- profiles table: Users can only update their own coin balance
- All functions use SECURITY DEFINER for safe execution

### Transaction Safety
- Atomic transactions prevent race conditions
- Balance never goes negative (checked before spending)
- All coin changes logged in coin_transactions table
- Rollback on errors

## Testing the System

1. **Free Tier Testing:**
   - Login as free user
   - Check coin balance (should start at 0)
   - Watch ad to earn 3 coins
   - Try to reveal prospect (costs 10 coins - should fail or show paywall)
   - Daily bonus: 10-15 coins added automatically

2. **Upgrade Flow:**
   - Navigate to Subscription page
   - Click "Get Started" on Pro tier
   - Verify checkout page shows correct price
   - Complete purchase
   - Verify profile updated
   - Verify 150 weekly coins added
   - Verify limits removed (unlimited scans/messages)

3. **Coin Transactions:**
   - Query coin_transactions table
   - Verify all transactions logged
   - Check balance_after matches current balance
   - Verify transaction types (earn, spend, bonus, purchase, ad_reward)

## Future Enhancements

- Stripe/PayPal payment integration
- Coin purchase packages
- Referral bonuses
- Seasonal promotions
- Team coin pooling
- Coin gifting between users
