import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiConsumes } from '@nestjs/swagger';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { SubmissionStatus } from '@ehms/database';

@ApiTags('submissions')
@Controller('submissions')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create new submission' })
  create(@CurrentUser() user: any, @Body() dto: CreateSubmissionDto) {
    return this.submissionsService.create(user.sub, dto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all submissions' })
  @ApiQuery({ name: 'eventId', required: false })
  @ApiQuery({ name: 'teamId', required: false })
  @ApiQuery({ name: 'status', required: false, enum: SubmissionStatus })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('eventId') eventId?: string,
    @Query('teamId') teamId?: string,
    @Query('status') status?: SubmissionStatus,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.submissionsService.findAll(eventId, teamId, status, page, limit);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get submission by ID' })
  findOne(@Param('id') id: string) {
    return this.submissionsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update submission' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateSubmissionDto,
  ) {
    return this.submissionsService.update(id, user.sub, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete submission' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.submissionsService.remove(id, user.sub);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit final submission (change status to SUBMITTED)' })
  submitFinal(@Param('id') id: string, @CurrentUser() user: any) {
    return this.submissionsService.submitFinal(id, user.sub);
  }

  @Post(':id/files')
  @ApiOperation({ summary: 'Upload file to submission' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException({
        en: 'File is required',
        ar: 'الملف مطلوب',
      });
    }

    return this.submissionsService.uploadFile(id, user.sub, file);
  }

  @Delete(':id/files/:fileId')
  @ApiOperation({ summary: 'Delete file from submission' })
  deleteFile(
    @Param('id') id: string,
    @Param('fileId') fileId: string,
    @CurrentUser() user: any,
  ) {
    return this.submissionsService.deleteFile(id, fileId, user.sub);
  }
}
