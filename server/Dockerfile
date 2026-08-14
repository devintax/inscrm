FROM node:18-alpine
WORKDIR /app
RUN apk add --no-cache curl
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN mkdir -p uploads/documents uploads/policyDocuments
USER node
EXPOSE 5000
CMD ["npm", "start"]
