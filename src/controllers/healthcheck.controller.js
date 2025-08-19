import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/api-response.js"



const healthCheck = asyncHandler(async (req,res) => {
         res.status(200)
            .json(new ApiResponse(200,{message : "Server is up and running"})) 
});

export default healthCheck;