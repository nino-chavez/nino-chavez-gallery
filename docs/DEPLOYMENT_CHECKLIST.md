# Deployment Checklist
**AI-Enriched Photo Gallery - Production Deployment**

---

## ✅ PRE-DEPLOYMENT TASKS

### 1. Dependency Installation
```bash
# Run installation script
./scripts/install-dependencies.sh

# Or manually:
pnpm add @tanstack/react-virtual jspdf @types/jspdf
```

- [ ] @tanstack/react-virtual installed
- [ ] jspdf and @types/jspdf installed
- [ ] All dependencies resolved (no errors)

### 2. Environment Configuration

- [ ] `.env.local` created from `.env.example`
- [ ] `NEXT_PUBLIC_SUPABASE_URL` configured
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` configured
- [ ] `SUPABASE_SERVICE_ROLE_KEY` configured
- [ ] `GOOGLE_AI_API_KEY` configured (if using metadata enrichment)
- [ ] All API keys validated

### 3. Database Setup

- [ ] Supabase project created
- [ ] Migration `001_create_photo_metadata.sql` executed
- [ ] Migration `002_create_stories_tables.sql` executed
- [ ] Tables verified (photo_metadata, stories, story_photos)
- [ ] Indexes created successfully
- [ ] RLS policies configured (if needed)

### 4. Metadata Sync

If you have enriched photos:

```bash
pnpm run sync:metadata --db=path/to/enrichment-db.db
```

- [ ] Enriched photos exist in SQLite
- [ ] Sync script executed successfully
- [ ] Photo metadata in Supabase verified
- [ ] Sample queries tested

### 5. Build Validation

```bash
pnpm run type-check
pnpm run lint
pnpm build
```

- [ ] TypeScript compilation successful (no errors)
- [ ] ESLint passed (no critical issues)
- [ ] Production build successful
- [ ] Build artifacts generated in `.next/`
- [ ] No build warnings (or documented if acceptable)

---

## 🧪 TESTING PHASE

### 6. Local Testing

```bash
pnpm dev
```

**Story Curation**
- [ ] Navigate to `/athlete/test-id`
- [ ] Click "Generate Highlight Reel"
- [ ] Select each of 6 story types
- [ ] Verify story generation works
- [ ] Test StoryViewer auto-play
- [ ] Test keyboard controls (←/→/Space/Esc)
- [ ] Test emotional curve interaction
- [ ] Verify PDF export

**Portfolio Showcase**
- [ ] Navigate to `/portfolio`
- [ ] Switch to Quality view mode
- [ ] Switch to Grid view mode
- [ ] Switch to Timeline view mode
- [ ] Test magnetic filters (hover interaction)
- [ ] Verify contextual cursor
- [ ] Test quality gradient effects

**Interactions**
- [ ] Test magnetic filter physics
- [ ] Test emotion timeline scrubber
- [ ] Test play type morphing
- [ ] Test momentum scroll
- [ ] Test swipeable carousel on mobile

**Discovery**
- [ ] Browse photos to unlock badges
- [ ] Verify confetti celebration triggers
- [ ] Check badge collection display
- [ ] Test sound effects (if audio files added)

### 7. Performance Testing

```bash
pnpm build && pnpm start
# Open http://localhost:3000
# Open Chrome DevTools > Lighthouse
```

**Lighthouse Scores (Target: 90+)**
- [ ] Performance: ___/100 (target: 90+)
- [ ] Accessibility: ___/100 (target: 90+)
- [ ] Best Practices: ___/100 (target: 90+)
- [ ] SEO: ___/100 (target: 90+)

**Page Load Metrics**
- [ ] LCP (Largest Contentful Paint): <2.5s
- [ ] FID (First Input Delay): <100ms
- [ ] CLS (Cumulative Layout Shift): <0.1
- [ ] TTFB (Time to First Byte): <600ms

**Bundle Size**
- [ ] Total JS bundle: <500KB gzipped
- [ ] Initial page load: <200KB
- [ ] Images lazy-loaded properly
- [ ] Code splitting working

### 8. Cross-Browser Testing

**Desktop Browsers**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Mobile Browsers**
- [ ] iOS Safari
- [ ] Chrome Mobile (Android)
- [ ] Samsung Internet

**Testing Checklist per Browser**
- [ ] Story viewer displays correctly
- [ ] Magnetic filters work
- [ ] 3D gravity renders (or graceful fallback)
- [ ] Swipe gestures work on mobile
- [ ] All animations smooth (60fps)

### 9. Accessibility Testing

**Keyboard Navigation**
- [ ] All interactive elements keyboard-accessible
- [ ] Tab order logical
- [ ] Focus visible on all elements
- [ ] Escape key closes modals
- [ ] Arrow keys work in story viewer

**Screen Reader Testing** (Test with NVDA/VoiceOver)
- [ ] All images have alt text
- [ ] ARIA labels present and correct
- [ ] Dynamic content announced
- [ ] Error messages announced
- [ ] Loading states announced

**Visual Accessibility**
- [ ] Color contrast WCAG AA minimum
- [ ] Text readable at 200% zoom
- [ ] No reliance on color alone
- [ ] Focus indicators visible
- [ ] Reduced motion preference honored

### 10. Mobile Testing

**Responsive Design**
- [ ] Mobile layout (320px - 767px)
- [ ] Tablet layout (768px - 1023px)
- [ ] Desktop layout (1024px+)
- [ ] Touch targets >44px
- [ ] No horizontal scrolling

**Mobile-Specific Features**
- [ ] Swipe carousel works
- [ ] Touch gestures responsive
- [ ] Magnetic filters work (or disabled appropriately)
- [ ] 3D view performs well (or disabled)
- [ ] Story viewer optimized

---

## 🚀 DEPLOYMENT

### 11. Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel deploy --prod
```

