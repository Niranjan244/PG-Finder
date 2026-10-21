import apiClient from './apiClient.js';

export const fetchChatTokenApi = async () => {
  return await apiClient.get('/chat/token', { params: { _t: Date.now() } });
};

export const startConversationApi = async (arg) => {
  const pgId = typeof arg === 'object' && arg !== null ? arg.pgId || arg._id : arg;
  return await apiClient.post('/chat/start', { pgId });
};

export const fetchMyConversationsApi = async () => {
  return await apiClient.get('/chat/conversations');
};

export const fetchConversationMessagesApi = async (conversationId, params = {}) => {
  return await apiClient.get(`/chat/conversations/${conversationId}/messages`, { params });
};

export const sendMessageApi = async (conversationIdOrData, maybeText) => {
  let conversationId = conversationIdOrData;
  let text = maybeText;
  if (typeof conversationIdOrData === 'object' && conversationIdOrData !== null) {
    conversationId = conversationIdOrData.conversationId;
    text = conversationIdOrData.text;
  }
  return await apiClient.post(`/chat/conversations/${conversationId}/messages`, { text });
};

export const markConversationReadApi = async (conversationId) => {
  return await apiClient.patch(`/chat/conversations/${conversationId}/read`);
};

export const fetchTotalUnreadCountApi = async () => {
  return await apiClient.get('/chat/unread-count');
};
