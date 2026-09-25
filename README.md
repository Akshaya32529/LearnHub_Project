# LearnHub

LearnHub is a MERN skill learning and assessment platform. It supports students, instructors, content reviewers, mentors, and administrators through course authoring, review, learning progress, assessment, mentoring, and analytics workflows.

## Features

- Responsive React and Tailwind landing page, course catalog, course detail, and learner workspace.
- Five server-enforced roles. Public registration always creates a student account; administrators grant other roles.
- JWT authentication in an HTTP-only cookie, password hashing with bcryptjs, configurable CORS, and request-origin checks for browser writes.
- Category and course management, curriculum modules and lessons, ordering, preview lessons, and instructor ownership checks.
- Course review history and DRAFT → SUBMITTED → UNDER_REVIEW → APPROVED / REJECTED / CHANGES_REQUESTED → PUBLISHED → ARCHIVED workflow.
- Published course discovery and enrollment.
- Multiple-choice quizzes with randomized questions and options, hidden answer keys, timed attempts, attempt limits, server-side scoring, result history, and feedback.
- Text assignments with module association, optional due dates, submissions, instructor grading, editing, deletion, and learner notifications.
- Lesson and module progress, quiz and assignment results, completion rules, certificates, and a printable certificate history.
- Admin mentor assignment and removal, learner progress and assessment performance, mentor feedback, and session scheduling and status management.
- Learner-defined goals used as part of personalized recommendation context.
- Backend-only, replaceable OpenAI-compatible LLM provider. AI suggestions use learner goals, enrolled-course progress, quiz results, assignment scores and feedback, and real lessons/quizzes; generated advice is cached for six hours and falls back gracefully if the provider is not configured or is unavailable.
- Instructor and platform analytics calculated from MongoDB records.
- User-owned notifications for course, enrollment, assessment, assignment, mentoring, certificate, and AI events.
- Development seed script for sample roles and learning data.

## Roles

| Role | Main access |
|---|---|
| `student` | Browse and enroll in published courses, complete lessons, take quizzes, submit assignments, view progress and certificates, use AI guidance, and receive mentor support. |
| `instructor` | Manage owned courses and curriculum, create assessments, grade submissions, submit courses for review, and view owned-course analytics. |
| `reviewer` | Review course submissions, request changes, reject or approve courses, and publish approved courses. |
| `mentor` | View assigned learners and their progress, share feedback, and schedule sessions. |
| `admin` | Manage categories and user access, assign mentors, review platform courses, and view platform analytics. |

Backend middleware enforces roles and ownership. React route guards improve navigation but are not the security boundary.

## Architecture

```text
frontend/                 React 18, Vite, React Router, Axios, Zustand, Tailwind
  src/components/         Shared navigation and UI components
  src/layouts/            Main application layout
  src/pages/               Catalog, course, role dashboards, learning and assessment pages
  src/routes/              Client route configuration
  src/services/            Axios API client and feature services
  src/store/               Authentication and app state

backend/                  Express ES modules, Mongoose, cookie/JWT authentication
  config/                  MongoDB connection and status
  controllers/             Request handlers
  middleware/              Authentication, role checks, origin checks, and errors
  models/                  Mongoose collections
  routes/                  REST API route groups
  seed/                    Development-only seed script
  services/                AI provider, recommendations, progress calculations
```

Main data models include User, Category, Course, Module, Lesson, ReviewHistory, Enrollment, CourseProgress, Quiz, Question, QuizAttempt, Assignment, Submission, Certificate, MentorAssignment, MentorFeedback, MentoringSession, Notification, and AIRecommendation.

## Requirements

- Node.js 18 or newer
- npm
- MongoDB Community Server or MongoDB Atlas

## Setup

Install dependencies in both applications:

```bash
cd backend
npm install
cd ../frontend
npm install
```

Create local environment files from the examples:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Set a private MongoDB connection string and a randomly generated JWT secret in `backend/.env`. Use a JWT secret of at least 32 characters. Do not commit `.env` files.

Start MongoDB, then run the API and client in separate terminals:

```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev
```

The default local URLs are `http://localhost:5000` and `http://localhost:5173`.

## Environment variables

Backend (`backend/.env.example`):

| Variable | Purpose |
|---|---|
| `PORT` | Express listen port. |
| `NODE_ENV` | Use `development` locally and `production` for deployment. |
| `MONGO_URI` | MongoDB connection string. |
| `CLIENT_URL` | Allowed frontend origin; comma-separated origins are accepted by the request-origin guard. |
| `JWT_SECRET` | Private signing secret, 32 or more characters. |
| `JWT_EXPIRES_IN` | JWT duration such as `7d`, `12h`, or `30m`. |
| `AI_API_KEY` | Optional provider key; backend only. |
| `AI_MODEL` | Provider model name. |
| `AI_BASE_URL` | Optional OpenAI-compatible API base URL. |
| `SEED_DEMO_PASSWORD` | Temporary seed account password; required only by the development seed command. |

Frontend (`frontend/.env.example`):

| Variable | Purpose |
|---|---|
| `VITE_API_URL` | API base URL including `/api`; the deployed backend is `https://learnhub-project-1-xu2q.onrender.com/api`. |

The frontend does not receive or store JWT or AI credentials.

## MongoDB and seed data

