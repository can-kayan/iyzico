import mongoose from "mongoose";
import nanoid from "../utils/nanoid"

const  {Schema}=mongoose;

const PaymentFailedSchema=new Schema({
    uid:{
        type:String,
        default:nanoid(),
        unique:true,
        required:true
    },
    status:{
        type:String,
        required:true,
        enum:["failure"]
    },
    conversationId:{
        type:String,
        required:true
    },
    errorCode:{
        type:String,
        required:true
    },
    errorMessage:{
        type:String,
        required:true
    },
    log:{
        type:Schema.Types.Mixed,
        required:true
    }
},{
    _id:true,
    collection:"payment-failed",
    timestamps:true,
    toJSON:{
        transform:(doc,ret)=>{
            delete ret.__v;
            delete ret.password;
            return{
                ...ret
            }
        }
    }
})

const PaymentFailed=mongoose.model("PaymentFailed",PaymentFailedSchema)

export default PaymentFailed