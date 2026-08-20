import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../common/enums/user-role.enum';
import { DtrGeneratorService } from '../dtr/generator/dtr-generator.service';
import { DtrPeriodsService } from '../dtr/periods/dtr-periods.service';
import { UsersService } from '../users/users.service';

// Every route here takes teacherId from the URL, not @CurrentUser() — an
// admin acts on a teacher's behalf. The underlying services (DtrPeriods,
// DtrGenerator) are unchanged from their teacher-facing counterparts; they
// already treat teacherId as a plain parameter with no hidden reliance on
// it matching the caller's own JWT (confirmed by reading every call site
// before writing this).
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(
    private readonly usersService: UsersService,
    private readonly dtrPeriodsService: DtrPeriodsService,
    private readonly dtrGeneratorService: DtrGeneratorService,
  ) {}

  @Get('teachers')
  findAllTeachers() {
    return this.usersService.findAllTeachersWithProfiles();
  }

  @Get('teachers/:teacherId/dtr-periods')
  findTeacherDtrPeriods(@Param('teacherId', ParseUUIDPipe) teacherId: string) {
    return this.dtrPeriodsService.findAllForTeacher(teacherId);
  }

  @Post('teachers/:teacherId/dtr-periods/:dtrPeriodId/generate')
  generateForTeacher(
    @Param('teacherId', ParseUUIDPipe) teacherId: string,
    @Param('dtrPeriodId', ParseUUIDPipe) dtrPeriodId: string,
  ) {
    return this.dtrGeneratorService.generate(teacherId, dtrPeriodId);
  }

  @Get('teachers/:teacherId/generations/:id/download')
  async downloadForTeacher(
    @Param('teacherId', ParseUUIDPipe) teacherId: string,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const { filePath, fileName } =
      await this.dtrGeneratorService.resolveDownload(teacherId, id);
    res.download(filePath, fileName);
  }
}
