# Student Expense Tracking and Budget Planner — Version 2.0

SESD course project by V Bharath Kumar (2403A52369), guided by Dr. Shoba Rani.

## Version 2.0 features
- User registration/login with bcrypt password hashing and JWT-protected APIs.
- Add, edit, delete, search and filter income/expense transactions.
- Monthly budget and optional daily spending limit.
- Budget alerts at 75%, 90% and 100%; daily limit alerts are shown in the dashboard.
- Expense analytics: category doughnut chart, highest-spending category, and comparison with the previous month.
- Savings goals with target, saved amount, progress and remaining amount.
- Recurring weekly/monthly expense reminders. Select **Mark paid & add expense** to create a transaction and advance the next due date.
- Monthly transaction export to CSV (opens in Excel) and print-friendly reports.
- Responsive desktop/mobile layout.
- Smart Spending Advisor: transparent local rule-based suggestions using the user's own transaction totals. No paid AI API key is needed and no transaction data is sent to an AI provider. It is AI-style decision support, not a generative AI model.

## Requirements
- Node.js 18 or newer
- MongoDB Community Server running locally, or a MongoDB Atlas connection string
- Internet connection for the Chart.js CDN chart library (the rest of the application runs locally)

## Run on Windows
1. Install and start MongoDB Community Server. In Windows Services, verify **MongoDB Server** is Running.
2. Extract this ZIP to a folder such as `Downloads\Student_Expense_Tracking_Budget_Planner_V2`.
3. Open that folder in VS Code: **File → Open Folder**.
4. Open VS Code Terminal (**Terminal → New Terminal**).
5. Run `npm install`.
6. Copy `.env.example` to `.env`. In PowerShell you can run `Copy-Item .env.example .env`.
7. Open `.env` and set a long random `JWT_SECRET`. The default local MongoDB URI is suitable if MongoDB is installed locally:
   `MONGODB_URI=mongodb://127.0.0.1:27017/student_expense_planner`
8. Run `npm start`.
9. Open `http://localhost:3000` in Chrome. Register a new account or use your existing Version 1 account. Existing MongoDB user and transaction records are retained; new fields such as dailyLimit default to zero.
10. Keep the terminal open while using the website. Press `Ctrl+C` in the terminal to stop the server.

If PowerShell blocks `npm.ps1`, use Command Prompt terminal in VS Code, or run `npm.cmd install` and `npm.cmd start`.

## How to use the new features
- **Analytics:** select a month at the top. The chart, highest category and comparison update for that month.
- **Budget alerts:** save a monthly budget and optionally a daily limit. Alerts appear at 75%, 90%, and 100% of the monthly limit; daily alerts begin at 75% of the daily limit.
- **Savings:** create a goal (e.g. Laptop, ₹10,000), then use **Add savings** to update the total amount saved so far.
- **Recurring expenses:** add an expense and due date. The reminder shows whether it is due, overdue or upcoming. **Mark paid & add expense** records it in transaction history and advances its next due date.
- **Reports:** use search/type/category filters, then Export CSV or Print report. CSV files are Excel-compatible.

## API overview
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register`, `/api/auth/login` | Account access |
| GET | `/api/auth/me` | Validate session |
| GET/POST | `/api/transactions` | List/create transactions |
| PUT/DELETE | `/api/transactions/:id` | Edit/delete transaction |
| GET/PUT | `/api/budgets/:month` | Read/update monthly and daily limits |
| GET/POST | `/api/savings` | List/create savings goals |
| PATCH/DELETE | `/api/savings/:id` | Update saved amount/delete goal |
| GET/POST | `/api/recurring` | List/create recurring reminders |
| POST/DELETE | `/api/recurring/:id/pay` and `/api/recurring/:id` | Record payment/delete reminder |
| GET | `/api/analytics/:month` | Monthly category and comparison analytics |

## Deployment notes
For access from different devices, deploy the Node.js app to a hosting provider and use MongoDB Atlas (or another managed MongoDB service). Set `MONGODB_URI`, `JWT_SECRET`, and `PORT` as hosting environment variables; enable HTTPS; restrict Atlas network access; and never commit `.env` to GitHub. Localhost is only available on the computer running the app. Before public/production use, add automated tests, rate limiting, secure HttpOnly cookies, CSRF protection, stricter validation, monitoring and database backups.

## Limitations
- The spending advisor is rule-based local analysis, not a connected large-language-model AI service.
- Recurring expenses are reminders, not automatic bank debits. A user must click Mark paid to create the expense.
- CSV export is Excel-compatible; print reports can be saved as PDF from the browser print dialog.
- This is an academic project starter, not a financial service. Verify all entries and keep backups.