Set `MONGO_URI` to a local database, for example `mongodb://127.0.0.1:27017/learnhub_db`, or to your Atlas URI. The backend reports database connection state at `GET /api/health`. Database-backed authentication and learning APIs return a service-unavailable response while MongoDB is disconnected; account and course mutations are not silently stored in memory.

For local development only, set `SEED_DEMO_PASSWORD` to a private password of at least 12 characters, then run:

```bash
cd backend
npm run seed
```

Seed identities are `admin@local.learnhub.test`, `instructor@local.learnhub.test`, `reviewer@local.learnhub.test`, `student@local.learnhub.test`, and `mentor@local.learnhub.test`. All use the password supplied through `SEED_DEMO_PASSWORD`. The script refuses to run when `NODE_ENV=production`; there is no public seed API.

## API overview

All endpoints are prefixed with `/api`.

| Area | Routes |
|---|---|
| Health | `GET /health` |
| Authentication | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| Categories | `/categories` |
| Courses and curriculum | `/courses`, `/courses/:courseId/modules`, `/modules/:id`, `/modules/:moduleId/lessons`, `/lessons/:id` |
| Review workflow | `/reviews/queue`, `/reviews/courses/:id/submit`, `/reviews/courses/:id/review`, `/reviews/courses/:id/history` |
| Discovery and enrollment | `GET /enrollments/catalog`, `POST /enrollments/courses/:id/enroll` (also `POST /courses/:id/enroll`), `/enrollments/my` |
| Quizzes | `/courses/:courseId/quizzes`, `/quizzes/:id`, `/quizzes/:id/start`, `/quizzes/:id/attempts`, `/quizzes/:id/history`, question CRUD under `/quizzes/:quizId/questions` |
| Assignments | `/courses/:courseId/assignments`, `/assignments/:id` (edit/delete), `/assignments/:id/submit`, `/assignments/:id/submissions` |
| Progress and certificates | `/progress/my`, `/progress/courses/:courseId/lesson-progress`, `/progress/courses/:courseId/certificate`, `/progress/certificates` |
| Mentoring | `/mentors/assignments`, `/mentors/assignments/:id`, `/mentors/feedback`, `/mentors/sessions`, `/mentors/sessions/:id` |
| AI | `/ai/learning-path`, `/ai/weak-concepts`, `/ai/recommendations`, `POST /ai/assessment-feedback` |
| Analytics | `/analytics/instructor`, `/analytics/courses/:courseId` |
| Notifications | `/notifications`, `/notifications/unread-count`, `/notifications/:id/read`, `/notifications/read-all`, `DELETE /notifications/:id` |
| Administration | `/admin/users`, `/admin/users/:id` |
| Learner profile | `PATCH /auth/me/profile` |

## Development commands

```bash
# Backend
npm run dev
npm start
npm run seed

# Frontend
npm run dev
npm run build
npm run preview
```

The production frontend build is written to `frontend/dist`. There is no automated test suite configured yet.

## AI configuration

Set `AI_API_KEY` and `AI_MODEL` on the backend. `AI_BASE_URL` may point at an OpenAI-compatible service. The AI service sends learning concepts and course activity, not account passwords or signing credentials. AI responses are normalized against known concepts, and recommendation IDs are selected from existing LearnHub records. Without a configured provider, deterministic activity-based recommendations and a useful fallback message are returned.

## Deployment

1. Provision MongoDB and configure `MONGO_URI` with a restricted database user.
2. Deploy the backend at `https://learnhub-project-1-xu2q.onrender.com` with `PORT`, `NODE_ENV=production`, `CLIENT_URL`, a strong `JWT_SECRET`, and `JWT_EXPIRES_IN`.
3. Deploy the frontend build and set `VITE_API_URL` to the deployed API base ending in `/api`.
4. Use HTTPS for both services. Production cookies are `HttpOnly`, `Secure`, and `SameSite=None` for cross-origin frontend/API hosting.
5. Set `CLIENT_URL` to the exact frontend origin(s), and configure the same origins in deployment infrastructure.
6. Configure AI credentials only on the backend if AI features are needed.

The server does not serve the built frontend; deploy the frontend and API separately or configure a reverse proxy.

## Security notes

- Passwords are hashed with bcryptjs and excluded from ordinary User queries and API responses.
- JWTs are placed in HTTP-only cookies and are not returned for browser storage.
- Public registration creates student accounts only.
- Every privileged API route checks role and resource ownership on the server.
- Course modules, lessons, quiz answers, learner submissions, mentor relationships, notifications, and analytics are scoped to the relevant user or course.
- API keys and environment files are excluded from source control.
- Use HTTPS and rotate secrets if they are exposed.

## Verification and current limitations

- The Vite production build and backend JavaScript syntax checks passed after the feature audit.
- HTTP smoke checks verified API startup, health, authentication requirements, rejection of privileged public registration, origin rejection, and service-unavailable responses when MongoDB is disconnected. Protected routes returned 401 without a session cookie.
- A MongoDB server was not available in the implementation environment, so successful registration/login/logout persistence, course workflow, quiz scoring, grading, certificate generation, mentor notifications, and analytics calculations were not end-to-end verified against a live database.
- Assignments currently accept text submissions only. Certificate pages use the browser print dialog to print or save as PDF; server-generated certificate files are not implemented.
- The AI adapter expects an OpenAI-compatible chat-completions API with JSON response support.
- No automated browser or database integration tests are configured yet.
