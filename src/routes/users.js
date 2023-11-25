import ApiError from "../error/ApiError"
import bcrypt from "bcryptjs"
import Users from "../db/users"
import jwt from "jsonwebtoken"
export default (router)=>{
    router.post("/login",async(req,res)=>{
        const {email,password}=req.body
        const user=await Users.findOne({email:email});
        if(!user){
            throw new ApiError("Incorrect password or email",401,"userOrPasswordIncorrect")
        }
        const passwordConfirmed=await bcrypt.compare(password,user.password);
        if(passwordConfirmed){
            const userJson=user.toJSON()
            const token=jwt.sign(userJson,process.env.JWT_SECRET)
            res.json({
                token:`Bearer ${token}`,
                user:userJson,

            })
        }else{
            throw new ApiError("Incorrect password or email",401,"userOrPasswordIncorrect")

        }
    })
}