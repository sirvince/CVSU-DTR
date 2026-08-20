import { Body, Controller, Get, Patch, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { CreateTeacherProfileDto } from './dto/create-teacher-profile.dto';
import { UpdateTeacherProfileDto } from './dto/update-teacher-profile.dto';
import { TeachersService } from './teachers.service';

@UseGuards(JwtAuthGuard)
@Controller('me/profile')
export class TeachersController {
  constructor(private readonly teachersService: TeachersService) {}

  @Get()
  findMine(@CurrentUser() user: JwtPayload) {
    return this.teachersService.findByUserId(user.sub);
  }

  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateTeacherProfileDto,
  ) {
    return this.teachersService.create(user.sub, dto);
  }

  @Patch()
  update(
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdateTeacherProfileDto,
  ) {
    return this.teachersService.update(user.sub, dto);
  }
}
