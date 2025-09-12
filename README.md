# 🕹 Valorant Esports Statistics Platform

A modern web application that displays professional **Valorant** esports match data, tournaments, and team statistics. Originally built using **React + Vite**, the project has now migrated to **Next.js** to leverage features like server-side rendering and API routes for better scalability and performance.

> 🎯 Now powered by **Next.js 13+ App Router**, with planned support for **web scraping** to enhance data coverage and reliability.

---

## 💡 Features

- 🔥 **Live Match Tracking**  
  Shows upcoming and recent Valorant matches with match metadata and countdowns.

- 🧠 **AI Stat Assistant**  
  Integrates the **OpenAI API** for natural language queries about players and matches.

- ⚛️ **Responsive Interface with Tailwind CSS**  
  Optimized for all devices with a clean, esports-style design.

- 🧾 **Web Scraping Support (Planned)**  
  Will use tools like **Cheerio** or **Puppeteer** to extract additional data directly from esports sites.

- ☁️ **Cloud Ready with AWS (Planned)**  
  Deployment to **AWS Amplify** or **S3 + CloudFront** is planned for production.

---

## 🧰 Tech Stack

- **Frontend:** Next.js (App Router), Tailwind CSS
- **Auth & DB:** Supabase (PostgreSQL)
- **AI Integration:** OpenAI API (ChatGPT)
- **Data Layer:** Web scraping (planned), Public Esports APIs
- **Cloud Hosting:** AWS (Amplify, S3, CloudFront, Lambda)
- **Dev Tools:** ESLint, Prettier, GitHub

---

## 🚀 Getting Started

```bash
git clone https://github.com/your-username/valorant-esports-app.git
cd valorant-esports-app
npm install
npm run dev
```

---

## 🛠 Migration Notes

This project was migrated from a **React + Vite** SPA to a **Next.js App Router** architecture to:

- Improve performance using server-side rendering (SSR)
- Simplify backend proxying with built-in API routes
- Prepare for server-side data scraping and AI responses
