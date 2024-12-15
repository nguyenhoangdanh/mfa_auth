import mongoose from 'mongoose';
import { config } from '../config/app.config';

const connectDatabase = async () => {
    try {
        await mongoose.connect(config.MONGO_URI)
        // console.log('Database connected successfully');
        console.log('Mongo DB connected successfully');
    } catch (error) {
        console.error('Database connection failed');
    }
}
export default connectDatabase; 