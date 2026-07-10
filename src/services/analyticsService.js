import { API_BASE_URL } from './apiConfig';
import axios from 'axios';

// Instancia separada o reutilizando configuración (asumiendo que tu api.js usa el token)
// Para asegurar que el token siempre viaje, usamos el mismo interceptor o copiamos la lógica:
const api = axios.create({
  baseURL: `${API_BASE_URL}/api/analytics`,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access') || localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

export const analyticsService = {
  /**
   * Obtiene la distribución y evolución mensual del riesgo.
   */
  getDashboardStats: async () => {
    const response = await api.get('/dashboard');
    return response.data;
  },

  /**
   * Obtiene la lista de alertas predictivas generadas por la IA.
   */
  getRecommendations: async () => {
    const response = await api.get('/recommendations');
    return response.data;
  },

  /**
   * Envía el feedback (útil o no) sobre un dictamen de la IA.
   */
  submitFeedback: async (id_alerta, es_util, causa_rechazo = '', comentarios_adicionales = '') => {
    const response = await api.post('/feedback', {
      id_alerta,
      es_util,
      causa_rechazo,
      comentarios_adicionales
    });
    return response.data;
  }
};
