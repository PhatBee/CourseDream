# Video Interactive Quiz — Task Tracker

## Backend (Server)
- [x] 1.1 Update `progress.model.js` — Expand CompletedQuizSchema
- [x] 1.2 Update `progress.service.js` — Fix submitQuizAnswer + add resetQuiz, resetAllQuizzes, getQuizHistory
- [x] 1.3 Update `progress.controller.js` — Add 3 new controllers
- [x] 1.4 Update `progress.routes.js` — Add 3 new routes

## Frontend Web (React)
- [x] 2.1 Update `learningApi.js` — Add 3 API methods
- [x] 2.2 Update `learningSlice.js` (Web) — Add removeQuizComplete, removeAllQuizzesForLecture reducers
- [x] 2.3 Update `useVideoQuiz.js` — Fix checkSeekBlock, triggeredRef, add lastKnownTime, resetQuiz, history
- [x] 2.4 Update `VideoPlayer.jsx` — Fix handleSeeking with lastKnownTime
- [x] 2.5 Update `VideoQuizOverlay.jsx` — Add continue button, attempt count
- [x] 2.6 Update `QuizProgressMarkers.jsx` — Fix marker mount/unmount lifecycle

## Frontend Mobile (Expo)
- [x] 3.1 Update `learningSlice.js` (Mobile) — Add quiz state + reducers
- [/] 3.2 Update `VideoPlayer.js` (Mobile) — Fix gatekeeper race condition + forward seek block
- [x] 3.3 Update `CustomProgressBar.js` — Add forward seek restriction delegation

## Verification
- [ ] 4.1 Review all changes for consistency
