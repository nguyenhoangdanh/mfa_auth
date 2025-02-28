import {
  ExtractJwt,
  StrategyOptionsWithRequest,
  Strategy as JWTStrategy,
} from 'passport-jwt';
import { UnauthorizedException } from '../utils/catch-error';
import { ErrorCode } from '../enums/error-code.enum';
import { config } from '../../config/app.config';
import passport, { PassportStatic } from 'passport';
import { userService } from '../../modules/user/user.module';
import { NextFunction, Request, Response } from 'express';

interface IJwtPayload {
  userId: string;
  sessionId: string;
}

const options: StrategyOptionsWithRequest = {
  jwtFromRequest: ExtractJwt.fromExtractors([
    (req: Request) => {
      const accessToken = req.cookies?.accessToken;
      if (!accessToken) {
        throw new UnauthorizedException(
          'Unauthorized access token',
          ErrorCode.AUTH_TOKEN_NOT_FOUND,
        );
      }
      return accessToken;
    },
  ]),
  secretOrKey: config.JWT.SECRET,
  audience: ['user'],
  algorithms: ['HS256'],
  passReqToCallback: true,
};

export const setupJwtStrategy = (passport: PassportStatic) => {
  passport.use(
    new JWTStrategy(
      options,
      async (req: Request, payload: IJwtPayload, done) => {
        try {
          const user = await userService.findUserById(payload.userId);

          if (!user) {
            return done(null, false);
          }

          (req as any).sessionId = payload.sessionId;
          return done(null, user);
        } catch (error) {
          return done(error, false);
        }
      },
    ),
  );
};

export const authenticateJwt = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  passport.authenticate(
    'jwt',
    { session: false },
    (err: Error | null, user: Express.User | false, info: any) => {
      if (err || !user) {
        return res.status(401).json({
          message: 'Unauthorized',
          error: info?.message || err?.message || 'Authentication failed',
        });
      }
      (req as any).user = user;
      return next();
    },
  )(req, res, next);
};
