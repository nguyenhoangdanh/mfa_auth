import 'dotenv/config';
import express, { Response, Request, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { config } from './config/app.config';
import { errorHandler } from './middlewares/errorHandler';
import { authRoutes } from './modules/auth/auth.routes';
import connectDatabase from './database/database';
import passport from './middlewares/passport';
import { authenticateJwt } from './common/strategies/jwt.strategy';
import { sessionRoutes } from './modules/session/session.routes';
import { mfaRoutes } from './modules/mfa/mfa.routes';


const app = express();
const BASE_PATH = config.BASE_PATH;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(
    cors({
        origin: config.APP_ORIGIN,
        credentials: true,
    })
)

app.use(cookieParser());
app.use(passport.initialize());
// app.get("/", (req, res) => {
//     res.send("Hello from Express with TypeScript on Vercel!");
//   });

app.use(`${BASE_PATH}/auth`, authRoutes);

app.use(`${BASE_PATH}/mfa`, mfaRoutes);

app.use(`${BASE_PATH}/session`, authenticateJwt, sessionRoutes)

app.use(errorHandler);


// app.listen(config.PORT, async() => {
//     console.log(`Server is running on port ${config.PORT} in ${config.NODE_ENV} mode`);
//     await connectDatabase();
// });

export default app;