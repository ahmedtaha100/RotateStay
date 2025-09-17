import { Router } from 'express';
import { authenticate } from '../middleware/auth.js';
import {
  createConversation,
  getConversationMessages,
  getUserConversations
} from '../controllers/message.controller.js';

const router = Router();

router.use(authenticate);

router.get('/conversations', getUserConversations);
router.post('/conversations', createConversation);
router.get('/:conversationId', getConversationMessages);

export default router;
