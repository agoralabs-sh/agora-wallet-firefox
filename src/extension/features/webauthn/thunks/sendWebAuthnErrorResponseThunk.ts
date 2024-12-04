import { type AsyncThunk, createAsyncThunk } from '@reduxjs/toolkit';
import { v4 as uuid } from 'uuid';
import browser from 'webextension-polyfill';

// enums
import { WebAuthnMessageReferenceEnum } from '@common/enums';
import { EventTypeEnum } from '@extension/enums';
import { ThunkEnum } from '../enums';

// messages
import WebAuthnRegisterResponseMessage from '@common/messages/WebAuthnRegisterResponseMessage';

// types
import type {
  IBackgroundRootState,
  IBaseAsyncThunkConfig,
  IMainRootState,
} from '@extension/types';
import type { IWebAuthnErrorResponseThunkPayload } from '../types';

const sendWebAuthnErrorResponseThunk: AsyncThunk<
  void, // return
  IWebAuthnErrorResponseThunkPayload, // args
  IBaseAsyncThunkConfig<IBackgroundRootState | IMainRootState>
> = createAsyncThunk<
  void,
  IWebAuthnErrorResponseThunkPayload,
  IBaseAsyncThunkConfig<IBackgroundRootState | IMainRootState>
>(
  ThunkEnum.SendWebAuthnErrorResponse,
  async ({ error, event }, { getState }) => {
    const id = uuid();
    const logger = getState().system.logger;
    let message: WebAuthnRegisterResponseMessage | null = null;

    // send the error the client via the middleware (content script)
    switch (event.type) {
      case EventTypeEnum.WebAuthnRegisterRequest:
        message = new WebAuthnRegisterResponseMessage({
          error,
          id,
          reference: WebAuthnMessageReferenceEnum.RegisterResponse,
          requestID: event.payload.message.id,
          result: null,
        });
        break;
    }

    if (!message) {
      return;
    }

    await browser.tabs.sendMessage(event.payload.originTabID, message);

    logger.debug(
      `${ThunkEnum.SendWebAuthnErrorResponse}: sent response "${message.reference}" message to the client via the middleware (content script)`
    );
  }
);

export default sendWebAuthnErrorResponseThunk;