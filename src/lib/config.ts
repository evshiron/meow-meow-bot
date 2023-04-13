const requiredEnv = (key: string): string => {
  const value = process.env[key];
  if (value) {
    return value;
  } else {
    console.error(`process.env.${key} = ${process.env[key]}`);
    process.exit(1);
  }
};

export const TELEGRAM_BOT_TOKEN = requiredEnv('TELEGRAM_BOT_TOKEN');
export const OPENAI_SECRET_KEY = process.env.OPENAI_SECRET_KEY as string;
export const RWKV_BASE_URL = process.env.RWKV_BASE_URL as string;

export const SOCKS_PROXY = process.env.SOCKS_PROXY;
