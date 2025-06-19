// src/kafka/kafka.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ClientKafka, Client, Transport } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class KafkaProducerService implements OnModuleInit {
    @Client({
        transport: Transport.KAFKA,
        options: {
          client: {
            clientId: 'producer-service',
            brokers: ['localhost:9092'],
          },
          producer: {
            allowAutoTopicCreation: true,
            transactionTimeout: 30000,
            retry: {
              initialRetryTime: 100,
              retries: 8
            }
          },
        },
      })
  private client: ClientKafka;

  async onModuleInit() {
    await this.client.connect();
    console.log('Kafka producer connected');
  }

  async emitLikeEvent(postId: string, userId: string, userName: string, mediaUrl:string, postOwnerId: string) {
    try {
      console.log('Sending message to Kafka:', { postId, userId, userName, postOwnerId });
      const message = {
        postId,
        userId,
        userName,
        mediaUrl,
        postOwnerId
      };
      await lastValueFrom(this.client.emit('post.react', message));
      console.log('Message sent successfully');
    } catch (error) {
      console.error('Error sending message to Kafka:', error);
      throw error;
    }
  }

  async emitCommentEvent(postId: string, userId: string, userName: string, mediaUrl: string, postOwnerId: string) {
    try {
      await lastValueFrom(this.client.emit('post.comment', {
        postId,
        userId,
        userName,
        mediaUrl,
        postOwnerId,
      }));
      console.log('Comment event sent');
    } catch (err) {
      console.error('Kafka emit failed:', err);
    }
  }

  async emitReplyEvent(postId: string, userId: string, userName:string, mediaUrl: string, postOwnerId: string, parentCommentId: string, replyToUserId: string) {
    try {
      await lastValueFrom(this.client.emit('post.reply', {
        postId,
        userId,
        userName,
        mediaUrl,
        postOwnerId,
        parentCommentId,
        replyToUserId
      }));
      console.log('reply event sent');
    } catch (err) {
      console.error('Kafka emit failed:', err);
    }
  }
}
