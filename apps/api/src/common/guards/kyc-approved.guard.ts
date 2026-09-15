import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthPayload } from '../decorators/current-user.decorator';
import { ProvidersService } from '../../modules/providers/providers.service';

@Injectable()
export class KycApprovedGuard implements CanActivate {
  constructor(private readonly providersService: ProvidersService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{ user?: AuthPayload }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException({
        code: 'FORBIDDEN',
        message: 'Accès non autorisé pour ce rôle.',
        details: [],
      });
    }

    if (user.role !== UserRole.provider) {
      return true;
    }

    await this.providersService.assertCanReceiveMissions(user.sub);
    return true;
  }
}
