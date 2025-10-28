VOICE ASSISTANT TEMPLATE

This is a simple, minimal-dependency template for building a fully functional voice assistant. It's designed to be extremely fast to modify, making it perfect for hackathons.

WHY THIS TEMPLATE?

Finding a good chatbot UI is harder than it looks. Most open-source templates are either:

Component Forests: Split into dozens of files, making it impossible to quickly find and change what you want.

Docker-Dependent: Require a complex build process just to get started.

This template solves that. It's a Next.js app where the entire UI is in one file (page.tsx).

If you want to add a button, change the layout, or modify the API calls, you can do it in seconds without hunting through a complex file structure.

FEATURES

Fully functional voice-to-text (listens to you).

Fully functional text-to-voice (responds in a natural voice).

Real-time interrupt handling (it stops speaking if you interrupt, just like a real assistant).

Entire UI is in page.tsx for fast hackathon development.

Backend logic is cleanly separated into Next.js API routes.

INSTALLATION AND SETUP

Clone the repository: git clone https://github.com/ilvoirr/voice-assistant-template.git

Navigate into the directory: cd voice-assistant-template

Install all required packages: npm install

Set up your API keys: Create a new file named .env.local in the main project folder.

Open the .env.local file and add your keys for the services used: GROQ_API_KEY=your_groq_api_key_goes_here DEEPGRAM_API_KEY=your_deepgram_api_key_goes_here

RUNNING THE PROJECT

Run the development server: npm run dev

Open your browser and go to: http://localhost:3000

The voice assistant is now running locally.

HOW TO MODIFY

This template is built for speed:

To change the UI (layout, buttons, colors): Edit the page.tsx file.

To change the backend logic: Edit the files in the app/api/ directory. You will find separate API routes for:

The chat logic

The voice-to-text (STT) logic

The text-to-voice (TTS) logic