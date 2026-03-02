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
  ParseBoolPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('teams')
@Controller('teams')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  @Post()
  @ApiOperation({ summary: 'Create new team' })
  create(@CurrentUser() user: any, @Body() dto: CreateTeamDto) {
    return this.teamsService.create(user.sub, dto);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all teams' })
  @ApiQuery({ name: 'eventId', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @Query('eventId') eventId?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.teamsService.findAll(eventId, page, limit);
  }

  @Get('invites')
  @ApiOperation({ summary: "Get current user's pending invites" })
  getUserInvites(@CurrentUser() user: any) {
    return this.teamsService.getUserInvites(user.sub);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get team by ID' })
  findOne(@Param('id') id: string) {
    return this.teamsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update team (leader only)' })
  update(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: UpdateTeamDto,
  ) {
    return this.teamsService.update(id, user.sub, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete team (leader only)' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.teamsService.remove(id, user.sub);
  }

  @Post(':id/invite')
  @ApiOperation({ summary: 'Invite member to team (leader only)' })
  inviteMember(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() dto: InviteMemberDto,
  ) {
    return this.teamsService.inviteMember(id, user.sub, dto);
  }

  @Post('invites/:inviteId/respond')
  @ApiOperation({ summary: 'Accept or decline team invite' })
  @ApiQuery({ name: 'accept', type: Boolean })
  respondToInvite(
    @Param('inviteId') inviteId: string,
    @CurrentUser() user: any,
    @Query('accept', ParseBoolPipe) accept: boolean,
  ) {
    return this.teamsService.respondToInvite(inviteId, user.sub, accept);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove member from team (leader only)' })
  removeMember(
    @Param('id') id: string,
    @Param('userId') memberUserId: string,
    @CurrentUser() user: any,
  ) {
    return this.teamsService.removeMember(id, user.sub, memberUserId);
  }
}
