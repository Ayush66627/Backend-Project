import dotenv from 'dotenv';
import connectDB from "./db/data.js";

dotenv.config({
    path: './env',
})

connectDB()

// import express from 'express'
// const app = express()

// ;(async() => {
//     try {
//       await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
//       app.on("error", (error) => {
//         console.error("mongoose connection error", error);
//       })

//        app.listen(process.env.PORT, () => {
//         console.log(`Server is running on port ${process.env.PORT}`);
//        })

//     } catch (error) {
//         console.log("error:", error);
//         throw error
//     }
// })()