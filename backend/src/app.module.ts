// Updated App Module - backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

// Controllers
import { AppController } from './app.controller';

// Entities
import { User } from './user/user.entity';
import { Survey } from './survey/survey.entity';
import { Response } from './survey/response.entity';

// Modules
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { AdminModule } from './admin/admin.module';
import { SurveyModule } from './survey/survey.module';
import { ClusteringModule } from './clustering/clustering.module';

const isUsingRailway = !!process.env.DATABASE_URL;
console.log('✅ Using DB:', isUsingRailway ? 'Railway' : 'Local');

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      ...(isUsingRailway
        ? {
            url: process.env.DATABASE_URL,
            extra: {
              ssl: {
                rejectUnauthorized: false,
              },
            },
          }
        : {
            host: process.env.DATABASE_HOST || 'localhost',
            port: parseInt(process.env.DATABASE_PORT || '5432', 10),
            username: process.env.DATABASE_USER || 'survey_admin',
            password: process.env.DATABASE_PASSWORD || 'adminpass',
            database: process.env.DATABASE_NAME || 'survey_data_db',
          }),
      entities: [User, Survey, Response],
      autoLoadEntities: true,
      synchronize: true,
      logging: false,
    }),
    AuthModule,
    UserModule,
    SurveyModule,
    AdminModule,
    ClusteringModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}