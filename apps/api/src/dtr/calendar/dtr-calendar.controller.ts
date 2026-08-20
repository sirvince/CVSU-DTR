import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../../auth/strategies/jwt.strategy';
import { DtrCalendarService } from './dtr-calendar.service';
import { GenerateCalendarDto } from './dto/generate-calendar.dto';
import { QueryCalendarDto } from './dto/query-calendar.dto';

@UseGuards(JwtAuthGuard)
@Controller('dtr/calendar')
export class DtrCalendarController {
  constructor(private readonly dtrCalendarService: DtrCalendarService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Query() query: QueryCalendarDto) {
    return this.dtrCalendarService.findAllForTeacher(
      user.sub,
      query.dtrPeriodId,
    );
  }

  @Post('generate')
  generate(@CurrentUser() user: JwtPayload, @Body() dto: GenerateCalendarDto) {
    return this.dtrCalendarService.generate(user.sub, dto.dtrPeriodId);
  }
}
