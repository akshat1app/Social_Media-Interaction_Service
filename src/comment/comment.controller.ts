import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Patch,
  Delete,
  Param,
  Get,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { GrpcAuthGuard } from '../common/guard/grpc-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CreateCommentDto } from './dto/create-comment.dto';
import { EditCommentDto } from './dto/edit-comment.dto';
import { LikeCommentDto } from './dto/comment-like.dto';

@ApiTags('Comments')
@Controller('interaction/comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @UseGuards(GrpcAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Create a new comment' })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() dto: CreateCommentDto, @Req() req) {
    return this.commentService.createComment(req.user.userId, dto);
  }

  @UseGuards(GrpcAuthGuard)
  @ApiBearerAuth()
  @Patch()
  @ApiOperation({ summary: 'Edit an existing comment' })
  @ApiResponse({ status: 200, description: 'Comment edited successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the comment owner' })
  async edit(@Body() dto: EditCommentDto, @Req() req) {
    return this.commentService.editComment(req.user.userId, dto);
  }

  @UseGuards(GrpcAuthGuard)
  @ApiBearerAuth()
  @Delete(':commentId')
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiParam({ name: 'commentId', description: 'ID of the comment to delete' })
  @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the comment owner' })
  async delete(@Param('commentId') id: string, @Req() req) {
    return this.commentService.deleteComment(id, req.user.userId);
  }

  @UseGuards(GrpcAuthGuard)
  @ApiBearerAuth()
  @Post('like')
  @ApiOperation({ summary: 'Like or unlike a comment' })
  @ApiResponse({ status: 200, description: 'Like status toggled successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async like(@Body() dto: LikeCommentDto, @Req() req) {
    return this.commentService.toggleLike(req.user.userId, dto.commentId);
  }

  @Get(':postId')
  @ApiOperation({ summary: 'Get all comments for a post' })
  @ApiParam({ name: 'postId', description: 'ID of the post' })
  @ApiResponse({ status: 200, description: 'Returns all comments for the post' })
  async getPostComments(@Param('postId') postId: string) {
    return this.commentService.getCommentsByPost(postId);
  }

  @Get('replies/:commentId')
  @ApiOperation({ summary: 'Get all replies for a comment' })
  @ApiParam({ name: 'commentId', description: 'ID of the parent comment' })
  @ApiResponse({ status: 200, description: 'Returns all replies for the comment' })
  async getReplies(@Param('commentId') commentId: string) {
    return this.commentService.getRepliesByCommentId(commentId);
  }
}
