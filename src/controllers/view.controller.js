import mongoose from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.model.js";
import { View } from "../models/view.model.js";

const addVideoView = asyncHandler(async(req,res)=>{
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

    // check if user has already viewed the video
    const isViewed = await View.findOne(
        {
            $and:[
                {
                    video:videoId
                },
                {
                    viewedBy:req.user._id
                }
            ]
        }
    )

    // already viewed, return response
    if(isViewed){
       return res
       .status(200)
       .json(
            new ApiResponse(
                200,
                {},
                "video is already viewed"
            )
       ) 
    }

    // create a new view
    const createdView = await View.create(
        {
            video:videoId,
            viewedBy:req.user._id
        }
    )

    // internal error while creating view
    if(!createdView){
        throw new ApiError(
            500,
            "Internal server error while viewing video"
        )
    }

    // return success response
    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            {},
            "view created successfully"
        )
    )

})

const getTotalViews = asyncHandler(async(req,res)=>{
    // get videoId from params
    const {videoId} = req.params
    if(!videoId){
        throw new ApiError(400,"videoId is required")
    }

    const views = await Video.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from:"views",
                localField:"_id",
                foreignField:"video",
                as:"viewersList"
            }
        },
        {
            $addFields:{
                views:{
                    $size:"$viewersList"
                }
            }
        },
        {
            $project:{
                views:1
            }
        }
    ])

    if(!views.length){
        throw new ApiError(404,"view count not found")
    }

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            {
                views: views[0].views
            },
            "total views fetched successfully!"
        )
    )
})

export {
    addVideoView,
    getTotalViews
};