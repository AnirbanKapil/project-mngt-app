import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/api-response.js";
import { ApiError } from "../utils/api-error.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {emailVerificationMailgenContent, forgotPasswordMailgenContent, sendEmail} from "../utils/mail.js";
import jwt from ' jsonwebtoken'


const generateAccessAndRefreshToken = async (userId) => {
    
    const user = await User.findById(userId)
    
    try {
        const accessToken = await user.generateAccessToken();
        const refreshToken = await user.generateRefreshToken();
        
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
        mailgenContent : emailVerificationMailgenContent(
            user.username,
            `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`
        )
    })

    const createdUser = await User.findById(user._id).select(
        " -password -refreshToken -emailVerificationToken -emailVerificationExpiry "
    );
    if(!createdUser){
        throw new ApiError(500,"Error while registering a user")
    };
    
    return res.status(201).json(
        new ApiResponse(201,{user : createdUser},"User registered successfully. Please verify your email")
    );

});


const loginUser = asyncHandler(async (req,res) => {
    
    const {password , email} = req.body;

    if(!email){
        throw new ApiError(401,"email is required"); 
    };
    
    const user = await User.findOne({email});
    if(!user){
        throw new ApiError(400,"user does not exist");
    };
    
    const isPasswordValid = await user.isPasswordCorrect(password);
    if(!isPasswordValid){
        throw new ApiError(400,"invalid credentials");
    };

    const {accessToken , refreshToken} = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken -emailVerificationToken -emailVerificationExpiry"
    ) 
    
    const options = {
        httpOnly : true,
        secured : true
    };

    return res.status(200)
              .cookie("accessToken",accessToken,options)
              .cookie("refreshToken",refreshToken,options)
              .json(new ApiResponse(
                200,{
                    user : loggedInUser,
                    accessToken,
                    refreshToken
                },
                "User logged in successfully"
              ));
});


const logoutUser = asyncHandler(async (req,res) => {
      await User.findByIdAndUpdate(req.user._id,{
        $set : {
            refreshToken : ""
        }
      },{
        new : true
      });

      const options = {
        httpOnly : true,
        secure : true
      };

      return res.status(200)
                .clearCookie("accessToken",options)
                .clearCookie("refreshToken",options)
                .json(new ApiResponse(201,{},"logged out successfully"))
});


const getCurrentUser = asyncHandler(async (req,res) => {
    return res.status(201)
              .json(new ApiResponse(201,req.user,"Current user fetched successfully !!"))
});


const verifyEmail = asyncHandler(async (req,res) => {
    const {verificationToken} = req.params;

    if(!verificationToken){
        throw new ApiError(401,"Email verification token missing")
    };

    let hashedToken = crypto
       .createHash("sha256")
       .update(verificationToken)
       .digest("hex");

    const user = await User.findOne({
        emailVerificationToken : hashedToken,
        emailVerificationExpiry : {
            $gt : Date.now()
        }
    });
    
    if(!user){
        throw new ApiError(402,"Token is invalid or expired")
    };
    
    user.emailVerificationToken = undefined;
    user.emailVerificationExpiry = undefined;

    user.isEmailVerified = true;
    user.save({validateBeforeSave : false});

    return res.status(200)
              .json(new ApiResponse(200,{isEmailVerified : true},"User verified successfully"));
});


const resendEmailVerification = asyncHandler(async (req,res) => {
    const user = await User.findById(req.user?._id);
    
    if(!user){
        throw new ApiError(404,"User doesnot exist")
    };

    if(user.isEmailVerified){
        throw new ApiError(409,"Email already verified")
    };

    const {unHashedToken , hashedToken , tokenExpiry} = user.generateTemporaryToken(); 

    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpiry = tokenExpiry;

    await user.save({validateBeforeSave : false});

    await sendEmail({
        email : user?.email,
        subject : "Please verify your email",
        mailgenContent : emailVerificationMailgenContent(
            user.username,
            `${req.protocol}://${req.get("host")}/api/v1/users/verify-email/${unHashedToken}`
        )
    });

    return res.status(200)
              .json(201,{},"Mail has been sent to your EmailId")
});


const refreshAccessToken = asyncHandler(async (req,res) => {
    const incommingRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;

    if(!incommingRefreshToken){
        throw new ApiError(401,"Unauthorized access")
    };

    try {
        const decodedRefreshToken = await jwt.verify(incommingRefreshToken,process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodedRefreshToken?._id);
        if(!user){
            throw new ApiError(402,"Invalid refresh token")
        };

        if(incommingRefreshToken !== user?.refreshToken){
            throw new ApiError(403,"Refresh token has expired")
        };
        
        const options = {
            httpOnly : true,
            secure : true
        };

        const {accessToken , refreshToken : newRefreshToken } = await user.generateAccessAndRefreshToken(user._id);

        user.refreshToken = newRefreshToken;
        await user.save();

        return res.status(201)
                  .cookie("accessToken",accessToken,options)
                  .cookie("refreshToken",newRefreshToken,options)
                  .json(new ApiResponse(200,{accessToken,refreshToken : newRefreshToken},"Access token refreshed successfully"));

    } catch (error) {
        throw new ApiError(401,"Invalid refresh token")
    };
});


const forgotPasswordRequest = asyncHandler(async (req,res) => {
    const {email} = req.body;

    const user = await User.findOne({email});
    if(!user){
        throw new ApiError(401,"User doesnot exist!!")
    };

    const {unHashedToken , hashedToken ,tokenExpiry} = user.generateTemporaryToken();

    user.forgotPasswordToken = hashedToken;
    user.forgotPasswordExpiry = tokenExpiry;

    await user.save({validateBeforeSave : false});

    await sendEmail({
        email : user?.email,
        subject : "Password reset request",
        mailgenContent : forgotPasswordMailgenContent(
            user.username,
            `${FORGOT_PASSWORD_REDIRECT_URL}/${unHashedToken}`
        )
    });

    return res.status(200)
              .json(new ApiResponse(
                200,{},"Password reset mail has been sent to your mail ID"
              ))
});


const resetForgotPassword = asyncHandler(async (req,res) => {
    const {resetToken} = req.params;
    const {newPassword} = req.body;

    let hashedToken = crypto
                      .createHash("sha256")
                      .update(resetToken)
                      .digest("hex");

    const user = await User.findOne({
        forgotPasswordToken : hashedToken,
        forgotPasswordExpiry : {$gt : Date.now()}
    });
    
    if(!user){
        throw new ApiError(489,"Token invalid or expired")
    }

    user.forgotPasswordToken = undefined;
    user.forgotPasswordExpiry = undefined;
    
    user.password = newPassword
    await user.save({validateBeforeSave : false});

    return res.status(200)
              .json(new ApiResponse(
                200,{},"Password reset successfully"
              ))
});


const changeCurrentPassword = asyncHandler(async (req,res) => {
    const {oldPassword , newPassword} = req.body;

    const user = await User.findById(req.user?._id);

    const isPasswordValid = await user.isPasswordCorrect(oldPassword);
    if(!isPasswordValid){
        throw new ApiError(402,"Invalid old password")
    };

    user.password = newPassword;
    await user.save({validateBeforeSave : false});

    return res.status(201)
              .json(new ApiResponse(201,{},"Password reset successful!!"));
});

export {registerUser , loginUser , logoutUser , getCurrentUser , verifyEmail , 
        resendEmailVerification , refreshAccessToken , forgotPasswordRequest , resetForgotPassword , changeCurrentPassword};