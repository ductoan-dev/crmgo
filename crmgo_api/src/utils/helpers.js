export const genCode = (prefix) => {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `${prefix}${mm}${dd}${rand}`;
};

export const makeWfEntry = (step, byUser, note = '') => ({
  step,
  by_user: byUser,
  note,
});

export const successRes = (res, data, statusCode = 200) =>
  res.status(statusCode).json({ success: true, data });

export const errorRes = (res, message, statusCode = 400) =>
  res.status(statusCode).json({ success: false, message });
