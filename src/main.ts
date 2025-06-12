import { NestFactory } from '@nestjs/core';
import { InteractionModule } from './interaction.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';

async function bootstrap() {
  // Create HTTP app
  const app = await NestFactory.create(InteractionModule);
  
  // Enable CORS
  app.enableCors({
    origin: '*', // Replace with your frontend URL
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // Enable validation pipe globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      transform: true, // Transform payloads to DTO instances
      forbidNonWhitelisted: true, // Throw errors if non-whitelisted properties are present
      transformOptions: {
        enableImplicitConversion: true, // Automatically convert primitive types
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Interaction Service API')
    .setDescription('The Interaction Service API documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  // Global prefix (optional)
  app.setGlobalPrefix('api/v1');

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
    app.listen(process.env.port ?? 3008),
    microservice.listen()
  ]);

  console.log(`🚀 Interaction Service is running at http://localhost:${process.env.port ?? 3008}`);
  console.log(`🚀 Interaction Service gRPC server is running on port 50056`);
  console.log(`📚 Swagger documentation is available at http://localhost:${process.env.port ?? 3008}/api`);
}
bootstrap();
