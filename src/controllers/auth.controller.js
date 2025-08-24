import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {emailVerificationMailgenContent, sendEmail} from "../utils/mail.js"

const generateAccessAndRefreshToken = async (userId) => {
    
    const user = await User.findById(userId)
    
    try {
        const accessToken = user.generateAccessToken();
        const refreshToken =  user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave : false});
        
        return {accessToken , refreshToken};

    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating token")
    }
}



const registerUser = asyncHandler(async (req,res) => {
     
    const {username,role,password,email} = req.body;

    const existedUser = await User.findOne({
        $or : [{email},{username}]
    });

    if(existedUser){
        throw new ApiError(401,"User with email or username already exists",[])
    }

    const user = await User.create({
        username,
        email,
        password,
        isEmailVerified : false
    })

    const {unHashedToken , hashedToken , tokenExpiry} = user.generateTemporaryToken(); 

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;

    await user.save({validateBeforeSave : false});

    await sendEmail({
        email : user?.email,
        subject : "Please verify your email",
        maigenContent : emailVerificationMailgenContent(
            user.username,
            `${req.protocol}://${req.host}/api/v1/users/verify-email/${unHashedToken}`
        )
    })

    const createdUser = await User.findById(user._id).select(
        " -password -refreshToken -emailVerificationToken -emailVerificationExpiry"
    );
    if(!createdUser){
        throw new ApiError(500,"Error while registering a user")
    };
    
    return res.status(201).json(
        new ApiResponse(201,{user : createdUser},"User registered successfully. Please verify your email")
    );

});


export {registerUser};