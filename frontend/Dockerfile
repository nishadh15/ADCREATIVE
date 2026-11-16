# ---- deps + build ----
FROM node:26-alpine AS build
WORKDIR /app
COPY package.json ./
RUN npm install --no-audit --no-fund
COPY . .
# NEXT_PUBLIC_* vars are inlined at build time, so pass the backend URL as a build arg
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
RUN npm run build

# ---- runtime ----
FROM node:26-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/package.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.next ./.next
COPY --from=build /app/next.config.js ./
RUN chown -R node:node /app
USER node
EXPOSE 3000
CMD ["sh", "-c", "npx next start -p ${PORT:-3000}"]
