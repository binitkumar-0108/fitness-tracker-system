# fitness-tracker-mvp

Minimal fitness tracker MVP - frontend + backend example

Quick start

Prerequisites:
- Node.js 18+
- pnpm

Install dependencies:

```
pnpm install
```

Run in development:

```
pnpm run dev
```

Build:

```
pnpm run build
```

Run tests:

```
pnpm run test
```

Publishing to GitHub

1. Initialize git (if not already):

```
git init
git add .
git commit -m "Initial commit"
```

2. Add remote and push (replace URL with your repo):

```
git remote add origin https://github.com/<your-username>/<repo>.git
git branch -M main
git push -u origin main
```

Notes
- This repo uses pnpm as package manager. If you prefer npm or yarn, adapt commands accordingly.
- Do not commit .env files; keep secrets out of the repository.
# Fitness Tracker MVP

A full-stack fitness tracking application built with React, TypeScript, Vite, Node.js, and Express.

## Features

- **Health Dashboard**: View daily health metrics and an overview of your progress.
- **Exercise Logging**: Track workouts and detailed exercises.
- **Health Profiles**: Maintain comprehensive health and dietary data.
- **Ayurvedic Assessments**: Log and receive dosha-based assessments.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MySQL](https://www.mysql.com/) database
- [pnpm](https://pnpm.io/) package manager

### Installation

1. Clone this repository to your local machine:
   ```bash
   git clone <repository-url>
   ```

2. Install dependencies:
   ```bash
   pnpm install
   ```

3. Set up environment variables:
   Copy the example environment file and populate it with your database connection details and secrets.
   ```bash
   copy .env.example .env
   ```

4. Setup Database Schema:
   Push the initial tables to your MySQL database using Drizzle ORM:
   ```bash
   pnpm db:push
   ```

5. Start the development server:
   ```bash
   pnpm dev
   ```

The application will start on `http://localhost:3000` (or the next available port).

## Project Structure

- **`client/`**: React frontend code built with Vite & TailwindCSS.
- **`server/`**: Node.js backend using Express and Drizzle ORM.
- **`shared/`**: Shared TypeScript types and Zod schemas.

## License

This project is licensed under the MIT License.
