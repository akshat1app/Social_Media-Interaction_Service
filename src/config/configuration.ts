export const configuration = () => {
  return Object.freeze({
    MONGO_URI: process.env['DB_URL'],
    JWT_SECRET: process.env['JWT_SECRET'],

    mail: {
      user: process.env['mail_user'],
      pass: process.env['mail_pass'],
    },

    AWS_REGION: process.env['AWS_S3_REGION'],
    AWS_ACCESS_KEY: process.env['AWS_ACCESS_KEY_ID'],
    AWS_SECRET_KEY: process.env['AWS_SECRET_ACCESS_KEY'],
    AWS_S3_BUCKET: process.env['AWS_S3_BUCKET'],

    REDIS: {
      HOST: process.env['redis_host'],
      PORT: process.env['redis_port'],
    },
  });
};
