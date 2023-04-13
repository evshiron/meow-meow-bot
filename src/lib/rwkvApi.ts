import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import {
  CreateChatCompletionRequest,
  CreateChatCompletionResponse,
} from 'openai';

export class RwkvApi {
  constructor(private readonly baseUrl: string) {}

  createChatCompletion(
    createChatCompletionRequest: CreateChatCompletionRequest,
    options?: AxiosRequestConfig,
  ): Promise<AxiosResponse<CreateChatCompletionResponse>> {
    return axios
      .post(
        `${this.baseUrl}/chat/completions`,
        createChatCompletionRequest,
        options,
      )
      .then((res) => {
        return {
          ...res,
          data: {
            choices: [{
              message: res.data.messages[res.data.messages.length - 1],
            }],
          },
        } as any;
      });
  }
}
