# Decision Log — Learn Bridge

**Team:** AI Tech (HM26-1F8A)  
**Sub-problem:** Browser-based learning, recording and Python execution  
**Date:** 27 Sept 2026

## Q1. What approach did we take, and what did we reject?

### Our approach

We chose a **browser-first learning platform with local browser storage**. Learn Bridge runs as a static web application using HTML, CSS and JavaScript. We use localStorage for accounts, sessions, progress and application data, while IndexedDB stores recordings and uploaded files. Music uses browser audio capabilities, speaking activities use browser recording and speech features, and Python exercises run with Pyodide inside a Web Worker.

### Alternative we considered and rejected

We considered building a full client-server application with a backend database and cloud storage for recordings. This looked attractive because student and mentor data could be shared between devices and stored centrally. We rejected it because it would add backend development, database setup, authentication, cloud media storage and deployment complexity to the project.

## Q2. Why did we reject it? The trade-off

| Dimension | Our approach | Rejected alternative |
|---|---|---|
| Build effort | Simple static application; faster to develop | Backend, database and authentication required |
| Data sharing | Data stays in the browser | Central data can be shared across devices |
| Recordings | Stored locally in IndexedDB | Cloud media storage could handle larger files |
| Offline/local use | Many features work without a backend | Backend connection is normally required |
| Security | Suitable for a project/demo | Stronger production authentication can be implemented |

The main deciding factor was development complexity and time. Our browser-first approach allowed us to build and demonstrate Music, Speaking and Python features without creating a complete backend system. We consciously accept that data is tied to the browser and device. If a user clears browser storage or changes computers, locally saved accounts, recordings and progress are not automatically transferred.

## Q3. What breaks at larger scale?

Learn Bridge currently works well as a browser-based student project, but several parts would become difficult with thousands of students. If 1,000 students each created 20 recordings averaging 5 MB, the recordings alone would represent about **100 GB** of data. Browser storage would not be appropriate for that scale. Mentor review would also become difficult if thousands of submissions arrived without a centralized queue, notifications and database. Python execution would need stronger resource controls if many users ran programs at the same time, while speech and video features would continue to depend on individual browser capabilities and permissions.

The first change we would make is to introduce a **secure backend with a centralized database and cloud media storage**. This would allow accounts, progress, submissions and mentor feedback to synchronize across devices while moving large recordings out of browser storage.

## Self-check

- [x] One approach and one clearly rejected alternative are named.
- [x] A cost of our approach is admitted.
- [x] Q3 contains concrete numbers and estimates.
- [x] The decision is specific to Learn Bridge.
- [x] Every team member can explain this page without notes.