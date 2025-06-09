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
    console.log('✅ Kafka producer connected');
  }

  async emitLikeEvent(postId: string, userId: string, postOwnerId: string) {
    try {
      console.log('📤 Sending message to Kafka:', { postId, userId, postOwnerId });
      const message = {
        postId,
        userId,
        postOwnerId
      };
      await lastValueFrom(this.client.emit('post', message));
      console.log('✅ Message sent successfully');
    } catch (error) {
      console.error('❌ Error sending message to Kafka:', error);
      throw error;
    }
  }

  async emitCommentEvent(postId: string, userId: string, type: 'new_comment') {
    try {
      await lastValueFrom(this.client.emit('comment', {
        postId,
        userId,
        type,
      }));
      console.log('✅ Comment event sent');
    } catch (err) {
      console.error('❌ Kafka emit failed:', err);
    }
  }
}
