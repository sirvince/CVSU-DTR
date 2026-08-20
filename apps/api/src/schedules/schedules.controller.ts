import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { CreateTeacherScheduleDto } from './dto/create-teacher-schedule.dto';
import { QueryTeacherScheduleDto } from './dto/query-teacher-schedule.dto';
import { UpdateTeacherScheduleDto } from './dto/update-teacher-schedule.dto';
import { SchedulesService } from './schedules.service';

@UseGuards(JwtAuthGuard)
@Controller('schedules')
export class SchedulesController {
  constructor(private readonly schedulesService: SchedulesService) {}

  @Get()
  findAll(
    @CurrentUser() user: JwtPayload,
    @Query() query: QueryTeacherScheduleDto,
  ) {
    return this.schedulesService.findAllForTeacher(
      user.sub,
      query.academicPeriodId,
    );
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.schedulesService.findOneForTeacher(user.sub, id);
  }

  @Post()
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateTeacherScheduleDto,
  ) {
    return this.schedulesService.create(user.sub, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTeacherScheduleDto,
  ) {
    return this.schedulesService.update(user.sub, id, dto);
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.schedulesService.remove(user.sub, id);
    return { id };
  }
}
