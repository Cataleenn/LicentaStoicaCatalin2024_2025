import { Controller, Delete, Param,Get, UseGuards } from '@nestjs/common';
import { UsersService } from './user.service';
import { AdminGuard } from '../admin/admin.guard';

@Controller('users') // 🔹 API va fi accesibil pe /users
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Delete(':id')
  async deleteUser(@Param('id') id: number) {
    await this.usersService.deleteUserAndResetIds(+id); // 🔹 Apel către service
    return { message: `User ${id} deleted and ID sequence reset` };
  }
}

@Controller('admin')
export class AdminController {
  @Get('dashboard')
  @UseGuards(AdminGuard)  // ✅ Protejăm accesul doar pentru admini
  getAdminDashboard() {
    return { message: 'Welcome to the admin dashboard' };
  }
}
