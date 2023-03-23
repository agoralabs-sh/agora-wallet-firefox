import { v4 as uuid } from 'uuid';

// Types
import { ISession } from '../../../types';
import { IConnectRequest } from '../types';

export default function createSessionFromConnectRequest({
  appName,
  authorizedAddresses,
  host,
}: IConnectRequest): ISession {
  const id: string = uuid();
  const now: Date = new Date();

  return {
    appName,
    authorizedAddresses,
    createdAt: Math.round(now.getTime() / 1000),
    host,
    id,
    usedAt: Math.round(now.getTime() / 1000),
  };
}
