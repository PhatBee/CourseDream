import { Server } from "socket.io";

let io;

export const initSocket = (server) => {
  io = new Server(server, {
    cors: { origin: "*", methods: ["GET", "POST"] },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Authentication error"));

    // Verify token như verifyToken middleware
    try {
      const user = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Token invalid"));
    }
  });

  io.on("connection", (socket) => {
    console.log("User connected:", socket.user._id);

    // Join room của user để nhận thông báo riêng
    socket.join(`user_${socket.user._id}`);

    // Join room của các khóa học đang dạy (nếu là instructor)
    if (socket.user.role === "instructor") {
      // Có thể lấy danh sách course của instructor và join
    }

    socket.on("disconnect", () => {
      console.log("User disconnected");
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized!");
  return io;
};