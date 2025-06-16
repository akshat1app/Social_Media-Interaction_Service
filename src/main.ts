import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';
import { InteractionModule } from './interaction.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AllExceptionsFilter } from './middleware/filter/exception.filter';
import { ErrorInterceptor } from './middleware/interceptor/error.interceptor';
import { SimpleResponseInterceptor } from './middleware/interceptor/response.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(InteractionModule);
  
  // Enable CORS
  app.enableCors();

  // Enable validation pipe globally
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, 
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true, 
      },
    }),
  );
  const httpAdapterHost = app.get(HttpAdapterHost);
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapterHost));
  app.useGlobalInterceptors(
    new ErrorInterceptor(),
    new SimpleResponseInterceptor(app.get(Reflector))
  );

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
        protoPath: join(process.cwd(), 'proto/post.proto'),
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

  console.log(`Interaction Service is running at http://localhost:${process.env.port ?? 3008}`);
  console.log(`Interaction Service gRPC server is running on port 50056`);
  console.log(`Swagger documentation is available at http://localhost:${process.env.port ?? 3008}/api`);
}
bootstrap();
