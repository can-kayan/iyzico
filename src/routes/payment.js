import moment from "moment";
import Carts from "../db/carts";
import ApiError from "../error/ApiError";
import Session from "../middlewares/Session";
import * as Payments from "../services/iyzico/methods/payments" 
import * as Cards from "../services/iyzico/methods/cards" 
import Users from "../db/users";
import nanoid from "../utils/nanoid";
import { CompletePayment } from "../utils/payment";
import Iyzipay from "iyzipay"

export default (router)=>{
    //yeni kart ile ödeme oluştur kart kaydetme
    router.post("/payments/:cartId/with-new-card",Session,async(req,res)=>{
        const {card}=req.body
        if(!card){
            throw new ApiError("Card is reuired",400,"cardRequired")

        }
        if(!req.params?.cartId){
            throw new ApiError("Card id is reuired",400,"cardIdRequired")
        }
        const cart=await Carts.findOne({_id:req.params?.cartId}).populate("buyer").populate("products")
        console.log(cart)
        if(!cart){
            throw new ApiError("Card not found",404,"cardNotFound")

        }
        if(cart?.completed){
            throw new ApiError("Card is completed",400,"cardIsCompleted")
        }

        card.registerCard="0"
        const paidPrice=cart.products.map((product)=>product.price).reduce((a,b)=>a+b,0)
        const data={
            locale:req.user.locale,
            conversationId:nanoid(),
            price:paidPrice,
            paidPrice:paidPrice,
            currency:Iyzipay.CURRENCY.TRY,
            installments:'1',
            basketId:String(cart?._id),
            paymentChannel:Iyzipay.PAYMENT_CHANNEL.WEB,
            paymentGroup:Iyzipay.PAYMENT_GROUP.PRODUCT,
            paymentCard:card,
            buyer:{
                id:String(req.user._id),
                name:req.user?.name,
                surname:req.user?.surname,
                gsmNumber:req.user?.phoneNumber,
                email:req.user?.email,
                identityNumber:req.user?.identityNumber,
                lastLoginDate: moment(req.user?.updateAt).format("YYYY-MM-DD HH:mm:ss"),
                registrationDate: moment(req.user?.createAt).format("YYYY-MM-DD HH:mm:ss"),
                registrationAddress:req.user?.address,
                ip:req.user?.ip,
                city:req.user?.city,
                country:req.user?.country,
                zipCode:req.user?.zipCode
            },
            shippingAddress:{
                contactName:req.user?.name+" "+req.user?.surname,
                city:req.user?.city,
                country:req.user?.country,
                address:req.user?.address,
                zipCode:req.user?.zipCode
            },
            billingAddress:{
                contactName:req.user?.name+" "+req.user?.surname,
                city:req.user?.city,
                country:req.user?.country,
                address:req.user?.address,
                zipCode:req.user?.zipCode
            },
            basketItems:cart.products.map((product,index)=>{
                return {
                    id:String(product?._id),
                    name:product?.name,
                    category1:product.categories[0],
                    category2:product.categories[1],
                    itemType:Iyzipay.BASKET_ITEM_TYPE[product?.itemType],
                    price:product?.price
                }
            })
        }
        let result =await Payments.createPayment(data)
        await CompletePayment(result)
        res.json(result)
        
    })

    //yeni kart ile ödeme oluştur kart kaydet
    router.post("/payments/:cartId/with-register-card",Session,async(req,res)=>{
        const {card}=req.body
        if(!card){
            throw new ApiError("Card is reuired",400,"cardRequired")

        }
        if(!req.params?.cartId){
            throw new ApiError("Card id is reuired",400,"cardIdRequired")
        }
        const cart=await Carts.findOne({_id:req.params?.cartId}).populate("buyer").populate("products")
        console.log(cart)
        if(!cart){
            throw new ApiError("Card not found",404,"cardNotFound")

        }
        if(cart?.completed){
            throw new ApiError("Card is completed",400,"cardIsCompleted")
        }
        if(req.user?.cardUserKey){
            card.cardUserKey=req.user?.cardUserKey
        }
        card.registerCard='1'
        const paidPrice=cart.products.map((product)=>product.price).reduce((a,b)=>a+b,0)
        const data={
            locale:req.user.locale,
            conversationId:nanoid(),
            price:paidPrice,
            paidPrice:paidPrice,
            currency:Iyzipay.CURRENCY.TRY,
            installments:'1',
            basketId:String(cart?._id),
            paymentChannel:Iyzipay.PAYMENT_CHANNEL.WEB,
            paymentGroup:Iyzipay.PAYMENT_GROUP.PRODUCT,
            paymentCard:card,
            buyer:{
                id:String(req.user._id),
                name:req.user?.name,
                surname:req.user?.surname,
                gsmNumber:req.user?.phoneNumber,
                email:req.user?.email,
                identityNumber:req.user?.identityNumber,
                lastLoginDate: moment(req.user?.updateAt).format("YYYY-MM-DD HH:mm:ss"),
                registrationDate: moment(req.user?.createAt).format("YYYY-MM-DD HH:mm:ss"),
                registrationAddress:req.user?.address,
                ip:req.user?.ip,
                city:req.user?.city,
                country:req.user?.country,
                zipCode:req.user?.zipCode
            },
            shippingAddress:{
                contactName:req.user?.name+" "+req.user?.surname,
                city:req.user?.city,
                country:req.user?.country,
                address:req.user?.address,
                zipCode:req.user?.zipCode
            },
            billingAddress:{
                contactName:req.user?.name+" "+req.user?.surname,
                city:req.user?.city,
                country:req.user?.country,
                address:req.user?.address,
                zipCode:req.user?.zipCode
            },
            basketItems:cart.products.map((product,index)=>{
                return {
                    id:String(product?._id),
                    name:product?.name,
                    category1:product.categories[0],
                    category2:product.categories[1],
                    itemType:Iyzipay.BASKET_ITEM_TYPE[product?.itemType],
                    price:product?.price
                }
            })
        }
        let result =await Payments.createPayment(data)
        if(!req.user?.cardUserKey){
            const user=await Users.findOne({_id:req.user?._id})
            user.cardUserKey=result?.cardUserKey
            await user.save()
        }
        await CompletePayment(result)
        res.json(result)
        
    })

    //kayıtlı kart ile ödeme yapma
    router.post("/payments/:cardId/:cartIndex/with-registered-card-index",Session,async(req,res)=>{
        const {cartIndex}=req.params
        if(!cartIndex){
            throw new ApiError("Card index is reuired",400,"cardIndexRequired")

        }
        if(!req.user?.cardUserKey){
            throw new ApiError("No registered card available",400,"cardAvailable")
        }
        const cards=await Cards.getUserCards({
            locale:req.user.locale,
            conversationId:nanoid(),
            cardUserKey:req.user?.cardUserKey
        })
        const index=parseInt(cartIndex)
        if(index >=cards?.cardDetails?.length){
            throw new ApiError("Card doesnt exists",400,"cardIbdexInvalid")
        }
        const {cardToken}=cards?.cardDetails[index]
        if(!req.params?.cardId){
            throw new ApiError("Card id is reuired",400,"cardIdRequired")
        }
        const cart=await Carts.findOne({_id:req.params?.cardId}).populate("buyer").populate("products")
        console.log(cart)
        if(!cart){
            throw new ApiError("Card not found",404,"cardNotFound")

        }
        if(cart?.completed){
            throw new ApiError("Card is completed",400,"cardIsCompleted")
        }
        const card={
            cardToken,
            cardUserKey:req.user?.cardUserKey
        }
        const paidPrice=cart.products.map((product)=>product.price).reduce((a,b)=>a+b,0)
        const data={
            locale:req.user.locale,
            conversationId:nanoid(),
            price:paidPrice,
            paidPrice:paidPrice,
            currency:Iyzipay.CURRENCY.TRY,
            installments:'1',
            basketId:String(cart?._id),
            paymentChannel:Iyzipay.PAYMENT_CHANNEL.WEB,
            paymentGroup:Iyzipay.PAYMENT_GROUP.PRODUCT,
            paymentCard:card,
            buyer:{
                id:String(req.user._id),
                name:req.user?.name,
                surname:req.user?.surname,
                gsmNumber:req.user?.phoneNumber,
                email:req.user?.email,
                identityNumber:req.user?.identityNumber,
                lastLoginDate: moment(req.user?.updateAt).format("YYYY-MM-DD HH:mm:ss"),
                registrationDate: moment(req.user?.createAt).format("YYYY-MM-DD HH:mm:ss"),
                registrationAddress:req.user?.address,
                ip:req.user?.ip,
                city:req.user?.city,
                country:req.user?.country,
                zipCode:req.user?.zipCode
            },
            shippingAddress:{
                contactName:req.user?.name+" "+req.user?.surname,
                city:req.user?.city,
                country:req.user?.country,
                address:req.user?.address,
                zipCode:req.user?.zipCode
            },
            billingAddress:{
                contactName:req.user?.name+" "+req.user?.surname,
                city:req.user?.city,
                country:req.user?.country,
                address:req.user?.address,
                zipCode:req.user?.zipCode
            },
            basketItems:cart.products.map((product,index)=>{
                return {
                    id:String(product?._id),
                    name:product?.name,
                    category1:product.categories[0],
                    category2:product.categories[1],
                    itemType:Iyzipay.BASKET_ITEM_TYPE[product?.itemType],
                    price:product?.price
                }
            })
        }
        let result =await Payments.createPayment(data)
        if(!req.user?.cardUserKey){
            const user=await Users.findOne({_id:req.user?._id})
            user.cardUserKey=result?.cardUserKey
            await user.save()
        }
        await CompletePayment(result)
        res.json(result)
        
    })

    //kayıtlı kart ile ödeme yapma token
    router.post("/payments/:cardId/with-registered-card-token",Session,async(req,res)=>{
        const {cardToken}=req.body
        if(!cardToken){
            throw new ApiError("Card token is reuired",400,"cardTokenRequired")
        }
        if(!req.user?.cardUserKey){
            throw new ApiError("No registered card available",400,"cardAvailable")
        }
        if(!req.params?.cardId){
            throw new ApiError("Card id is reuired",400,"cardIdRequired")
        }
        const cart=await Carts.findOne({_id:req.params?.cardId}).populate("buyer").populate("products")
        console.log(cart)
        if(!cart){
            throw new ApiError("Card not found",404,"cardNotFound")

        }
        if(cart?.completed){
            throw new ApiError("Card is completed",400,"cardIsCompleted")
        }
        const card={
            cardToken,
            cardUserKey:req.user?.cardUserKey
        }
        const paidPrice=cart.products.map((product)=>product.price).reduce((a,b)=>a+b,0)
        const data={
            locale:req.user.locale,
            conversationId:nanoid(),
            price:paidPrice,
            paidPrice:paidPrice,
            currency:Iyzipay.CURRENCY.TRY,
            installments:'1',
            basketId:String(cart?._id),
            paymentChannel:Iyzipay.PAYMENT_CHANNEL.WEB,
            paymentGroup:Iyzipay.PAYMENT_GROUP.PRODUCT,
            paymentCard:card,
            buyer:{
                id:String(req.user._id),
                name:req.user?.name,
                surname:req.user?.surname,
                gsmNumber:req.user?.phoneNumber,
                email:req.user?.email,
                identityNumber:req.user?.identityNumber,
                lastLoginDate: moment(req.user?.updateAt).format("YYYY-MM-DD HH:mm:ss"),
                registrationDate: moment(req.user?.createAt).format("YYYY-MM-DD HH:mm:ss"),
                registrationAddress:req.user?.address,
                ip:req.user?.ip,
                city:req.user?.city,
                country:req.user?.country,
                zipCode:req.user?.zipCode
            },
            shippingAddress:{
                contactName:req.user?.name+" "+req.user?.surname,
                city:req.user?.city,
                country:req.user?.country,
                address:req.user?.address,
                zipCode:req.user?.zipCode
            },
            billingAddress:{
                contactName:req.user?.name+" "+req.user?.surname,
                city:req.user?.city,
                country:req.user?.country,
                address:req.user?.address,
                zipCode:req.user?.zipCode
            },
            basketItems:cart.products.map((product,index)=>{
                return {
                    id:String(product?._id),
                    name:product?.name,
                    category1:product.categories[0],
                    category2:product.categories[1],
                    itemType:Iyzipay.BASKET_ITEM_TYPE[product?.itemType],
                    price:product?.price
                }
            })
        }
        let result =await Payments.createPayment(data)
        if(!req.user?.cardUserKey){
            const user=await Users.findOne({_id:req.user?._id})
            user.cardUserKey=result?.cardUserKey
            await user.save()
        }
        await CompletePayment(result)
        res.json(result)
        
    })
}