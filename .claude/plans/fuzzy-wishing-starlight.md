# Implementation Plan: Corporate Gangsta → The Corporate Heroes (80s Power Ballad)

## Overview
Transform the "Corporate Gangsta" rap app into "The Corporate Heroes" - an 80s power ballad experience with arena rock energy, inspirational lyrics, and dramatic album cover aesthetics. No backend dependencies exist (no Supabase), making this a straightforward clone and retheme.

## User Requirements
- **Theme:** 80s Power Ballad / Inspirational Rock (Europe, Survivor, Bonnie Tyler style)
- **Band Name:** "The Corporate Heroes"
- **Design Level:** Professional 80s aesthetic with polished visual design
- **Photo Style:** 80s action-hero album cover (instead of GTA gangsta)
- **Layout:** Photo on LEFT, scrolling lyrics on RIGHT (not overlaid)

---

## Implementation Steps

### Phase 1: Repository Setup (15 min)

**1.1 Clone Repository**
```bash
cd /Users/erikmarkensten/Documents/GitHub
git clone corporate-gangsta corporate-heroes
cd corporate-heroes
```

**1.2 Update Package Configuration**
- Update `package.json` → `"name": "corporate-heroes"`
- Update `package-lock.json` → `"name": "corporate-heroes"` (2 locations)
- Test that app runs: `npm install && npm run dev`

**1.3 Update Base URLs**
- `src/lib/suno.ts:53` → Update default URL if needed
- `src/app/api/test-apis/route.ts:14` → Update default URL if needed

---

### Phase 2: 80s Color System (30 min)

**2.1 Create Theme Constants File**
Create `/src/lib/theme.ts`:
```typescript
export const THEME_COLORS = {
  primary: {
    magenta: '#FF1F8E',      // Electric Magenta
    pink: '#FF6BB5',         // Hot Pink
    deep: '#C20A6F',         // Deep Magenta
  },
  secondary: {
    blue: '#00D4FF',         // Electric Blue
    gold: '#FFD700',         // Neon Gold
    orange: '#FF6B35',       // Sunset Orange
  },
  background: {
    black: '#000000',
    charcoal: '#1a1a1a',
  },
  gradients: {
    sunset: 'from-[#FF1F8E] via-[#FF6B35] to-[#FFD700]',
    electric: 'from-[#00D4FF] via-[#FF1F8E] to-[#FF6BB5]',
    spotlight: 'radial-gradient(circle, #FFD700 0%, transparent 70%)',
  }
};
```

**2.2 Update OKLCH Color System**
Update `/src/app/globals.css` (lines 91-115):
```css
.dark {
  --primary: oklch(0.65 0.25 340);        /* Magenta instead of violet 275 */
  --accent: oklch(0.70 0.20 210);         /* Electric blue instead of cyan 195 */
  --ring: oklch(0.65 0.25 340);           /* Magenta ring */
  --sidebar-primary: oklch(0.65 0.25 340);
  --sidebar-ring: oklch(0.65 0.25 340);
  --chart-1: oklch(0.65 0.25 340);        /* Magenta */
  --chart-2: oklch(0.70 0.20 210);        /* Electric blue */
  --chart-3: oklch(0.80 0.20 50);         /* Gold */
  --chart-4: oklch(0.70 0.20 30);         /* Orange */
  --chart-5: oklch(0.70 0.25 330);        /* Hot pink */
}
```

**2.3 Global Color Find & Replace**
Search and replace across all component files:
- `violet-400` → `[#FF6BB5]` (Hot Pink)
- `violet-500` → `[#FF1F8E]` (Electric Magenta)
- `violet-600` → `[#C20A6F]` (Deep Magenta)
- `cyan-400` → `[#00D4FF]` (Electric Blue)
- `cyan-500` → `[#FFD700]` (Neon Gold)

**Files to update:**
- `src/app/page.tsx`
- `src/components/KaraokeDisplay.tsx`
- `src/components/HackerTerminal.tsx`
- `src/components/ImageReveal.tsx`
- `src/components/StemPlayer.tsx`
- `src/components/WebcamCapture.tsx`
- `src/components/WordCloud.tsx`

---

### Phase 3: Text & Branding Updates (20 min)

**3.1 Main Application**
Update `/src/app/page.tsx`:
- Line 86: `"Corporate Gangsta"` → `"Arena Anthem"`
- Line 239: `"MC KPI"` → `"The Corporate Heroes"`
- Line 240: `"THE CORPORATE RAPPER"` → `"THE ARENA ROCKERS"`
- Line 395, 404: `MC_KPI_` → `CORPORATE_HEROES_`

