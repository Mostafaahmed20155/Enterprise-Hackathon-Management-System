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
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { EventsService } from './events.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { OptionalAuth } from '../auth/decorators/optional-auth.decorator';
import { EventState } from '@ehms/database';

@ApiTags('events')
@Controller('events')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Post()
  @RequirePermissions({ resource: 'EVENT', action: 'CREATE' })
  @ApiOperation({ summary: 'Create new event' })
  create(@CurrentUser() user: any, @Body() dto: CreateEventDto) {
    return this.eventsService.create(user.sub, dto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all events' })
  @ApiQuery({ name: 'state', required: false, enum: EventState })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('state') state?: EventState,
    @Query('search') search?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.eventsService.findAll(state, search, page, limit);
  }

  @Get(':id')
  @OptionalAuth()
  @ApiOperation({ summary: 'Get event by ID' })
  findOne(@Param('id') id: string, @CurrentUser() user?: any) {
    return this.eventsService.findOne(id, user?.sub);
  }

  @Patch(':id')
  @RequirePermissions({ resource: 'EVENT', action: 'UPDATE' })
  @ApiOperation({ summary: 'Update event' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateEventDto,
  ) {
    return this.eventsService.update(id, user.sub, dto);
  }

  @Delete(':id')
  @RequirePermissions({ resource: 'EVENT', action: 'DELETE' })
  @ApiOperation({ summary: 'Delete event' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.eventsService.remove(id, user.sub);
  }

  @Post(':id/publish')
  @RequirePermissions({ resource: 'EVENT', action: 'PUBLISH' })
  @ApiOperation({ summary: 'Publish event' })
  publish(@Param('id') id: string, @CurrentUser() user: any) {
    return this.eventsService.publish(id, user.sub);
  }

  @Post(':id/register')
  @ApiOperation({ summary: 'Register for event' })
  register(@Param('id') id: string, @CurrentUser() user: any) {
    return this.eventsService.register(id, user.sub);
  }

  @Get(':id/registrations')
  @RequirePermissions({ resource: 'EVENT', action: 'UPDATE' })
  @ApiOperation({ summary: 'Get all registrations for an event (organizer/admin)' })
  getRegistrations(@Param('id') id: string) {
    return this.eventsService.getRegistrations(id);
  }

  @Get(':id/teams')
  @Public()
  @ApiOperation({ summary: 'Get event teams' })
  getTeams(@Param('id') id: string) {
    return this.eventsService.getTeams(id);
  }

  @Get(':id/submissions')
  @RequirePermissions({ resource: 'SUBMISSION', action: 'READ' })
  @ApiOperation({ summary: 'Get event submissions' })
  getSubmissions(@Param('id') id: string) {
    return this.eventsService.getSubmissions(id);
  }

  @Post(':id/transition')
  @RequirePermissions({ resource: 'EVENT', action: 'UPDATE' })
  @ApiOperation({ summary: 'Manually trigger state transitions for event' })
  triggerTransition(@Param('id') id: string, @CurrentUser() user: any) {
    return this.eventsService.triggerTransition(id, user.sub);
  }

  @Post(':id/advance-state')
  @RequirePermissions({ resource: 'EVENT', action: 'UPDATE' })
  @ApiOperation({ summary: 'Manually advance event to next state (for testing)' })
  advanceState(@Param('id') id: string, @CurrentUser() user: any) {
    return this.eventsService.advanceState(id, user.sub);
  }
}
