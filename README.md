# WORLDCRAFT

> **“Capture the world. Create your own.”**

WORLDCRAFT is a creative web application built for the **Hacktoberfest 2026 Challenge**. Users capture or upload photographs of real-world objects—such as flowers, trees, rocks, birds, and buildings—and arrange those elements on an interactive, retro 2D canvas to compose their own living world.

---

## 🎨 Retro Hacktoberfest Design System

Inspired by the Hacktoberfest 2026 arcade visual language:
- **Deep Teal (`#304C48`) & Forest Teal (`#3D5E59`)**: Atmospheric arcade framing
- **Retro Cream (`#E8E8DA` / `#FAF9F0`)**: Spacious panels and high-contrast world canvas
- **Arcade Yellow (`#F5BD2D`)**: Primary actions, retro badges, and canvas transform handles
- **Pixel Coral (`#E98083`)**: Accents, deletion indicators, and status pulses
- **Pixel Blue (`#8BB4DE`)**: Export actions and AI classification badges
- **Dark Outline (`#171D1B`)**: Bold 2px/3px outlines with classic 8-bit offset hard shadows (`box-shadow: 3px 3px 0px #171D1B`)

---

## 🌟 Key Features

1. **Interactive 2D World Canvas (React-Konva)**
   - Drag, place, scale, rotate, and layer elements freely.
   - Aspect-ratio locked resize handles and rotation anchor.
   - Layer-depth ordering (*Bring to Front*, *Bring Forward*, *Send Backward*, *Send to Back*).
   - Independent canvas deletion (removing an element from the canvas preserves the inventory).

2. **Photo Ingestion & In-App Live Camera**
   - Drag-and-drop file upload zone supporting `PNG`, `JPG`, and `WebP`.
   - In-app live camera capture modal using `getUserMedia` with mobile rear-facing camera prioritization (`facingMode: { ideal: "environment" }`).
   - Strict media-track cleanup upon closing or snapping photos.

3. **Client-Side Open-Source AI Vision (Transformers.js)**
   - Open-source **MobileNet-v1** running entirely in the browser via `@xenova/transformers` (Apache-2.0 License).
   - Non-blocking asynchronous classification displaying genuine softmax confidence scores.
   - Offline and failure resilience with filename fallbacks and inline manual renaming (✏️).

4. **Multi-Instance Safe Memory & Persistence**
   - **IndexedDB Storage**: Binary image blobs persisted via `idb-keyval` to bypass `localStorage` limits.
   - **Reference-Counted Object URLs**: Safely share image sources across multiple canvas instances without broken links upon inventory deletions.
   - **Debounced Auto-Save**: Auto-persists inventory and canvas layouts to survive page reloads.

5. **High-Resolution PNG Canvas Export**
   - One-click export downloading a crisp 2x pixel ratio snapshot (`worldcraft-[timestamp].png`) excluding transformer handles.

6. **Mobile-First Responsive Layout**
   - 0 horizontal overflow across small phones (320px), standard phones (375px), tablets (768px), and desktops.
   - Single-column canvas-first layout on mobile devices.
   - Minimum 44px touch targets on all interactive controls.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or newer)
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/Nobody-377/worldcraft.git

# Navigate to project directory
cd worldcraft

# Install dependencies
npm install

# Start the local development server
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🛠️ Tech Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router, Turbopack)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Canvas Engine:** [Konva](https://konvajs.org/) & [react-konva](https://github.com/konvajs/react-konva)
- **Local Storage:** [idb-keyval](https://github.com/jakearchibald/idb-keyval) (IndexedDB)
- **AI Vision:** [@xenova/transformers](https://huggingface.co/docs/transformers.js) (MobileNet-v1 ONNX Quantized, Apache-2.0)

---

## 📄 License

MIT License. Open-source models and libraries licensed under Apache-2.0.
