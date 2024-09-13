import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";

const getChannelVideos = asyncHandler(async(req,res)=>{
    const { channelId } = req.params;

    const videos = await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"_id",
                foreignField:"owner",
                as:"channelVideos"
            }
        },
        {
            $addFields:{
                uploadedVideos:"$channelVideos._id"
            }
        },
        {
            $project:{
                uploadedVideos:1
            }
        }
    ])
    if(!videos.length){
        throw new ApiError(404,"videos not found")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            {
                videos:videos[0].uploadedVideos
            },
            "channel videos fetched successfully"
        )
    )
})

// Get the channel stats like total video views, total subscribers, total videos, total likes etc.
const getChannelStats = asyncHandler(async(req,res)=>{
    const { channelId } = req.params;

    const channelDetails = await User.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"_id",
                foreignField:"owner",
                as:"channelVideos",
                pipeline:[
                    {
                        $lookup:{
                            from:"likes",
                            localField:"_id",
                            foreignField:"video",
                            as:"videoLikes"
                        }
                    },
                    {
                        $lookup:{
                            from:"views",
                            localField:"_id",
                            foreignField:"video",
                            as:"videoViewers"
                        }
                    },
                    {
                        $addFields:{
                            likesCountOnVideo:{
                                $size:"$videoLikes"
                            },
                            videoViews:{
                                $size:"$videoViewers"
                            }
                        }
                    }
                ]
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
            $addFields:{
                totalVideos:{
                    $size:"$channelVideos"
                },
                totalViews:{
                    $sum:"$channelVideos.videoViews"
                },
                totalLikes:{
                    $sum:"$channelVideos.likesCountOnVideo"
                },
                totalSubscribers:{
                    $size:"$subscribers"
                }
            }
        },
        {
            $project:{
                totalVideos:1,
                totalViews:1,
                totalLikes:1,
                totalSubscribers:1
            }
        }
    ])

    if(!channelDetails){
        throw new ApiError(404,"Details not found")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            {
                totalLikes:channelDetails[0].totalLikes,
                totalViews:channelDetails[0].totalViews,
                totalVideos:channelDetails[0].totalVideos,
                totalSubscribers:channelDetails[0].totalSubscribers
            },
            "channel details fetched successfully"
        )
    )
})

export {
    getChannelVideos,
    getChannelStats
}