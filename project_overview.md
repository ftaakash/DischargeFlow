# SkillGraph V2 Overview

**SkillGraph V2** is a next-generation AI Career Intelligence Platform and Campus Placement OS. Designed to unify students, recruiters, and university faculty under a single, highly advanced autonomous ecosystem. Currently operating in a robust local development environment, the platform leverages large language models and headless automation to streamline the job hunt, track student placement metrics, and negotiate compensation.

---

## 🛠 Tech Stack Core
* **Frontend Workflow:** Next.js (App Router), React 18, Server Actions
* **Styling & UI:** Tailwind CSS v4, custom theme parameters (`#0A0D14` background), Shadcn/Radix primitive headless UI components
* **AI Cognitive Engine:** Groq SDK utilizing `llama-3.3-70b-versatile` optimized through customized system prompts for deterministic parsing
* **Database & ORM:** Prisma ORM, configured for a scalable SQL database with strict schema modeling mappings for multi-role hierarchies
* **Automation & Extraction:** Playwright (headless browser orchestration), Cheerio (HTML extraction)
* **Background Tasks:** BullMQ (Redis-backed task queue architecture for batching evaluations)
* **Exporting:** `@react-pdf/renderer` for robust resume and artifact downloading

---

## 🚀 Core Features & Capabilities

### 1. OpenClaw Autonomous AI Agent
The flagship feature of the platform, the **OpenClaw** module removes the manual toil of job hunting by acting as a highly personalized AI recruiter.
* **Playwright Auto-Scraper:** Capable of scraping external ATS systems (Greenhouse, Lever, LinkedIn, Unstop) dynamically.
* **10-Dimension Grading Engine:** Evaluates matched job descriptions against the student's profile along 10 distinct parameters (including CTC match, Role-Skill Match, Growth Trajectory, Location Preference, Company Tier) scoring jobs on an absolute scale of `A` to `F`. 
* **Terminal Dashboard UI:** Features a hacker-esque, ultra-modern terminal table format for managing job pipelines, equipped with interactive grade badges and a rigorous "Human-in-the-Loop" Confirm & Apply gate.
* **Story Bank Synthesizer:** Intelligently extracts STAR (Situation, Task, Action, Result) + Reflection stories tailored across 6 themes (Leadership, Conflict, etc) straight from the student's background. 
* **Dynamic Negotiation Scripts:** Leverages AI to programmatically simulate and write 3 contextual salary negotiation scripts (Geofencing constraints, Competing Offers, Skill Premiums) based specifically on the applicant's matching profile.

### 2. Multi-Role Ecosystem
SkillGraph supports multiple bounded contexts, giving discrete users hyper-focused dashboards:

* **Faculty & Placement Cell OS:** Enables university placement coordinators to track and analyze cohort performance, manage student populations, securely provision recruiter accounts, and bulk insert verified legacy placement records (e.g. by uploading `.csv` distributions).
* **Recruiter Portal:** Provides integrated talent acquisition views allowing recruitment professionals to scrape through verified students, generate hiring workflows, and track internal shortlists.
* **Student/Job-Seeker:** Immersed continuously in the OpenClaw evaluation system, a fully-featured interactive Resume Builder, and curated learning roadmaps.

### 3. Market Intelligence Database
* Displays aggregate metrics tailored directly toward geographical bounds (such as Indian Market metrics). 
* Monitors and calculates demand frequencies, analyzing what specific framework or technology is trending among distinct company tiers (e.g., FAANG vs Startups) and what average annual compensation loops match the respective demand.

### 4. Bulletproof Pipeline Integrity
* **Anti-Duplication CRON:** Background API hooks configured to merge status and remove anomalous duplicates of job board entries so students never accidentally double-apply. 
* **Parallel Batch Processing:** Implemented robust queue mechanisms where bulk URL jobs are concurrently evaluated against the `llama` backend without hanging the core UI. 

---

## 🏗 Current State & Deployability
The framework's UI/UX styling remains strongly rooted in an ultra-premium "dark mode" syntax (`bg-[#0A0D14]` coupled with cyan-500 accents and discrete monospace font weights). 

**The platform has transitioned completely out of MVP stage.** It securely encompasses real-time web-scraping bindings and deep AI context management. The next phase transitions into physical production environment deployments (Dockerizing services and connecting Kubernetes infrastructure), or building out specific high-velocity communication endpoints between Recruiters and Students.
