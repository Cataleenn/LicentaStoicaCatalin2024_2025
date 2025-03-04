import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader) {
      console.log('⚠️ No Authorization header received');
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.split(' ')[1];
    console.log('🔹 Token primit:', token);

    try {
      const payload = this.jwtService.verify(token);
      console.log('✅ Token valid, payload:', payload);
      if (payload.role !== 'admin') {
        throw new UnauthorizedException('Access restricted to administrators only');
      }
      request.user = payload;
      return true;
    } catch (err) {
      console.log('❌ Eroare la verificarea token-ului:', err.message);
      throw new UnauthorizedException('Invalid token');
    }
}

}
