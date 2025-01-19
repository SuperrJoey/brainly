//models and schemas
import mongoose from "mongoose"
import { UserModel } from "./models/userSchema.js"
import { TagModel } from "./models/tagSchema.js"
import { contentModel } from "./models/contentSchema.js"
import { linkModel } from "./models/linkSchema.js"

mongoose.connect("mongodb://localhost:27017/Brainly")

export const models = {
    User: UserModel,
    Tag: TagModel,
    Content: contentModel,
    link: linkModel
} as const;

export const db = mongoose.connection;