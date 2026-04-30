import api from "./api.js";

export const createPaymentIntentApi = async (token, payload) => {
  const { data } = await api.post("/payments/intent", payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return data;
};
