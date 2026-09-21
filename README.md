# Credit Risk Scorecard

An explainable and fair machine learning-based credit risk assessment system that predicts customer credit risk and provides transparent explanations for the prediction.

## 📌 Project Overview

The Credit Risk Scorecard is a web-based application designed to assist in evaluating the credit risk of customers.

The system accepts customer financial information, uses a machine learning model to predict credit risk, and provides explanations for the prediction. It also maintains customer history and can send the prediction result and explanation to the customer's email.

## ✨ Key Features

- Credit risk prediction using Machine Learning
- Customer registration and login
- Employee registration and login
- Customer dashboard
- Employee dashboard
- Customer prediction history
- Employee history management
- Explainable AI for prediction results
- Fairness and bias analysis
- Email notification containing prediction results and explanations
- Frontend and backend integration through APIs

## 🏗️ System Workflow

Customer / Employee
        ↓
React Frontend
        ↓
Backend REST API
        ↓
Machine Learning Model
        ↓
Credit Risk Prediction
        ↓
Explanation & Fairness Analysis
        ↓
Database / History
        ↓
Email Notification

## 🛠️ Technologies Used

### Frontend
- React.js
- Vite
- JavaScript
- CSS

### Backend
- Python
- Flask
- REST API

### Machine Learning
- Pandas
- NumPy
- Scikit-learn
- SHAP / Explainability techniques

### Database
- SQLite

### Other
- Git
- GitHub
- Email integration

## 👥 User Roles

### Customer
- Create an account
- Login securely
- Enter required details
- View credit risk prediction
- View prediction explanation
- View previous prediction history
- Receive prediction results and explanations through email

### Employee
- Create an employee account
- Login
- Access employee dashboard
- View customer-related information
- View prediction history

## 🔍 Explainability

The system provides an explanation of the machine learning prediction so that users can understand the factors contributing to the predicted credit risk.

## ⚖️ Fairness

The project also considers fairness in machine learning by evaluating model behaviour across relevant customer groups and identifying potential differences in model outcomes.

## 📧 Email Notifications

After a credit risk assessment, the system can send the customer an email containing:

- Credit risk result
- Prediction information
- Explanation of the result

## 📁 Project Structure

```text
Credit-Risk-Project/
│
├── backend/
│   ├── data/
│   ├── ml/
│   ├── models/
│   ├── app.py
│   └── database.py
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── App.jsx
│   │   └── App.css
│   ├── package.json
│   └── vite.config.js
│
├── .gitignore
└── README.md
