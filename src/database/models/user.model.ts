import mongoose, { Document, Schema } from "mongoose";
import { comparePassword, hashPassword } from "../../common/utils/bcrypt";

interface IUserPreferences {
    enable2FA: boolean;
    emailNotifications: boolean;
    twoFactorSecret: string;
}


export interface UserDocument extends Document {
    username: string;
    email: string;
    password: string;
    isEmailVerified: boolean;
    createdAt: Date;
    updatedAt: Date;
    userPreferences: IUserPreferences;
    comparePassword(candidatePassword: string): Promise<boolean>;
}

const userPreferences = new Schema<IUserPreferences>({
    enable2FA: { type: Boolean, default: false },
    emailNotifications: { type: Boolean, default: true },
    twoFactorSecret: { type: String, default: null, required: false },
})

const userSchema = new Schema<UserDocument>({
    username: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    isEmailVerified: { type: Boolean, default: false },
    userPreferences: {
        type: userPreferences,
        default: {},
    },
}, { timestamps: true, toJSON: {} });

userSchema.pre<UserDocument>('save', async function (next) {
    if (this.isModified('password')) {
        this.password = await hashPassword(this.password);
    }
    next();
});


userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return await comparePassword(candidatePassword, this.password);
}


userSchema.set('toJSON', {
    transform: (doc, ret) => {
        delete ret.password;
        delete ret.userPreferences.twoFactorSecret;
        return ret;
    }
})

const UserModel = mongoose.model<UserDocument>('User', userSchema);

export default UserModel;