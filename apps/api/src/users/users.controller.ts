import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  // ──────────────────────────────────────────────────────────────────────────
  // Current-user endpoints (no extra permission required)
  // ──────────────────────────────────────────────────────────────────────────

  @Get('me')
  @ApiOperation({ summary: 'Get current user profile' })
  async getCurrentUser(@CurrentUser() user: any) {
    return this.usersService.getCurrentUser(user.sub);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(@CurrentUser() user: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(user.sub, dto);
  }

  @Get('me/teams')
  @ApiOperation({ summary: "Get current user's teams" })
  async getUserTeams(@CurrentUser() user: any) {
    return this.usersService.getUserTeams(user.sub);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search users by name, email, skills, or role' })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'skills', required: false, type: [String] })
  @ApiQuery({ name: 'role', required: false, description: 'Filter by role name e.g. JUDGE' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async searchUsers(
    @Query('q') query?: string,
    @Query('skills') skills?: string[],
    @Query('role') role?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.usersService.searchUsers(query, skills, role, page, limit);
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Admin endpoints — require USER permissions
  // ──────────────────────────────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: '[Admin] List all users with pagination and filters' })
  @ApiQuery({ name: 'q', required: false })
  @ApiQuery({ name: 'role', required: false })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @RequirePermissions({ resource: 'USER', action: 'READ' })
  async listAllUsers(
    @Query('q') query?: string,
    @Query('role') role?: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
  ) {
    return this.usersService.listAllUsers(query, role, page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: '[Admin] Get any user by ID with full profile and roles' })
  @RequirePermissions({ resource: 'USER', action: 'READ' })
  async getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Post(':id/roles')
  @ApiOperation({ summary: '[Admin] Assign a global platform role to a user' })
  @RequirePermissions({ resource: 'USER', action: 'UPDATE' })
  async assignRole(@Param('id') id: string, @Body() body: { role: string }) {
    return this.usersService.assignRole(id, body.role);
  }

  @Delete(':id/roles/:roleName')
  @ApiOperation({ summary: '[Admin] Remove a global platform role from a user' })
  @RequirePermissions({ resource: 'USER', action: 'UPDATE' })
  async removeRole(@Param('id') id: string, @Param('roleName') roleName: string) {
    return this.usersService.removeRole(id, roleName);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '[Admin] Activate or deactivate a user account' })
  @RequirePermissions({ resource: 'USER', action: 'UPDATE' })
  async toggleStatus(@Param('id') id: string, @Body() body: { active: boolean }) {
    return this.usersService.toggleUserStatus(id, body.active);
  }
}
