/**
 * Abstract Message Repository
 * @file src/core/domain/repositories/message.repository.abstract.ts
 */

import {
  MessageEntity,
  SendMessageRequest,
  EditMessageRequest,
  DeleteMessageRequest,
  Attachment,
  Reaction,
} from '../entities/message.entity';

/**
 * Abstract Message Repository
 * Defines all message-related operations
 */
export abstract class MessageRepository {
  /**
   * Send message
   * @param request - Message send details
   * @returns Sent message entity
   */
  abstract sendMessage(request: SendMessageRequest): Promise<MessageEntity>;

  /**
   * Get message by ID
   * @param conversationId - Conversation ID
   * @param messageId - Message ID
   * @returns Message entity
   */
  abstract getMessage(conversationId: string, messageId: string): Promise<MessageEntity | null>;

  /**
   * Get messages for conversation
   * @param conversationId - Conversation ID
   * @param limit - Number of messages to fetch
   * @param startAfter - Pagination cursor (last message timestamp)
   * @returns Array of message entities (newest first)
   */
  abstract getMessages(
    conversationId: string,
    limit?: number,
    startAfter?: Date,
  ): Promise<MessageEntity[]>;

  /**
   * Get messages for a specific date range
   * @param conversationId - Conversation ID
   * @param startDate - Start date
   * @param endDate - End date
   * @returns Array of messages
   */
  abstract getMessagesByDateRange(
    conversationId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<MessageEntity[]>;

  /**
   * Edit message
   * @param request - Edit details
   * @returns Updated message entity
   */
  abstract editMessage(request: EditMessageRequest): Promise<MessageEntity>;

  /**
   * Delete message
   * @param request - Delete details
   */
  abstract deleteMessage(request: DeleteMessageRequest): Promise<void>;

  /**
   * Mark message as read
   * @param conversationId - Conversation ID
   * @param messageId - Message ID
   * @param userId - User ID
   */
  abstract markAsRead(conversationId: string, messageId: string, userId: string): Promise<void>;

  /**
   * Mark multiple messages as read
   * @param conversationId - Conversation ID
   * @param messageIds - Array of message IDs
   * @param userId - User ID
   */
  abstract markMultipleAsRead(
    conversationId: string,
    messageIds: string[],
    userId: string,
  ): Promise<void>;

  /**
   * Add reaction to message
   * @param conversationId - Conversation ID
   * @param messageId - Message ID
   * @param userId - User ID
   * @param emoji - Emoji reaction
   */
  abstract addReaction(
    conversationId: string,
    messageId: string,
    userId: string,
    emoji: string,
  ): Promise<void>;

  /**
   * Remove reaction from message
   * @param conversationId - Conversation ID
   * @param messageId - Message ID
   * @param userId - User ID
   * @param emoji - Emoji reaction
   */
  abstract removeReaction(
    conversationId: string,
    messageId: string,
    userId: string,
    emoji: string,
  ): Promise<void>;

  /**
   * Forward message
   * @param conversationId - Source conversation ID
   * @param messageId - Message ID
   * @param targetConversationId - Target conversation ID
   * @param userId - User ID
   */
  abstract forwardMessage(
    conversationId: string,
    messageId: string,
    targetConversationId: string,
    userId: string,
  ): Promise<MessageEntity>;

  /**
   * Search messages
   * @param conversationId - Conversation ID
   * @param query - Search query
   * @returns Array of matching messages
   */
  abstract searchMessages(conversationId: string, query: string): Promise<MessageEntity[]>;

  /**
   * Get message count for conversation
   * @param conversationId - Conversation ID
   */
  abstract getMessageCount(conversationId: string): Promise<number>;

  /**
   * Listen to messages changes
   * @param conversationId - Conversation ID
   * @param callback - Function to call when messages change
   */
  abstract observeMessages(
    conversationId: string,
    limit?: number,
    callback?: (messages: MessageEntity[]) => void,
  ): () => void;

  /**
   * Listen to new messages (live updates)
   * @param conversationId - Conversation ID
   * @param callback - Function to call for new messages
   */
  abstract observeNewMessages(
    conversationId: string,
    callback: (message: MessageEntity) => void,
  ): () => void;

  /**
   * Listen to message updates (edits, reactions, etc)
   * @param conversationId - Conversation ID
   * @param messageId - Message ID
   * @param callback - Function to call when message updates
   */
  abstract observeMessageUpdates(
    conversationId: string,
    messageId: string,
    callback: (message: MessageEntity) => void,
  ): () => void;

  /**
   * Get last message in conversation
   * @param conversationId - Conversation ID
   */
  abstract getLastMessage(conversationId: string): Promise<MessageEntity | null>;

  /**
   * Check if message exists
   * @param conversationId - Conversation ID
   * @param messageId - Message ID
   */
  abstract messageExists(conversationId: string, messageId: string): Promise<boolean>;

  /**
   * Batch delete messages
   * @param conversationId - Conversation ID
   * @param messageIds - Array of message IDs
   * @param deleteFor - 'me' or 'everyone'
   */
  abstract batchDeleteMessages(
    conversationId: string,
    messageIds: string[],
    deleteFor: 'me' | 'everyone',
  ): Promise<void>;

  /**
   * Clear conversation history
   * @param conversationId - Conversation ID
   * @param userId - User ID
   */
  abstract clearConversationHistory(conversationId: string, userId: string): Promise<void>;
}
