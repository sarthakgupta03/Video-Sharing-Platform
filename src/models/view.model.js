import mongoose,{Schema} from "mongoose";

const viewSchema = new Schema(
    {
        video:{
            type:Schema.Types.ObjectId,
            ref:"Video"
        },
        viewedBy:{
            type:Schema.Types.ObjectId,
            ref:"User"
        }
    },
    {
        timestamps:true
    }
)

export const View = mongoose.model("View",viewSchema)
