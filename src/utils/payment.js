import { Types } from "mongoose";
import Paymentsuccess from "../db/payment-success";
import PaymentFailed from "../db/payment-fail";
import Carts from "../db/carts";
const {ObjectId}=Types
export const CompletePayment=async(result)=>{
    if(result?.status==="success"){
        await Carts.updateOne({_id:result.basketId},{$set:{
            completed:true
        }})
        await Paymentsuccess.create({
            status:result.status,
            cardId:result?.basketId,
            conversationId:result?.conversationId,
            currency:result?.currency,
            paymentId:result?.paymentId,
            price:result?.price,
            paidPrice:result?.paidPrice,
            itemTransactions: result?.itemTransactions.map(item=>{
                return {
                    itemId:item?.itemId,
                    paymentTransactionId:item?.paymentTransactionId,
                    price:item?.price,
                    paidPrice:item?.paidPrice
                }
            }),
            log:result
        })
    }else{
        await PaymentFailed.create({
            status:result?.status,
            conversationId:result?.conversationId,
            errorCode:result?.errorCode,
            errorMessage:result?.errorMessage,
            log:result
        })
    }
}