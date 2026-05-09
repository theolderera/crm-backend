import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User, UserRole } from '../users/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    const byEmail = await this.userRepo.findOne({ where: { email: dto.email } });
    if (byEmail) throw new ConflictException('Ин имейл аллакай қайд шудааст');

    const byPhone = await this.userRepo.findOne({ where: { phone: dto.phone } });
    if (byPhone) throw new ConflictException('Ин рақам аллакай қайд шудааст');

    const hashed = await bcrypt.hash(dto.password, 10);
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    const user = this.userRepo.create({ 
      ...dto, 
      password: hashed, 
      role: UserRole.PENDING,
      verificationCode,
      isEmailVerified: false
    });
    await this.userRepo.save(user);

    await this.mailService.sendVerificationCode(user.email, verificationCode);

    const token = this.jwtService.sign({ sub: user.id, role: user.role });
    return { token, user: this.sanitize(user) };
  }

  async verifyEmail(userId: number, code: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new BadRequestException('Корбар ёфт нашуд');
    
    if (user.verificationCode !== code) {
      throw new BadRequestException('Коди тасдиқ нодуруст аст');
    }

    user.isEmailVerified = true;
    user.verificationCode = null;
    await this.userRepo.save(user);

    return { success: true, message: 'Имейл бомуваффақият тасдиқ шуд' };
  }

  async login(dto: LoginDto) {
    if (!dto.phone && !dto.email) {
      throw new BadRequestException('Рақам ё имейл лозим аст');
    }

    const where = dto.phone ? { phone: dto.phone } : { email: dto.email };
    const user = await this.userRepo.findOne({ where });
    if (!user) throw new UnauthorizedException('Маълумот нодуруст аст');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Маълумот нодуруст аст');

    const token = this.jwtService.sign({ sub: user.id, role: user.role });
    return { token, user: this.sanitize(user) };
  }

  async getMe(userId: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new UnauthorizedException();
    return this.sanitize(user);
  }

  private sanitize(user: User) {
    const { password, ...rest } = user;
    return rest;
  }
}
