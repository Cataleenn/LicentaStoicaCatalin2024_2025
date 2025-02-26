import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { User } from './user/user.entity';
import { Survey } from './survey/survey.entity';
import { AuthModule } from './auth/auth.module';  // ✅ Importă modulul de autentificare
import { UserModule } from './user/user.module'; // ✅ Importă modulul utilizatorilor
import { AdminModule } from './admin/admin.module'; // Importăm modulul Admin

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
    AuthModule,  // ✅ Importă autentificarea
    UserModule,
    AdminModule
  ],
  
  controllers: [AppController],
})
export class AppModule {}
