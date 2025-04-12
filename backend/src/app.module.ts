import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { User } from './user/user.entity';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { AdminModule } from './admin/admin.module';
import { SurveyModule } from './survey/survey.module';  // ✅ Importă SurveyModule
import { Survey } from './survey/survey.entity';  // Importă entitatea Survey

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432', 10),
      username: process.env.DATABASE_USER || 'survey_admin',
      password: process.env.DATABASE_PASSWORD || 'adminpass',
      database: process.env.DATABASE_NAME || 'survey_data_db',
      entities: [User, Survey],  // Asigură-te că entitățile sunt incluse
      autoLoadEntities: true,
      synchronize: true,  // Sincronizează entitățile cu baza de date
    }),
    AuthModule,
    UserModule,
    SurveyModule,  // ✅ SurveyModule este importat corect
    AdminModule
  ],
  controllers: [AppController],  // Nu mai adăuga SurveyController aici
  providers: [],
})
export class AppModule {}
