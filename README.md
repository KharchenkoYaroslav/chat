# 📨 Chat

An interactive real-time chat platform built to explore WebSocket technology. Using NestJS for the backend and React for the client.

## 📦 Technologies

- `TypeScript`
- `Nx`
- `NestJS`
- `WebSockets`
- `gRPC`
- `RabbitMQ`
- `Docker`
- `TypeORM`
- `Vite`
- `React`
- `SCSS`

## 🚀 Features

- **Real-time Messaging**: Using WebSockets for seamless real-time communication
- **Message Management**: Ability to send, edit, and delete messages
- **User Discovery**: Global search functionality to find and connect with other users
- **Profile Settings**: Secure options to change login credentials and passwords
- **Secure Authentication**: Robust login and registration system utilizing Guard protections
- **Scalable Architecture**: Microservices communicating via gRPC within an Nx monorepo

## 📍 The Process

I started this project to gain more experience working with WebSockets, a simple chat is best suited for this purpose as it covers such important aspects as isolation and security (I used separate rooms for communication between users, and a user who is not a participant in the conversation cannot find out anything about it because the participant's identity is verified through their token), a full pool of operations (I learned how to process deletion or update operations on the client) and, finally, a combination with REST to retrieve old messages.

## 🏗️ System Architecture

The system follows a scalable microservices architecture managed within an **Nx** monorepo. It leverages different communication protocols to ensure performance and real-time capabilities:

- **API Gateway** (`REST API` & `WebSockets`): The central entry point that aggregates data from internal services. It handles HTTP requests and establishes persistent WebSocket connections for real-time messaging.
- **Auth Service** & **Messenger Service** (`gRPC`): High-performance internal microservices responsible for core business logic. They communicate with the Gateway via gRPC to efficiently handle user identities and message persistence.
- **Client** (`React`): A modern Single Page Application (SPA) built with Vite. It consumes the Gateway's REST API and connects to WebSockets for instant chat updates.

## 📂 Project Structure

This monorepo project is organised into the following applications:

- `apps/client` - Frontend application built with React, Vite, and SCSS.
- `apps/api-gateway` - Main server entry point handling REST routes and WebSocket events.
- `apps/auth-service` - Microservice handling user registration, login, and authentication.
- `apps/messenger-service` - Core microservice for managing chat history, messages, and user search.

## ℹ️ Environment
```
# Database Connection URL (For simplicity, it uses one database for all services. Don't do that in real projects!)
DATABASE_URL=postgresql://user:password@host_url/database_name?sslmode=require

# JWT Configuration
# Generate strong random strings for these secrets
JWT_SECRET=your_super_secret_jwt_string_here

# Service Configuration & Ports
VITE_API_URL=http://localhost:4000
SERVER_PORT=4000
AUTH_SERVICE_URL=localhost:4010
MESSENGER_SERVICE_URL=localhost:4020

# Message Broker Configuration
RABBITMQ_URL=amqp://user:password@localhost:5672
```

## 🚦 Running the Project

1. Clone the repository
2. Install dependencies: `npm install`
3. Configure environment variables:
   - Create a `.env` file in the root directory.
   - Add the necessary variables as described in the **Environment** section.
4. Start the RabbitMQ
5. Start the applications:
You can run the entire platform at once or start specific services as needed.

Option A: Run All Services 
```
npx nx run-many --target=serve --all --parallel=5
```
Option B: Run Services Individually (Recommended for development)
```
# Backend Services
npx nx serve api-gateway
npx nx serve auth-service
npx nx serve messenger-service

# Frontend
npx nx serve client
```
6. Open `http://localhost:4200` in your browser
> [!TIP]
> Highly recommend installing the Nx Console extension for VS Code.

## 🎞️ Preview

https://github.com/user-attachments/assets/92cc3dbe-c8e8-4232-97bb-ff2b94b7542e
