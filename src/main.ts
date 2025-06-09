import { NestFactory } from '@nestjs/core';
import { InteractionModule } from './interaction.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(InteractionModule);

  const config = new DocumentBuilder()
    .setTitle('Interaction Service API')
    .setDescription('The Interaction Service API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  await app.listen(process.env.port ?? 3000);
  console.log(`🚀 Interaction Service is running at grpc port http://localhost:3000`);
  console.log(`📚 Swagger documentation is available at http://localhost:3000/api`);
}
bootstrap();
