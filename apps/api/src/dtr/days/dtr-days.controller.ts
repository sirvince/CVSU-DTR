import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../../auth/strategies/jwt.strategy';
import { QueryDtrDayDto } from './dto/query-dtr-day.dto';
import { UpdateDtrDayDto } from './dto/update-dtr-day.dto';
import { DtrDaysService } from './dtr-days.service';

@UseGuards(JwtAuthGuard)
@Controller('dtr/days')
export class DtrDaysController {
  constructor(private readonly dtrDaysService: DtrDaysService) {}

  @Get(':date')
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('date') date: string,
    @Query() query: QueryDtrDayDto,
  ) {
    return this.dtrDaysService.findOneForTeacher(
      user.sub,
      query.dtrPeriodId,
      date,
    );
  }

  @Patch(':date')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('date') date: string,
    @Query() query: QueryDtrDayDto,
    @Body() dto: UpdateDtrDayDto,
  ) {
    return this.dtrDaysService.update(user.sub, query.dtrPeriodId, date, dto);
  }

  @Delete(':date')
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('date') date: string,
    @Query() query: QueryDtrDayDto,
  ) {
    await this.dtrDaysService.remove(user.sub, query.dtrPeriodId, date);
    return { date };
  }
}
