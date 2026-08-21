import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Injectable()
export class NeonAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Missing Neon Auth token or session');
    }

    const user = await this.authService.verifySessionOrToken(token);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired Neon Auth session');
    }

    request.user = user;
    return true;
  }

  private extractToken(request: any): string | null {
    const authHeader = request.headers?.authorization;
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    if (request.cookies && request.cookies['better-auth.session_token']) {
      return request.cookies['better-auth.session_token'];
    }
    return null;
  }
}

@Injectable()
export class OptionalNeonAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractToken(request);

    if (token) {
      const user = await this.authService.verifySessionOrToken(token);
      request.user = user || null;
    } else {
      request.user = null;
    }

    return true;
  }

  private extractToken(request: any): string | null {
    const authHeader = request.headers?.authorization;
    if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    if (request.cookies && request.cookies['better-auth.session_token']) {
      return request.cookies['better-auth.session_token'];
    }
    return null;
  }
}
