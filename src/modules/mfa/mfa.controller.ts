import {Response, Request} from 'express';
import {asyncHandler} from '../../middlewares/asyncHandler';
import {MfaService} from './mfa.service';
import {HTTPSTATUS} from '../../config/http.config';
import {
  mfaSchema,
  verifyMfaForLoginSchema,
} from '../../common/validators/mfa.validator';
import {setAuthenticaionCookies} from '../../common/utils/cookie';

export class MfaController {
  private readonly mfaService: MfaService;
  constructor(mfaService: MfaService) {
    this.mfaService = mfaService;
  }

  public generateMFASetup = asyncHandler(
    async (req: Request, res: Response) => {
      const {message, secret, qrImageUrl} =
        await this.mfaService.generateMFASetup(req);

      return res.status(HTTPSTATUS.OK).json({
        message,
        secret,
        qrImageUrl,
      });
    },
  );

  public verifyMFASetup = asyncHandler(async (req: Request, res: Response) => {
    // const {code, secretKey} = mfaSchema.parse({
    //   ...req.body,
    // });

    const validationResult = mfaSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(HTTPSTATUS.BAD_REQUEST).json({
        message: 'Invalid MFA setup data',
        errors: validationResult.error.format(),
      });
    }
    const {code, secretKey} = validationResult.data;

    const {message, userPreferences} = await this.mfaService.verifyMFASetup(
      req,
      code,
      secretKey,
    );

    return res.status(HTTPSTATUS.OK).json({
      message,
      userPreferences,
    });
  });

  public revokeMFASetup = asyncHandler(async (req: Request, res: Response) => {
    const {message, userPreferences} =
      await this.mfaService.revokeMFASetup(req);

    return res.status(HTTPSTATUS.OK).json({
      message,
      userPreferences,
    });
  });

  public verifyMfaForLogin = asyncHandler(
    async (req: Request, res: Response) => {
      // const {code, email, userAgent} = verifyMfaForLoginSchema.parse({
      //   ...req.body,
      //   userAgent: req.headers['user-agent'],
      // });

      const validationResult = verifyMfaForLoginSchema.safeParse({
        ...req.body,
        userAgent: req.headers["user-agent"] || "unknown",
      });
      if (!validationResult.success) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json({
          message: "Invalid MFA verification data",
          errors: validationResult.error.format(),
        });
      }
      const { code, email, userAgent } = validationResult.data;
      

      const {accessToken, refreshToken, user} =
        await this.mfaService.verifyMfaForLogin(code, email, userAgent);

      //   return res.status(HTTPSTATUS.OK).json({
      //     accessToken,
      //     refreshToken,
      //     user,
      //   });

      if (!accessToken || !refreshToken) {
        return res.status(HTTPSTATUS.UNAUTHORIZED).json({
          message: "Failed to generate authentication tokens",
        });
      }
      
      return setAuthenticaionCookies({
        res,
        accessToken,
        refreshToken,
      })
        .status(HTTPSTATUS.OK)
        .json({
          message: 'User logged in successfully',
          user,
        });
    },
  );
}
