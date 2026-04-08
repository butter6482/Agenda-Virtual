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

# Run migrations then start on $PORT (Render sets this)
CMD ["sh", "-c", "npx prisma migrate deploy && node prisma/seed.mjs && ./node_modules/.bin/next start -p ${PORT:-3000}"]
