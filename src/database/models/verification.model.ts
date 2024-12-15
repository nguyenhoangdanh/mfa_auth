import mongoose, { Document, Schema} from "mongoose";
import { VefificationEnum } from "../../common/enums/verification-code.enum";
import { generateUniqueCode } from "../../common/utils/uuid";


export interface VerificationDocument extends Document {
    userId: mongoose.Types.ObjectId;
    code: string;
    type: VefificationEnum;
    expiredAt: Date;
    createdAt: Date;
}


export const verificationSchema = new Schema<VerificationDocument>({
    userId:{
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User',
        index: true,
    },
    code:{
        type: String,
        required: true,
        unique: true,
        default: generateUniqueCode,
    },
    type:{
        type: String,
        required: true,
    },
    expiredAt:{
        type: Date,
        required: true,
    },
    createdAt:{
        type: Date,
        default: Date.now(),
    },
})


const VerificationModel = mongoose.model<VerificationDocument>(
    'VerificationCode', 
    verificationSchema,
    'verification_codes'
);

export default VerificationModel;