**3.2 Metadata & SEO**
Update `/src/app/layout.tsx`:
- Line 16: `"MC KPI | The Corporate Rapper"` → `"The Corporate Heroes | Arena Rock Experience"`
- Line 17: `"Transform corporate buzzwords into gangsta rap..."` → `"Transform corporate buzzwords into 80s power ballad anthems. An inspirational arena rock experience."`

**3.3 Loading Messages**
Update `/src/components/HackerTerminal.tsx` (lines 19-30):
```typescript
const FAKE_LOGS: LogEntry[] = [
  { text: "Initializing Corporate Heroes protocol...", type: "info" },
  { text: "Tuning power ballad frequencies...", type: "processing" },
  { text: "Analyzing inspirational keyword density...", type: "processing" },
  { text: "Injecting 80s arena rock energy...", type: "processing" },
  { text: "Loading stadium lighting effects...", type: "info" },
  { text: "Compiling anthemic chorus patterns...", type: "processing" },
  { text: "Rendering heroic visual style...", type: "processing" },
  { text: "Synthesizing power ballad arrangements...", type: "processing" },
  { text: "Optimizing guitar solo trajectories...", type: "processing" },
];
```
- Line 71: `"mc-kpi-generator v6.9.420"` → `"corporate-heroes-generator v1.985"`

**3.4 Image Reveal Component**
Update `/src/components/ImageReveal.tsx`:
- Line 60: `"MC KPI skapar din låt..."` → `"The Corporate Heroes skapar din power ballad..."`
- Line 66: `"Genererar musik"` → `"Skapar anthemisk låt"`

---

### Phase 4: AI Prompts - Core Transformation (45 min)

**4.1 Lyrics Prompt (Gemini)**
Update `/src/lib/gemini.ts` (lines 6-29):
```typescript
const MC_KPI_PROMPT = `Agera som "The Corporate Heroes", ett inspirerande 80s power ballad rockband.
Skriv en KORT power ballad (max 1,5 minut) baserat på orden: {KEYWORDS}.
{CROWD_SECTION}

VIKTIGA INSTRUKTIONER FÖR SUNO V5:
1. KOMPAKT STRUKTUR (max 20 rader totalt):
   - [Intro] (2-4 rader, talad eller mjukt sjungen, sätt stämningen)
   - [Verse] (max 6 rader, bygger känslomässig intensitet)
   - [Chorus] (max 4 rader, anthemisk och kraftfull, lätt att sjunga med i)
   - [Outro] (2 rader, fade out med upprepad hook)

2. AD-LIBS:
   - Använd parenteser () för bakgrundsröster i slutet av rader
   - Exempel: "Vi når våra mål (Yeah!)", "Tillsammans vi står (Ooh!)"
   - ENDAST emotionella utrop som kan sjungas (Yeah!, Ooh!, Hey!, Woah!)
   - ALDRIG ljudeffekter eller instruktioner som "(gitarrsolo)", "(fade out)"

3. INNEHÅLL:
   - Blanda corporate buzzwords med inspirerande, emotionellt laddade metaforer
   - Teman: uthållighet, teamwork, att övervinna motgångar, nå toppen
   - Var EXTREMT dramatisk och emotionell. Allt handlar om att kämpa och vinna
   - Använd INTE asterisker (*) eller markdown-formatering
   - Inkludera upprepade hooks/fraser som är lätta att sjunga med i
   - Håll det KORT - max 20 rader totalt!

4. TONALITET:
   - Inspirerande och hoppfull (inte aggressiv)
   - Emotionell kraft och passion
   - "Vi gör det tillsammans" mentalitet
   - 80-tals power ballad-känsla: episk, dramatisk, anthemisk

Generera BARA texten. Inget annat snack.`;
```

Update crowd section (line 35):
```typescript
"\n\nTitta på bilden av publiken. VIKTIGT: Nämn publiken DIREKT i introt eller första versen (inte i slutet!). Beskriv något specifikt du ser: antal personer, kläder, energi, eller något unikt. Inkorporera dem som 'heroes' eller 'warriors' i narrativet."
```

**4.2 Image Transform Prompt (Gemini)**
Update `/src/lib/gemini.ts` `generateGTAImage` function (lines 66-82):
```typescript
export async function generateGTAImage(imageBase64: string): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-3-pro-image-preview" });

  const prompt = `[Composition & Zoom - Highest Priority]
Re-imagine this group photo as an iconic 1980s power ballad album cover in the style of Europe, Survivor, or Bonnie Tyler albums. Create a tightly composed, heroic group portrait with dramatic arena lighting that completely fills the frame.

