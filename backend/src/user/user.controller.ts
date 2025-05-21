import { Controller, Delete, Param,Get, UseGuards } from '@nestjs/common';
import { UsersService } from './user.service';
import { AdminGuard } from '../admin/admin.guard';

@Controller('users') 
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Delete(':id')
  async deleteUser(@Param('id') id: number) {
    await this.usersService.deleteUserAndResetIds(+id); 
    return { message: `User ${id} deleted and ID sequence reset` };
  }
}

@Controller('admin')
export class AdminController {
  @Get('dashboard')
  @UseGuards(AdminGuard)  
  getAdminDashboard() {
    return { message: 'Welcome to the admin dashboard' };
  }
}
