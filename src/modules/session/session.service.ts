import { NotFoundException } from '../../common/utils/catch-error';
import SessionModel from '../../database/models/session.model';
export class SessionService {
  constructor() {
    console.log('SessionService created');
  }

  async getAllSessions(userId: string) {
    const sessions = await SessionModel.find(
      {
        userId,
        expiredAt: {$gt: Date.now()},
      },
      {
        _id: 1,
        userId: 1,
        userAgent: 1,
        createdAt: 1,
        expiredAt: 1,
      },
      {
        sort: {createdAt: -1},
      },
    );

    return {
        sessions,
    }
  }

  async getSessionById(sessionId: string) {
    const session = await SessionModel.findById(sessionId)
    .populate('userId')
    .select("-expiredAt");

    if (!session) {
        throw new NotFoundException('Session not found');
    }

    const { userId: user } = session;

    return {
      user
    }
  }

  async deleteSession(sessionId: string, userId: string) {
    const session = await SessionModel.findByIdAndDelete({
        _id: sessionId,
        userId,
    });

    if (!session) {
        throw new NotFoundException('Session not found');
    }

    return;
  }
}
