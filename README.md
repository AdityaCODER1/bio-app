# BioStudio — NCERT Biology Line-by-Line Study App

A macOS dark-themed desktop study workspace (`Vite + React + TypeScript + Vanilla CSS`) built for deep, verbatim, line-by-line mastery of NCERT Biology chapters with Gemini AI tutoring and NEET MCQ generation.

## Pre-Generated Chapters Included

| Chapter | Title | Source PDF | Lines | Diagrams | Vault Items |
| --- | --- | --- | ---: | ---: | ---: |
| Chapter 8 | Cell: The Unit of Life (+ Unit 3 & G.N. Ramachandran) | `b11cell.pdf` | 332 | 14 | 42 |
| Chapter 9 | Biomolecules (+ Tables 9.1–9.5 & Reactions) | `b11biomol.pdf` | 321 | 6 | 29 |
| Chapter 10 | Cell Cycle and Cell Division (+ Inquiry Boxes) | `b11celldiv.pdf` | 206 | 5 | 23 |

See `src/data/chapters/inventory.json` for SHA-256 checksums and `MANUAL.md` for adding new NCERT chapters via Antigravity.

## Quick Start

```bash
git pull
npm install
npm run dev
```

Open the local URL printed by Vite (default `http://localhost:5173`).

### Configure Gemini API Key
1. Click the **Settings (⚙)** icon in the top-right toolbar (or press `⌘,`).
2. Paste your Google AI Studio Gemini API key and click **Save** (or set `GEMINI_API_KEY=...` in `.env.local`).
3. Choose between `gemini-3.1-flash-lite`, `gemini-3.5-flash-lite`, `gemini-3.5-flash`, `gemini-3.8-flash`, `gemini-4-hydrogen`, or any custom Gemini model ID.

Your API key (`user-data/local-config.json`) and all personal study progress (`user-data/study-state.json`) automatically sync to disk locally (and mirror to browser `IndexedDB`) while remaining gitignored for safety.

## Key Features & Shortcuts

- **Verbatim Line-by-Line Reader**: Navigate sentences with `J` / `K` (or `↑` / `↓`), mark **Mastered (`M`)**, flag for **Revision (`R`)**, toggle **Active Recall Cloze Mode (`C`)**, jump to **NEET MCQ Lab (`Q`)**, or **Peek Original NCERT PDF Page (`P`)**.
- **Custom Lines & Tagged Notes**: Insert custom lines (supports `{{cloze}}` syntax) and tagged notes (`#PYQ`, `#Trap`, `#Exception`, `#Mnemonic`, `#Concept`) directly beneath any NCERT sentence; edit, revise, or delete anytime.
- **Revise Until Mastered Queue**: Focused tab gathering all flagged lines, custom lines, tagged notes, Gemini pins, and saved MCQs until you graduate every item to Mastered.
- **Cropped Diagrams + Side-by-Side Breakdown**: High-DPI NCERT figures shown both inline and in the **Diagrams** tab with categorized Labels, NCERT Facts, Exam Inferences, zoom lightbox, and custom diagram points.
- **Editable End-of-Chapter Vault**: Categorized master reference (*Scientists & Years*, *Numbers & Dimensions*, *Examples & Exceptions*, *Equations, Pathways & Tables*, and *NCERT Word Traps*) with full Add/Edit/Delete and Active Recall blur.
- **Spotlight Search (`⌘K`)**: Instant search across every verbatim line, diagram breakdown, and vault entry.

## Scripts

```bash
npm run dev                # Start desktop studio with local disk JSON sync
npm run validate:chapters  # Validate chapter data, diagram crops, PDF pages & inventory.json
npm run test               # Run Vitest unit & middleware tests
npm run build              # Typecheck & build production bundle
```