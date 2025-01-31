import express from "express";
import jwt from "jsonwebtoken";
import { models, db } from "./db.js";
import { JWT_PASSWORD } from "./config.js";
import { userMiddleware } from "./middleware.js";
import * as bcrypt from "bcrypt-ts";
import crypto from "crypto";
import cors from "cors";
import { z } from "zod";
import cookieParser from "cookie-parser"


db.on('error', (error) => {
    console.error('Database connection error:', error);
});

db.once('open', () => {
    console.log("Connected to database");
})


const app = express();

app.use(cookieParser());
app.use(express.json());

const ALLOWED_ORIGIN = process.env.NODE_ENV === "production"
    ? 'your-production-domain.com'
    : 'http://localhost:5173';

app.use(cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
    exposedHeaders: ['Set-Cookie']
}));


const signupSchema = z.object({
    username: z.string().min(3, "Username is too short"),
    password: z.string().min(6, "password is too short")

});


app.post("/api/v1/signup", async (req, res) => {
    try {
        const { username, password } = signupSchema.parse(req.body);
    
        const hash = await bcrypt.hash(password, 12);

        await models.User.create({
            username: username,
            password: hash
    
        })
    
        res.json({
            message: "User signed up"
        })
    }
     catch(e) {
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
    
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
        maxAge: 24 * 60 * 60 * 1000,
        path: "/",
        domain: process.env.NODE_ENV === "production"
            ? "sampleproductiondomain.com"
            : "localhost"
    })

        res.json({
           message: "Signed in successfully"
        })
    } else {
        res.status(403).json({
            message: "Incorrect creds"
        })
    }
})

app.post("/api/v1/content", userMiddleware, async (req, res) => {
    try {

    const { link, type, title } = req.body;

    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/;
    const twitterRegex = /^(https?:\/\/)?(www\.)?(twitter\.com\/\w+\/status\/\d+)/;

    if ((type === "youtube" && !youtubeRegex.test(link)) ||
        (type === "twitter" && !twitterRegex.test(link))) {
            res.status(400).json({ error: "Invalid URL for the selection"})
            return
        }

        await models.Content.create({
            title,
            link,
            type,
            //@ts-ignore
            userId: req.userId,
            tags: []
    
        })
    
         res.json({
            message: "content added"
        })
    } catch (error) {
        res.status(500).json({
            error: "Failed to add content"
        })
    }
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


app.post("/api/v1/brain/share", userMiddleware, async (req, res) => {
    try {
        const { contentId } = req.body;

        console.log("Content ID: ", contentId);
        //@ts-ignore
        console.log("User ID: ", req.userId);

        if(!contentId) {
            res.status(400).json({ message: "Content ID is required"});
            return;
        }

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
            shareLink: `/api/v1/brain/${hash}` 
        });

    } catch (error) {
        res.status(500).json({
            message: "Error sharing content",
            error: (error as Error).message
        });
    }
});


app.get("/api/v1/brain/:shareLink", async (req, res) => {
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
            }
        ]);

        if (!sharedContent) {
            res.status(404).json({
                message: "Shared content no longer exists"
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

app.post("/api/v1/logout", (req, res) => {
    res.cookie("token", "", { maxAge: 0 });
    res.json({ messaage: "Logged out seccessfully" });
})

console.log("Server starting...");

app.listen(3000);