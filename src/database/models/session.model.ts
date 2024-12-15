import mongoose, { Document, Schema} from "mongoose";
import { thirtyDaysFromNow } from "../../common/utils/date-time";


export interface SessionDocument extends Document {
    userId: mongoose.Types.ObjectId;
    userAgent?: string;
    expiredAt: Date;
    createdAt: Date;
}

const sessionSchema = new Schema<SessionDocument>({
    userId:{
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        require: true,
    },
    userAgent:{
        type: String,
        required: false,
    },
    expiredAt:{
        type: Date,
        default: thirtyDaysFromNow(),
    },
    createdAt:{
        type: Date,
        required: true,
        default: Date.now(),
    },
})

const SessionModel = mongoose.model<SessionDocument>('Session', sessionSchema);

export default SessionModel;