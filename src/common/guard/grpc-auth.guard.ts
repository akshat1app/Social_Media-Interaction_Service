import {
    CanActivate,
    ExecutionContext,
    Inject,
    Injectable,
    UnauthorizedException,
  } from '@nestjs/common';
  import { ClientGrpc } from '@nestjs/microservices';
  import { Observable, lastValueFrom } from 'rxjs';
  import { Request } from 'express';
  
  interface AuthGrpcService {
    ValidateToken(data: { access_token: string }): Observable<{
      userId: string;
      email: string;
      role: string;
      issuedAt: number;
      expiresAt: number;
    }>;
  }
  
  @Injectable()
  export class GrpcAuthGuard implements CanActivate {
    private authService: AuthGrpcService;
  
    constructor(@Inject('AUTH_PACKAGE') private readonly client: ClientGrpc) {}
  
    onModuleInit() {
      this.authService = this.client.getService<AuthGrpcService>('AuthService');
    }
  
    async canActivate(context: ExecutionContext): Promise<boolean> {
      const req: Request = context.switchToHttp().getRequest();
      const authHeader = req.headers['authorization'];
  
      console.log('Received auth header:', authHeader);

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UnauthorizedException('Authorization token missing or malformed');
      }
  
      const token = authHeader.split(' ')[1];
      console.log('Extracted token:', token);
      
      try {
        console.log('Calling auth service ValidateToken...');
        const userPayload = await lastValueFrom(
          this.authService.ValidateToken({ access_token: token }),
        );
        console.log('Auth service response:', userPayload);
  
        req['user'] = userPayload;
        return true;
      } catch (error) {
        console.error('Token validation error:', error);
        throw new UnauthorizedException('Invalid or expired token');
      }
    }
  }
  