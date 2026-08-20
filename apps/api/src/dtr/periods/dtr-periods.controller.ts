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
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../../auth/strategies/jwt.strategy';
import { CreateDtrPeriodDto } from './dto/create-dtr-period.dto';
import { QueryDtrPeriodDto } from './dto/query-dtr-period.dto';
import { UpdateDtrPeriodDto } from './dto/update-dtr-period.dto';
import { DtrPeriodsService } from './dtr-periods.service';

@UseGuards(JwtAuthGuard)
@Controller('dtr/periods')
export class DtrPeriodsController {
  constructor(private readonly dtrPeriodsService: DtrPeriodsService) {}

  @Get()
  findAll(@CurrentUser() user: JwtPayload, @Query() query: QueryDtrPeriodDto) {
    return this.dtrPeriodsService.findAllForTeacher(
      user.sub,
      query.academicPeriodId,
    );
  }

  @Get(':id')
  findOne(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.dtrPeriodsService.findOneForTeacher(user.sub, id);
  }

  @Post()
  create(@CurrentUser() user: JwtPayload, @Body() dto: CreateDtrPeriodDto) {
    return this.dtrPeriodsService.create(user.sub, dto);
  }

  @Patch(':id')
  update(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDtrPeriodDto,
  ) {
    return this.dtrPeriodsService.update(user.sub, id, dto);
  }

  @Delete(':id')
  async remove(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    await this.dtrPeriodsService.remove(user.sub, id);
    return { id };
  }
}