[80s Arena Rock Vibe & Attire]
Transform the group into heroic rock legends:

Poses & Attitude: Epic heroic stances - crossed arms with confidence, fists raised triumphantly, powerful forward-leaning poses. Expressions must convey determination, passion, and inspirational intensity (think "Eye of the Tiger" energy). No smiling - serious, dramatic, ready-to-conquer expressions.

Clothing: Authentic 80s rock attire - leather jackets worn open, ripped denim jeans, band t-shirts, denim vests with patches, headbands (NOT covering faces), wristbands and studded accessories.

Hair: Big, dramatic 80s hair - teased, feathered, permed, or flowing. Volume is essential. Mullets, big bangs, or windswept manes. Hair must be recognizable but enhanced with 80s styling.

Accessories: Minimal jewelry - maybe one simple chain or wristbands. Focus on the heroic, aspirational aesthetic rather than wealth display.

[Identity Preservation Constraint]
Despite dramatic styling and 80s transformation, individual facial features and hair colors MUST remain distinctly recognizable. CRITICAL: NO sunglasses covering eyes, NO bandanas covering faces, NO stage fog obscuring faces.

[Art Style & Setting]
Background: Arena concert stage with dramatic lighting - spotlights, purple/blue/gold light beams, slight smoke/haze for atmosphere, silhouettes of crowd with raised hands.

Lighting: Dramatic theatrical lighting from below and behind (rim lighting), creating silhouettes and highlights. Golden hour warmth mixed with electric stage lighting (magenta, blue, gold).

Art Style: Airbrushed, slightly stylized realism typical of 1980s album covers. Soft glow around subjects, dramatic contrast, slightly dreamlike quality.

Color Palette: Rich, saturated colors - deep blacks, electric blues, hot magentas, golden highlights. High contrast with dramatic shadows and bright highlights.

Text/Logo: NO text or band logos in the image.`;

  // Rest of function unchanged...
}
```

**4.3 Music Style (Suno)**
Update `/src/lib/suno.ts` (line 61):
```typescript
style: "80s power ballad, arena rock, anthemic chorus, inspirational, emotional powerful male vocals, soaring guitar solos, synthesizer layers, dramatic drums, stadium rock, swedish vocals, europe style, survivor style, epic",
```

Update title (line 45):
```typescript
title: string = "Arena Anthem"
```

---

### Phase 5: Layout Restructure - Split Screen (1 hour)

**5.1 Update PERFORMANCE State Layout**
Update `/src/app/page.tsx` PERFORMANCE state (lines 383-444):

Replace entire PERFORMANCE state with:
```tsx
{/* PERFORMANCE STATE */}
{appState === "PERFORMANCE" && (
  <motion.div
    key="performance"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    className="relative min-h-screen"
  >
    {/* Download buttons - fixed top left */}
    <div className="fixed top-4 left-4 z-[100] flex gap-2">
      {gtaImage && (
        <button
          onClick={() => downloadBase64(gtaImage, `CORPORATE_HEROES_${Date.now()}.jpg`)}
          className="p-2 rounded-full bg-black/50 backdrop-blur-sm border border-zinc-800 hover:border-[#FFD700] hover:bg-black/70 transition-all group"
          title="Download image"
        >
          <ImageIcon className="w-5 h-5 text-zinc-500 group-hover:text-[#FFD700] transition-colors" />
        </button>
      )}
      {audioUrl && (
        <button
          onClick={() => downloadUrl(audioUrl, `CORPORATE_HEROES_${Date.now()}.mp3`)}
          className="p-2 rounded-full bg-black/50 backdrop-blur-sm border border-zinc-800 hover:border-[#FFD700] hover:bg-black/70 transition-all group"
          title="Download song"
        >
          <Music className="w-5 h-5 text-zinc-500 group-hover:text-[#FFD700] transition-colors" />
        </button>
      )}
    </div>

    {/* Split Screen Layout */}
    <div className="relative min-h-screen flex flex-col lg:flex-row">
      {/* LEFT SIDE - Album Cover Photo */}
      <div className="lg:w-1/2 h-[40vh] lg:h-screen relative overflow-hidden">
        {gtaImage && (
          <>
            <div
              className="absolute inset-0 bg-cover bg-center"
              style={{ backgroundImage: `url(${gtaImage})` }}
            />
            {/* Spotlight gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent via-black/20 to-black/50" />
            {/* 80s style border glow */}
            <div className="absolute inset-0 shadow-[inset_0_0_100px_rgba(255,215,0,0.2)]" />
          </>
        )}
      </div>

      {/* RIGHT SIDE - Lyrics Panel */}
      <div className="lg:w-1/2 h-[60vh] lg:h-screen bg-gradient-to-br from-black via-zinc-900 to-black border-t lg:border-t-0 lg:border-l border-[#FF1F8E]/30">
        <KaraokeDisplay
          lyrics={lyrics}
          isPlaying={isPlaying}
          buzzwords={buzzwords}
        />
      </div>
    </div>

    {/* Player - Fixed bottom */}
    <div className="fixed bottom-0 left-0 right-0 z-50">
      <StemPlayer
        audioUrl={audioUrl}
        onPlayStateChange={setIsPlaying}
      />
    </div>
  </motion.div>
)}
```

