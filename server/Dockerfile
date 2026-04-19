# ── Base Image ──────────────────────────────────────────
# Use official Node.js 20 LTS (lightweight alpine version)
FROM node:20-alpine

# ── Working Directory ────────────────────────────────────
# All commands run inside /app folder in the container
WORKDIR /app

# ── Install Dependencies ─────────────────────────────────
# Copy package files first (better caching)
COPY package*.json ./

# Install all dependencies
RUN npm install

# ── Copy Source Code ─────────────────────────────────────
COPY . .

# ── Expose Port ──────────────────────────────────────────
# Backend runs on port 5000
EXPOSE 5000

# ── Start Command ────────────────────────────────────────
# Runs when container starts
CMD ["npm", "run", "dev"]