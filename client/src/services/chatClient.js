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
  return await apiClient.get(`/chat/conversations/${conversationId}/messages`, {
    params: { ...params, _t: Date.now() },
  });
};

export const sendMessageApi = async (conversationIdOrData, maybePayload) => {
  let conversationId = conversationIdOrData;
  let payload = {};

  if (typeof conversationIdOrData === 'object' && conversationIdOrData !== null) {
    conversationId = conversationIdOrData.conversationId;
    payload = {
      text: conversationIdOrData.text || '',
      attachments: conversationIdOrData.attachments || [],
      isForwarded: Boolean(conversationIdOrData.isForwarded),
    };
  } else if (typeof maybePayload === 'object' && maybePayload !== null) {
    payload = {
      text: maybePayload.text || '',
      attachments: maybePayload.attachments || [],
      isForwarded: Boolean(maybePayload.isForwarded),
    };
  } else {
    payload = { text: maybePayload || '' };
  }

  return await apiClient.post(`/chat/conversations/${conversationId}/messages`, payload);
};

export const uploadChatFilesApi = async (files) => {
  const formData = new FormData();
  if (Array.isArray(files)) {
    files.forEach((file) => formData.append('attachments', file));
  } else if (files) {
    formData.append('attachments', files);
  }

  return await apiClient.post('/chat/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
};

export const reactToMessageApi = async (messageId, emoji) => {
  return await apiClient.post(`/chat/messages/${messageId}/react`, { emoji });
};

export const deleteMessageApi = async (messageId, deleteFor = 'everyone') => {
  return await apiClient.delete(`/chat/messages/${messageId}`, {
    data: { deleteFor },
  });
};

export const batchDeleteMessagesApi = async (messageIds, deleteFor = 'me') => {
  return await apiClient.post('/chat/messages/batch-delete', {
    messageIds,
    deleteFor,
  });
};

export const forwardMessageApi = async (messageId, targetConversationIds) => {
  return await apiClient.post(`/chat/messages/${messageId}/forward`, { targetConversationIds });
};

export const fetchConversationMediaApi = async (conversationId) => {
  return await apiClient.get(`/chat/conversations/${conversationId}/media`, {
    params: { _t: Date.now() },
  });
};

export const clearConversationApi = async (conversationId) => {
  return await apiClient.delete(`/chat/conversations/${conversationId}/clear`);
};

export const toggleBlockConversationApi = async (conversationId) => {
  return await apiClient.post(`/chat/conversations/${conversationId}/block`);
};

export const fetchConversationStorageApi = async (conversationId) => {
  return await apiClient.get(`/chat/conversations/${conversationId}/storage`, {
    params: { _t: Date.now() },
  });
};

export const markConversationReadApi = async (conversationId) => {
  return await apiClient.patch(`/chat/conversations/${conversationId}/read`);
};

export const fetchTotalUnreadCountApi = async () => {
  return await apiClient.get('/chat/unread-count');
};
