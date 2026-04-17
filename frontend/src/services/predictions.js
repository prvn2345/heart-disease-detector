/**
 * predictions.js
 * API helpers for prediction-related endpoints.
 */

import api from "./api";

export const createPrediction = (data)   => api.post("/predictions", data);
export const getPredictions   = (params) => api.get("/predictions", { params });
export const getPredictionById = (id)    => api.get(`/predictions/${id}`);
export const deletePrediction  = (id)    => api.delete(`/predictions/${id}`);
export const getStats          = ()      => api.get("/predictions/stats");
