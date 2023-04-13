import { Bot } from 'grammy';
import { SocksProxyAgent } from 'socks-proxy-agent';
import {
  ChatCompletionResponseMessageRoleEnum,
  Configuration,
  OpenAIApi,
} from 'openai';
import { autoQuote } from '@roziscoding/grammy-autoquote';

import {
  OPENAI_SECRET_KEY,
  RWKV_BASE_URL,
  SOCKS_PROXY,
  TELEGRAM_BOT_TOKEN,
} from './lib/config';
import { SessionManager } from './lib/session';
import { RwkvApi } from './lib/rwkvApi';

let agent;

if (SOCKS_PROXY) {
  agent = new SocksProxyAgent(SOCKS_PROXY);
}

const bot = new Bot(TELEGRAM_BOT_TOKEN, {
  client: {
    baseFetchConfig: {
      agent,
    },
  },
});

bot.use(autoQuote);

// const api = new OpenAIApi(
//   new Configuration({
//     apiKey: OPENAI_SECRET_KEY,
//   }),
// );

const api = new RwkvApi(RWKV_BASE_URL);

const sessionManager = new SessionManager();

bot.on('message', async (ctx) => {
  // in private we support some magic commands
  if (ctx.chat.type === 'private') {
    if (ctx.message.text?.startsWith('//system ')) {
      const session = sessionManager.getSession(ctx.message.from);
      const message = await session.completion(
        api,
        ctx.message.text.slice(9),
        ChatCompletionResponseMessageRoleEnum.System,
      );
      if (message) {
        ctx.reply(message);
      }
    } else if (ctx.message.text?.startsWith('//revert')) {
      const session = sessionManager.getSession(ctx.message.from);
      const message = session.popMessage();
      if (message) {
        ctx.reply(`message ${message.content} reverted`);
      } else {
        ctx.reply(`message revert failed`);
      }
    } else if (ctx.message.text?.startsWith('//reset')) {
      sessionManager.clearSession(ctx.message.from);
      ctx.reply('session reset');
    } else if (ctx.message.text) {
      const session = sessionManager.getSession(ctx.message.from);
      const message = await session.completion(api, ctx.message.text);
      if (message) {
        ctx.reply(message);
      }
    }
    // in group only messages with mention or reply are handled
  } else if (
    ctx.message.text &&
    (ctx.message.text.includes(`@${bot.botInfo.username}`) ||
      ctx.message.reply_to_message?.from?.username === bot.botInfo.username)
  ) {
    const session = sessionManager.getSession(ctx.message.from);
    const message = await session?.completion(
      api,
      ctx.message.text.replace(`@${bot.botInfo.username}`, ''),
    );
    if (message) {
      ctx.reply(message);
    }
  }
});

bot.start();
