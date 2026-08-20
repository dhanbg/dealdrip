import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('DealDripBootstrap');
  const app = await NestFactory.create(AppModule);

  // Enable Global CORS for Next.js frontend and local testing
  app.enableCors({
    origin: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3001',
      ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Global Route Prefix: /api
  app.setGlobalPrefix('api');

  // Global Request Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Swagger OpenAPI Documentation Configuration
  const config = new DocumentBuilder()
    .setTitle('Deal Drip API')
    .setDescription('RESTful Backend API for Deal Drip E-Commerce Storefront')
    .setVersion('1.0.0')
    .addTag('Health', 'System and runtime health status')
    .addTag('Products', 'Product specs, packages and inventory')
    .addTag('Orders', 'Order placement, tracking and status updates')
    .addTag('Coupons', 'Promo code verification & discount engine')
    .addTag('Payments', 'Payment gateways & verification')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');

  logger.log(`========================================================`);
  logger.log(`🚀 Deal Drip NestJS API is running on http://localhost:${port}/api`);
  logger.log(`📚 Swagger OpenAPI Docs available at http://localhost:${port}/api/docs`);
  logger.log(`❤️  Health check available at http://localhost:${port}/api/health`);
  logger.log(`========================================================`);
}

bootstrap();
