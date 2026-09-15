# Node.js 22 LTS
FROM node:22-alpine

# Install system dependencies
RUN apk add --no-cache libc6-compat

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Generate NextAuth secret if not provided
ENV NEXTAUTH_SECRET=${NEXTAUTH_SECRET:-$(openssl rand -base64 32)}

# Expose port
EXPOSE 3000

# Start the application
CMD ["npm", "run", "dev"]
