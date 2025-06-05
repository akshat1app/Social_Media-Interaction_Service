import { Injectable } from '@nestjs/common';

@Injectable()
export class InteractionService {
  getHello(): string {
    return 'Hello World!';
  }
}
