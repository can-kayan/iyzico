import "express-async-errors"
import dotenv from "dotenv"
import config from "./config.js"
import express from "express"
import logger from "morgan"
import https from "https"
import fs from "fs"
import path from "path"
import helmet from "helmet"
import cors from "cors"
import passport, { session } from "passport"
import { ExtractJwt,Strategy as JwtStrategy } from "passport-jwt"
import DBModules from "./db"
import Users from "./db/users.js"
import GenericErrorHandler from "./middlewares/GenericErrorhandler.js"
import ApiError from "./error/ApiError.js"
import Session from "../build/middlewares/Session.js"
import mongoose from "mongoose"
import routes from "./routes/index.js"
const envPath=config?.production
    ?"./env/.prod"
    :"./env/.dev"
dotenv.config({
    path:envPath
})

//Begin mongoodb connection
mongoose.connect(process.env.MONGO_URI,{
    useNewUrlParser:true,
    useUnifiedTopology:true,
}).then(()=>{
    console.log("connected to mongoDb")
}).catch((err)=>{
    console.log(err)
})

//End

const app=express()


app.use(logger(process.env.LOGGER))
app.use(helmet())
app.use(cors({
    origin:"*"
}))
app.use(express.json({
    limit:"1mb"
}));
app.use(express.urlencoded({extended:true}))

passport.serializeUser((user,done)=>{
    done(null,user)
})
passport.deserializeUser((id,done)=>{
    done(null,id)
})
app.use(passport.initialize())

const jwtOpts={
    jwtFromRequest:ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey:process.env.JWT_SECRET
}
passport.use(
    new JwtStrategy(
        jwtOpts,
        async(jwtPayload,done)=>{
            try{
                const user=await Users.findOne({_id:jwtPayload._id})
                if(user){
                    done(null,user.toJSON())
                }else{
                    done(new ApiError("Authorization is not valid",401,"authorizationvalid"))
                }
            }catch(err){
                return done(err,false)
            }
        }
    )
)
// app.use("/",(req,res)=>{
//     throw new ApiError("bir hata olştu",404,"somethingWrong")
//     res.json({
//         test:1
//     })
// })
const router=express.Router()
routes.forEach((routeFn,index)=>{
    routeFn(router)
})
Users.initializer()
app.use("/api",router)
app.all("/test-auth",Session,(req,res)=>{
    res.json({
        test:true
    })
})
app.use(GenericErrorHandler)



if(process.env.HTTPS_ENABLED=="true"){
    const key=fs.readFileSync(path.join(__dirname,"./certs/key.pem")).toString()
    const cert= fs.readFileSync(path.join(__dirname,"./certs/cert.pem")).toString()
    const server = https.createServer({key:key,cert:cert},app)
    server.listen(process.env.PORT,()=>{console.log("Listen"+process.env.PORT)})

}else{
    app.listen(process.env.PORT,()=>{console.log("Listen"+process.env.PORT)})
}

