import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { getLikeCountComment, getLikeCountTweet, getLikeCountVideo, getLikedVideos, toggleCommentLike, toggleTweetLike, toggleVideoLike } from "../controllers/like.controller.js";

const router = Router()
router.use(verifyJwt)

router.route("/toggle/v/:videoId").post(toggleVideoLike)
router.route("/toggle/t/:tweetId").post(toggleTweetLike)
router.route("/toggle/c/:commentId").post(toggleCommentLike)
router.route("/videos").get(getLikedVideos);
router.route("/count/v/:videoId").get(getLikeCountVideo)
router.route("/count/t/:tweetId").get(getLikeCountTweet)
router.route("/count/c/:commentId").get(getLikeCountComment)

export default router