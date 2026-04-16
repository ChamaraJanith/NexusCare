# Develop stage
FROM node:22-alpine AS build-stage

WORKDIR /app

# Copy package.json and install dependencies
COPY package*.json ./
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the Quasar project
RUN npm run build

# Production stage
FROM nginx:alpine AS production-stage

# Copy the build output from the previous stage to Nginx's default public directory
# (For Quasar SSR/PWA this differs, but for purely static SPA, the dist is dist/spa)
COPY --from=build-stage /app/dist/spa /usr/share/nginx/html

# Expose port 80
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]