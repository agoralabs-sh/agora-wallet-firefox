// enums
import { WebAuthnMessageReferenceEnum } from '@common/enums';

// errors
import { BaseExtensionError } from '@extension/errors';

// types
import type { IWebAuthnResponseMessage } from '@common/types';

export default class WebAuthnCreateResponseMessage
  implements IWebAuthnResponseMessage
{
  public readonly error: BaseExtensionError | null;
  public readonly id: string;
  public readonly requestID: string;
  public readonly result: PublicKeyCredential | null;
  public readonly reference: WebAuthnMessageReferenceEnum.CreateResponse;

  constructor({ error, id, requestID, result }: IWebAuthnResponseMessage) {
    this.error = error;
    this.id = id;
    this.requestID = requestID;
    this.result = result;
    this.reference = WebAuthnMessageReferenceEnum.CreateResponse;
  }
}
