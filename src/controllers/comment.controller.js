import mongoose from "mongoose";
import { ApiError  } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { Like } from "../models/like.model.js";

const addComment = asyncHandler(async(req,res) => {
    // get videoId from params
    const {videoId} = req.params
    // get content from body
    const {content} = req.body
    
    // check for videoId
    if(!videoId){
        throw new ApiError(400,"videoId is required");
    }
    // check for content
    if(!content || content.trim() === ""){
        throw new ApiError(400,"content is required");
    }

    // check if video exists or not
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,"video not found")
    }

    // create an object of comment and add it to db
    const createdComment = await Comment.create(
        {
            content:content,
            video:video._id,
            owner:req.user._id
        }
    )
    if(!createdComment){
        throw new ApiError(500,"Internal error while creating a comment")
    }

    // return response
    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            createdComment,
            "Comment added successfully!"
        )
    )
})

const updateComment = asyncHandler(async(req,res)=>{
    // get commentId from params
    const {commentId} = req.params
    // get content from body
    const {content} = req.body

    // check for commentId
    if(!commentId){
        throw new ApiError(400,"commentId is required");
    }
    // check for content
    if(!content || content.trim() === ""){
        throw new ApiError(400,"content is required");
    }

    // find and update the comment
    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set:{
                content:content
            }
        },
        {
            new:true
        }
    )
    if(!updatedComment){
        throw new ApiError(404,"comment not found")
    }

    // return response
    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            updatedComment,
            "Comment updated successfully!"
        )
    )
})

const deleteComment = asyncHandler(async(req,res)=>{
    // get commentId from params
    const {commentId} = req.params
    // check for commentId
    if(!commentId){
        throw new ApiError(400,"commentId is required");
    }

    // find and delete the comment
    const deletedComment = await Comment.findByIdAndDelete(commentId)
    if(!deletedComment){
        throw new ApiError(404,"comment not found")
    }

    // delete likes on the comment
    await Like.deleteMany(
        {
            comment:commentId
        }
    )

    // return response
    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            deletedComment,
            "Comment deleted successfully!"
        )
    )
})

const getVideoComments = asyncHandler(async (req, res) => {
    //get video Id from params
    const {videoId} = req.params
    //get page number and limit from query
    const {page = 1, limit = 10} = req.query

    // check for videoId
    if(!videoId){
        throw new ApiError(400,"videoId is required");
    }

    const comments = await Video.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from:"comments",
                localField:"_id",
                foreignField:"video",
                as:"videoComments"
            }
        },
        {
            $project:{
                videoComments:1
            }
        }
    ])
    if(!comments?.length){
        throw new ApiError(404,"no comments found")
    }

    // pagination
    let paginatedComments = comments[0].videoComments
    const startIndex = Number(Number(page)-1)*Number(limit)
    const endIndex = startIndex + Number(limit)
    paginatedComments = paginatedComments.slice(startIndex,endIndex)

    // return response
    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            paginatedComments,
            "Comments fetched successfully"
        )
    )
})

export {
    addComment,
    updateComment,
    deleteComment,
    getVideoComments
}