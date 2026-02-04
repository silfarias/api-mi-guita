import { INestApplication } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder, SwaggerCustomOptions } from '@nestjs/swagger';

export function setupSwagger(app: INestApplication): void {
  const local = {
    url: 'http://localhost:3000/',
  };
  const production = {
    url: 'http://localhost:3000/',
  };

  const config = new DocumentBuilder()
    .setTitle('Documentación del Sistema Mi Guita')
    .setDescription('Sistema de Mi Guita')
    .setVersion('1.0')

    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'authorization',
    )
    .build();

  const options: SwaggerCustomOptions = {
    swaggerOptions: {
      docExpansion: 'none',
      persistAuthorization: true, // Persistir el token de autorización
      displayRequestDuration: true,
    },
  };

  config.servers = [local, production];
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, options);
}
