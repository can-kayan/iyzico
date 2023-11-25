import ApiError from "../error/ApiError";
import Session from "../middlewares/Session";
import * as RefundPayments from "../services/iyzico/methods/refund-payments"
import nanoid from "../utils/nanoid";
import Paymentsuccess from "../db/payment-success";
import Iyzipay from "iyzipay"
const reasonEnum =["double_payment","buyer_request","fraud","other"]
export default (router)=>{
    router.post("/payments/:paymentTransactionId/refund",Session,async(req,res)=>{
        const {paymentTransactionId}=req.params
        const reasonObj={}
        const {reason,description}=req.body
        if(!paymentTransactionId){
           throw new ApiError("paymentTransactionId is required",400,"paymentTransactionIdRequired")

        }
        if(reason && description){
            if(!reasonEnum.includes(reason)){
                throw new ApiError("Invalid cancel payment reason",400,"invalidCancelPayment")
            }
            reasonObj.reason=reason
            reasonObj.description=description
        }
        const payment=await Paymentsuccess.findOne({
            "itemTransactions.paymentTransactionId":paymentTransactionId
        })
        const currentItemTransaction=payment.itemTransactions.find((itemTransaction,index)=>{
            return itemTransaction.paymentTransactionId===paymentTransactionId
        })
        const result=await RefundPayments.refundPayments({
            locale:req.user?.locale,
            conversationId:nanoid(),
            paymentTransactionId:currentItemTransaction?.paymentTransactionId,
            price:req.body?.refundPrice || currentItemTransaction?.paidPrice,
            curreny:Iyzipay.CURRENCY.TRY,
            ip:req.user?.ip,
            ...reasonObj
        })
        res.json(result)
    })
}