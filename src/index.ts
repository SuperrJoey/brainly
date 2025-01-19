import express from "express";
import jwt from "jsonwebtoken";
import { models, db } from "./db.js";
import { JWT_PASSWORD } from "./config.js";
import { userMiddleware } from "./middleware.js";
import * as bcrypt from "bcrypt-ts";
import crypto from "crypto";


const app = express();
app.use(express.json());

app.post("/api/v1/signup", async (req, res) => {
    //zod validation, hash pw
    const username = req.body.username;
    const password = req.body.password;

    try{
        const hash = await bcrypt.hash(password, 12);
        await models.User.create({
            username: username,
            password: hash
    
        })
    
        res.json({
            message: "User signed up"
        })
    } catch(e) {
        res.status(411).json({
            message: "User already exists"
        })
    }
    
})

app.post("/api/v1/signin", async (req, res) => {
    const username = req.body.username;
    const password = req.body.password;
    
    const user = await models.User.findOne({
        username: username
    })

    if(!user?.password) {
        throw new Error("Invalid user data")
    }

    const pwMatch = await bcrypt.compare(password, user.password);

    if (user && pwMatch) {
        const token = jwt.sign({
            id: user._id.toString()
        }, JWT_PASSWORD);
    
        res.json({
            token
        })
    } else {
        res.status(403).json({
            message: "Incorrect creds"
        })
    }
})

app.post("/api/v1/content", userMiddleware, async (req, res) => {
    const { link, type } = req.body;
    await models.Content.create({
        link,
        type,
        //@ts-ignore
        userId: req.userId,
        tags: []

    })

     res.json({
        message: "content added"
    })
})

app.get("/api/v1/content", userMiddleware, async(req, res) => {
    //@ts-ignore
    const { userId } = req;
    const content = await models.Content.find({ userId })
        .populate({ 
            path: "userId",
            select: "username"
        })

    res.json({
        content
    })
})

app.delete("/api/v1/content", async (req, res) => {
    const { contentId } = req.body;

    await models.Content.deleteMany({
        contentId,
        //@ts-ignore
        userId: req.userId
    })
})

app.post("api/v1/brain/share", userMiddleware, async (req, res) => {
    try {
        const { contentId } = req.body;

        const content = await models.Content.findOne({
            _id: contentId,
            //@ts-ignore
            userId: req.userId
        })
        
        if (!content) {
            res.status(404).json({
                message: "Content not found or unauthorized"
            })
            return;
        }

        //generating a random hash for the share link
        const hash = crypto.randomBytes(8).toString('hex');

        await models.link.create({
            hash,
            //@ts-ignore
            userId: req.userId,
            contentId
        });

        res.json({
            message: "Content shared successfully",
            shareLink: `/brain/${hash}` 
        });

    } catch (error) {
        res.status(500).json({
            message: "Error sharing content",
            error: (error as Error).message
        });
    }
});

app.get("api/v1/brain/:shareLink", async (req, res) => {
    try {
        const { shareLink } = req.params;

        const link = await models.link.findOne({
            hash: shareLink
        });

        if(!link) {
            res.status(404).json({
                message: "Share link not found"
            });
            return;
        }

        const sharedContent = await models.Content.find({
            _id: link.contentId,
            userId: link.userId
        }).populate([
            {
                path: "userId",
                select: "username"
            },
            {
                path: "tags",
                select: "title"
            }
        ]);

        if (!sharedContent) {
            res.status(404).json({
                mmessage: "Shared content no longer exists"
            });
            return;
        }

        res.json({
            content: sharedContent
        });

    } catch (error) {
        res.status(500).json({
            message: "Error getting the shared content",
            error: (error as Error).message
        });
    }
});

console.log("Server starting...");


app.listen(300);