import { encode as encodeBase64 } from '@stablelib/base64';
import { v4 as uuid } from 'uuid';

// errors
import {
  UnknownError,
  WebAuthnMalformedRegistrationRequestError,
} from '@common/errors';

// enums
import { WebAuthnMessageReferenceEnum } from '@common/enums';

// constants
import {
  DEFAULT_REQUEST_TIMEOUT,
  WEB_AUTHN_REQUEST_TIMEOUT,
} from '@external/constants';

// messages
import WebAuthnConfigRequestMessage from '@common/messages/WebAuthnConfigRequestMessage';
import WebAuthnRegisterRequestMessage from '@common/messages/WebAuthnRegisterRequestMessage';

// types
import type { IResult as WebAuthnConfigResponseMessageResult } from '@common/messages/WebAuthnConfigResponseMessage';
import type { IResult as WebAuthnRegisterResponseMessageResult } from '@common/messages/WebAuthnRegisterResponseMessage';
import type {
  IBaseMessage,
  IBaseOptions,
  IBaseResponseMessage,
  IExternalConfig,
  ILogger,
  ISerializedPublicKeyCredentialCreationOptions,
} from '@common/types';
import type {
  IDispatchMessageWithTimeoutOptions,
  IRegisterOptions,
  IRegisterResult,
} from './types';

// utils
import bufferSourceToUint8Array from '@common/utils/bufferSourceToUint8Array';

export default class WebAuthnMessageManager {
  // private variables
  private readonly _logger: ILogger | null;

  constructor({ logger }: IBaseOptions) {
    this._logger = logger || null;
  }

  /**
   * private functions
   */

  private async _dispatchMessageWithTimeout<
    Result,
    Message extends IBaseMessage<WebAuthnMessageReferenceEnum>
  >({
    delay = DEFAULT_REQUEST_TIMEOUT,
    message,
    responseReference,
  }: IDispatchMessageWithTimeoutOptions<Message>): Promise<Result | null> {
    return new Promise((resolve, reject) => {
      const _functionName = '_dispatchMessageWithTimeout';
      const listener = (event: CustomEvent<string>) => {
        let detail: IBaseResponseMessage<Result, WebAuthnMessageReferenceEnum>;

        try {
          detail = JSON.parse(event.detail); // the event.detail should be a stringified message object
        } catch (error) {
          this._logger?.debug(
            `${WebAuthnMessageManager.name}#${_functionName}:`,
            error
          );

          // clear the timeout and remove the listener - we failed to parse the message
          window.clearTimeout(timerId);
          window.removeEventListener(responseReference, listener);

          return reject(new UnknownError(error.message));
        }

        // if the request ids or the references do not match ignore - the message may be still coming
        if (
          detail.requestID !== message.id ||
          detail.reference !== responseReference
        ) {
          return;
        }

        // clear the timeout and remove the listener - we can handle it from here
        window.clearTimeout(timerId);
        window.removeEventListener(responseReference, listener);

        // if there was an error return it
        if (detail.error) {
          return reject(detail.error);
        }

        this._logger?.debug(
          `${WebAuthnMessageManager.name}#${_functionName}: received response "${detail.reference}" for request "${detail.requestID}"`
        );

        // return the result
        return resolve(detail.result);
      };
      const timerId = window.setTimeout(() => {
        // remove the listener
        window.removeEventListener(responseReference, listener);

        reject(new UnknownError(`no response from provider`));
      }, delay);

      // listen for the response
      window.addEventListener(responseReference, listener);

      // dispatch the request message
      window.dispatchEvent(
        new CustomEvent(message.reference, {
          detail: message,
        })
      );

      this._logger?.debug(
        `${WebAuthnMessageManager.name}#${_functionName}: posted webauthn request message "${message.reference}" with id "${message.id}"`
      );
    });
  }

  /**
   * Convenience function that serializes the public key creation credentials, converting any raw bytes to base64
   * encoded strings to allow to posting to the extension.
   * @param {PublicKeyCredentialCreationOptions} options - The public key creation options to serialize.
   * @returns {ISerializedPublicKeyCredentialCreationOptions} The serialized public key creation options.
   * @private
   */
  private static _serializePublicKeyCreationOptions({
    challenge,
    excludeCredentials,
    user,
    ...otherOptions
  }: PublicKeyCredentialCreationOptions): ISerializedPublicKeyCredentialCreationOptions {
    return {
      ...otherOptions,
      challenge: encodeBase64(bufferSourceToUint8Array(challenge)),
      user: {
        ...user,
        id: encodeBase64(bufferSourceToUint8Array(user.id)),
      },
      ...(excludeCredentials && {
        excludeCredentials: excludeCredentials.map(
          ({ id, ...otherExcludeCredentialProps }) => ({
            ...otherExcludeCredentialProps,
            id: encodeBase64(bufferSourceToUint8Array(id)),
          })
        ),
      }),
    };
  }

  /**
   * public functions
   */

  public async config(): Promise<IExternalConfig | null> {
    const result = await this._dispatchMessageWithTimeout<
      WebAuthnConfigResponseMessageResult,
      WebAuthnConfigRequestMessage
    >({
      message: new WebAuthnConfigRequestMessage({
        id: uuid(),
        reference: WebAuthnMessageReferenceEnum.ConfigRequest,
      }),
      responseReference: WebAuthnMessageReferenceEnum.ConfigResponse,
    });

    return result?.config || null;
  }

  public async register({
    clientInfo,
    publicKeyCreationOptions,
  }: IRegisterOptions): Promise<IRegisterResult | null> {
    let result: WebAuthnRegisterResponseMessageResult | null;

    if (!publicKeyCreationOptions) {
      throw new WebAuthnMalformedRegistrationRequestError(
        'no public key creation options supplied'
      );
    }

    result = await this._dispatchMessageWithTimeout<
      WebAuthnRegisterResponseMessageResult,
      WebAuthnRegisterRequestMessage
    >({
      delay: WEB_AUTHN_REQUEST_TIMEOUT,
      message: new WebAuthnRegisterRequestMessage({
        id: uuid(),
        payload: {
          clientInfo,
          options: WebAuthnMessageManager._serializePublicKeyCreationOptions(
            publicKeyCreationOptions
          ),
        },
        reference: WebAuthnMessageReferenceEnum.RegisterRequest,
      }),
      responseReference: WebAuthnMessageReferenceEnum.RegisterResponse,
    });

    if (!result) {
      return null;
    }

    // TODO: convert serialized public key credential
    return {
      account: result.account,
      credential: new PublicKeyCredential(),
    };
  }
}
