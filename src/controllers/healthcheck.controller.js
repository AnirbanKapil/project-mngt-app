import { ApiResponse } from "../utils/api-response.js"


const healthCheck = (req,res) => {
    try {
        res.status(200)
           .json(new ApiResponse(200,{message : "Server up and running"})) 
    } catch (error) {
        
    }
};

export default healthCheck;