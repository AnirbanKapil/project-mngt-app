import dotenv from "dotenv";
import express from "express";

dotenv.config({
    path : "./.env"
});


const app = express();
const port = process.env.PORT || 3000;


app.get("/",(req,res)=>{
    res.send("Welcome")
})

app.listen(port,()=>{
    console.log(`App Up and Running on port - ${port}`)
})