**5.2 Responsive Behavior**
- Desktop (lg+): Side-by-side 50/50 split
- Mobile/Tablet: Stacked vertically (photo top 40%, lyrics bottom 60%)

---

### Phase 6: Visual Polish & 80s Effects (1.5 hours)

**6.1 Update WordCloud Colors**
Update `/src/components/WordCloud.tsx` (lines 12-19):
```typescript
const COLORS = [
  "text-[#FF6BB5]",      // Hot Pink
  "text-[#00D4FF]",      // Electric Blue
  "text-[#FFD700]",      // Neon Gold
  "text-[#FF1F8E]",      // Electric Magenta
  "text-[#FF6B35]",      // Sunset Orange
  "text-[#C20A6F]",      // Deep Magenta
];
```

**6.2 Invoke frontend-design Skill for Enhanced Components**

Create three polished 80s components using the skill:

**A. Hero Header Component** (for LOBBY state)
Invoke skill: "Create an 80s power ballad band header for 'The Corporate Heroes' with metallic chrome text effect, subtle animated star field background, and neon glow. Should feel like an 80s arena concert."

**B. Album Frame Component** (for PERFORMANCE photo)
Invoke skill: "Design a subtle 80s album cover frame with beveled metallic corners and inner glow effect. Should complement the photo without overwhelming it."

**C. Enhanced Button Component** (replace current buttons)
Invoke skill: "Create production-grade 80s UI buttons with beveled shadows, neon magenta/gold glow on hover, and subtle geometric patterns."

**6.3 Add 80s Visual Effects**

Create `/src/styles/80s-effects.css`:
```css
/* Chrome/Metallic Text */
.chrome-text {
  background: linear-gradient(180deg, #FFD700 0%, #FF6BB5 50%, #00D4FF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0 0 10px rgba(255, 215, 0, 0.5));
}

/* Neon Glow */
.neon-glow-magenta {
  box-shadow: 0 0 20px rgba(255, 31, 142, 0.6),
              0 0 40px rgba(255, 31, 142, 0.4),
              0 0 60px rgba(255, 31, 142, 0.2);
}

.neon-glow-gold {
  box-shadow: 0 0 20px rgba(255, 215, 0, 0.6),
              0 0 40px rgba(255, 215, 0, 0.4),
              0 0 60px rgba(255, 215, 0, 0.2);
}

/* Beveled Button */
.bevel-button {
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.2),
              inset 0 -1px 0 rgba(0, 0, 0, 0.5),
              0 4px 8px rgba(0, 0, 0, 0.3);
}

/* Grid Background */
.retro-grid {
  background-image:
    linear-gradient(rgba(255, 31, 142, 0.2) 1px, transparent 1px),
    linear-gradient(90deg, rgba(255, 31, 142, 0.2) 1px, transparent 1px);
  background-size: 50px 50px;
  background-position: center center;
}

/* Spotlight */
.spotlight-overlay {
  background: radial-gradient(circle at 50% 50%,
    rgba(255, 215, 0, 0.3) 0%,
    rgba(255, 31, 142, 0.1) 40%,
    transparent 70%);
}
```

Import in `/src/app/globals.css`:
```css
@import "tailwindcss";
@import "tw-animate-css";
@import "../styles/80s-effects.css";
```

**6.4 Apply Effects to Key Components**

- Add `.chrome-text` to "The Corporate Heroes" header
- Add `.neon-glow-magenta` to primary buttons
- Add `.spotlight-overlay` to ImageReveal background
- Add `.bevel-button` to all action buttons

---

### Phase 7: README & Documentation (15 min)

