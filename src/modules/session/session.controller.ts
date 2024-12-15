import {Request, Response} from 'express';
import {asyncHandler} from '../../middlewares/asyncHandler';
import {SessionService} from './session.service';
import { HTTPSTATUS } from '../../config/http.config';
import { NotFoundException } from '../../common/utils/catch-error';
import * as z from 'zod';

export class SessionController {
  private sessionService: SessionService;
  constructor(sessionService: SessionService) {
    this.sessionService = sessionService;
  }

  public getAllSessions = asyncHandler(async (req: Request, res: Response) => {
    // const sessions = await this.sessionService.getAllSessions();
    const userId = req.user?.id;
    const sessionId = req.sessionId;

    const {sessions} = await this.sessionService.getAllSessions(userId);

    const modifySessions = sessions.map((session) => ({
        ...session.toObject(),
        ...(session.id === sessionId && {
            isCurrent: true,
        }),
    }));

    return res.status(HTTPSTATUS.OK).json({
        message: 'Retrieved all sessions successfully',
        sessions: modifySessions,
    });
  });

  public getSession = asyncHandler(async (req: Request, res: Response) => {
    const sessionId = req.sessionId;

    if (!sessionId) {
        throw new NotFoundException('Session ID not found. Please login again!');
    }

    const {user} = await this.sessionService.getSessionById(sessionId);

    return res.status(HTTPSTATUS.OK).json({
        message: 'Retrieved session successfully',
        user,
    });
  });

  public deleteSession = asyncHandler(async (req: Request, res: Response) => {
    const sessionId = z.string().parse(req.params.id);
    const userId = req.user?.id;
    await this.sessionService.deleteSession(sessionId, userId);

    return res.status(HTTPSTATUS.OK).json({
        message: 'Session deleted successfully',
    });
  });
}
