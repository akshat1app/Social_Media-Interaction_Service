import { Test, TestingModule } from '@nestjs/testing';
import { InteractionController } from './interaction.controller';
import { InteractionService } from './interaction.service';

describe('InteractionController', () => {
  let interactionController: InteractionController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [InteractionController],
      providers: [InteractionService],
    }).compile();

    interactionController = app.get<InteractionController>(InteractionController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(interactionController.getHello()).toBe('Hello World!');
    });
  });
});
