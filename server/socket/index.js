// server/socket/index.js

const setupSocket = (io) => {
    io.on("connection", (socket) => {
        // 1. Handshake Identity
        // We get the myProfileId passed from App.jsx auth object
        const myProfileId = socket.handshake.auth.myProfileId;

        if (myProfileId) {
            // User joins their own private room (e.g., room "65bc...")
            // This is used for global unread badge notifications
            socket.join(myProfileId);
            console.log(`🔌 User ${myProfileId} connected and joined private notification room.`);
        }

        // 2. Joining a Specific Conversation
        socket.on("join_room", (roomKey) => {
            socket.join(roomKey);
            console.log(`📡 Device linked to shared conversation room: ${roomKey}`);
        });

        // 3. Handling Message Transmission
        socket.on("send_message", (data) => {
            // data format: { roomKey, conversationId, senderId, receiverId, text, createdAt }
            
            // Broadcast to everyone in the shared chat room (including sender on other tabs)
            io.to(data.roomKey).emit("receive_message", data);
            
            // Send a specific notification to the receiver's private room 
            // This triggers the unread badge in App.jsx
            io.to(data.receiverId).emit("receive_message_notification", data);
        });

        socket.on("disconnect", () => {
            console.log("❌ User disconnected from socket");
        });
    });
};

export default setupSocket;