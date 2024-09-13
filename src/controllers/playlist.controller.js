import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js"
import { User } from "../models/user.model.js" 

const createPlaylist = asyncHandler(async(req,res)=>{
    // get name and description from body
    const {name, description, isPrivate} = req.body

    // validation
    if(!name || name.trim() === ""){
        throw new ApiError(400,"name is required")
    }

    // create playlist object
    const createdPlaylist = await Playlist.create(
        {
            name:name,
            description:description||"",
            owner:req.user._id,
            isPrivate:isPrivate||true
        }
    )

    // check for created playlist
    if(!createdPlaylist){
        throw new ApiError(500,"Error while creating playlist")
    }

    // return response
    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            createdPlaylist,
            "Playlist created successfully"
        )
    )
})

const getPlaylistById = asyncHandler(async(req,res)=>{
    // get playlistId from params
    const {playlistId} = req.params
    // check for playlistId
    if(!playlistId){
        throw new ApiError(400,"playlistId is required")
    }

    // get playlist from db
    const playlist = await Playlist.findById(playlistId)

    // check for playlist
    if(!playlist){
        throw new ApiError(404,"playlist not found")
    }

    // return response
    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            playlist,
            "playlist fetched successfully"
        )
    )
})

const updatePlaylist = asyncHandler(async(req,res)=>{
    // get playlistId from params
    const {playlistId} = req.params
    // get title and description from body
    const {name,description,isPrivate} = req.body

    // check for playlistId
    if(!playlistId){
        throw new ApiError(400,"playlistId is required")
    }

    if(name && name.trim() === ""){
        throw new ApiError(400,"name is cannot be empty")
    }

    // Fetch the playlist to check the owner
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // Check if the current user is the owner of the playlist
    if (!playlist.owner.equals(req.user._id)) {
        throw new ApiError(403, "User is not authorized to update this playlist");
    }

    // Initialize update object
    let updateFields = {};
    if(name) updateFields.name = name;
    if(description) updateFields.description = description;
    if(isPrivate) updateFields.isPrivate = isPrivate;

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { 
            $set: updateFields 
        },
        { 
            new: true 
        } 
    )
    // check for playlist
    if(!updatedPlaylist){
        throw new ApiError(500,"error occured during updating playlist")
    }

    // return response
    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            updatedPlaylist,
            "playlist updated successfully"
        )
    )
})

const deletePlaylist = asyncHandler(async(req,res)=>{
    // get playlistId from params
    const {playlistId} = req.params
    // check for playlistId
    if(!playlistId){
        throw new ApiError(400,"playlistId is required")
    }

    // Fetch the playlist to check the owner
    const playlist = await Playlist.findById(playlistId);
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // Check if the current user is the owner of the playlist
    if (!playlist.owner.equals(req.user._id)) {
        throw new ApiError(403, "User is not authorized to delete this playlist");
    }

    // find and delete playlist
    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId)
    // check for deleted playlist
    if(!deletePlaylist){
        throw new ApiError(404,"Playlist not found")
    }

    // return response
    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            deletedPlaylist,
            "playlist deleted successfully"
        )
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    // get playlistId and videoId from params
    const {playlistId, videoId} = req.params
    // check for playlistId
    if(!playlistId){
        throw new ApiError(400,"playlistId is required")
    }
    // check for videoId
    if(!videoId){
        throw new ApiError(400,"videoId is required")
    }
    
    // check if playlist exists
    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404,"playlist not found")
    }

    // Check if the current user is the owner of the playlist
    if (!playlist.owner.equals(req.user._id)) {
        throw new ApiError(403, "User is not authorized to add video in this playlist");
    }

    // check if video exits or not
    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(404,"video not found")
    }

    // check if video is already present in the playlist
    const videos = playlist.videos;
    if (videos.includes(videoId)) {
        throw new ApiError(409, "Video is already present in the playlist");
    }

    // add video to playlist's videos array
    videos.push(videoId)
    playlist.videos = videos
    playlist.save({validateBeforeSave:false})

    // return response
    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            playlist.videos,
            "video added successfully"
        )
    )
})

const removeVideoFromPlaylist = asyncHandler(async(req,res) => {
    // get playlistId and videoId from params
    let {playlistId, videoId} = req.params
    // check for playlistId
    if(!playlistId){
        throw new ApiError(400,"playlistId is required")
    }
    // check for videoId
    if(!videoId){
        throw new ApiError(400,"videoId is required")
    }
    
    // check if playlist exists
    const playlist = await Playlist.findById(playlistId)
    if(!playlist){
        throw new ApiError(404,"playlist not found")
    }

    // Check if the current user is the owner of the playlist
    if (!playlist.owner.equals(req.user._id)) {
        throw new ApiError(403, "User is not authorized to delete video in this playlist");
    }

    // check if video is present in the playlist
    const videos = playlist.videos;
    if (!videos.includes(videoId)) {
        throw new ApiError(404, "Video is not present in the playlist");
    }

    // delete video from playlist's videos array
    videoId = new mongoose.Types.ObjectId(videoId)
    playlist.videos = videos.filter((id) => !id.equals(videoId))
    playlist.save({validateBeforeSave:false})

    // return response
    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            playlist.videos,
            "video removed successfully"
        )
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    // get userId from params
    const {userId} = req.params
    // check for userId
    if(!userId){
        throw new ApiError(400,"userId is required")
    }

    let includePrivatePlaylist = false
    if(new mongoose.Types.ObjectId(userId).equals(req.user._id)){
        includePrivatePlaylist = true
    }

    // collect playlists of user using mongodb aggregate pipelines
    const playlists = await User.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from:"playlists",
                localField:"_id",
                foreignField:"owner",
                as:"userPlaylists",
                pipeline:[
                    {
                        $match: {
                            $expr: {
                              $cond: {
                                if: { $eq: [includePrivatePlaylist, true] },
                                then: {},
                                else: { $eq: ["$isPrivate", false] }
                              }
                            }
                        }
                    }
                ]
            }
        },
        {
            $project:{
                userPlaylists:1
            }
        }
    ])
    // check for playlists
    if(!playlists.length){
        throw new ApiError(404,"No playlists found")
    }

    // return response
    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            playlists[0].userPlaylists,
            "User playlists fetched successfully"
        )
    )
    
})


export {
    createPlaylist,
    getPlaylistById,
    updatePlaylist,
    deletePlaylist,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    getUserPlaylists
}