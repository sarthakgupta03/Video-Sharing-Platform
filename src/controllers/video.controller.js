import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary,deleteOnCloudinary, deleteVideoOnCloudinary } from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js"
import mongoose from "mongoose";
import { User } from "../models/user.model.js";
import { View } from "../models/view.model.js";
import { Like } from "../models/like.model.js";
import { Comment } from "../models/comment.model.js"
import { Playlist } from "../models/playlist.model.js"

const uploadVideo = asyncHandler(async (req,res) => {
    //get title, description
    const {title, description} = req.body

    //validation
    if(!title || !title.trim() === ""){
        throw new ApiError(400,"title not found")
    }
    if(!description || !description.trim() === ""){
        throw new ApiError(400,"description not found")
    }

    //get thumbnail and videoFile local path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path 
    const videoFileLocalPath = req.files?.videoFile[0]?.path

    //check for thumbail, video file 
    if(!thumbnailLocalPath){
        throw new ApiError(400,"thumbnail not found")
    }
    if(!videoFileLocalPath){
        throw new ApiError(400,"videoFile not found")
    }

    if(!req.user){
        throw new ApiError(401, "User not found or unauthorized access");
    }

    //upload thumbnail and video to cloudinary
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)
    const videoFile = await uploadOnCloudinary(videoFileLocalPath)

    if (!thumbnail) {
        throw new ApiError(500, "Failed to upload thumbnail to cloudinary.");
    }
    if(!videoFile){
        throw new ApiError(500, "Failed to upload videoFile to cloudinary")
    }

    //create video object - create entry in database
    const createdVideo = await Video.create(
        {
            title,
            description,
            thumbnail:thumbnail.url,
            videoFile:videoFile.url,
            owner:req.user._id,
            duration:videoFile.duration
        }
    )

    //check for video object creation
    if(!createdVideo){
        throw new ApiError(500, "Failed to create video in the database.");
    }

    //return response
    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            createdVideo,
            "Video uploaded successfully"
        )
    )
})

const getVideoById = asyncHandler(async (req,res) => {
    // get videoId from params
    const {videoId} = req.params

    // check videoId it exists
    if(!videoId){
        throw new ApiError(400,"videoId not found!")
    }

    // get video from db by id
    const video = await Video.findById(videoId)
    // check for video object
    if(!video){
        throw new ApiError(404,"video not found")
    }
    // return response
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            video,
            "video fetched successfully"
        )
    )
})

const deleteVideo = asyncHandler(async (req,res) => {
    //get video id from params
    const {videoId} = req.params

    //check id if exits and delete video obj from db
    if(!videoId){
        throw new ApiError(400,"videoId not found!")
    }
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,"video not found")
    }
    if(!req.user?._id.equals(video.owner)){
        throw new ApiError(400,"User cannot delete this video")
    }

    const deletedVideo = await Video.deleteOne({
        _id:video._id
    })
    if(!deletedVideo){
        throw new ApiError(500,"Internal error while deleting video")
    }

    //delete thumbnail,videoFile from cloudinary
    await deleteOnCloudinary(video.thumbnail)
    await deleteVideoOnCloudinary(video.videoFile)

   // delete views on the video
    await View.deleteMany(
        {
            video:videoId
        }
    )

    // delete likes on the video
    await Like.deleteMany(
        {
            video:videoId
        }
    )

    // get comments on the video
    const comments = await Comment.find(
        {
            video:videoId
        }
    )

    // extracting comment ids
    const commentIds = comments?.map(comment => comment?._id)

    // delete likes on the comment of the video
    await Like.deleteMany(
        {
            comment:{$in: commentIds}
        }
    )

    // delete comments on the video
    await Comment.deleteMany(
        {
            video:videoId
        }
    )

    // delete videos from playlists
    await Playlist.updateMany(
        {},
        {
            $pull:{
                videos:videoId
            }
        }
    )
    
    //return response
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},
            "Video deleted successfully"
        )
    )
})

