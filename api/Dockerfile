FROM node:22-alpine
WORKDIR /app/api

# copy package. json/lock from build context (repo root)
COPY package*.json ./

# install deps
RUN npm ci

# copy api sources
COPY api/./api/



EXPOSE 3001

# run the same command you used locally
CMD - ["node", "api.js"]