import { Controller, Post, Body, UseGuards, Req, Delete, Param, Get } from '@nestjs/common';
import { GrpcAuthGuard } from '../common/guard/grpc-auth.guard';
import { ReactService } from './react.service';
import { UnreactDto } from '../dto/unreact.dto';
import { ReactDto } from '../dto/react.dto';

@Controller('interaction')
export class ReactController {
  constructor(private readonly reactService: ReactService) {}

  @UseGuards(GrpcAuthGuard)
  @Post('react')
  async react(@Body() dto: ReactDto, @Req() req) {
    return this.reactService.reactToPost(req.user.userId, dto);
  }


  @UseGuards(GrpcAuthGuard)
  @Delete('react')
  async unreact(@Body() dto: UnreactDto, @Req() req) {
    return this.reactService.removeReaction(req.user.userId, dto);
  }

  @UseGuards(GrpcAuthGuard)
  @Get('react/:postId')
  async getUserReaction(@Param('postId') postId: string, @Req() req) {
    return this.reactService.getUserReaction(postId, req.user.userId);
  }

  @Get('react/:postId/all')
  async getReactions(@Param('postId') postId: string) {
    return this.reactService.getPostReactions(postId);
  }

  @Get('react/:postId/summary')
  async getSummary(@Param('postId') postId: string) {
    return this.reactService.getReactionSummary(postId);
  }
}
