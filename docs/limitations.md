# Learn Bridge — Known Limitations & Future Scope

← Back to [README](../README.md)

## What Doesn't Work Yet

The current Learn Bridge version is a browser-based educational application. It provides the core student, mentor, music, speaking and Python-learning features, but it also has limitations that would need to be addressed before using the system as a large-scale production platform.

| Limitation | Why it exists | What we'd do next |
|---|---|---|
| Data is stored locally in the browser | The current version does not use a central backend database | Add a secure backend API and cloud database |
| Student and mentor data is not synchronized between devices | `localStorage` and IndexedDB are browser-specific | Implement cloud synchronization and user accounts |
| Audio/video recording depends on browser permissions | Browsers require microphone/camera permission | Provide clearer permission handling and browser compatibility guidance |
| Python execution depends on Pyodide | Python runs inside the browser instead of on a server | Optimize Pyodide loading or provide a controlled server-side execution environment |
| Large recordings use browser storage | Audio/video files can consume significant local storage | Add cloud media storage and configurable upload limits |
| Live speech transcription depends on browser support | Speech recognition APIs are not equally supported by all browsers | Add a compatible speech-processing service or broader browser fallback |
| No production-grade authentication | The current project is a client-side prototype | Add secure authentication, password hashing and role-based access control |
| No centralized mentor notification system | There is currently no backend messaging service | Add email/in-app notifications for submissions and feedback |

---

# Edge Cases We Don't Handle Yet

## 1. Browser storage is cleared

If the user clears the browser's site data, locally stored accounts, progress, submissions and media may be removed.

### Future improvement

Use a cloud database so that user information can be restored after signing in on another device.

---

## 2. User changes device or browser

A student using Learn Bridge on one computer will not automatically see the same locally stored data on another computer.

### Future improvement

Synchronize user data with a secure backend.

---

## 3. Microphone or camera permission is denied

The Public Speaking recording features cannot capture audio or video when the browser does not provide the required permission.

### Future improvement

Provide clearer instructions and alternative activities that do not require recording.

---

## 4. Browser does not support a required speech feature

Live speech recognition and transcript features depend on browser capabilities.

### Future improvement

Use a server-side speech recognition service as a fallback.

---

## 5. Internet connection is unavailable during the first Python run

Pyodide may need to be downloaded before Python exercises can be executed.

### Future improvement

Pre-cache the required Python runtime or provide an application/service-worker strategy for offline use.

---

## 6. Very large recordings or attachments

Long video recordings and large files may exceed available browser storage.

### Future improvement

Upload large media files to cloud storage and keep only references/metadata in the application database.

---

## 7. Python program runs for too long

An incorrectly written Python program may contain an infinite loop or very long computation.

### Current approach

Python execution has a time limit to prevent an exercise from blocking indefinitely.

### Future improvement

Provide more detailed execution limits and server-side sandboxing for production use.

---

## 8. Invalid Python code

Students may submit code containing syntax or runtime errors.

### Current approach

The Python runner displays the error and identifies the relevant line where possible.

### Future improvement

Provide more detailed beginner-friendly explanations and suggestions for correcting the error.

---

## 9. Different browser behavior

Some browser APIs can behave differently between browsers.

This can affect:

- Speech recognition
- Audio recording
- Video recording
- Microphone permissions
- Camera permissions
- Python runtime behavior

### Future improvement

Perform broader browser compatibility testing and provide graceful fallbacks.

---

# Scaling the Application

The current version is designed primarily as a lightweight browser-based learning application.

A production version serving a large number of students and mentors would require additional infrastructure.

| What breaks first | Rough impact | Fix |
|---|---|---|
| Browser-only data storage | Data cannot be shared reliably across devices | Introduce a cloud database |
| Large media recordings | Local storage can become limited | Use cloud media storage |
| Client-side authentication | Not suitable for production security | Add secure server-side authentication |
| Mentor/student synchronization | Different browsers have separate data | Add backend APIs and synchronization |
| Python execution in the browser | Large-scale execution may consume client resources | Use controlled sandboxed execution infrastructure |
| Speech processing | Browser support varies | Add a reliable speech-processing backend |
| Notifications | No centralized notification mechanism | Add email and in-app notifications |
| Application monitoring | Client-only prototype has limited centralized monitoring | Add logging, analytics and monitoring |

---

# Future Architecture

A future production version could evolve from:

```text
Current version

Student / Mentor
       |
       v
Browser Application
       |
       +---- localStorage
       |
       +---- IndexedDB
       |
       +---- Pyodide