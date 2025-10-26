import express from "express";
import cors from "cors"
import cookieParser from "cookie-parser";

const app=express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}));

app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true}))
app.use(express.static("public"))
app.use(cookieParser())

// import routes
import userRoutes from "./routes/user.routes.js"
import likeRoutes from "./routes/like.routes.js"
import dislikeRoutes from "./routes/dislike.routes.js"

// routes Declaration

// here app.use is a middleware: why b'coz using app.get will surve only one task only for GET


app.use("/api/v1/users",userRoutes)
app.use("/api/v1/likes",likeRoutes)
app.use("/api/v1/dislikes",dislikeRoutes)





export {app}