import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminGuard } from './admin.guard'; 

@Controller('admin')
export class AdminController {
  @Get('dashboard') 
  @UseGuards(AdminGuard) 
  getAdminDashboard() {
    return { message: 'Admin Dashboard - Access granted' };
  }
}
