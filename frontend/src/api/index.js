import axios from 'axios';

const BACKEND = import.meta.env.VITE_BACKEND_URL || '';
const api = axios.create({ baseURL: `${BACKEND}/api` });

export const getWebhooks = () => api.get('/webhooks');
export const createWebhook = (data) => api.post('/webhooks', data);
export const getLogs = (webhookId) => api.get('/logs', { params: { webhookId } });
export const getDevices = () => api.get('/devices');
export const getSmsHistory = () => api.get('/sms/history');
export const sendSms = (data) => api.post('/sms/send', data);
