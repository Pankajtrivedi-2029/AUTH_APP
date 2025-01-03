import express from 'express';
import { config } from 'dotenv';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import connectDB from './config/db.js';
import authRouter from './routes/authRoutes.js';
import userRouter from './routes/userRoutes.js';

// Load environment variables
config();

const app = express();

// Port configuration
const port = process.env.PORT || 4000;

// Connect to the database
connectDB();

const allowedOrigins = ['http://localhost:5173'] // add your frontend url here

// Middleware
app.use(express.json());
app.use(cookieParser());
app.use(cors({ credentials: true, origin: allowedOrigins }));

// API routes
app.get('/', (req, res) => {
    return res.send('API is working');
});
app.use('/api/auth',authRouter);
app.use('/api/user',userRouter);

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
