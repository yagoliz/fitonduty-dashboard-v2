FROM docker.io/node:20-slim AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build arg for API URL (Vite needs this at build time)
ARG VITE_API_URL=
ENV VITE_API_URL=$VITE_API_URL
ENV NODE_ENV=production

# Build for production
RUN pnpm build --mode production

# Production stage with nginx
FROM docker.io/nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config for SPA routing
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000

CMD ["nginx", "-g", "daemon off;"]