import { Controller, Post, Body, UseGuards, Req, Delete, Param, Get } from '@nestjs/common';
import { GrpcAuthGuard } from '../common/guard/grpc-auth.guard';
import { ReactService } from './react.service';
import { UnreactDto } from './dto/unreact.dto';
import { ReactDto } from './dto/react.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';

@ApiTags('Reactions')
@Controller('interaction')
export class ReactController {
  constructor(private readonly reactService: ReactService) {}

  @UseGuards(GrpcAuthGuard)
  @ApiBearerAuth()
  @Post('react')
  @ApiOperation({ summary: 'Add a reaction to a post' })
  @ApiResponse({ status: 201, description: 'Reaction added successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async react(@Body() dto: ReactDto, @Req() req) {
    return this.reactService.reactToPost(req.user.userId, dto);
  }

  @UseGuards(GrpcAuthGuard)
  @ApiBearerAuth()
  @Delete('react')
  @ApiOperation({ summary: 'Remove a reaction from a post' })
  @ApiResponse({ status: 200, description: 'Reaction removed successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async unreact(@Body() dto: UnreactDto, @Req() req) {
    return this.reactService.removeReaction(req.user.userId, dto);
  }

  @UseGuards(GrpcAuthGuard)
  @ApiBearerAuth()
  @Get('react/:postId')
  @ApiOperation({ summary: 'Get user reaction for a specific post' })
  @ApiParam({ name: 'postId', description: 'ID of the post' })
  @ApiResponse({ status: 200, description: 'Returns the user reaction' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserReaction(@Param('postId') postId: string, @Req() req) {
    return this.reactService.getUserReaction(postId, req.user.userId);
  }

  @Get('react/:postId/all')
  @ApiOperation({ summary: 'Get all reactions for a specific post' })
  @ApiParam({ name: 'postId', description: 'ID of the post' })
  @ApiResponse({ status: 200, description: 'Returns all reactions for the post' })
  async getReactions(@Param('postId') postId: string) {
    return this.reactService.getPostReactions(postId);
  }

  @Get('react/:postId/summary')
  @ApiOperation({ summary: 'Get reaction summary for a specific post' })
  @ApiParam({ name: 'postId', description: 'ID of the post' })
  @ApiResponse({ status: 200, description: 'Returns the reaction summary' })
  async getSummary(@Param('postId') postId: string) {
    return this.reactService.getReactionSummary(postId);
  }
}