**Vercel Configuration**
- [ ] Project linked to Git repository
- [ ] Environment variables added to Vercel:
  - [ ] NEXT_PUBLIC_SUPABASE_URL
  - [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
  - [ ] SUPABASE_SERVICE_ROLE_KEY
  - [ ] GOOGLE_AI_API_KEY
- [ ] Build settings configured
- [ ] Domain configured (if custom)

### 12. Post-Deployment Verification

**Smoke Tests**
- [ ] Homepage loads
- [ ] Portfolio page loads
- [ ] Athlete dashboard loads
- [ ] Story generation API responds
- [ ] Story retrieval API responds
- [ ] Images load from SmugMug/storage
- [ ] No console errors

**Critical User Flows**
- [ ] User can browse photos
- [ ] User can filter photos
- [ ] User can generate story
- [ ] User can view story
- [ ] User can download PDF
- [ ] User can switch view modes

### 13. Monitoring Setup

- [ ] Error tracking configured (Sentry, if used)
- [ ] Analytics configured (GA, Vercel Analytics)
- [ ] Performance monitoring active
- [ ] API rate limits configured
- [ ] Database connection pooling optimized

---

## 📊 POST-DEPLOYMENT

### 14. User Acceptance Testing

**Test with Real Users**
- [ ] Athlete tests highlight reel generation
- [ ] Coach tests season highlights
- [ ] User tests portfolio showcase
- [ ] User tests all view modes
- [ ] User unlocks badges
- [ ] User exports PDF

**Collect Feedback**
- [ ] User feedback form active
- [ ] Bug reporting system ready
- [ ] Feature request tracking
- [ ] Success metrics baseline established

### 15. Performance Monitoring (First Week)

**Track Metrics Daily**
- [ ] Story generation rate
- [ ] Story view rate
- [ ] Filter usage rate
- [ ] Badge unlock rate
- [ ] Error rates
- [ ] API latency
- [ ] Page load times

**Set Alerts**
- [ ] Error rate >5%
- [ ] API latency >3s
- [ ] Page load time >3s
- [ ] Database connection issues

### 16. Optimization (First Month)

**Based on Real Usage**
- [ ] Identify slow queries
- [ ] Optimize image loading
- [ ] Tune virtual scrolling
- [ ] Adjust animation performance
- [ ] Optimize bundle size
- [ ] Add caching where needed

---

## 🔧 ROLLBACK PLAN

### If Critical Issues Found

```bash
# Vercel rollback to previous deployment
vercel rollback

# Or redeploy specific commit
git checkout <previous-commit>
vercel deploy --prod
```

**Rollback Triggers**
- Error rate >10%
- Critical feature broken
- Database corruption
- Performance degradation >50%
- Security vulnerability

---

## 📋 LAUNCH CHECKLIST

### Before Public Launch

- [ ] All smoke tests passing
- [ ] No critical bugs
- [ ] Performance acceptable
- [ ] Accessibility verified
- [ ] Documentation complete
- [ ] Support channels ready
- [ ] Marketing materials prepared
- [ ] Pricing tiers finalized (if applicable)

### Launch Day

- [ ] Deploy to production
- [ ] Verify deployment successful
- [ ] Test critical paths
- [ ] Monitor error rates
- [ ] Monitor performance
- [ ] Respond to user feedback
- [ ] Document any issues

### Week 1 Post-Launch

- [ ] Daily monitoring
- [ ] Address critical bugs immediately
- [ ] Collect user feedback
- [ ] Measure against success metrics
- [ ] Plan iteration based on data

---

## 🎯 SUCCESS CRITERIA

### Engagement Metrics (Week 1)
- [ ] Story generation rate >40%
- [ ] Story view rate >60%
- [ ] Filter usage >40%
- [ ] Avg time on site >2 minutes

### Performance Metrics (Week 1)
- [ ] Lighthouse performance >85
- [ ] Error rate <5%
- [ ] API latency <2s
- [ ] Story generation <3s

### Business Metrics (Month 1)
- [ ] User retention >30%
- [ ] Return visit rate >25%
- [ ] Badge unlock rate >15%
- [ ] Story share rate >10%

---

## 📞 SUPPORT READINESS

### Documentation
- [ ] README.md complete
- [ ] Installation guide accessible
- [ ] API documentation available
- [ ] Component usage examples documented

### Support Channels
- [ ] Support email configured
- [ ] Bug reporting process defined
- [ ] Feature request process defined
- [ ] FAQ document created

---

## ✅ FINAL SIGN-OFF

**Technical Lead**: _________________ Date: _______
**Product Owner**: _________________ Date: _______
**QA Lead**: _________________ Date: _______

**Deployment Approved**: [ ] YES [ ] NO

**Notes**:
```
_______________________________________________
_______________________________________________
_______________________________________________
```

---

**Version**: 1.0.0  
**Deployment Date**: _____________  
**Last Updated**: 2025-01-15