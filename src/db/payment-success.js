import mongoose from "mongoose";
import nanoid from "../utils/nanoid"

const  {Schema}=mongoose;
const {ObjectId}=Schema.Types;

const ItemtransactionSchema=new Schema({
    uid:{
        type:String,
        default:nanoid(),
        unique:true,
        required:true
    },
    itemId:{
        type:ObjectId,
        ref:"Products",
        required:true
    },
    paymentTransactionId:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    paidPrice:{
        type:Number,
        required:true
    }
})

const PaymentsSuccessSchema=new Schema({
    uid:{
        type:String,
        default:nanoid(),
        unique:true,
        required:true
    },
    status:{
        type:String,
        required:true,
        enum:["success"]
    },
    cardId:{
        type:ObjectId,
        ref:"Carts",
        required:true
    },
    conversationId:{
        type:String,
        required:true
    },
    currency:{
        type:String,
        required:true,
        enum:["TRY","USD","EUR"]
    },
    paymentId:{
        type:String,
        required:true,
        unique:true
    },
    price:{
        type:Number,
        required:true
    },
    paidPrice:{
        type:Number,
        required:true
    },
    itemTransactions:{
        type:[ItemtransactionSchema]
    },
    log:{
        type:Schema.Types.Mixed,
        required:true
    }
},{
    _id:true,
    collection:"payment-success",
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

const Paymentsuccess=mongoose.model("PaymentSuccess",PaymentsSuccessSchema)

export default Paymentsuccess