const updateVideo = asyncHandler(async(req,res) => {
    // get video id from params, title and description from body
    const {videoId} = req.params
    const {title,description} = req.body

    // check if video exist
    if(!videoId){
        throw new ApiError(400,"videoId not found")
    }

    // get video
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,"Video not found")
    }
    // check if user is authorised to change the details
    if(!req.user?._id.equals(video.owner)){
        throw new ApiError(400,"User cannot update details of this video")
    }

    if(title?.trim() === ""){
        throw new ApiError(400,"title cannot be empty")
    }
    if(description?.trim() === ""){
        throw new ApiError(400,"description cannot be empty")
    }
    
    // set variables
    let newTitle = title || video.title;
    let newDescription = description || video.description;
    let newThumbnailPath;
    if(req.file){
        newThumbnailPath = req.file.path
    }

    let newThumbnail;
    // update in cloudinary if there is a thumbnail
    if(newThumbnailPath){
        newThumbnail = await uploadOnCloudinary(newThumbnailPath)
        await deleteOnCloudinary(video.thumbnail)

        if(!newThumbnail){
            throw new ApiError(500,"Interal error while uploading new thumbnail")
        }
        newThumbnail = newThumbnail.url
    }else{
        newThumbnail = video.thumbnail
    }

    // update the object
    const updatedVideo = await Video.findOneAndUpdate(
        {
            _id:videoId
        },
        {
            title:newTitle,
            description:newDescription,
            thumbnail:newThumbnail
        },
        {
            new:true
        }
    )
    if(!updatedVideo){
        throw new ApiError(500,"Video could not be updated")
    }

    // return response
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            updatedVideo,
            "Video updated successfully"
        )
    )
})

const togglePublishStatus = asyncHandler(async(req,res) => {
    // get videoId from params
    const {videoId} = req.params
    if(!videoId){
        throw new ApiError(400,"videoId not found")
    }
    // get video
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,"Video not found")
    }
    // check if user is authorised to change the details
    if(!req.user?._id.equals(video.owner)){
        throw new ApiError(400,"User cannot toggle details of this video")
    }

    // toggle status
    const toggledStatusInVideo = await Video.findOneAndUpdate(
        {
            _id:videoId
        },
        {
            isPublished:!video.isPublished
        },
        {
            new:true
        }
    )
    if(!toggledStatusInVideo){
        throw new ApiError(500,"Status could not be toggled")
    }

    // return response
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            toggledStatusInVideo,
            "Status updated successfully"
        )
    )
})

const getAllVideos = asyncHandler(async (req, res) => {
    //all videos of an user
    //get fields
    let { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    if(!userId){
        throw new ApiError(400,"userId does not exist")
    }
    
    //collect videos of user using mongodb aggregate pipelines
    const videos = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as:"uploadedVideos"
            }
        },
        {
            $project:{
                uploadedVideos:1
            }
        }
    ])

    if(!videos?.length){
        throw new ApiError(404,"No videos found")
    }

    //do sorting
    sortBy = sortBy || "createdAt"
    sortType = sortType === 'desc' ? -1 : 1; // Converting 'desc' to -1, default to 1
    videos[0].uploadedVideos.sort((a, b) => {
        if (a[sortBy] < b[sortBy]) {
            return -1 * sortType;
        }
        if (a[sortBy] > b[sortBy]) {
            return 1 * sortType;
        }
        return 0;
    });

    //paginate - create a subset from collection
    let paginatedVideos = videos[0].uploadedVideos
    const startIndex = Number(Number(page)-1)*Number(limit)
    const endIndex = startIndex + Number(limit)
    paginatedVideos = paginatedVideos.slice(startIndex,endIndex)

    //return response
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            paginatedVideos,
            "Videos fetched successfully"
        )
    )
})

export {uploadVideo,deleteVideo,getVideoById,updateVideo,togglePublishStatus,getAllVideos}