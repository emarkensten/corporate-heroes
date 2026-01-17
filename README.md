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
