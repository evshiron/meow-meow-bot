import { writeFile } from 'fs/promises';
import { User } from 'grammy/types';
import LRUCache from 'lru-cache';
import {
  ChatCompletionResponseMessage,
  ChatCompletionResponseMessageRoleEnum,
  OpenAIApi,
} from 'openai';
import { join } from 'path';

const DIR_SAVES = './data/saves';

export class Session {
  createdAt: Date;

  messages: ChatCompletionResponseMessage[] = [];

  constructor(public readonly user: User) {
    this.createdAt = new Date();
  }

  async completion(
    openai: OpenAIApi,
    content: string,
    role: ChatCompletionResponseMessageRoleEnum = ChatCompletionResponseMessageRoleEnum.User,
  ) {
    this.messages.push({
      role,
      content,
    });

    if (role === ChatCompletionResponseMessageRoleEnum.User) {
      try {
        const { data } = await openai.createChatCompletion({
          model: 'gpt-3.5-turbo',
          messages: this.messages,
        });

        const message = data.choices[0].message;

        if (message) {
          this.messages.push(message);
          return message?.content;
        } else {
          return 'message malformed';
        }
      } catch (err) {
        console.error(err);
        return 'request failed';
      }
    } else {
      return 'seal applied';
    }
  }
}

export class SessionManager {
  // uid to session
  lruSessions = new LRUCache<number, Session>({
    // how many sessions to keep at a time
    max: 30,

    // 1 day
    ttl: 24 * 60 * 60 * 1000,

    // save session before removing
    dispose: (value) => {
      if (value.messages.filter((x) => x.role === 'assistant').length) {
        writeFile(
          join(
            DIR_SAVES,
            `${value.user.id}_${
              value.messages.length
            }_${+value.createdAt}.json`,
          ),
          JSON.stringify(value),
        );
      }
    },
  });

  getSession(user: User): Session | undefined {
    if (!this.lruSessions.has(user.id)) {
      this.lruSessions.set(user.id, new Session(user));
    }

    return this.lruSessions.get(user.id);
  }

  clearSession(user: User) {
    this.lruSessions.delete(user.id);
  }
}
