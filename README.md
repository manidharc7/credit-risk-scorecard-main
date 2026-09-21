# CreditGuard AI

An explainable and fair machine learning-based credit risk assessment system that predicts customer credit risk and provides transparent explanations for the prediction.

## 📌 Project Overview

CreditGuard AI is a web-based application for evaluating customer credit risk. It accepts a customer's financial information, uses an XGBoost model to predict credit risk, and explains the prediction with SHAP. Accounts, roles and assessment history are backed by Firebase; the ML/SHAP inference runs in a small stateless Flask service deployed on Cloud Run.

## ✨ Key Features

- Credit risk prediction using an explainable XGBoost model (SHAP)
- Firebase Authentication for customer and employee accounts
- One permanent super admin (`manidharc@gmail.com`) who can promote any employee to **Admin** and revoke that privilege at any time, from the in-app Admin Panel
- Customer self-assessment (not stored) and employee-run assessments (stored in Firestore, shared history across employees/admins)
- Email notification of the assessment result to the customer
- Professional, animated UI with route transitions and micro-interactions

## 🏗️ System Architecture

```
React (Vite) frontend
   ├─ Firebase Auth        → signup / login / session
   ├─ Firestore            → users, customers, assessments (direct client reads/writes, gated by security rules)
   └─ Cloud Run (Flask)    → POST /predict, /customer/predict (ML + SHAP, stateless), /send-result (email)
```

## 🛠️ Technologies Used

### Frontend
- React 19, React Router, Vite
- Firebase Auth + Firestore (client SDK)
- Hand-written CSS design system (custom properties, transitions/keyframe animations)

### ML Backend (Cloud Run)
- Python, Flask
- Pandas, NumPy, Scikit-learn, XGBoost
- SHAP for explainability

### Accounts & Data
- Firebase Authentication (email/password)
- Firestore (users, customers, assessments)

## 👥 User Roles

- **Customer** — self-assess credit risk (not persisted), view explanation and improvement advice.
- **Employee** — run assessments for customers (persisted to Firestore), view shared assessment history, email results to customers.
- **Admin** — an employee promoted by the super admin; same access as Employee plus the Admin Panel (view all users).
- **Super Admin** — permanently `manidharc@gmail.com`, enforced in Firestore security rules against the verified auth token email (not client-controlled). Can promote/demote any employee's Admin status at any time.

## 🚀 Setup

### 1. Firebase project

1. Create a project at the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Authentication → Sign-in method → Email/Password**.
3. Enable **Firestore Database** (production mode).
4. Add a Web app to the project and copy its config.
5. Copy `frontend/.env.example` to `frontend/.env` and fill in the `VITE_FIREBASE_*` values.
6. Install the Firebase CLI and deploy the security rules from the repo root:

   ```bash
   npm i -g firebase-tools
   firebase login
   firebase use --add        # select your project
   firebase deploy --only firestore:rules,firestore:indexes
   ```

### 2. ML backend (Cloud Run)

```bash
cd backend
# local dev
pip install -r requirements.txt
python app.py            # runs on http://127.0.0.1:5000

# deploy to Cloud Run
gcloud auth login
gcloud config set project <your-project-id>
gcloud run deploy creditguard-ml \
  --source . \
  --region <region> \
  --allow-unauthenticated \
  --set-env-vars SENDGRID_API_KEY=<sendgrid-api-key>,SENDGRID_FROM_EMAIL=<verified-sender-email>,ALLOWED_ORIGIN=<frontend-url>,GROQ_API_KEY=<groq-api-key>
```

Put the deployed Cloud Run URL into `frontend/.env` as `VITE_API_BASE_URL` (defaults to `http://127.0.0.1:5000` for local dev).

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

### 4. Bootstrap the super admin

Sign up once through the Employee portal using `manidharc@gmail.com`. The Firestore security rules automatically grant that account super-admin status. From there, open the **Admin Panel** to promote other employees to Admin.

## 📁 Project Structure

```text
credit-risk-scorecard/
│
├── backend/                 # Stateless ML service (Cloud Run)
│   ├── ml/
│   ├── models/
│   ├── app.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── context/         # Auth + Toast providers
│   │   ├── firebase/        # Firebase config + auth helpers
│   │   └── styles/          # Design system (tokens, base, components, animations, pages)
│   ├── package.json
│   └── vite.config.js
│
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
└── README.md
```

## 🔍 Explainability

SHAP values from the XGBoost model are translated into plain-language, customer-friendly explanations and improvement advice. When `GROQ_API_KEY` is set, an additional AI-written summary paragraph (via Groq, model `openai/gpt-oss-20b`) narrates those same SHAP-derived factors in natural prose — the LLM is only ever given the already-computed facts and instructed not to introduce new ones, so it can't hallucinate a reason the model didn't actually use. This is optional: without a key, `ai_summary` is simply `null` and nothing else changes.

## ⚖️ Fairness

See `backend/ml/fairness.py` for the fairness/bias analysis used during model development.
