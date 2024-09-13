import { Router } from "express"
import { verifyJwt } from "../middlewares/auth.middleware.js"
import { addVideoView, getTotalViews } from "../controllers/view.controller.js"

const router = Router()
router.use(verifyJwt)

router.route("/:videoId").post(addVideoView).get(getTotalViews)

export default router