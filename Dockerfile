FROM node:22-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . .

EXPOSE 3000

# Jalankan migrasi database dan seed data secara otomatis, lalu nyalakan server nodemon dev
CMD ["sh", "-c", "npm run migrate && npm run dev"]
