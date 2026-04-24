# Stage 1 — Build our React app
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files first for caching
COPY package.json package-lock.json ./

# Install all npm packages
RUN npm install --legacy-peer-deps

# Copy all frontend code
COPY . .

# Build React for production (creates /app/build folder)
RUN npm run build

# Stage 2 — Serve the built files with Nginx
FROM nginx:alpine

# Copy our built React files to where Nginx serves from
COPY --from=builder /app/build /usr/share/nginx/html

# Copy our Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Nginx runs on port 80
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]