import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription } from "../controllers/subscription.controller.js";

const router = Router()
router.use(verifyJwt)

router.route("/c/:channelId")
    .post(toggleSubscription)
    .get(getUserChannelSubscribers)
    
router.route("/u/:subscriberId").get(getSubscribedChannels);

export default router