export const notifyUser = async ({ userId, title, message }) => {
  return { ok: true, userId, title, message };
};
