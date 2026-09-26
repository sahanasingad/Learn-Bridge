# Learn Bridge

A student and mentor learning portal for **Music**, **Public Speaking & Communication** and **Python**.

Students log in, choose an activity, practise in a built-in studio and send their work to a mentor. Mentors accept students, review the work, point out mistakes, send corrected code, voice feedback, notes and media, and assign new tasks. Students see the feedback, improve and track their progress.

## Activities

**Music (4):** Piano, Guitar, Violin, Drum kit
- Playable virtual instruments (mouse, touch or computer keyboard), with note-name or keyboard-shortcut labels, volume and octave
- Record what you play straight from the instrument (no microphone needed), Mark notes and play them together, metronome
- Exercises with 10 questions and a score: read notes on the treble staff, find keys, build major chords, name notes on the fretboard, identify drums by ear, copy drum patterns
- Inspired by the free exercises and instruments on musicca.com; all code, sound and graphics here are original

**Public Speaking & Communication (5):** Self introduction, Presentation skills, Debate, Interview preparation, Pronunciation and accent
- Each activity shows a course paragraph, and each exercise shows the paragraph or topic to speak on
- Automatic timer: a preparation countdown, then recording starts and stops by itself when the speaking time is up
- Audio or video recording; live transcript, words per minute, filler words and reading accuracy in Chrome and Edge

**Python (4):** Variables and data types, Loops and conditions, Object oriented programming, Mini project
- Code editor with line numbers; Run shows the output and errors with the error line highlighted and a tip
- Input box for programs that use input(); a 10-second limit stops infinite loops
- Check my answer runs automatic tests; mentors can run the student's code, see a model solution and send corrected code

## Run it

**Option A: VS Code + Live Server (easiest)**
1. Open this folder in VS Code (File → Open Folder).
2. Install the **Live Server** extension when VS Code suggests it (or search "Live Server" by Ritwick Dey in Extensions).
3. Right-click `index.html` → **Open with Live Server**. The app opens at http://127.0.0.1:5500.

**Option B: terminal**
- With Node.js: `npm start`
- With Python: `python -m http.server 5500`, then open http://localhost:5500

Use a local server rather than double-clicking `index.html`, so the microphone, camera and Python runner work.

**Internet:** needed the first time you press Run in a Python exercise (the browser downloads Python, about 10 MB, from cdn.jsdelivr.net) and for the fonts. Music and speaking work offline. Use Chrome or Edge for the live speech transcript.

## Project structure

```
learn-bridge/
├── index.html               Page shell
├── css/styles.css           All styles (light and dark mode, responsive)
├── js/core.js               Utilities, local database (localStorage), sessions
├── js/catalog.js            Activities, exercises, demo mentors, media storage, downloads
├── js/components.js         Microphone/camera recorder, file attachments, media viewer
├── js/music-studio.js       Piano, guitar, violin, drum kit, drills, metronome (Web Audio)
├── js/speech-and-code.js    Timed speech studio and Python runner (Pyodide in a Web Worker)
├── js/public-views.js       Home page, login / create account, mentor profile
├── js/student.js            Student portal: activities, exercises, submissions, progress
├── js/mentor-and-app.js     Mentor portal, review, routing, events, app start
└── docs/mentor-accounts.md  Demo mentor logins (team reference only)
```

## Data

Everything is stored in the browser: accounts and work in `localStorage`, recordings and files in `IndexedDB`. Use the same browser on the same computer for student and mentor. To reset, clear the site data in the browser.

## Demo mentors

See `docs/mentor-accounts.md`. All demo mentors use the password `mentor123`.
