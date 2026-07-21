import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersModule } from '../users/users.module';
import { UsersService } from '../users/users.service';
import { RolesModule } from '../roles/roles.module';
import { Session, SessionSchema } from './schemas/session.schema';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleController } from './google.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { GoogleStrategy } from './strategies/google.strategy';

@Module({
  imports: [
    UsersModule,
    RolesModule,
    PassportModule,
    JwtModule.register({}),
    MongooseModule.forFeature([{ name: Session.name, schema: SessionSchema }]),
  ],
  controllers: [AuthController, GoogleController],
  providers: [
    AuthService,
    JwtStrategy,
    {
      // Google strategy only registers when credentials are configured.
      provide: GoogleStrategy,
      useFactory: (config: ConfigService, users: UsersService) =>
        config.get('GOOGLE_CLIENT_ID') && config.get('GOOGLE_CLIENT_SECRET')
          ? new GoogleStrategy(config, users)
          : null,
      inject: [ConfigService, UsersService],
    },
  ],
  exports: [AuthService],
})
export class AuthModule {}
