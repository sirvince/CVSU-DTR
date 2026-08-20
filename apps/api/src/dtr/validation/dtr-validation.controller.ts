import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../../auth/strategies/jwt.strategy';
import { ValidateDtrPeriodDto } from './dto/validate-dtr-period.dto';
import { DtrValidationService } from './dtr-validation.service';

@UseGuards(JwtAuthGuard)
@Controller('dtr/validate')
export class DtrValidationController {
  constructor(private readonly dtrValidationService: DtrValidationService) {}

  @Post()
  validate(@CurrentUser() user: JwtPayload, @Body() dto: ValidateDtrPeriodDto) {
    return this.dtrValidationService.validate(user.sub, dto.dtrPeriodId);
  }
}
