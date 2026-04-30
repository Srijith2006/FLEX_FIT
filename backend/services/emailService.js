export const sendEmail = async ({ to, subject, html }) => {
  return { ok: true, to, subject, htmlLength: html?.length || 0 };
};
