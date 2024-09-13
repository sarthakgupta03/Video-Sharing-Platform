import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { Like } from "../models/like.model.js"

const createTweet = asyncHandler(async(req,res) => {
    //get content from body
    const {content} = req.body
    //validation not empty
    if(!content || !content.trim() === ""){
        throw new ApiError(400,"content not found")
    }

    //create tweet obj
    const tweet = await Tweet.create(
        {
            content,
            owner:req.user._id
        }
    )
    //check for tweet creation
    if(!tweet){
        throw new ApiError(500,"error while adding to database")
    }

    // return response
    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            tweet,
            "Tweet added successfully"
        )
    )
})

const updateTweet = asyncHandler(async(req,res) => {
    //get id from params
    const {tweetId} = req.params
    //get content from body
    const {content} = req.body

    //validation not empty
    if(!tweetId){
        throw new ApiError(400,"tweetId is not provided")
    }
    if(!content || !content.trim() === ""){
        throw new ApiError(400,"content is not provided or empty")
    }

    //find and update tweet object
    const tweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set:{
                content
            }
        },
        {
            new:true
        }
    )

    if(!tweet){
        throw new ApiError(404,"tweet not found") 
    }

    // return response
    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            tweet,
            "Tweet updated successfully"
        )
    )
})

const deleteTweet = asyncHandler(async(req,res) => {
    //get id from params
    const {tweetId} = req.params

    //validation not empty
    if(!tweetId){
        throw new ApiError(400,"tweetId is not provided")
    }

    //find and delete
    const tweet = await Tweet.findByIdAndDelete(tweetId)
    if(!tweet){
        throw new ApiError(404,"tweet not found") 
    }

    // delete likes on the tweet
    await Like.deleteMany(
        {
            tweet:tweetId
        }
    )

    // return response
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweet,
            "Tweet deleted successfully"
        )
    )

})

const getTweetById = asyncHandler(async(req,res) => {
    //get id from params
    const {tweetId} = req.params

    //validation not empty
    if(!tweetId){
        throw new ApiError(400,"tweetId is not provided")
    }

    const tweet = await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(404,"tweet not found") 
    }

    // return response
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweet,
            "Tweet fetched successfully"
        )
    )
})

const getUserTweets = asyncHandler(async(req,res)=>{
    // get userId from params
    const {userId} = req.params
    
    //collect tweets of user using mongodb aggregate pipelines
    const tweets = await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:"tweets",
                localField:"_id",
                foreignField:"owner",
                as:"userTweets"
            }
        },
        {
            $project:{
                userTweets:1
            }
        }
    ])

    if(!tweets?.length){
        throw new ApiError(404,"No tweets found")
    }

    //return response
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            tweets[0].userTweets,
            "All tweets fetched successfully"
        )
    )
})

export {createTweet,updateTweet,deleteTweet,getTweetById,getUserTweets}