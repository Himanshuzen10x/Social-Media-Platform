# XChat - Social Media Platform (MERN Stack)

A full-stack text-based social media platform built with MongoDB, Express.js, React.js, and Node.js. Users can share short text posts, follow other users, like and comment on posts.

## Features

- **Secure Authentication** — Register/Login with JWT tokens, protected routes
- **Text Posts** — Create and delete short-form posts (280 character limit)
- **Social Interactions** — Like/unlike posts, comment and reply
- **User Profiles** — View profiles, edit bio, follow/unfollow users
- **User Discovery** — Search users by username
- **Real-time Feed** — View all posts sorted by newest first
- **Responsive Design** — Works on desktop and mobile

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React.js (Vite), React Router, Axios |
| Backend | Node.js, Express.js |
| Database | MongoDB (Mongoose ODM) |
| Auth | JWT (JSON Web Tokens), bcryptjs |
| Deployment | Vercel (API) + Netlify (Client) |

## Project Structure

```
├── server/              # Backend API
│   ├── config/db.js     # MongoDB connection
│   ├── middleware/auth.js # JWT auth middleware
│   ├── models/          # Mongoose models (User, Post)
│   ├── routes/          # API routes (auth, users, posts)
│   ├── server.js        # Express entry point
│   └── vercel.json      # Vercel deployment config
│
├── client/              # Frontend React app
│   ├── src/
│   │   ├── components/  # Navbar, Post, CreatePost
│   │   ├── context/     # AuthContext (global state)
│   │   ├── pages/       # Home, Login, Register, Profile, Search
│   │   ├── App.jsx      # Root component with routing
│   │   └── App.css      # Global styles
│   └── public/_redirects # Netlify SPA routing
```

## Setup & Run Locally

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas account (free tier)

### 1. Clone & Setup Backend

```bash
cd server
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm install
npm run dev
```

### 2. Setup Frontend

```bash
cd client
# Edit .env with your API URL
npm install
npm run dev
```

### 3. Open in Browser
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5001`

## Deployment

### Backend → Vercel
1. Push to GitHub
2. Import `server/` directory in Vercel
3. Add environment variables: `MONGO_URI`, `JWT_SECRET`
4. Deploy

### Frontend → Netlify
1. Import repo in Netlify
2. Base directory: `client`, Build: `npm run build`, Publish: `client/dist`
3. Add env variable: `VITE_API_URL` = your Vercel backend URL + `/api`
4. Deploy

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login user |
| GET | `/api/auth/me` | Get current user |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/:id` | Get user profile |
| PUT | `/api/users/profile` | Update bio |
| PUT | `/api/users/follow/:id` | Follow/unfollow user |
| GET | `/api/users?search=` | Search users |

### Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/posts` | Create post |
| GET | `/api/posts/feed` | Get feed |
| GET | `/api/posts/user/:id` | Get user's posts |
| PUT | `/api/posts/like/:id` | Like/unlike post |
| POST | `/api/posts/comment/:id` | Add comment |
| DELETE | `/api/posts/:id` | Delete post |

## Live Demo
- **Frontend**: [xchatind.netlify.app](https://xchatind.netlify.app)
- **Backend API**: [social-media-platform-one-gray.vercel.app](https://social-media-platform-one-gray.vercel.app)
