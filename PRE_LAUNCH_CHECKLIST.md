# ✅ NexScout Pre-Launch Checklist

Complete this checklist before going live at **nexscout.co**

---

## 🔧 Code & Build

- [ ] All TypeScript errors fixed (`npm run typecheck`)
- [ ] All linting errors fixed (`npm run lint`)
- [ ] Production build succeeds (`npm run build`)
- [ ] Build size is reasonable (< 2MB initial load)
- [ ] All hardcoded URLs updated to use environment variables
- [ ] `.env.example` file created and documented
- [ ] `.gitignore` includes all `.env` files

---

## 🗄️ Database & Backend

- [ ] Production Supabase project created
- [ ] All database migrations applied to production
- [ ] RLS policies verified on all tables
- [ ] Database backups enabled (Supabase auto-backups)
- [ ] Edge Functions deployed to production
- [ ] Edge Functions environment variables set
- [ ] Test data removed from production (if any)

---

## 🔐 Security & Configuration

- [ ] Production Supabase credentials obtained
- [ ] Environment variables documented
- [ ] CORS configured in Supabase for `nexscout.co`
- [ ] Supabase Auth URLs configured:
  - Site URL: `https://nexscout.co`
  - Redirect URLs: `https://nexscout.co/**`
- [ ] API rate limiting configured
- [ ] Service role key secured (never in client code)

---

## 🌐 Domain & Hosting

- [ ] Hosting platform chosen (Vercel/Netlify/Cloudflare)
- [ ] Domain `nexscout.co` purchased and accessible
- [ ] DNS records configured:
  - A record or CNAME for root domain
  - CNAME for www subdomain (optional)
- [ ] SSL certificate active (automatic with Vercel/Netlify)
- [ ] Domain verified in hosting platform
- [ ] Environment variables set in hosting platform

---

## 🧪 Testing

### Core Functionality
- [ ] User registration works
- [ ] User login works
- [ ] Password reset works
- [ ] Email verification works (if enabled)
- [ ] Profile editing works
- [ ] Settings save correctly

### Chatbot
- [ ] Public chatbot accessible: `https://nexscout.co/chat/{slug}`
- [ ] Chatbot responds correctly
- [ ] Chatbot settings save
- [ ] Training data loads

### Features
- [ ] Prospect scanning works
- [ ] Pipeline management works
- [ ] Messages generate correctly
- [ ] Payments work (if enabled)
- [ ] File uploads work

### Cross-Browser
- [ ] Chrome (Desktop & Mobile)
- [ ] Safari (Desktop & Mobile)
- [ ] Firefox
- [ ] Edge

### Mobile Responsive
- [ ] All pages work on mobile (375px width)
- [ ] Touch interactions work
- [ ] Forms are usable on mobile
- [ ] Navigation works on mobile

---

## 📱 Production URLs

- [ ] Main app: `https://nexscout.co`
- [ ] Public chatbot: `https://nexscout.co/chat/{slug}`
- [ ] All internal links use production domain
- [ ] No localhost or development URLs in code

---

## 📊 Monitoring & Analytics

- [ ] Error monitoring set up (Sentry recommended)
- [ ] Analytics configured (Google Analytics optional)
- [ ] Supabase dashboard access verified
- [ ] Hosting platform dashboard access verified
- [ ] Email notifications working

---

## 📧 Email & Notifications

- [ ] Email sending works (password reset, etc.)
- [ ] Email templates look correct
- [ ] "From" email address configured
- [ ] Email delivery tested

---

## 💳 Payments (If Enabled)

- [ ] Stripe/Payment gateway configured
- [ ] Test payments work
- [ ] Webhook endpoints configured
- [ ] Subscription flow works end-to-end

---

## 🚀 Final Steps

- [ ] All checklist items completed
- [ ] Team notified of launch
- [ ] Backup plan in place
- [ ] Rollback plan documented
- [ ] Support email/contact ready

---

## 🎯 Launch Day

1. **Final Build:**
   ```bash
   npm run build
   ```

2. **Deploy:**
   ```bash
   vercel --prod  # or your hosting platform
   ```

3. **Verify:**
   - Visit `https://nexscout.co`
   - Test critical user flows
   - Check browser console for errors

4. **Monitor:**
   - Watch error logs
   - Monitor database queries
   - Check user registrations

---

## 🆘 Emergency Contacts

- **Supabase Support:** https://supabase.com/support
- **Vercel Support:** https://vercel.com/support
- **Domain Registrar:** (Your registrar support)

---

**Ready to launch?** ✅ Complete all items above, then deploy!




