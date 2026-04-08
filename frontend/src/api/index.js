import axios from 'axios';

const BACKEND = import.meta.env.VITE_BACKEND_URL || '';
const api = axios.create({ baseURL: `${BACKEND}/api` });

// Webhooks & logs
export const getWebhooks = () => api.get('/webhooks');
export const createWebhook = (data) => api.post('/webhooks', data);
export const getLogs = (webhookId) => api.get('/logs', { params: { webhookId } });

// Devices
export const getDevices = () => api.get('/devices');

// SMS
export const getSmsHistory = (params = {}) => api.get('/sms/history', { params });
export const sendSms = (data) => api.post('/sms/send', data);
export const exportSms = (params = {}) => {
  const qs = new URLSearchParams(params).toString();
  return `${BACKEND}/api/sms/export${qs ? '?' + qs : ''}`;
};

// Shablonlar
export const getTemplates = () => api.get('/templates');
export const createTemplate = (data) => api.post('/templates', data);
export const deleteTemplate = (id) => api.delete(`/templates/${id}`);

// Kontakt guruhlari
export const getGroups = () => api.get('/groups');
export const createGroup = (data) => api.post('/groups', data);
export const deleteGroup = (id) => api.delete(`/groups/${id}`);

// Jadval SMS
export const scheduleSms = (data) => api.post('/sms/schedule', data);
export const getScheduled = () => api.get('/sms/scheduled');
export const deleteScheduled = (id) => api.delete(`/sms/scheduled/${id}`);

// Statistika
export const getStats = () => api.get('/stats');

// Qo'ng'iroqlar
export const sendCall = (data) => api.post('/call/send', data);
export const getCallHistory = (params = {}) => api.get('/call/history', { params });
