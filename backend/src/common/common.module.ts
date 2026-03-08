import { Global, Module } from '@nestjs/common';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { ResponseEnvelopeInterceptor } from './interceptors/response-envelope.interceptor';

@Global()
@Module({
  providers: [
    ResponseEnvelopeInterceptor,
    JwtAuthGuard,
    RolesGuard,
    {
      provide: APP_INTERCEPTOR,
      useExisting: ResponseEnvelopeInterceptor,
    },
    {
      provide: APP_GUARD,
      useExisting: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useExisting: RolesGuard,
    },
  ],
  exports: [JwtAuthGuard, RolesGuard, ResponseEnvelopeInterceptor],
})
export class CommonModule {}
