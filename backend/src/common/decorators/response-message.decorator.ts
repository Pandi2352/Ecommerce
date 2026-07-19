import { SetMetadata } from '@nestjs/common';

export const RESPONSE_MESSAGE = 'response_message';

/** Optional per-handler success message for the response envelope. */
export const ResponseMessage = (message: string) => SetMetadata(RESPONSE_MESSAGE, message);
