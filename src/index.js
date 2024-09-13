// require('dotenv').config({path:'./env'})
import dotenv from "dotenv"
import connectDB from './db/index.js'
import {app} from "./app.js"

dotenv.config({
    path:"./.env"
})



//async method return a promise
connectDB()
.then(()=>{
    //use app
    app.listen(process.env.PORT||8000,()=>{
        console.log(` Server is running at port ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log(` MongoDB connection failed!! ${err}`);
})


/*
;(async ()=>{
    try {
        await mongoose.connect(`${process.env.MONGO_URI}/${DB_NAME}`)
        app.on("error",(error)=>{
            console.log("Error: ",error);
            throw error
        })

        app.listen(process.env.PORT,()=>{
            console.log(`APP is listening on PORT ${process.env.PORT}`);
        })
    } catch (error) {
        console.log("ERROR: ",error);
        throw error
    }
})()
*/