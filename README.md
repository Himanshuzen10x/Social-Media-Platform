# Social Media Platform - MERN Stack

A full-stack social media application built with MongoDB, Express.js, React.js, and Node.js.

## Features

- **Authentication**: Register/Login with JWT tokens
- **Posts**: Create, delete, like/unlike posts
- **Comments**: Add comments on posts
- **Profiles**: View profiles, edit bio
- **Follow System**: Follow/unfollow users
- **Search**: Search users by username
- **Feed**: View all posts (newest first)

## Tech Stack

- **Frontend**: React.js (Vite), React Router, Axios
- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Mongoose)
- **Auth**: JWT (JSON Web Tokens), bcryptjs

## Project Structure

```
├── server/          # Backend API
│   ├── config/      # DB connection
│   ├── middleware/   # Auth middleware
│   ├── models/      # Mongoose models (User, Post)
│   ├── routes/      # API routes (auth, users, posts)
│   ├── server.js    # Entry point
│   └── vercel.json  # Vercel deployment config
│
├── client/          # Frontend React app
│   ├── src/
│   │   ├── components/  # Navbar, Post, CreatePost
│   │   ├── context/     # AuthContext
│   │   ├── pages/       # Home, Login, Register, Profile, Search
│   │   ├── App.jsx
│   │   └── App.css
│   └── public/_redirects  # Netlify SPA support
```

## Setup & Run Locally

### 1. Backend

```bash
cd server
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm install
npm run dev
```

### 2. Frontend

```bash
cd client
# Edit .env with your API URL (default: http://localhost:5000/api)
npm install
npm run dev
```

## Deployment

### Backend (Vercel)

1. Push `server/` to a GitHub repo
2. Import in Vercel
3. Set environment variables: `MONGO_URI`, `JWT_SECRET`
4. Deploy

### Frontend (Netlify/Vercel)

1. Push `client/` to a GitHub repo
2. Import in Netlify/Vercel
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Set env variable: `VITE_API_URL=https://your-backend-url.vercel.app/api`
6. Deploy

## API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /api/auth/register | Register user | No |
| POST | /api/auth/login | Login user | No |
| GET | /api/auth/me | Get current user | Yes |
| GET | /api/users/:id | Get user profile | Yes |
| PUT | /api/users/profile | Update bio | Yes |
| PUT | /api/users/follow/:id | Follow/unfollow | Yes |
| GET | /api/users?search= | Search users | Yes |
| POST | /api/posts | Create post | Yes |
| GET | /api/posts/feed | Get feed | Yes |
| GET | /api/posts/user/:id | Get user posts | Yes |
| PUT | /api/posts/like/:id | Like/unlike post | Yes |
| POST | /api/posts/comment/:id | Add comment | Yes |
| DELETE | /api/posts/:id | Delete post | Yes |
