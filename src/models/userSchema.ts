import mongoose, {model, mongo, Schema} from "mongoose"


const userSchema = new Schema({
    username: {type: String, unique: true},
    password: String
})

export const UserModel = model("User", userSchema);

