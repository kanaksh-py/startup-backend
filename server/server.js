import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { Server } from 'socket.io';
import { createServer } from 'http';
import jwt from 'jsonwebtoken';

import User from './model/UserModel.js';
import Message from './model/Message.js'; 

import authRoutes from './routes/auth.js';
import postRoutes from './routes/postRoutes.js';
import feedRoutes from './routes/globalFeed.js';
import chatRoutes from './routes/chat.js';
import profileRoutes from './routes/profileRoutes.js';

import './worker/deactivationWorker.js';
import scheduleInactivityCheck from './queues/scheduler.js';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: { origin: "*", methods: ["GET", "POST"] }
});

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Socket Auth Middleware updated for RBAC
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if(!token) return next(new Error("No token provided"));
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate('startupProfile incubatorProfile');
    
    // Attach the profile ID to the socket
    socket.profileId = user.role === 'startup' 
        ? user.startupProfile._id 
        : user.incubatorProfile._id;
    
    socket.role = user.role;
    next();
  } catch(err) {
    next(new Error("Authentication failed"));
  }
});

io.on("connection", (socket) => {
  console.log(`${socket.role} connected: ${socket.profileId}`);

  socket.on("join_room", (roomID) => {
    socket.join(roomID);
  });

  socket.on("send_message", async (data) => {
    const { roomID, text } = data;
    try {
        const newMessage = new Message({
            conversationId: roomID,
            sender: socket.profileId, // Using profileId for messaging
            text
        });
        await newMessage.save();

        io.to(roomID).emit("receive_message", {
            conversationId: roomID,
            sender: socket.profileId,
            text: text,
            createdAt: newMessage.createdAt
        });
    } catch (err) {
        socket.emit("error", "Message failed");
    }
  });

  socket.on("disconnect", () => console.log("User disconnected"));
});

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    scheduleInactivityCheck(); 
  })
  .catch(err => console.error("Connection Error:", err));

app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/myfeed', feedRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/profiles', profileRoutes);

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));