# Learn Bridge Architecture

← Back to [README](../README.md)

## System Overview

Learn Bridge is a browser-based student and mentor learning portal for:

- Music
- Public Speaking & Communication
- Python

The application is designed as a client-side web application. Most application data is stored locally in the user's browser, so the project can run without a dedicated backend server.

Students can:

1. Create an account or log in.
2. Select a learning activity.
3. Practise through interactive exercises.
4. Record music or speaking activities.
5. Run Python programs.
6. Submit their work.
7. View mentor feedback.
8. Track their learning progress.

Mentors can:

1. Log in using a mentor account.
2. View students and submissions.
3. Review student work.
4. Add notes and feedback.
5. Provide corrected Python code.
6. Attach or provide media feedback.
7. Assign activities to students.

---

## System Diagram

```text
                         LEARN BRIDGE
                              |
              +---------------+---------------+
              |                               |
              v                               v
        Public Pages                    User Authentication
              |                               |
              +---------------+---------------+
                              |
                              v
                     Student / Mentor Portal
                              |
          +-------------------+-------------------+
          |                   |                   |
          v                   v                   v
       Music             Public Speaking       Python
       Studio                Studio             Studio
          |                   |                   |
          |                   |                   |
          v                   v                   v
      Web Audio          MediaRecorder       Pyodide
      Exercises          Speech APIs         Web Worker
          |                   |                   |
          +-------------------+-------------------+
                              |
                              v
                     Browser Storage
                              |
                  +-----------+-----------+
                  |                       |
                  v                       v
             localStorage              IndexedDB
                  |                       |
                  |                       |
          Accounts, progress,       Recordings and
          submissions, feedback     uploaded media