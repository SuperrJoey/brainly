import mongoose, {model, mongo, Schema} from "mongoose"

const linkSchema = new Schema({
    hash: { type: String, required: true },
    userId: { type: mongoose.Types.ObjectId, ref: 'User', required: true },
    contentId: {type: mongoose.Types.ObjectId, ref: 'Content', required: true }
});

export const linkModel = model("Link", linkSchema);