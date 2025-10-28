# Voice Assistant Template

This is a simple, minimal-dependency template for building a fully functional voice assistant. It's designed to be extremely fast to modify, making it perfect for hackathons.

---

### Why This Template?

Finding a good chatbot UI is harder than it looks. Most open-source templates are either split into dozens of files (Component Forests), making it impossible to quickly find and change what you want, or require a complex build process just to get started (Docker-Dependent).

This template solves that. It's a Next.js app where the entire UI is in one file (`page.tsx`). If you want to add a button, change the layout, or modify the API calls, you can do it in seconds without hunting through a complex file structure.

---

### Features

-   Fully functional voice-to-text (listens to you).
-   Fully functional text-to-voice (responds in a natural voice).
-   Real-time interrupt handling (it stops speaking if you interrupt, just like a real assistant).
-   Entire UI is in `page.tsx` for fast hackathon development.
-   Backend logic is cleanly separated into Next.js API routes.

---

### Installation and Setup

1.  Clone the repository:
    ```bash
    git clone https://github.com/ilvoirr/voice-assistant-template.git
    ```

2.  Navigate into the directory:
    ```bash
    cd voice-assistant-template
    ```

3.  Install all required packages:
    ```bash
    npm install
    ```

4.  Set up your API keys:
    Create a new file named `.env.local` in the main project folder and add your keys for the services used:
    ```
    GROQ_API_KEY=your_groq_api_key_goes_here
    DEEPGRAM_API_KEY=your_deepgram_api_key_goes_here
    ```

---

### Running the Project

1.  Run the development server:
    ```bash
    npm run dev
    ```

2.  Open your browser and go to:
    [http://localhost:3000](http://localhost:3000)

The voice assistant is now running locally.

---

### How to Modify

This template is built for speed:

-   To change the UI (layout, buttons, colors), edit the `page.tsx` file.

-   To change the backend logic, edit the files in the `app/api/` directory. You will find separate API routes for the chat logic, the voice-to-text (STT) logic, and the text-to-voice (TTS) logic.