import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminGuard } from './admin.guard'; // Importă guard-ul pentru protecție

@Controller('admin')
export class AdminController {
  @Get('dashboard') // Ruta va fi accesibilă la /admin/dashboard
  @UseGuards(AdminGuard) // Protejăm ruta (opțional)
  getAdminDashboard() {
    return { message: 'Admin Dashboard - Access granted' };
  }
}
