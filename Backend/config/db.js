import mongoose from "mongoose";

const connectDB = async () => {
    try {
        console.log("Attempting to connect to MongoDB...");

        if (!process.env.MONGO_URL) {
            throw new Error("MONGO_URL is not defined in environment variables.");
        }

        // Set event listeners before connecting
        mongoose.connection.on('connected', () => {
            console.log('DB connected successfully');
        });

        mongoose.connection.on('error', (error) => {
            console.error('MongoDB connection error:', error);
        });

        // Connect to MongoDB
        await mongoose.connect(`${process.env.MONGO_URL}MERN_AUTH_APP`);
    } catch (error) {
        console.error("Something went wrong during the database connection!");
        console.error(error);
        process.exit(1); // Exit with failure code
    }
};

export default connectDB;


// const connectDB = async () => {
//     await mongoose.connect(process.env.MONGO_URL).then(()=>{
//         console.log('DB connected')
//     })
// }

// export default connectDB;
