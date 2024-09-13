import {asyncHandler} from "../utils/asyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary, deleteOnCloudinary} from "../utils/cloudinary.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose";

const validRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const generateAccessAndRefreshToken = async(userId) => 
{
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave:false })

        return {accessToken,refreshToken}
    } catch (error) {
        throw new ApiError(500,"Something went wrong while generating refresh and access token")

    }
}

const registerUser = asyncHandler( async(req,res) => {
    // get user details from frontend
    // validation - not empty
    // check if user already exists: username, email
    // check for images, check for avatar
    // upload them to cloudinary, avatar
    // create user object - create entry in db
    // remove password and refresh token field from response
    // check for user creation 
    // return response

    // get user details from frontend
    const {fullname,email,username,password} = req.body

    // validation - not empty
    // if(fullname === ""){
    //     throw new ApiError(400,"fullname is required")
    // }
    if(
        [fullname,email,username,password].some((field)=>field?.trim()==="")
    ){
        throw new ApiError(400,"All fields are required")
    }
    if(!email || !email.match(validRegex)){
        throw new ApiError(400,"Enter valid Email Id")
    }
    // res.status(200).json(
    //     {
    //         message:"ok"
    //     }
    // )

    // check if user already exists: username, email
    const existedUser = await User.findOne(
        {
            $or:[{username},{email}]
        }
    )
    // console.log(existedUser);
    if(existedUser){
        throw new ApiError(409,"User with email or username already exists")
    }

    // check for images, check for avatar
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    if(!avatarLocalPath){
        throw new ApiError(400,"Avatar file is required")
    }

    // upload them to cloudinary, avatar
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar){
        throw new ApiError(400,"Avatar file is required")
    }

    // create user object - create entry in db
    const user = await User.create(
        {
            fullname,
            avatar:avatar.url,
            coverImage:coverImage?.url || "",
            email,
            password,
            username:username.toLowerCase()
        }
    )

    // check for user creation 
    // remove password and refresh token field from response
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500,"Something went wrong while registering the user")
    }

    // return response
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully!")
    )

})

const loginUser = asyncHandler( async(req,res) => {
    // req body -> data
    // username or email
    // find the user
    // password check
    // access and refresh token
    // send cookie

    // req body -> data
    const {email,username,password} = req.body

    // username or email
    if(!username && !email){
        throw new ApiError(400,"username or email is required");
    }

    const user = await User.findOne(
        {
            $or:[{username},{email}]
        }
    )

    // find the user
    if(!user){
        throw new ApiError(404,"User does not exist")
    }

    // password check
    if(!password){
        throw new ApiError(400,"password is required");
    }
    const isPasswordValid = await user.isPasswordCorrect(password)
    if(!isPasswordValid){
        throw new ApiError(401,"Password incorrect")
    }

    // access and refresh token
    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id)

    // send cookie
    const loggedInUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    const options = {
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser, 
                accessToken, 
                refreshToken
            },
            "User logged in successfully"
        )
    )
})

const logoutUser = asyncHandler(async (req,res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{
                refreshToken: 1
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged out successfully"))
})

const refresAccessToken = asyncHandler(async (req,res) => {
    const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken
    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
        if(!user){
            throw new ApiError(401,"Invalid refresh token")
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"Refresh token is expired or used")
        }
    
        const {accessToken,newRefreshToken} = await generateAccessAndRefreshToken(user._id)
    
        const options = {
            httpOnly:true,
            secure:true
        }
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken:newRefreshToken
                },
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token")
    }
})

const changePassword = asyncHandler(async (req,res) => {
    const {oldPassword, newPassword} = req.body
    const user = await User.findById(req.user?._id)
    if(!user){
        throw new ApiError(400,"Unauthorized access")
    }
    const passwordCheck = await user.isPasswordCorrect(oldPassword)
    if(!passwordCheck){
        throw new ApiError(400,"Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave:false}) 

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"Password changed successfully")
    )
})

const getCurrentUser = asyncHandler(async (req,res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(200,req.user,"current user fetched successfully")
    )
})

const updateAccountDetails = asyncHandler(async(req,res) => {
    const {fullname,email} = req.body
    if(!fullname || !email){
        throw new ApiError(400,"All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                fullname,
                email
            }
        },
        {
            new:true
        }
    ).select(
        "-password"
    )

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Account Details Updated Successfully"
        )
    )
})

const updateUserAvatar = asyncHandler(async(req,res) => {
    const localAvatarPath = req.file?.path
    if(!localAvatarPath){
        throw new ApiError(400,"Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(localAvatarPath)
    if(!avatar.url){
        throw new ApiError(400,"Error while uploading the avatar")
    }

    const oldAvatarUrl = req.user?.avatar

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar:avatar.url
            }
        },
        {
            new:true
        }
    ).select(
        "-password"
    )

    await deleteOnCloudinary(oldAvatarUrl)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Avatar changed successfully"
        )
    )

})

const updateUserCoverImage = asyncHandler(async(req,res) => {
    const localCoverImagePath = req.file?.path
    if(!localCoverImagePath){
        throw new ApiError(400,"Cover image file is missing")
    }

    const oldCoverImageUrl = req.user?.coverImage

    const coverImage = await uploadOnCloudinary(localCoverImagePath)
    if(!coverImage.url){
        throw new ApiError(400,"Error while uploading the cover image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage:coverImage.url
            }
        },
        {
            new:true
        }
    ).select(
        "-password"
    )

    await deleteOnCloudinary(oldCoverImageUrl)

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user,
            "Cover image changed successfully"
        )
    )

})

const getUserChannelProfile = asyncHandler(async(req,res) => {
    const {username} = req.params
    if(!username?.trim()){
        throw new ApiError(400,"username is missing")
    }

    const channel = await User.aggregate(
        [
            {
                $match:{
                    username:username?.toLowerCase()
                }
            },
            {
                $lookup:{
                    from:"subscriptions",
                    localField:"_id",
                    foreignField:"channel",
                    as:"subscribers"
                }
            },
            {
                $lookup:{
                    from:"subscriptions",
                    localField:"_id",
                    foreignField:"subscriber",
                    as:"subscribedTo"
                }
            },
            {
                $addFields:{
                    subsribersCount:{
                        $size: "$subscribers"
                    },
                    channelsSubscribedToCount:{
                        $size: "$subscribedTo"
                    },
                    isSubscribed:{
                        // check here if the current user is in the subscriber or not
                        $cond:{
                            if:{$in:[req.user?._id,"$subscribers.subscriber"]},
                            then:true,
                            else:false
                        }
                    }
                }
            },
            {
                $project:{
                    username:1,
                    email:1,
                    avatar:1,
                    coverImage:1,
                    channel:1,
                    subscribers:1,
                    isSubscribed:1,
                    subsribersCount:1,
                    channelsSubscribedToCount:1
                }
            }
        ]
    )

    if(!channel?.length){
        throw new ApiError(404,"Channel does not exist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            channel[0],
            "User channel fetched successfully"
        )
    )
})

const getWatchHistory = asyncHandler(async(req,res) => {
    const user = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"views",
                localField:"_id",
                foreignField:"viewedBy",
                as:"watchedVideosList"
            }
        },
        {
            $addFields:{
                watchHistory:"$watchedVideosList.video"
            }
        },
        {
            $project:{
                watchHistory:1
            }
        }
    ])

    if(!user?.length){
        throw new ApiError(404,"User does not exist")
    }


    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "Watch history fetched successfully"
        )
    )
})

export {
    registerUser,
    loginUser,
    logoutUser,
    refresAccessToken,
    changePassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}