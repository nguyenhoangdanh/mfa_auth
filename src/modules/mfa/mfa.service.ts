import {Request} from 'express';
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '../../common/utils/catch-error';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import {config} from '../../config/app.config';
import {sendEmail} from '../../mailers/templates/mailer';
import {mfaSetupTemplate} from '../../mailers/templates/template';
import UserModel from '../../database/models/user.model';
import SessionModel from '../../database/models/session.model';
import { refreshTokenSignOptions, signJwtToken } from '../../common/utils/jwt';
export class MfaService {
  constructor() {
    console.log('MfaService created');
  }

  public async generateMFASetup(req: Request) {
    const user = req.user;

    if (!user) {
      throw new UnauthorizedException('User not unauthorized');
    }

    if (user.userPreferences.enable2FA) {
      throw new UnauthorizedException('MFA already enabled');
    }

    let secretKey = user.userPreferences.twoFactorSecret;

    if (!secretKey) {
      const secret = speakeasy.generateSecret({name: 'Squeezy'});
      secretKey = secret.base32;
      user.userPreferences.twoFactorSecret = secretKey;
      await user.save();
    }

    const url = speakeasy.otpauthURL({
      secret: secretKey,
      label: `${user.username}`,
      issuer: 'squeezy.com',
      encoding: 'base32',
    });

    const qrImageUrl = await qrcode.toDataURL(url);

    return {
      message: 'Scan the QR code or use the setup key.',
      secret: secretKey,
      qrImageUrl,
    };
  }

  public async verifyMFASetup(req: Request, code: string, secretKey: string) {
    const user = req.user;

    if (!user) {
      throw new UnauthorizedException('User not unauthorized');
    }

    if (user.userPreferences.enable2FA) {
      return {
        message: 'MFA already enabled',
        userPreferences: {
          enable2FA: user.userPreferences.enable2FA,
        },
      };
    }

    // // Generate a TOTP code
    const tokenCode = speakeasy.totp({
      secret: secretKey,
      encoding: 'base32',
    });
    console.log('tokenCode', tokenCode);

    // const OTPCode = `${config.APP_ORIGIN}/mfa/verify`;

    // await sendEmail({
    //     to: user.email,
    //     ...mfaSetupTemplate(tokenCode),
    // })

    const isValid = speakeasy.totp.verify({
      secret: secretKey,
      encoding: 'base32',
      token: tokenCode,
    });

    console.log('isValid', isValid);

    if (!isValid) {
      throw new BadRequestException('Invalid MFA code. Please try again.');
    }

    user.userPreferences.enable2FA = true;
    await user.save();

    return {
      message: 'MFA enabled successfully',
      userPreferences: {
        enable2FA: user.userPreferences.enable2FA,
      },
    };
  }

  public async revokeMFASetup(req: Request) {
    const user = req.user;

    if (!user) {
      throw new UnauthorizedException('User not unauthorized');
    }

    if (!user.userPreferences.enable2FA) {
      return {
        message: 'MFA already disabled',
        userPreferences: {
          enable2FA: user.userPreferences.enable2FA,
        },
      };
    }

    user.userPreferences.enable2FA = false;
    user.userPreferences.twoFactorSecret = '';
    await user.save();

    return {
      message: 'MFA revoke successfully',
      userPreferences: {
        enable2FA: user.userPreferences.enable2FA,
      },
    };
  }

  public async verifyMfaForLogin(
    code: string,
    email: string,
    userAgent?: string,
  ) {
    const user = await UserModel.findOne({email});

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (
      !user.userPreferences.enable2FA &&
      !user.userPreferences.twoFactorSecret
    ) {
      throw new BadRequestException('MFA not enabled for this user');
    }

    //Gerenerate a TOTP code
    const tokenCode = speakeasy.totp({
      secret: user.userPreferences.twoFactorSecret,
      encoding: 'base32',
    });

    const isValid = speakeasy.totp.verify({
      secret: user.userPreferences.twoFactorSecret,
      encoding: 'base32',
      token: tokenCode,
    });

    if (!isValid) {
      throw new BadRequestException('Invalid MFA code. Please try again.');
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
    };
  }
}
