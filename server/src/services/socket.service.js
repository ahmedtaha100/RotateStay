import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import DOMPurify from 'isomorphic-dompurify';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const prisma = new PrismaClient();

const messageRateLimiter = new RateLimiterMemory({
  points: 30,
  duration: 60
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const UPLOAD_DIR = path.join(__dirname, '../../uploads');

const ensureUploadsDir = async () => {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
};

export class ChatService {
  constructor(io) {
    this.io = io;
    this.userSockets = new Map();
    this.initializeHandlers();
  }

  initializeHandlers() {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth?.token;
        if (!token) {
          throw new Error('Authentication failed');
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await prisma.user.findUnique({
          where: { id: decoded.id },
          select: { id: true, firstName: true, lastName: true }
        });

        if (!user) {
          throw new Error('User not found');
        }

        socket.userId = user.id;
        socket.user = user;
        next();
      } catch (err) {
        next(new Error('Authentication failed'));
      }
    });

    this.io.on('connection', (socket) => {
      this.registerSocket(socket);
    });
  }

  registerSocket(socket) {
    const existing = this.userSockets.get(socket.userId) ?? new Set();
    existing.add(socket.id);
    this.userSockets.set(socket.userId, existing);

    socket.join(`user:${socket.userId}`);

    socket.on('join-conversations', async () => {
      const conversations = await prisma.conversation.findMany({
        where: {
          participants: {
            some: { id: socket.userId }
          }
        },
        select: { id: true }
      });

      conversations.forEach((conversation) => {
        socket.join(`conversation:${conversation.id}`);
      });
    });

    socket.on('send-message', async (data, callback) => {
      try {
        await messageRateLimiter.consume(socket.userId);

        const { conversationId, content = '', fileData } = data ?? {};
        const sanitizedContent = DOMPurify.sanitize(content, {
          ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
          ALLOWED_ATTR: ['href', 'target']
        }).trim();

        if (!conversationId) {
          throw new Error('Conversation required');
        }

        if (!sanitizedContent && !fileData) {
          throw new Error('Message cannot be empty');
        }

        const conversation = await prisma.conversation.findFirst({
          where: {
            id: conversationId,
            participants: {
              some: { id: socket.userId }
            }
          },
          include: {
            participants: {
              select: { id: true, firstName: true, lastName: true }
            }
          }
        });

        if (!conversation) {
          throw new Error('Unauthorized');
        }

        let fileUrl = null;
        let fileType = null;
        let fileName = null;

        if (fileData) {
          const processedFile = await this.processFile(fileData);
          fileUrl = processedFile.url;
          fileType = processedFile.type;
          fileName = processedFile.name;
        }

        const messageContent = sanitizedContent || (fileData ? 'Shared a file' : '');

        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId: socket.userId,
            content: messageContent,
            fileUrl,
            fileType,
            fileName
          },
          include: {
            sender: {
              select: { id: true, firstName: true, lastName: true, profilePhoto: true }
            }
          }
        });

        await prisma.conversation.update({
          where: { id: conversationId },
          data: { lastMessageAt: new Date() }
        });

        this.io.to(`conversation:${conversationId}`).emit('new-message', {
          message,
          conversationId
        });

        const otherParticipants = conversation.participants.filter((participant) => participant.id !== socket.userId);
        for (const participant of otherParticipants) {
          const sockets = this.userSockets.get(participant.id);
          if (!sockets || sockets.size === 0) {
            await this.sendPushNotification(participant.id, {
              title: `${socket.user.firstName} ${socket.user.lastName}`.trim(),
              body: messageContent.substring(0, 100) || 'Sent you a file',
              data: { conversationId }
            });
          }
        }

        callback?.({ success: true, message });
      } catch (error) {
        if (error?.msBeforeNext) {
          callback?.({ success: false, error: 'Too many messages. Please slow down.' });
          return;
        }
        console.error('Send message error:', error);
        callback?.({ success: false, error: error.message || 'Failed to send message' });
      }
    });

    socket.on('mark-as-read', async ({ conversationId }) => {
      if (!conversationId) {
        return;
      }

      const readAt = new Date();
      await prisma.message.updateMany({
        where: {
          conversationId,
          senderId: { not: socket.userId },
          isRead: false
        },
        data: {
          isRead: true,
          readAt
        }
      });

      this.io.to(`conversation:${conversationId}`).emit('messages-read', {
        conversationId,
        readBy: socket.userId,
        readAt
      });
    });

    socket.on('typing-start', ({ conversationId }) => {
      if (!conversationId) return;
      socket.to(`conversation:${conversationId}`).emit('user-typing', {
        conversationId,
        userId: socket.userId,
        userName: `${socket.user.firstName} ${socket.user.lastName}`.trim()
      });
    });

    socket.on('typing-stop', ({ conversationId }) => {
      if (!conversationId) return;
      socket.to(`conversation:${conversationId}`).emit('user-stopped-typing', {
        conversationId,
        userId: socket.userId
      });
    });

    socket.on('disconnect', () => {
      const sockets = this.userSockets.get(socket.userId);
      if (sockets) {
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          this.userSockets.delete(socket.userId);
        } else {
          this.userSockets.set(socket.userId, sockets);
        }
      }
    });
  }

  async processFile(fileData) {
    await ensureUploadsDir();

    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx/;
    const ext = path.extname(fileData.name || '').toLowerCase();
    const mime = (fileData.type || '').toLowerCase();

    if (!allowedTypes.test(ext) || !allowedTypes.test(mime)) {
      throw new Error('Invalid file type. Only images and documents are allowed.');
    }

    const buffer = this.toBuffer(fileData.buffer);
    const maxFileSize = 10 * 1024 * 1024;
    if (buffer.length > maxFileSize) {
      throw new Error('File size must be less than 10MB');
    }

    const fileId = crypto.randomBytes(16).toString('hex');
    const fileName = `${fileId}${ext}`;
    const filePath = path.join(UPLOAD_DIR, fileName);
    let outputBuffer = buffer;

    if (mime.startsWith('image/')) {
      try {
        outputBuffer = await sharp(buffer)
          .rotate()
          .resize({ width: 1600, withoutEnlargement: true })
          .withMetadata()
          .toBuffer();
      } catch (error) {
        console.warn('Image processing failed, storing original buffer', error);
        outputBuffer = buffer;
      }
    }

    await fs.writeFile(filePath, outputBuffer);

    return {
      url: `/uploads/${fileName}`,
      type: mime,
      name: fileData.name || fileName
    };
  }

  toBuffer(fileBuffer) {
    if (!fileBuffer) {
      throw new Error('Invalid file payload');
    }

    if (fileBuffer instanceof ArrayBuffer) {
      return Buffer.from(fileBuffer);
    }

    if (Array.isArray(fileBuffer)) {
      return Buffer.from(fileBuffer);
    }

    if (typeof fileBuffer === 'string') {
      return Buffer.from(fileBuffer, 'base64');
    }

    if (Buffer.isBuffer(fileBuffer)) {
      return fileBuffer;
    }

    return Buffer.from(fileBuffer);
  }

  async sendPushNotification(userId, notification) {
    await prisma.notification.create({
      data: {
        userId,
        type: 'MESSAGE',
        title: notification.title,
        content: notification.body,
        link: `/messages?conversation=${notification.data?.conversationId || ''}`
      }
    });
  }
}
