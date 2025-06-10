import { NestFactory } from '@nestjs/core';
import { InteractionModule } from './interaction.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
  // Create HTTP app
  const app = await NestFactory.create(InteractionModule);
  
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));

  const config = new DocumentBuilder()
    .setTitle('Interaction Service API')
    .setDescription('The Interaction Service API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Create gRPC microservice
  const microservice = await NestFactory.createMicroservice<MicroserviceOptions>(
    InteractionModule,
    {
      transport: Transport.GRPC,
      options: {
        package: 'post',
        protoPath: join(__dirname, '../proto/post.proto'),
        url: 'localhost:50056',
        loader: {
          keepCase: true,
          longs: String,
          enums: String,
          defaults: true,
          oneofs: true
        }
      },
    },
  );

  // Start both servers
  await Promise.all([
    app.listen(process.env.PORT ?? 8080),
    microservice.listen()
  ]);

  console.log(`🚀 Interaction Service HTTP server is running on port ${process.env.PORT ?? 3000}`);
  console.log(`🚀 Interaction Service gRPC server is running on port 50056`);
  console.log(`📚 Swagger documentation is available at http://localhost:${process.env.PORT ?? 3000}/api`);
}
bootstrap();
