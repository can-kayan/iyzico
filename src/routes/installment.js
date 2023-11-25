import { Types } from "mongoose";
import moment from "moment";
import Session from "../middlewares/Session";
import nanoid from "../utils/nanoid";
import * as Installment from "../services/iyzico/methods/installmetns"
import ApiError from "../error/ApiError";
import Carts from "../db/carts";

const {ObjectId}=Types
export default (router)=>{
    //fiyata göre taksit kontrolü
    router.post("/installments",Session,async(req,res)=>{
        const {binNumber,price}=req.body
        if(!binNumber || !price){
            throw new ApiError("Missing parameters",400,"missingParameter")

        }
        const result =await Installment.checkInstallment({
            locale:req.user.locale,
            conversationId:nanoid(),
            binNumber:binNumber,
            price:price
        })
        res.json(result)
    })

    //spete göre taksit kontrolü
    router.post("/installments/:cardId",Session,async(req,res)=>{
        const {binNumber}=req.body
        const {cardId}=req.params
        if(!cardId){
            throw new ApiError("Card id is required",400,"cardIdrequired")
        }
        const cart =await Carts.findOne({
            _id:cardId
        }).populate("products",{
            _id:1,
            price:1
        })
        const price=cart.products.map((product)=>product.price).reduce((a,b)=>a+b,0)
        if(!binNumber || !price){
            throw new ApiError("Missing parameters",400,"missingParameter")
        }
        const result =await Installment.checkInstallment({
            locale:req.user.locale,
            conversationId:nanoid(),
            binNumber:binNumber,
            price:price
        })
        res.json(result)
    })
}