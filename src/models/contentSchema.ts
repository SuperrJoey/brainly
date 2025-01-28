import mongoose, {model, mongo, Schema} from "mongoose"


const contentTypes = ['twitter', 'youtube'];

const ContentSchema = new Schema({
    title:  { type: String, required: true },
    link:  { type: String, required: true },
    type: { type: String, enum: contentTypes, required: true },
    tags: [{type: mongoose.Types.ObjectId, ref: 'Tag'}],
    userId: {type: mongoose.Types.ObjectId, ref: 'User', required: true,}
})

export const contentModel = model("Content", ContentSchema);
 