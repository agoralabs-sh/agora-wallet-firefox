import {
  ARC0027MethodNotSupportedError,
  ARC0027MethodTimedOutError,
  ARC0027UnknownError,
  AVMWebProvider,
  IAVMWebProviderCallbackOptions,
  DEFAULT_REQUEST_TIMEOUT,
  TResponseResults,
} from '@agoralabs-sh/avm-web-provider';
import browser from 'webextension-polyfill';

// constants
import { SUPPORTED_METHODS } from '@common/constants';

// message-brokers
import BaseMessageBroker from '@extension/message-brokers/BaseMessageBroker';

// messages
import { ClientRequestMessage, ClientResponseMessage } from '@common/messages';

// types
import type { INewOptions } from './types';

// utils
import createClientInformation from '@common/utils/createClientInformation';

export default class AVMWebProviderMessageBroker extends BaseMessageBroker {
  // private variables
  private readonly _avmWebProvider: AVMWebProvider;

  constructor({ debug, ...baseOptions }: INewOptions) {
    super(baseOptions);

    this._avmWebProvider = AVMWebProvider.init(__PROVIDER_ID__, {
      debug,
    });
  }

  /**
   * private functions
   */

  public async _onMessage(
    message: IAVMWebProviderCallbackOptions
  ): Promise<TResponseResults | void> {
    const _functionName = '_onMessage';

    this._logger?.debug(
      `${AVMWebProviderMessageBroker.name}#${_functionName} "${message.method}" request received`
    );

    if (!SUPPORTED_METHODS.includes(message.method)) {
      throw new ARC0027MethodNotSupportedError({
        method: message.method,
        providerId: __PROVIDER_ID__,
      });
    }

    return await this._sendRequestToExtensionWithTimeout(message);
  }

  private async _sendRequestToExtensionWithTimeout(
    requestMessage: IAVMWebProviderCallbackOptions
  ): Promise<TResponseResults> {
    return new Promise<TResponseResults>((resolve, reject) => {
      const listener = (message: ClientResponseMessage<TResponseResults>) => {
        // if the response's request id does not match the intended request, just ignore
        if (message.requestId !== requestMessage.id) {
          return;
        }

        // clear the timer, we can handle it from here
        window.clearTimeout(timer);

        if (message.error) {
          return reject(message.error);
        }

        if (!message.result) {
          return reject(
            new ARC0027UnknownError({
              message: `failed to get a result from "${message.method}" request`,
              providerId: __PROVIDER_ID__,
            })
          );
        }

        resolve(message.result);

        // clean up
        browser.runtime.onMessage.removeListener(listener.bind(this));
      };
      let timer: number;

      // listen to responses
      browser.runtime.onMessage.addListener(listener.bind(this));

      // remove listener after a timeout
      timer = window.setTimeout(() => {
        browser.runtime.onMessage.removeListener(listener.bind(this));

        return reject(
          new ARC0027MethodTimedOutError({
            method: requestMessage.method,
            providerId: __PROVIDER_ID__,
          })
        );
      }, DEFAULT_REQUEST_TIMEOUT);

      // send the message to the background script/popups
      browser.runtime.sendMessage(
        new ClientRequestMessage({
          clientInfo: createClientInformation(),
          id: requestMessage.id,
          method: requestMessage.method,
          params: requestMessage.params,
        })
      );
    });
  }

  /**
   * public functions
   */

  public startListening(): void {
    this._avmWebProvider.onDisable(this._onMessage.bind(this));
    this._avmWebProvider.onDiscover(this._onMessage.bind(this));
    this._avmWebProvider.onEnable(this._onMessage.bind(this));
    this._avmWebProvider.onPostTransactions(this._onMessage.bind(this));
    this._avmWebProvider.onSignAndPostTransactions(this._onMessage.bind(this));
    this._avmWebProvider.onSignMessage(this._onMessage.bind(this));
    this._avmWebProvider.onSignTransactions(this._onMessage.bind(this));
  }

  public stopListening() {}
}