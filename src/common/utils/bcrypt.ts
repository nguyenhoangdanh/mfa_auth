import bcrypt from 'bcrypt';


export const hashPassword = async (password: string, slatRounds: number = 10) => {
    return await bcrypt.hash(password, slatRounds);
}
export const comparePassword = async (candidatePassword: string, hashedPassword: string) => {
    return await bcrypt.compare(candidatePassword, hashedPassword);
}