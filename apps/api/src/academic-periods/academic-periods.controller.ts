import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AcademicPeriodsService } from './academic-periods.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { JwtPayload } from '../auth/strategies/jwt.strategy';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { CreateAcademicPeriodDto } from './dto/create-academic-period.dto';
import { UpdateAcademicPeriodDto } from './dto/update-academic-period.dto';

// Shared resource: reads are open to any authenticated teacher (they need
// the list to pick a period for schedules/DTR periods), writes are
// admin-only. This is the one controller in the codebase with a per-route
// permission split rather than one guard set for the whole class.
@UseGuards(JwtAuthGuard)
@Controller('academic-periods')
export class AcademicPeriodsController {
  constructor(
    private readonly academicPeriodsService: AcademicPeriodsService,
  ) {}

  @Get()
  findAll() {
    return this.academicPeriodsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.academicPeriodsService.findOne(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateAcademicPeriodDto,
  ) {
    return this.academicPeriodsService.create(user.sub, dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAcademicPeriodDto,
  ) {
    return this.academicPeriodsService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.academicPeriodsService.remove(id);
    return { id };
  }
}
