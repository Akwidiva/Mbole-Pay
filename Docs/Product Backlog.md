📦 Mbole Pay – Product Backlog
A Kanban or Agile board-ready breakdown of user stories, features, and technical tasks to guide development.

🚀 EPIC 1: User Onboarding & Authentication
ID	User Story	Priority	Notes
US-01	As a user, I want to register with my phone/email so I can have a secure personal account.	High	Basic auth (Firebase/Auth0 or custom)
US-02	As a user, I want to log in securely to access my Njangi activities.	High	Include forgot password
US-03	As a user, I want to log out to keep my account secure.	Medium	Add session timeout later

💼 EPIC 2: Njangi Group Management
ID	User Story	Priority	Notes
US-04	As a user, I want to create a new Njangi group and set rules.	High	Name, cycle type, frequency
US-05	As a user, I want to join an existing Njangi group via invite code.	High	Generate & validate group codes
US-06	As an admin, I want to manage group members and assign roles.	High	Admin, Treasurer, Member

💰 EPIC 3: Contributions & Payment Tracking
ID	User Story	Priority	Notes
US-07	As a user, I want to view contribution schedules so I know when to pay.	High	Calendar view
US-08	As a treasurer, I want to mark payments as received to keep records.	High	Manual & future automated
US-09	As a user, I want to receive reminders when my contribution is due.	Medium	Push notifications or SMS/email

📊 EPIC 4: Financial Reporting & Transparency
ID	User Story	Priority	Notes
US-10	As a user, I want to view a summary of my payments and pending contributions.	High	Dashboard
US-11	As a group member, I want to see a group-wide report of contributions.	Medium	Add charts later
US-12	As a treasurer, I want to export group data to Excel/PDF.	Low	Optional at MVP stage

🔒 EPIC 5: Security, Roles & Permissions
ID	User Story	Priority	Notes
US-13	As a user, I want my data to be secure and private.	High	Use HTTPS, auth tokens
US-14	As an admin, I want to control who can perform key actions.	Medium	RBAC (Role-Based Access Control)

🎨 EPIC 6: UI/UX & Styling
ID	User Story	Priority	Notes
US-15	As a user, I want a clean, intuitive UI.	High	Tailwind + React
US-16	As a user, I want dark/light mode toggle.	Low	Later sprint
US-17	As a user, I want the app to be mobile responsive.	High	Especially on smaller devices

🧪 EPIC 7: Testing & DevOps
ID	Task	Priority	Notes
T-01	Setup GitHub/GitLab CI pipelines	High	Auto tests/deploy
T-02	Write unit tests for core components	Medium	Jest/React Testing Library
T-03	Setup Docker container for the app	High	For GitLab deployment
T-04	Deploy app on a test server (Heroku/Netlify)	High	MVP preview

📌 MVP Scope (Must-Haves):
Registration/Login (US-01, US-02)

Create/Join Njangi group (US-04, US-05)

Contribution tracking (US-07, US-08)

Basic group management (US-06)

Summary dashboard (US-10)

Want me to format this as a spreadsheet, Notion table, or Markdown board for GitHub Projects? Just say the word 👇


2/2







