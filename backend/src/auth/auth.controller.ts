import { Controller, Post, Get, Request, UseGuards, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AdminGuard } from '../admin/admin.guard'; 
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
async login(@Body('email') email: string, @Body('password') password: string) {
  console.log(`🔹 Login attempt for email: ${email}`);

  const user = await this.authService.validateUser(email, password);
  console.log('✅ Utilizator validat:', user);

  if (!user) {
    console.error('❌ Autentificare eșuată! Utilizator inexistent sau parolă greșită.');
    return { error: 'Invalid credentials' };
  }

  
  const tokenResponse = await this.authService.login(user);
  console.log('✅ Token generat:', tokenResponse);

  return tokenResponse; 
}



  @Get('me')  
  @UseGuards(AdminGuard) 
  getProfile(@Request() req) {
    return req.user; // Returnăm datele utilizatorului
  }
}
