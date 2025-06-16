export const configuration = () => {
  return Object.freeze({
    MONGO_URI: process.env['DB_URL']
  });
};
