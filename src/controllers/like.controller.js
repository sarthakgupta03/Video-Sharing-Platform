import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { Like } from "../models/like.model.js";
import { Video } from "../models/video.model.js"
import { Tweet } from "../models/tweet.model.js"
import { Comment } from "../models/comment.model.js"
import { User } from "../models/user.model.js";

const toggleVideoLike = asyncHandler(async(req,res) => {
    // get videoId from params
    const {videoId} = req.params
    if(!videoId){
        throw new ApiError(400,"videoId is required")
    }

    // check if video exists
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,"video not found")
    }

    // check if user has already liked the video -> delete the like object else create a like object
    const isLiked = await Like.findOne({
        $and:[
            {
                likedBy:req.user._id
            },
            {
                video:videoId
            }
        ]
    })

    // handle like object
    if(isLiked){
        // delete that like object
        const deletedLike = await Like.findByIdAndDelete(isLiked._id)
        if(!deletedLike){
            throw new ApiError(500,"Internal error while removing like")
        }
    }else{
        // create a like object
        const createdLike = await Like.create({
            likedBy:req.user._id,
            video:videoId
        })
        if(!createdLike){
            throw new ApiError(500,"Internal error while adding like")
        }
    }

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            {},
            "like changed successfully on video"
        )
    )

})

const toggleTweetLike = asyncHandler(async(req,res) => {
    // get tweetId from params
    const {tweetId} = req.params
    if(!tweetId){
        throw new ApiError(400,"tweetId is required")
    }

    // check if tweet exists
    const tweet = await Tweet.findById(tweetId)
    if(!tweet){
        throw new ApiError(404,"tweet not found")
    }

    // check if user has already liked the tweet -> delete the like object else create a like object
    const isLiked = await Like.findOne({
        $and:[
            {
                likedBy:req.user._id
            },
            {
                tweet:tweetId
            }
        ]
    })

    // handle like object
    if(isLiked){
        // delete that like object
        const deletedLike = await Like.findByIdAndDelete(isLiked._id)
        if(!deletedLike){
            throw new ApiError(500,"Internal error while removing like")
        }
    }else{
        // create a like object
        const createdLike = await Like.create({
            likedBy:req.user._id,
            tweet:tweetId
        })
        if(!createdLike){
            throw new ApiError(500,"Internal error while adding like")
        }
    }

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            {},
            "like changed successfully on tweet"
        )
    )

})

const toggleCommentLike = asyncHandler(async(req,res) => {
    // get commentId from params
    const {commentId} = req.params
    if(!commentId){
        throw new ApiError(400,"commentId is required")
    }

    // check if comment exists
    const comment = await Comment.findById(commentId)
    if(!comment){
        throw new ApiError(404,"comment not found")
    }

    // check if user has already liked the comment -> delete the like object else create a like object
    const isLiked = await Like.findOne({
        $and:[
            {
                likedBy:req.user._id
            },
            {
                comment:commentId
            }
        ]
    })

    // handle like object
    if(isLiked){
        // delete that like object
        const deletedLike = await Like.findByIdAndDelete(isLiked._id)
        if(!deletedLike){
            throw new ApiError(500,"Internal error while removing like")
        }
    }else{
        // create a like object
        const createdLike = await Like.create({
            likedBy:req.user._id,
            comment:commentId
        })
        if(!createdLike){
            throw new ApiError(500,"Internal error while adding like")
        }
    }

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            {},
            "like changed successfully on comment"
        )
    )

})

const getLikedVideos = asyncHandler(async(req,res) => {
    // to get all liked videos of user

    // looking for like objects having video field using aggregate pipeline
    const likedVideos = await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(req.user._id)
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"likedBy",
                as:"userLikedVideos",
                pipeline:[
                    {
                        $match:{
                            video:{
                                $exists:true
                            }
                        }
                    }
                ]
            }
        },
        {
            $project:{
                userLikedVideos:1
            }
        }
    ])

    if(!likedVideos?.length){
        throw new ApiError(404,"no liked videos found")
    }

    // return response
    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            likedVideos[0].userLikedVideos,
            "all videos liked by user fetched successfully"
        )
    )
})

const getLikeCountVideo = asyncHandler(async(req,res) => {
    const {videoId} = req.params
    const totalLikes = await Video.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"video",
                as:"likesList"
            }
        },
        {
            $addFields:{
                likes:{
                    $size:"$likesList"
                }
            }
        },
        {
            $project:{
                likes:1
            }
        }
    ])

    if(!totalLikes.length){
        throw new ApiError(404,"like count not found")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            {
                likes:totalLikes[0].likes
            },
            "total likes on video fetched successfully"
        )
    )
})

const getLikeCountTweet = asyncHandler(async(req,res) => {
    const {tweetId} = req.params
    const totalLikes = await Tweet.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(tweetId)
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"tweet",
                as:"likesList"
            }
        },
        {
            $addFields:{
                likes:{
                    $size:"$likesList"
                }
            }
        },
        {
            $project:{
                likes:1
            }
        }
    ])

    if(!totalLikes.length){
        throw new ApiError(404,"like count not found")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            {
                likes:totalLikes[0].likes
            },
            "total likes on tweet fetched successfully"
        )
    )
})

const getLikeCountComment = asyncHandler(async(req,res) => {
    const {commentId} = req.params
    const totalLikes = await Comment.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(commentId)
            }
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"comment",
                as:"likesList"
            }
        },
        {
            $addFields:{
                likes:{
                    $size:"$likesList"
                }
            }
        },
        {
            $project:{
                likes:1
            }
        }
    ])

    if(!totalLikes.length){
        throw new ApiError(404,"like count not found")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            {
                likes:totalLikes[0].likes
            },
            "total likes on comment fetched successfully"
        )
    )
})

export{
    toggleVideoLike,
    toggleTweetLike,
    toggleCommentLike,
    getLikedVideos,
    getLikeCountVideo,
    getLikeCountTweet,
    getLikeCountComment
}