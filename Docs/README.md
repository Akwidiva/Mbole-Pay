You → Write Code (Mbole Pay)
      ↓
Push to → GitLab
      ↓
GitLab CI/CD → Runs Tests, Builds Docker Images
      ↓
Docker Containers → Contain your app (frontend, backend, contracts)
      ↓
Kubernetes → Deploys and manages those containers on the cloud



📁 Your repo will eventually host:

/client – React app

/server – Node.js/Express backend

/contracts – Smart contracts (optional)

Dockerfiles and .gitlab-ci.yml – for DevOps magic

Mbole-Pay/
├── app/
│   ├── dashboard/
│   │   └── page.jsx
│   ├── groups/
│   │   └── page.jsx
│   ├── transactions/
│   │   └── page.jsx
│   ├── disputes/
│   │   └── page.jsx
│   ├── globals.css
│   ├── layout.jsx
│   └── page.jsx
├── components/
│   ├── dashboard/
│   ├── groups/
│   ├── transactions/
│   ├── disputes/
│   ├── landing/
│   ├── ui/
│   └── ...
├── public/
├── .gitignore
├── next.config.js
├── package.json
└── tailwind.config.jsc;