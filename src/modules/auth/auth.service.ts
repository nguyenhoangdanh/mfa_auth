import jwt from 'jsonwebtoken';
import {ErrorCode} from '../../common/enums/error-code.enum';
import {VefificationEnum} from '../../common/enums/verification-code.enum';
import {
  ILoginDto,
  IRegisterDto,
  IResetPasswordDto,
} from '../../common/interface/auth.interface';
import {
  BadRequestException,
  HttpException,
  InternalServerException,
  NotFoundException,
  UnauthorizedException,
} from '../../common/utils/catch-error';
import {
  anHourFromNow,
  calculateExpirationDate,
  fortyFiveMinutesFromNow,
  ONE_DAY_IN_MILLISECONDS,
  threeMinutesAgo,
} from '../../common/utils/date-time';
import SessionModel from '../../database/models/session.model';
import UserModel from '../../database/models/user.model';
import VerificationModel from '../../database/models/verification.model';
import {config} from '../../config/app.config';
import {
  refreshTokenSignOptions,
  RefreshTPayload,
  signJwtToken,
  verifyJwtToken,
} from '../../common/utils/jwt';
import {use} from 'passport';
import {sendEmail} from '../../mailers/templates/mailer';
import {
  passwordResetTemplate,
  verifyEmailTemplate,
} from '../../mailers/templates/template';
import {HTTPSTATUS} from '../../config/http.config';
import {hashPassword} from '../../common/utils/bcrypt';

export class AuthService {
  public async register(data: IRegisterDto): Promise<any> {
    const {username, password, email} = data;

    const existingUser = await UserModel.exists({email});

    if (existingUser) {
      throw new BadRequestException(
        'User already exists',
        ErrorCode.AUTH_EMAIL_ALREADY_EXISTS,
      );
    }

    const newUser = await UserModel.create({
      username,
      password,
      email,
    });

    const userId = newUser._id;

    const verificationCode = await VerificationModel.create({
      userId,
      type: VefificationEnum.EMAIL_VERIFICATION,
      expiredAt: fortyFiveMinutesFromNow(),
    });

    // Send verification email link
    const verificationUrl = `${config.APP_ORIGIN}/confirm-account?code=${verificationCode.code}&verification`;

    await sendEmail({
      to: newUser.email,
      ...verifyEmailTemplate(verificationUrl),
    });

    return {
      user: newUser,
    };
  }

  public async login(data: ILoginDto): Promise<any> {
    const {email, password, userAgent} = data;
    const user = await UserModel.findOne({email});

    if (!user) {
      throw new BadRequestException(
        'Invalid email or password provided',
        ErrorCode.AUTH_USER_NOT_FOUND,
      );
    }

    const isInvalidPassword = await user.comparePassword(password);

    if (!isInvalidPassword) {
      throw new BadRequestException(
        'Invalid email or password provided',
        ErrorCode.AUTH_USER_NOT_FOUND,
      );
    }

    // Check if the user enabled 2FA

    if (user.userPreferences.enable2FA) {
      return {
        user: null,
        mfaRequired: true,
        accessToken: '',
        refreshToken: '',
      };
    }

    const session = await SessionModel.create({
      userId: user._id,
      userAgent,
    });

    const accessToken = signJwtToken({
      userId: user._id,
      sessionId: session._id,
    });

    const refreshToken = signJwtToken(
      {
        sessionId: session._id,
      },
      refreshTokenSignOptions,
    );

    return {
      user,
      accessToken,
      refreshToken,
      mfaRequired: false,
    };
  }

