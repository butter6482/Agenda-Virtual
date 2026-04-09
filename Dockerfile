FROM node:20-alpine

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Install dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm install

# Copy source and build
COPY . .
RUN npx prisma generate
RUN npm run build

EXPOSE 3000

# Heal the known initial migration edge case, then migrate/seed/start.
CMD ["node", "scripts/render-start.mjs"]
