import mongoose, {model, mongo, Schema} from "mongoose"


const tagSchema = new Schema({
    title: { type: String, required: true, unique: true }
});

export const TagModel = model("Tag", tagSchema);

