# MediAssist AI — Smart Healthcare Information & Patient Assistant

A modern, responsive, privacy-first healthcare education and patient-preparedness web application designed to help individuals prepare for doctor visits, organize health symptoms, plan consultation questions, explore safe medication knowledge, and learn general health literacy.

MediAssist AI includes a **secure Node.js + Express backend** powered by Google Gemini AI, featuring server-side secret management, input validation, zero-latency emergency guardrails, and client-side privacy.

---

## 🌟 Key Features

1. **AI Health Assistant (Live Gemini AI + Offline Knowledge Base)**
   - Conversational assistant answering general health, test-preparation, and medical terminology questions.
   - Connected to genuine AI via secure Node.js backend proxy using official Google Gen AI SDK (`@google/genai`).
   - Server-side pre-screening for emergency red flags (e.g. chest pain, stroke signs, breathing distress) with immediate hotline alerts (911 / 112 / 999).
   - Strict non-diagnostic clinical system prompt enforcing safe educational guidance without medical claims.
   - Built-in "Copy Notes", "Clear Conversation", and suggested question chips.
   - **Honest Connection Indicator**: Automatically detects whether an API key is configured. Never makes false connection claims.

2. **Symptom Organizer (Doctor's Visit Prep)**
   - Record symptoms, body location, onset duration, severity slider (1–10 with dynamic visual cues: Mild, Moderate, Severe, Urgent), and contextual triggers.
   - Generates an instant **Doctor's Communication Sheet** with structured clinical bullet points.
   - One-click copy-to-clipboard for quick sharing.

3. **Healthcare Appointment Planner**
   - Plan upcoming doctor consultations: Physician name, clinic, specialty, date/time, and chief visit purpose.
   - **Smart Question Builder**: Pre-loaded recommended questions for doctors (General, Medication, Lifestyle) + custom question input.
   - Pre-appointment checklist ("What to bring": Photo ID, Insurance card, Previous test results, Medication bottles).

4. **Medicine Information Guide & Daily Dose Tracker**
   - Searchable reference library of common essential medicines (Paracetamol, Ibuprofen, Amoxicillin, Cetirizine, Metformin, Omeprazole).
   - Detailed monographs: Drug class, mechanism of action, food & alcohol interactions, storage conditions, and specific questions to ask your pharmacist.
   - Category filtering (Pain & Fever, Antibiotics, Allergy, Blood Sugar, GI Health).
   - **Personal Medication Schedule Tracker**: Add your daily prescriptions, track scheduled times, and check off doses taken today.

5. **Unified Health Summary (Printable Clinical Dossier)**
   - Combines patient name/notes, active symptoms, scheduled appointments, prepared questions, and current medications into an organized 4-quadrant summary.
   - **One-Click Print / Save as PDF**: Uses specialized CSS `@media print` styling to produce a clean, doctor-ready physical handout or PDF (hiding all navigation, buttons, and website chrome).
   - **Clear Stored Data**: Complete privacy control with one-click browser data wiping.

---

## 🔒 Safety, Privacy & Ethical Compliance

- **No Medical Diagnosis**: The application strictly refuses to provide definitive diagnoses or treatment prescriptions. It is designed as an educational tool and doctor-communication aid.
- **Client-Side Privacy**: 100% of user data (symptoms, appointments, medications) is stored exclusively in the browser's `localStorage`.
- **Zero Health Data Storage on Server**: The backend does NOT store, log, or persist user health queries to any database or disk files.
- **Protected API Credentials**: AI provider API keys are loaded exclusively on the server using environment variables (`.env`) and are **never exposed to the browser**.
- **Emergency Warnings**: Persistent red emergency banner with quick-access hotline numbers (911, 112, 988) and warning signs for life-threatening emergencies.
- **Honest Connection Status**: If credentials are missing, the server and UI explicitly state that the AI key is not configured and fall back to the built-in educational knowledge base.

---

## 📂 Project Structure

```
MediAssist-AI/
├── index.html            # Main semantic HTML structure & modals
├── css/
│   └── styles.css        # Responsive design system (Teal & Blue healthcare theme, @media print)
├── js/
│   ├── data.js           # Medical reference data, emergency red flags & educational knowledge base
│   └── app.js            # Interactive application logic & localStorage state management
├── server/
│   └── server.js         # Secure Node.js & Express backend (serves frontend + API proxy)
├── package.json          # Node.js dependencies, metadata, and startup scripts
├── .env.example          # Template for backend environment variables
├── .gitignore            # Prevents .env and node_modules from being committed
└── README.md             # Project documentation & beginner walkthrough
```

---

## 🚀 Beginner-Friendly Windows Quick Start Guide

Follow these simple steps to run the complete MediAssist AI website and backend on your Windows PC.

### Prerequisites

- **Node.js** installed on Windows. (If you don't have it, download the LTS version from [nodejs.org](https://nodejs.org/)).
- **Google Gemini API Key** (Free tier available). You can get a free key in 1 minute from [Google AI Studio](https://aistudio.google.com/app/apikey).

---

### Step 1: Open Your Terminal in the Project Directory

1. Open **File Explorer** and go to your `MediAssist-AI` folder.
2. Click on the folder address bar at the top, type `powershell` (or `cmd`), and press **Enter**.
3. Alternatively, open Windows PowerShell and navigate to the directory:
   ```powershell
   cd C:\Users\YourUsername\Downloads\MediAssist-AI
   ```

---

### Step 2: Install Node.js Dependencies

Run the following command to install the required backend packages (`express`, `dotenv`, `cors`, `@google/genai`):

```powershell
npm install
```

*(This will create a `node_modules` folder in your project directory.)*

---

### Step 3: Set Up Your Environment File (`.env`)

1. Copy the example configuration template to create your `.env` file:
   - **In PowerShell:**
     ```powershell
     Copy-Item .env.example .env
     ```
   - **In Command Prompt (`cmd`):**
     ```cmd
     copy .env.example .env
     ```
2. Open the newly created `.env` file in Notepad or VS Code:
   ```powershell
   notepad .env
   ```
3. Add your preferred AI API key:
   - **For NVIDIA API (NVIDIA NIM):**
     ```env
     PORT=3000
     NVIDIA_API_KEY=nvapi-...your_nvidia_key_here...
     NVIDIA_MODEL=meta/llama-3.3-70b-instruct
     ```
   - **For Google Gemini:**
     ```env
     PORT=3000
     GEMINI_API_KEY=AIzaSy...your_gemini_key_here...
     GEMINI_MODEL=gemini-2.5-flash
     ```
4. Save and close the file (**Ctrl + S** in Notepad).

> 💡 **Note**: If you do not have an API key right now, you can still run the website! The app will honestly notify you that the AI key is not configured and will seamlessly use its comprehensive built-in medical education knowledge base.

---

### Step 4: Start the Server

Run the start command:

```powershell
npm start
```

You will see:
```
====================================================
 MediAssist AI Server is running!
 Web Application: http://localhost:3000
 API Status:      http://localhost:3000/api/status
 AI Provider:     Google Gemini (gemini-2.5-flash)
====================================================
```

*(For development with auto-reloading when editing server files, you can run `npm run dev`.)*

---

### Step 5: Open the Application in Your Browser

Open your favorite web browser (Google Chrome, Microsoft Edge, Brave, or Firefox) and navigate to:

```
http://localhost:3000
```

Both the **frontend website** and the **secure backend API** run together on port `3000`!

---

## 🛠️ API Endpoints Reference

| Endpoint | Method | Description |
|---|---|---|
| `GET /api/status` | `GET` | Returns server health and honest AI configuration status (`configured: true/false`, provider, model). |
| `POST /api/chat` | `POST` | Accepts `{ "message": "Your question" }`. Validates input, screens for emergencies, and returns AI educational response. |
| `GET /` | `GET` | Serves `index.html` and static assets (`css/`, `js/`). |

### Example Chat Request:
```bash
curl -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d "{\"message\": \"What are key questions to ask my doctor about blood pressure?\"}"
```

---

## ❓ Windows Troubleshooting & FAQ

#### 1. "Error: listen EADDRINUSE: address already in use :::3000"
- **Cause**: Another program (or a previous Node.js instance) is already using port 3000.
- **Solution A**: Open `.env` and change the port number to `PORT=3001`, then run `npm start` and visit `http://localhost:3001`.
- **Solution B**: To close the existing process in PowerShell, run:
  ```powershell
  Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
  ```

#### 2. "Windows Defender Firewall has blocked some features"
- **Solution**: Click **"Allow access"** for Private networks so Windows allows your browser to communicate with your local server.

#### 3. "npm : The term 'npm' is not recognized"
- **Cause**: Node.js is not yet added to your Windows PATH environment variable.
- **Solution**: Restart your terminal window after installing Node.js, or reinstall Node.js and check the box "Add to PATH".

#### 4. Can I still open `index.html` directly without running Node.js?
- **Yes!** If you double-click `index.html` or open it with another server (such as Python's `http.server`), the application detects that the backend is offline and gracefully switches to the local educational knowledge base without throwing breaking errors.

---

## 📄 License & Ethical Medical Disclaimer

**IMPORTANT DISCLAIMER:** MediAssist AI is an educational healthcare information and patient preparedness tool. It is **NOT** a medical device, does **NOT** provide medical diagnoses, and does **NOT** recommend medication prescriptions or dosages. It is intended solely for general health literacy and doctor consultation preparation. Always seek the advice of a licensed physician or other qualified healthcare provider with any questions regarding a medical condition.
