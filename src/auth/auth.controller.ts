import { Controller, Post, Get, Body, UseGuards, Request, Param } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    @InjectRepository(User) private readonly userRepo: Repository<User>,
  ) { }

  @Get('get-code/:email')
  async getCode(@Param('email') email: string) {
    const user = await this.userRepo.findOne({ where: { email } });
    return { code: user?.verificationCode || 'Not found' };
  }

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('verify-email')
  @UseGuards(JwtAuthGuard)
  verifyEmail(@Request() req: any, @Body('code') code: string) {
    return this.authService.verifyEmail(req.user.id, code);
  }

  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Request() req: any) {
    return this.authService.getMe(req.user.id);
  }
}
