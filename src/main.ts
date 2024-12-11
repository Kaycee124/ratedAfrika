import { NestFactory,  } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpErrorFilter } from './errors/globalfilter';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe()); // Ensures validation works globally
  app.useGlobalFilters(new HttpErrorFilter);
  app.enableCors();
  
  await app.listen(3000);
}
bootstrap();
