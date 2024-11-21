import browser from 'webextension-polyfill';

// enums
import { WebAuthnMessageReferenceEnum } from '@common/enums';

// message-brokers
import BaseMessageBroker from '@extension/message-brokers/BaseMessageBroker';

// messages
import {
  WebAuthnCreateRequestMessage,
  WebAuthnCreateResponseMessage,
  WebAuthnGetRequestMessage,
  WebAuthnGetResponseMessage,
} from '@common/messages';

/**
 * The WebAuthn message broker listens to messages the client (the `WebAuthnManager` that is injected in the webpage via
 * `webauthn-manager.js`) and the provider (background script/popup) and transfers the messages between the two.
 */
export default class WebAuthnMessageBroker extends BaseMessageBroker {
  /**
   * private methods
   */

  private _onClientMessage(
    reference: WebAuthnMessageReferenceEnum,
    message: CustomEvent<
      WebAuthnCreateRequestMessage | WebAuthnGetRequestMessage
    >
  ) {
    const _functionName = '_onClientMessage';

    this._logger?.debug(
      `${WebAuthnMessageBroker.name}#${_functionName}: received client message "${reference}" with id "${message.detail.id}"`
    );

    // send message to provider
    browser.runtime.sendMessage(message);
  }

  private _onProviderMessage(
    message: WebAuthnCreateResponseMessage | WebAuthnGetResponseMessage
  ): void {
    const _functionName = '_onProviderMessage';

    this._logger?.debug(
      `${WebAuthnMessageBroker.name}#${_functionName}: received provider message "${message.reference}" with id "${message.id}"`
    );

    // dispatch message to the client
    window.dispatchEvent(
      new CustomEvent(message.reference, {
        detail: message,
      })
    );
  }

  /**
   * public methods
   */

  public startListening(): void {
    // listen to client messages
    [
      WebAuthnMessageReferenceEnum.CreateRequest,
      WebAuthnMessageReferenceEnum.GetRequest,
    ].forEach((reference) =>
      window.addEventListener(
        reference,
        this._onClientMessage.bind(this, reference)
      )
    );

    // listen to provider messages
    browser.runtime.onMessage.addListener(this._onProviderMessage.bind(this));
  }

  public stopListening(): void {
    // remove client listeners
    [
      WebAuthnMessageReferenceEnum.CreateRequest,
      WebAuthnMessageReferenceEnum.GetRequest,
    ].forEach((reference) =>
      window.removeEventListener(
        reference,
        this._onClientMessage.bind(this, reference)
      )
    );

    // remove provider listeners
    browser.runtime.onMessage.removeListener(
      this._onProviderMessage.bind(this)
    );
  }
}