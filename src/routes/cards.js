import ApiError from "../error/ApiError";
import * as Cards from "../services/iyzico/methods/cards"
import nanoid from "../utils/nanoid";
import Session from "../middlewares/Session"
import Users from "../db/users";
import Iyzipay from "iyzipay";
export default (router)=>{
    //kart ekleme
    router.post("/cards",Session,async(req,res)=>{
        const {card}=req.body
        console.log(card)
        let result=await Cards.createUserCard({
            locale:req.user.locale,
            conversationId:nanoid(),
            email:req.user.email,
            externalId:nanoid(),
            ...req.user?.cardUserKey && {
                cardUserKey:req.user.cardUserKey
            },
            card:card
        })
        console.log(result)
        if(!req.user?.cardUserKey){
            if(result?.status==="success"&& result?.cardUserKey){
                const user=await Users.findOne({
                    _id:req.user?._id
                })
                user.cardUserKey=result?.cardUserKey
                console.log(user.cardUserKey)
                await user.save()
            }
        }
        res.json(result)
    })

    //kart okuma
    router.get("/cards",Session,async(req,res)=>{
        if(!req.user?.cardUserKey){
            throw new ApiError("User has no credit card",403,"userHashNoCard")

        }
        let cards=await Cards.getUserCards({
            locale:req.user.locale,
            conversationId:nanoid(),
            cardUserKey:req.user?.cardUserKey
        })
        res.status(200).json(cards)
    })

    //Kart silme -token
    router.delete("/cards/delete-by-token",Session,async(req,res)=>{
        const {cardToken}=req.body
        if(!cardToken){
            throw new ApiError("Card token is required",400,"cardTokenRequired")

        }
        let deleteresult=await Cards.deleteUserCard({
            locale:req.user.locale,
            conversationId:nanoid(),
            cardUserKey:req.user?.cardUserKey,
            cardToken:cardToken
        })
        res.status(200).json(deleteresult)
    })

    //kart silme index
    router.delete("/cards/:cardIndex/delete-by-index",Session,async(req,res)=>{
        if(!req.params?.cardIndex){
            throw new ApiError("Card Index is required",400,"cardIndexrequired")

        }
        let cards=await Cards.getUserCards({
            locale:req.user.locale,
            conversationId:nanoid(),
            cardUserKey:req.user?.cardUserKey

        })
        const index=parseFloat(req.params?.cardIndex);
        if(index>=cards?.cardDetails.length){
            throw new ApiError("Card doesnt exists, checl index number",400,"ccardIndexInvalid")
        }
        const {cardToken}=cards?.cardDetails[index]
        let deleteresult=await Cards.deleteUserCard({
            locale:req.user.locale,
            conversationId:nanoid(),
            cardUserKey:req.user?.cardUserKey,
            cardToken:cardToken
        })
        res.json(deleteresult)
    })
}