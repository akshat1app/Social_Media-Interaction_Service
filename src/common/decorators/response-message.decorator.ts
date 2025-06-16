import { SetMetadata } from '@nestjs/common';

export const ResponseMessageKey = 'messageKey';
export const ResponseMessage = (message: string) =>
  SetMetadata(ResponseMessageKey, message);