import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import type { JwtPayload } from '../../auth/strategies/jwt.strategy';
import { GenerateDtrDto } from './dto/generate-dtr.dto';
import { DtrGeneratorService } from './dtr-generator.service';

@UseGuards(JwtAuthGuard)
@Controller('dtr/generate')
export class DtrGeneratorController {
  constructor(private readonly dtrGeneratorService: DtrGeneratorService) {}

  @Post()
  generate(@CurrentUser() user: JwtPayload, @Body() dto: GenerateDtrDto) {
    return this.dtrGeneratorService.generate(user.sub, dto.dtrPeriodId);
  }

  @Get(':id/download')
  async download(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Res() res: Response,
  ) {
    const { filePath, fileName } =
      await this.dtrGeneratorService.resolveDownload(user.sub, id);
    res.download(filePath, fileName);
  }
}
