# Learn Bridge — Five Hard Constraints

← Back to [README](../README.md)

Learn Bridge is a browser-based learning platform for Music, Public Speaking & Communication, and Python.

The following constraints describe the important technical and functional limitations of the current implementation.

| # | Constraint | Status | Evidence / Test |
|---|---|---|---|
| 1 | Student and mentor data is stored locally in the browser | ✅ | Account, progress and submission data are stored using browser storage |
| 2 | Audio/video features depend on browser permissions and support | ⚠️ | MediaRecorder and browser permissions are required |
| 3 | Python execution depends on Pyodide being available | ⚠️ | Pyodide is downloaded when Python is first used |
| 4 | Large recordings and attachments depend on browser storage capacity | ⚠️ | Recordings and files are stored in IndexedDB |
| 5 | The application does not currently provide cloud synchronization | ⚠️ | Data remains on the browser/device used by the student or mentor |

---

## 1. Local Browser Data

### Constraint

The current version of Learn Bridge stores application data in the user's browser rather than in a central server database.

### Approach

The application uses:

- `localStorage` for smaller application data.
- `IndexedDB` for recordings and larger media/files.

Examples of locally stored information include:

- User accounts
- Sessions
- Student progress
- Activities
- Exercise results
- Submissions
- Mentor feedback
- Audio/video recordings
- File attachments

### Why this constraint exists

The current version is designed as a lightweight browser-based application that does not require a dedicated backend server.

### Consequence

Data stored in one browser is not automatically available in another browser or another computer.

For example:

```text
Computer A
    ↓
Chrome
    ↓
Learn Bridge
    ↓
Student data

Computer B
    ↓
Chrome
    ↓
Learn Bridge
    ↓
Different browser storage