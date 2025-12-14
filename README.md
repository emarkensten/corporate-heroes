# MC KPI - The Corporate Rapper

En live-demo som omvandlar publikens buzzwords till en gangster rap-låt med AI-genererad musik och GTA-stiliserad bild.

## Vad det gör

1. **LOBBY** - Publik skickar in buzzwords via QR-kod
2. **CAPTURE** - Tar foto på publiken (med 3-2-1 countdown)
3. **LOADING** - AI genererar lyrics baserat på buzzwords + analyserar publiken i bilden
4. **IMAGE_REVEAL** - Visar GTA-stiliserad bild medan musik genereras
5. **PERFORMANCE** - Spelar upp låten med lyrics (buzzwords highlightade)

## Tech Stack

- **Next.js 16** - React framework
- **Gemini 3 Pro** - Lyrics-generering (multimodal med bildanalys)
- **Gemini 3 Pro Image** - GTA-stiliserad bildgenerering
- **Suno V5** - AI-musikgenerering
- **Framer Motion** - Animationer
- **Tailwind CSS** - Styling

## Flöde

```
Buzzwords + Foto
       ↓
   Gemini 3 Pro (lyrics + bildanalys i ett anrop)
       ↓
   ┌───────────────┬────────────────┐
   ↓               ↓
Suno V5         Gemini 3 Pro Image
(musik)         (GTA-bild)
   ↓               ↓
   └───────┬───────┘
           ↓
    IMAGE_REVEAL (väntar på musik)
           ↓
      PERFORMANCE
```

## Setup

### Environment Variables

Skapa `.env.local`:

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

Öppna http://localhost:3000

### Join-sidan

Publik går till `/join` (via QR-kod) för att skicka in buzzwords.

## Deployment

Deployas automatiskt till Vercel vid push till main.

## Prompts

### Lyrics (MC KPI)
- Hardcore gangsterrappare (mellanchef)
- Blandar orten-slang med Corporate Swenglish
- Extremt dramatiskt - allt är på liv och död
- Analyserar publiken i bilden och refererar till dem

### Musik (Suno V5)
- 90s west coast gangsta rap
- G-funk, heavy bassline
- Aggressiv svensk manlig röst

### Bild (Gemini)
- GTA V loading screen art style
- High contrast, comic book shading
- Ingen text/logotyper i bilden