**7.1 Update README.md**
Replace entire content with:
```markdown
# The Corporate Heroes - Arena Rock Experience

Transform corporate buzzwords into epic 80s power ballad anthems. A live presentation experience with AI-generated music and dramatic album cover visuals.

## What It Does

1. **LOBBY** - Audience submits buzzwords via QR code
2. **CAPTURE** - Take photo of the crowd (with 3-2-1 countdown)
3. **LOADING** - AI generates power ballad lyrics analyzing the crowd
4. **IMAGE_REVEAL** - Shows 80s album cover transformation while music generates
5. **PERFORMANCE** - Plays the anthem with scrolling lyrics (buzzwords highlighted)

## Tech Stack

- **Next.js 16** - React framework
- **Gemini 3 Pro** - Lyrics generation with crowd analysis
- **Gemini 3 Pro Image** - 80s album cover transformation
- **Suno V5** - AI music generation (arena rock style)
- **Framer Motion** - Animations
- **Tailwind CSS** - 80s-inspired styling

## Theme

**Music Style:** 80s Power Ballad / Arena Rock (Europe, Survivor, Bonnie Tyler)
**Visual Style:** Dramatic album covers with heroic poses and stage lighting
**Energy:** Inspirational, anthemic, emotionally powerful

## Setup

### Environment Variables

Create `.env.local`:

```bash
GEMINI_API_KEY=your_gemini_api_key
SUNO_API_KEY=your_suno_api_key
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

### Installation

```bash
npm install
npm run dev
```

Open http://localhost:3000

### Join Page

Audience goes to `/join` (via QR code) to submit buzzwords.

## Deployment

Deploys automatically to Vercel on push to main.
```

---

## Critical Files Modified

### Core Functionality
1. `/src/lib/gemini.ts` (lines 6-82) - Lyrics & image prompts
2. `/src/lib/suno.ts` (lines 45, 61) - Music style
3. `/src/app/page.tsx` (lines 86, 239-240, 383-444) - Text & layout
4. `/src/components/HackerTerminal.tsx` (lines 19-30, 71) - Loading messages

### Visual Styling
5. `/src/app/globals.css` (lines 91-115) - Color system
6. `/src/components/KaraokeDisplay.tsx` (line 53, 99, 80) - Colors
7. `/src/components/ImageReveal.tsx` (lines 47, 60, 66, 87) - Text & colors
8. `/src/components/WordCloud.tsx` (lines 12-19) - Color palette

### New Files
9. `/src/lib/theme.ts` - Centralized color constants
10. `/src/styles/80s-effects.css` - Visual effects

### Documentation
11. `/README.md` - Complete rewrite
12. `/package.json` - Name change
13. `/src/app/layout.tsx` - Metadata

---

## Verification Steps

### Functional Testing
1. **End-to-End Flow:**
   - Visit `/` → see "The Corporate Heroes" header with new colors
   - Scan QR → submit buzzwords at `/join`
   - Click "LOCK IN & SNAPSHOT" → camera countdown works
   - Capture photo → loading screen shows 80s messages
   - IMAGE_REVEAL → shows transformed 80s album cover
   - PERFORMANCE → split screen (photo left, lyrics right), music plays

2. **Content Verification:**
   - Search codebase for "MC KPI" → should find ZERO results
   - Search for "gangsta" or "GTA" → should find ZERO results
   - Lyrics should be inspirational power ballad (not rap)
   - Music should be arena rock (not gangsta rap)
   - Image should show 80s rock band aesthetic (not GTA)

3. **Visual Verification:**
   - All violet colors replaced with magenta/pink
   - All cyan colors replaced with electric blue/gold
   - Buttons have 80s aesthetic (beveled, neon glow)
   - Background has warm spotlight effects
   - Text has dramatic styling

### Edge Cases
- No buzzwords entered → proper error message
- Image generation fails → fallback to original photo
- Music generation timeout → appropriate error state
- Mobile layout → stacked vertically (photo top, lyrics bottom)

### Performance
- App loads in < 3s
- State transitions smooth
- Audio playback starts immediately when ready
- No layout shift during transitions

---

## Estimated Timeline

- **Phase 1:** Repository Setup - 15 min
- **Phase 2:** Color System - 30 min
- **Phase 3:** Text Updates - 20 min
- **Phase 4:** AI Prompts - 45 min
- **Phase 5:** Layout Restructure - 1 hour
- **Phase 6:** Visual Polish - 1.5 hours
- **Phase 7:** Documentation - 15 min

**Total:** ~4 hours for full implementation with polish

---

## Notes

- Keep the gangsta version in separate repo for future events
- This version maintains all functionality, only transforms theme/aesthetic
- Split-screen layout showcases both photo and lyrics equally
- 80s color palette provides high contrast on dark background
- Gemini prompts are specific enough to maintain consistency
- Suno style tags reference specific artists for better results
