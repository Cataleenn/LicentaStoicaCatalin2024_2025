import { Controller, Delete, Param, Get, Post, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './user.service';
import { AdminGuard } from '../admin/admin.guard';

interface CreateAdminDto {
  name: string;
  email: string;
  password: string;
}

@Controller('users') 
export class UsersController {
  constructor(private readonly usersService: UsersService) {}


  @Get('admins')
  @UseGuards(AdminGuard)
  async getAllAdmins() {
    return this.usersService.getAllAdmins();
  }


  @Post('admin')
  @UseGuards(AdminGuard)
  async createAdmin(@Body() createAdminDto: CreateAdminDto) {
    return this.usersService.createAdmin(createAdminDto);
  }


  @Get(':id')
  @UseGuards(AdminGuard)
  async getUserById(@Param('id') id: number) {
    return this.usersService.getUserById(+id);
  }


  @Delete(':id')
  @UseGuards(AdminGuard)
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