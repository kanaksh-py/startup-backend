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

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io with permissive CORS for development
const io = new Server(httpServer, {
  cors: { 
    origin: "*", 
    methods: ["GET", "POST"] 
  }
});

// Middleware
app.use(cors());
// CRITICAL: Increased limits for Base64 image uploads from Feed/Profile
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

/**
 * Socket.io Authentication Middleware
 * Validates JWT and attaches the specific Profile ID (ObjectID) to the socket
 */
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error("No token provided"));
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).populate('startupProfile incubatorProfile');
    
    if (!user) return next(new Error("User not found"));

    // Extract the internal MongoDB ID for Startups or Incubators
    const profile = user.role === 'startup' ? user.startupProfile : user.incubatorProfile;
    if (!profile) return next(new Error("Profile not initialized"));

    // Attach profile data to the socket object for use in events
    socket.profileId = profile._id;
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
  console.log(`Connected: Profile ${socket.profileId} (Role: ${socket.role})`);

  // Join a specific chat room (ID_ID format)
  socket.on("join_room", (roomID) => {
    socket.join(roomID);
    console.log(`User ${socket.profileId} entered room: ${roomID}`);
  });

  // Handle outgoing messages
  socket.on("send_message", async (data) => {
    const { roomID, text } = data;
    
    try {
        if (!text || !roomID) return;

        const newMessage = new Message({ 
            conversationId: roomID, 
            sender: socket.profileId, 
            text 
        });

        await newMessage.save();

        // Broadcast to EVERYONE in the room (including the sender for confirmation)
        io.to(roomID).emit("receive_message", {
            _id: newMessage._id,
            conversationId: roomID, 
            sender: socket.profileId, 
            text, 
            createdAt: newMessage.createdAt
        });

    } catch (err) { 
        console.error("Message Processing Error:", err);
        socket.emit("error", { message: "Message delivery failed" }); 
    }
  });

  socket.on("disconnect", () => {
    console.log(`Disconnected: Profile ${socket.profileId}`);
  });
});

// Database Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully"))
  .catch(err => {
      console.error("❌ MongoDB Connection Error:", err.message);
      process.exit(1); // Exit if DB connection fails
  });

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/posts', postRoutes);
app.use('/api/myfeed', feedRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/profiles', profileRoutes);

// Error Handling Middleware for Express
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📡 Socket.io interface active`);
});