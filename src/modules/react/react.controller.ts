import { Controller, Post, Body, UseGuards, Req, Param, Get, Query } from '@nestjs/common';
import { GrpcAuthGuard } from '../../common/guard/grpc-auth.guard';
import { ReactService } from './react.service';
import { ReactDto } from './dto/react.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { PaginationDto } from './dto/pagination.dto';
import { ResponseMessage } from '../../common/decorators/response-message.decorator';
import { SUCCESS } from './constant/message.constant';

@ApiTags('Reactions')
@Controller('interaction')
export class ReactController {
  constructor(private readonly reactService: ReactService) {}

  /**
   * Toggle like status for a post (like/unlike)
   * @param dto 
   * @param req 
   * @returns Object with success message
   */
  @UseGuards(GrpcAuthGuard)
  @ApiBearerAuth()
  @Post('react')
  @ResponseMessage(SUCCESS.LIKE_UPDATED)
  @ApiOperation({ summary: 'Toggle like status for a post' })
  @ApiResponse({ 
    status: 200, 
    description: 'Like status toggled successfully',
    schema: {
      properties: {
        liked: { 
          type: 'boolean',
          example: true,
          description: 'Indicates whether the Post is now liked (true) or unliked (false)'
        },
        message: { 
          type: 'string',
          example: 'Post liked successfully'
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async toggleLike(@Body() dto: ReactDto, @Req() req) {
    return this.reactService.reactToPost(req.user.userId, dto);
  }

  /**
   * get a specific user's like status for a post
   * @param postId 
   * @param req 
   * @returns The user's like status
   */
  @UseGuards(GrpcAuthGuard)
  @ApiBearerAuth()
  @Get('react/:postId')
  @ResponseMessage(SUCCESS.GET_USER_REACTION)
  @ApiOperation({ summary: 'Get user like status for a specific post' })
  @ApiParam({ name: 'postId', description: 'ID of the post' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the user like status',
    schema: {
      properties: {
        message: { 
          type: 'string',
          example: 'User reaction status retrieved successfully'
        },
        data: {
          type: 'object',
          properties: {
            liked: { type: 'boolean' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getUserReaction(@Param('postId') postId: string, @Req() req) {
    return this.reactService.getUserReaction(postId, req.user.userId);
  }

  /**
   * to get all likes for a specific post
   * @param postId 
   * @returns Array of all likes on the post
   */
  @Get('react/:postId/all')
  @ResponseMessage(SUCCESS.GET_POST_REACTIONS)
  @ApiOperation({ summary: 'Get all likes for a specific post' })
  @ApiParam({ name: 'postId', description: 'ID of the post' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns paginated likes for the post with pagination information',
    schema: {
      properties: {
        message: { 
          type: 'string',
          example: 'Post reactions retrieved successfully'
        },
        data: {
          type: 'object',
          properties: {
            reactions: {
              type: 'array',
              items: { 
                type: 'object',
                properties: {
                  postId: { type: 'string' },
                  userId: { type: 'string' },
                  name: { type: 'string' },
                  reactedAt: { type: 'string', format: 'date-time' }
                }
              }
            },
            pagination: {
              type: 'object',
              properties: {
                currentPage: { type: 'number' },
                totalPages: { type: 'number' },
                totalReactions: { type: 'number' },
                remainingReactions: { type: 'number' },
                hasMore: { type: 'boolean' }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getReactions(
    @Param('postId') postId: string,
    @Query() paginationDto: PaginationDto
  ) {
    return this.reactService.getPostReactions(
      postId,
      paginationDto.page,
      paginationDto.limit
    );
  }

  /**
   * get the total number of likes for a post
   * @param postId 
   * @returns Total number of likes
   */
  @Get('react/:postId/summary')
  @ResponseMessage(SUCCESS.GET_REACTION_SUMMARY)
  @ApiOperation({ summary: 'Get like count for a specific post' })
  @ApiParam({ name: 'postId', description: 'ID of the post' })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns the total number of likes',
    schema: {
      properties: {
        message: { 
          type: 'string',
          example: 'Reaction summary retrieved successfully'
        },
        data: {
          type: 'object',
          properties: {
            likes: { type: 'number' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getSummary(@Param('postId') postId: string) {
    return this.reactService.getReactionSummary(postId);
  }
}
