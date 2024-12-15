import UserModel from "../../database/models/user.model";


export class UserService {
    public async finfUserById(userId: string){
        const user = await UserModel.findById(userId,{
            password: false,
        });

        return user || null;
    }
}