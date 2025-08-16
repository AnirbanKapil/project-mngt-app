import dotenv from "dotenv";
import app from "./app.js";
import connectDB from "./db/index.js";

dotenv.config({
    path : "./.env"
});


const port = process.env.PORT || 3000


connectDB()
.then(()=>{
    app.listen(port,()=>{
    console.log(`App up and running on port -- ${port}`)
})
})
.catch((err)=>{
    console.log("Error connecting to MnogoDB")
})



