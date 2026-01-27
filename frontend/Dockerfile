FROM node:20-slim

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install

# Copy source
COPY . .

# Expose port
EXPOSE 3000

# Build for production
RUN pnpm build

# Serve with preview
CMD ["pnpm", "preview", "--host", "--port", "3000"]