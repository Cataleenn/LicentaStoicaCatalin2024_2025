import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { User } from './user/user.entity';
import { Survey } from './survey/survey.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Face ca variabilele să fie disponibile oriunde
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      username: process.env.DATABASE_USER || 'survey_admin',
      password: process.env.DATABASE_PASSWORD || 'adminpass',
      database: process.env.DATABASE_NAME || 'survey_data_db',
      entities: [User, Survey],
      autoLoadEntities: true,
      synchronize: true,
    }),
  ],
  controllers: [AppController],
})
export class AppModule {}
