import 'dotenv/config';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import { Server } from 'socket.io';
import { createServer } from 'http';
import jwt from 'jsonwebtoken';

import User from './model/UserModel.js';
import Message from './model/MessageModel.js'; 

import authRoutes from './routes/auth.js';
import postRoutes from './routes/postRoutes.js';
import feedRoutes from './routes/globalFeed.js';
import chatRoutes from './routes/chat.js';
import profileRoutes from './routes/profileRoutes.js';
import messageRoutes from './routes/chat.js';

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io with enhanced connection stability
const io = new Server(httpServer, {
  cors: { 
    origin: "*", 
    methods: ["GET", "POST"] 
  },
  pingTimeout: 60000,
  pingInterval: 25000
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

/**
 * Socket.io Authentication Middleware
 */
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("No token provided"));
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate('startupProfile incubatorProfile');
    
    if (!user) return next(new Error("User not found"));

    const profile = user.role === 'startup' ? user.startupProfile : user.incubatorProfile;
    if (!profile) return next(new Error("Profile not initialized"));

    // Ensure profileId is a clean string for room logic and state comparisons
    socket.profileId = profile._id.toString();
    socket.role = user.role;
    next();
  } catch (err) {
    console.error("Socket Auth Error:", err.message);
    next(new Error("Authentication failed"));
  }
});



/**
 * Socket Event Handlers
 */
io.on("connection", (socket) => {
    const myId = socket.handshake.auth.myProfileId;
    if (myId) socket.join(myId); // Join private room for notifications

    socket.on("join_room", (roomKey) => {
        socket.join(roomKey);
        console.log(`📡 Device linked to room: ${roomKey}`);
    });

    socket.on("send_message", (data) => {
        // Emit to the shared room
        io.to(data.roomKey).emit("receive_message", data);
        
        // Emit notification to receiver's private ID room
        io.to(data.receiverId).emit("receive_message_notification", data);
    });
});

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch(err => {
      console.error("❌ MongoDB Connection Error:", err.message);
      process.exit(1);
  });

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/myfeed', feedRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/messages', messageRoutes);

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Socket.io interface active`);
});