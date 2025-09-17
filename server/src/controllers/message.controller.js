import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const conversationInclude = {
  participants: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      profilePhoto: true,
      medicalSchool: true
    }
  },
  messages: {
    orderBy: { createdAt: 'desc' },
    take: 1,
    include: {
      sender: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          profilePhoto: true
        }
      }
    }
  }
};

const formatConversation = async (conversation, userId) => {
  const unreadCount = await prisma.message.count({
    where: {
      conversationId: conversation.id,
      senderId: { not: userId },
      isRead: false
    }
  });

  return {
    id: conversation.id,
    lastMessageAt: conversation.lastMessageAt,
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
    participants: conversation.participants,
    lastMessage: conversation.messages[0] ?? null,
    unreadCount
  };
};

export const getUserConversations = async (req, res) => {
  try {
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { id: req.user.id }
        }
      },
      include: conversationInclude,
      orderBy: [
        { lastMessageAt: 'desc' },
        { updatedAt: 'desc' }
      ]
    });

    const formatted = await Promise.all(
      conversations.map((conversation) => formatConversation(conversation, req.user.id))
    );

    res.json(formatted);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to load conversations' });
  }
};

export const createConversation = async (req, res) => {
  try {
    const { participantId } = req.body;

    if (!participantId) {
      return res.status(400).json({ error: 'participantId is required' });
    }

    if (participantId === req.user.id) {
      return res.status(400).json({ error: 'Cannot create a conversation with yourself' });
    }

    const participant = await prisma.user.findUnique({
      where: { id: participantId },
      select: { id: true }
    });

    if (!participant) {
      return res.status(404).json({ error: 'Participant not found' });
    }

    const existingConversation = await prisma.conversation.findFirst({
      where: {
        participants: {
          some: { id: req.user.id }
        },
        AND: {
          participants: {
            some: { id: participantId }
          }
        }
      },
      include: conversationInclude
    });

    if (existingConversation) {
      const formatted = await formatConversation(existingConversation, req.user.id);
      return res.json(formatted);
    }

    const conversation = await prisma.conversation.create({
      data: {
        participants: {
          connect: [{ id: req.user.id }, { id: participantId }]
        }
      },
      include: conversationInclude
    });

    const formatted = await formatConversation(conversation, req.user.id);
    res.status(201).json(formatted);
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
};

export const getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: {
          some: { id: req.user.id }
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }

    const messages = await prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            profilePhoto: true
          }
        }
      }
    });

    await prisma.message.updateMany({
      where: {
        conversationId,
        senderId: { not: req.user.id },
        isRead: false
      },
      data: {
        isRead: true,
        readAt: new Date()
      }
    });

    res.json(messages);
  } catch (error) {
    console.error('Get conversation messages error:', error);
    res.status(500).json({ error: 'Failed to load messages' });
  }
};
