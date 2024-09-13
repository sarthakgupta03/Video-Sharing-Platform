import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { createTweet, deleteTweet, getTweetById, getUserTweets, updateTweet } from "../controllers/tweet.controller.js";

const router = Router()
router.use(verifyJwt)

router.route("/create").post(createTweet)
router.route("/:tweetId").patch(updateTweet)
router.route("/:tweetId").delete(deleteTweet)
router.route("/:tweetId").get(getTweetById)
router.route("/user/:userId").get(getUserTweets)

export default router