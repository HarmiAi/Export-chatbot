# Gemini AI Chatbot

A premium dark-themed AI chatbot built with React 18, Vite, and Google's Gemini API. Chat opens immediately on launch — no landing page.

## Features

- Real-time streaming responses from **Gemini 2.5 Flash**
- Markdown & syntax-highlighted code blocks
- Copy, regenerate, and stop generation
- Chat history in `localStorage` (restored on refresh)
- Export chat as TXT or JSON
- New chat & clear chat
- Responsive desktop and mobile layout
- Glassmorphism UI with smooth animations

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- A [Google AI Studio](https://aistudio.google.com/apikey) API key

## Installation

1. **Clone or open the project**

   ```bash
   cd gemini-chatbot
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure environment variables**

   Copy the example env file and add your API key:

   ```bash
   cp .env.example .env
   ```

   Edit `.env`:

   ```env
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   ```

4. **Start the development server**

   ```bash
   npm run dev
   ```

5. Open the URL shown in the terminal (usually `http://localhost:5173`). The chatbot UI loads immediately.

## Scripts

| Command           | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Start development server |
| `npm run build`   | Production build         |
| `npm run preview` | Preview production build |

## Project structure

```
src/
├── components/
│   ├── ChatWindow.jsx
│   ├── Message.jsx
│   ├── MessageInput.jsx
│   ├── Sidebar.jsx
│   └── TypingIndicator.jsx
├── services/
│   └── geminiService.js
├── hooks/
│   └── useChat.js
├── styles/
│   ├── App.css
│   ├── Chat.css
│   └── Responsive.css
├── App.jsx
└── main.jsx
```

## Security

- Never commit `.env` — it is listed in `.gitignore`
- The API key is only read via `import.meta.env.VITE_GEMINI_API_KEY`
- Keys are sent to Google's API from the browser; for production, consider a backend proxy

## Tech stack

- React 18 + Vite
- Pure CSS (no Tailwind)
- Axios (REST client & error handling)
- Fetch (SSE streaming for real-time tokens)
- react-markdown + remark-gfm + react-syntax-highlighter

## License

MIT
