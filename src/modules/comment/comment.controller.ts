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
  Query,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { GrpcAuthGuard } from '../../common/guard/grpc-auth.guard';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { CreateCommentDto } from './dto/create-comment.dto';
import { EditCommentDto } from './dto/edit-comment.dto';
import { LikeCommentDto } from './dto/comment-like.dto';
import { PaginationDto } from './dto/pagination.dto';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { SUCCESS } from './constant/message.constant';

@ApiTags('Comments')
@Controller('interaction/comment')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  /**
   * create a new comment on a post
   * @param dto - Contains postId, content, and optional parentCommentId
   * @param req - Request object containing authenticated user
   * @returns The created comment
   */
  @UseGuards(GrpcAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ResponseMessage(SUCCESS.COMMENT_CREATED)
  @ApiOperation({ summary: 'Create a new comment' })
  @ApiResponse({ 
    status: 201, 
    description: 'Comment created successfully',
    schema: {
      properties: {
        message: { 
          type: 'string',
          example: 'Comment created successfully'
        },
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '665fdd917712f702a44e6e04' },
            postId: { type: 'string', example: '665d3e805be127abc1234567' },
            userId: { type: 'string', example: '665d3e805be127abc1234568' },
            name: { type: 'string', example: 'John Doe' },
            content: { type: 'string', example: 'This is a great post!' },
            parentCommentId: { type: 'string', nullable: true, example: null },
            replyToUserId: { type: 'string', nullable: true, example: null },
            likeCount: { type: 'number', example: 0 },
            likedBy: { 
              type: 'array',
              items: { type: 'string' },
              example: []
            },
            isEdited: { type: 'boolean', example: false },
            replyCount: { type: 'number', example: 0 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid input data or IDs' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async create(@Body() dto: CreateCommentDto, @Req() req) {
    return this.commentService.createComment(req.user.userId, dto);
  }

  /**
   * edit an existing comment
   * @param dto - Contains commentId and new content
   * @param req - Request object containing authenticated user
   * @returns The updated comment
   */
  @UseGuards(GrpcAuthGuard)
  @ApiBearerAuth()
  @Patch()
  @ResponseMessage(SUCCESS.COMMENT_EDITED)
  @ApiOperation({ summary: 'Edit an existing comment' })
  @ApiResponse({ 
    status: 200, 
    description: 'Comment edited successfully',
    schema: {
      properties: {
        message: { 
          type: 'string',
          example: 'Comment edited successfully'
        },
        data: {
          type: 'object',
          properties: {
            _id: { type: 'string', example: '665fdd917712f702a44e6e04' },
            postId: { type: 'string', example: '665d3e805be127abc1234567' },
            userId: { type: 'string', example: '665d3e805be127abc1234568' },
            name: { type: 'string', example: 'John Doe' },
            content: { type: 'string', example: 'Updated comment content' },
            parentCommentId: { type: 'string', nullable: true, example: null },
            replyToUserId: { type: 'string', nullable: true, example: null },
            likeCount: { type: 'number', example: 0 },
            likedBy: { 
              type: 'array',
              items: { type: 'string' },
              example: []
            },
            isEdited: { type: 'boolean', example: true },
            replyCount: { type: 'number', example: 0 },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the comment owner' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async edit(@Body() dto: EditCommentDto, @Req() req) {
    return this.commentService.editComment(req.user.userId, dto);
  }

  /**
   * delete a comment
   * @param id - The ID of the comment to delete
   * @param req - Request object containing authenticated user
   * @returns Success message
   */
  @UseGuards(GrpcAuthGuard)
  @ApiBearerAuth()
  @Delete(':commentId')
  @ResponseMessage(SUCCESS.COMMENT_DELETED)
  @ApiOperation({ summary: 'Delete a comment' })
  @ApiParam({ name: 'commentId', description: 'ID of the comment to delete' })
  @ApiResponse({ 
    status: 200, 
    description: 'Comment deleted successfully',
    schema: {
      properties: {
        message: { 
          type: 'string',
          example: 'Comment deleted successfully'
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Not the comment owner' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async delete(@Param('commentId') id: string, @Req() req) {
    return this.commentService.deleteComment(id, req.user.userId);
  }

  /**
   * like or unlike a comment
   * @param dto - Contains commentId to like/unlike
   * @param req - Request object containing authenticated user
   * @returns Updated like status
   */
  @UseGuards(GrpcAuthGuard)
  @ApiBearerAuth()
  @Post('like')
  @ResponseMessage(SUCCESS.LIKE_TOGGLED)
  @ApiOperation({ summary: 'Like or unlike a comment' })
  @ApiResponse({ 
    status: 200, 
    description: 'Like status toggled successfully',
    schema: {
      properties: {
        message: { 
          type: 'string',
          example: 'Like status toggled successfully'
        },
        data: {
          type: 'object',
          properties: {
            liked: { 
              type: 'boolean',
              example: true,
              description: 'Indicates whether the comment is now liked (true) or unliked (false)'
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Comment not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async like(@Body() dto: LikeCommentDto, @Req() req) {
    return this.commentService.toggleLike(req.user.userId, dto.commentId);
  }

  /**
   * get all comments for a post
   * @param postId - The ID of the post
   * @returns Array of comments
   */
  @Get(':postId')
  @ResponseMessage(SUCCESS.GET_COMMENTS)
  @ApiOperation({ summary: 'Get all comments for a post' })
  @ApiParam({ name: 'postId', description: 'ID of the post' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns paginated comments for the post with pagination information',
    schema: {
      properties: {
        message: { 
          type: 'string',
          example: 'Comments retrieved successfully'
        },
        data: {
          type: 'object',
          properties: {
            comments: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string', example: '665fdd917712f702a44e6e04' },
                  postId: { type: 'string', example: '665d3e805be127abc1234567' },
                  userId: { type: 'string', example: '665d3e805be127abc1234568' },
                  name: { type: 'string', example: 'John Doe' },
                  content: { type: 'string', example: 'This is a great post!' },
                  parentCommentId: { type: 'string', nullable: true, example: null },
                  replyToUserId: { type: 'string', nullable: true, example: null },
                  likeCount: { type: 'number', example: 5 },
                  likedBy: { 
                    type: 'array',
                    items: { type: 'string' },
                    example: ['665d3e805be127abc1234568']
                  },
                  isEdited: { type: 'boolean', example: false },
                  replyCount: { type: 'number', example: 2 },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                  username: { type: 'string'},
                  mediaUrl: { type: 'string'},
                  replyToUsername: { type: 'string'},
                  replyToMediaUrl: { type: 'string'},

                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                currentPage: { type: 'number', example: 1 },
                totalPages: { type: 'number', example: 5 },
                totalComments: { type: 'number', example: 50 },
                remainingComments: { type: 'number', example: 40 },
                hasMore: { type: 'boolean', example: true }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getPostComments(
    @Param('postId') postId: string,
    @Query() paginationDto: PaginationDto
  ) {
    return this.commentService.getCommentsByPost(
      postId,
      paginationDto.page,
      paginationDto.limit
    );
  }

  /**
   * get all replies for a comment
   * @param commentId - The ID of the parent comment
   * @returns Array of reply comments
   */
  @Get('replies/:commentId')
  @ResponseMessage(SUCCESS.GET_REPLIES)
  @ApiOperation({ summary: 'Get all replies for a comment' })
  @ApiParam({ name: 'commentId', description: 'ID of the parent comment' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns paginated replies for the comment with pagination information',
    schema: {
      properties: {
        message: { 
          type: 'string',
          example: 'Replies retrieved successfully'
        },
        data: {
          type: 'object',
          properties: {
            replies: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  _id: { type: 'string', example: '665fdd917712f702a44e6e04' },
                  postId: { type: 'string', example: '665d3e805be127abc1234567' },
                  userId: { type: 'string', example: '665d3e805be127abc1234568' },
                  name: { type: 'string', example: 'John Doe' },
                  content: { type: 'string', example: 'Thanks for your comment!' },
                  parentCommentId: { type: 'string', example: '665fdd917712f702a44e6e03' },
                  replyToUserId: { type: 'string', example: '665d3e805be127abc1234569' },
                  likeCount: { type: 'number', example: 2 },
                  likedBy: { 
                    type: 'array',
                    items: { type: 'string' },
                    example: ['665d3e805be127abc1234568']
                  },
                  isEdited: { type: 'boolean', example: false },
                  replyCount: { type: 'number', example: 0 },
                  createdAt: { type: 'string', format: 'date-time' },
                  updatedAt: { type: 'string', format: 'date-time' },
                  username: { type: 'string'},
                  mediaUrl: { type: 'string'},
                  replyToUsername: { type: 'string'},
                  replyToMediaUrl: { type: 'string'},
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                currentPage: { type: 'number', example: 1 },
                totalPages: { type: 'number', example: 3 },
                totalReplies: { type: 'number', example: 25 },
                remainingReplies: { type: 'number', example: 15 },
                hasMore: { type: 'boolean', example: true }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getReplies(
    @Param('commentId') commentId: string,
    @Query() paginationDto: PaginationDto
  ) {
    return this.commentService.getRepliesByCommentId(
      commentId,
      paginationDto.page,
      paginationDto.limit
    );
  }
}