  public async refreshToken(refreshToken: string): Promise<any> {
    const {payload} = verifyJwtToken<RefreshTPayload>(refreshToken, {
      secret: refreshTokenSignOptions.secret,
    });

    if (!payload) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const session = await SessionModel.findById(payload.sessionId);
    const now = Date.now();

    if (!session) {
      throw new UnauthorizedException('Session does not exist');
    }

    if (session.expiredAt.getTime() < now) {
      throw new UnauthorizedException('Session expired');
    }

    const sessionRequireRefresh =
      session.expiredAt.getTime() - now <= ONE_DAY_IN_MILLISECONDS;

    if (sessionRequireRefresh) {
      session.expiredAt = calculateExpirationDate(
        config.JWT.REFRESH_EXPIRES_IN,
      );
      await session.save();
    }

    const newRefereshToken = sessionRequireRefresh
      ? signJwtToken(
          {
            sessionId: session._id,
          },
          refreshTokenSignOptions,
        )
      : undefined;

    const accessToken = signJwtToken({
      userId: session.userId,
      sessionId: session._id,
    });
    return {
      accessToken,
      newRefereshToken,
    };
  }

  public async verifyEmail(verificationCode: string): Promise<any> {
    const validCode = await VerificationModel.findOne({
      code: verificationCode,
      type: VefificationEnum.EMAIL_VERIFICATION,
      expiredAt: {
        $gt: new Date(), // Check if the code is not expired
      },
    });

    if (!validCode) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    const updateUser = await UserModel.findByIdAndUpdate(
      validCode.userId,
      {isEmailVerified: true},
      {new: true},
    );
    if (!updateUser) {
      throw new BadRequestException(
        'Unable to verify email',
        ErrorCode.VALIDATION_ERROR,
      );
    }

    await validCode.deleteOne();

    return {
      user: updateUser,
    };
  }

  public async forgotPassword(email: string): Promise<any> {
    const user = await UserModel.findOne({email});

    if (!user) {
      throw new NotFoundException(
        'User not found',
        ErrorCode.AUTH_USER_NOT_FOUND,
      );
    }

    //check mail rate limit is 2 emails per 3 or 10 minutes
    const timeAgo = threeMinutesAgo();
    const maxAttempts = 2;

    const count = await VerificationModel.countDocuments({
      userId: user._id,
      type: VefificationEnum.PASSWORD_RESET,
      createdAt: {$gt: timeAgo},
    });

    if (count >= maxAttempts) {
      throw new HttpException(
        'Too many requests, try again later',
        HTTPSTATUS.TOO_MANY_REQUESTS,
        ErrorCode.AUTH_TOO_MANY_ATTEMPTS,
      );
    }

    const expiresAt = anHourFromNow();

    const validCode = await VerificationModel.create({
      userId: user._id,
      type: VefificationEnum.PASSWORD_RESET,
      expiredAt: expiresAt,
    });

    const resetLink = `${config.APP_ORIGIN}/reset-password?code=${validCode.code}&exp=${expiresAt.getTime()}`;

    const {data, error} = await sendEmail({
      to: user.email,
      ...passwordResetTemplate(resetLink),
    });

    if (!data?.id) {
      throw new InternalServerException(`${error?.name} - ${error?.message}`);
    }

    return {
      message: 'Password reset link sent successfully',
      url: resetLink,
      emailId: data.id,
    };
  }

  public async resetPassword({
    password,
    verificationCode,
  }: IResetPasswordDto): Promise<any> {
    const validCode = await VerificationModel.findOne({
      code: verificationCode,
      type: VefificationEnum.PASSWORD_RESET,
      expiredAt: {
        $gt: new Date(),
      },
    });

    if (!validCode) {
      throw new NotFoundException(
        'Invalid or expired verification code',
        ErrorCode.AUTH_NOT_FOUND,
      );
    }

    const hashedPassword = await hashPassword(password);

    const updateUser = await UserModel.findByIdAndUpdate(validCode.userId, {
      password: hashedPassword,
    });

    if (!updateUser) {
      throw new BadRequestException('Failed to reset password');
    }

    await validCode.deleteOne();

    await SessionModel.deleteMany({
      userId: updateUser._id,
    });

    return {
      user: updateUser,
    };
  }

  public async logout(sessionId: string): Promise<any> {
    return await SessionModel.findByIdAndDelete(sessionId);
  }
}
