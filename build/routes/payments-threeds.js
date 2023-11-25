"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _moment = _interopRequireDefault(require("moment"));
var _carts = _interopRequireDefault(require("../db/carts"));
var _ApiError = _interopRequireDefault(require("../error/ApiError"));
var _Session = _interopRequireDefault(require("../middlewares/Session"));
var PaymentsThreeDS = _interopRequireWildcard(require("../services/iyzico/methods/threeds-payment"));
var Cards = _interopRequireWildcard(require("../services/iyzico/methods/cards"));
var _users = _interopRequireDefault(require("../db/users"));
var _nanoid = _interopRequireDefault(require("../utils/nanoid"));
var _payment = require("../utils/payment");
var _iyzipay = _interopRequireDefault(require("iyzipay"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var _default = router => {
  router.post("/threeds/payments/complete", async (req, res) => {
    if (!req.body?.paymentId) {
      throw new _ApiError.default("Payment id is required", 400, "paymentIdRequired");
    }
    if (req.body.status !== "success") {
      throw new _ApiError.default("Payment cant be starred because initialize is failed", 400, "initializationFailed");
    }
    const data = {
      locale: "tr",
      conversationId: (0, _nanoid.default)(),
      paymentId: req.body.paymentId,
      conversationData: req.body.conversationData
    };
    const result = await PaymentsThreeDS.complatePayment(data);
    await (0, _payment.CompletePayment)(result);
    res.status(200).json(result);
  });
  //kartı kaydetme  3dödeme
  router.post("/threeds/payments/:cartId/with-new-card", _Session.default, async (req, res) => {
    const {
      card
    } = req.body;
    if (!card) {
      throw new _ApiError.default("Card is reuired", 400, "cardRequired");
    }
    if (!req.params?.cartId) {
      throw new _ApiError.default("Card id is reuired", 400, "cardIdRequired");
    }
    const cart = await _carts.default.findOne({
      _id: req.params?.cartId
    }).populate("buyer").populate("products");
    console.log(cart);
    if (!cart) {
      throw new _ApiError.default("Card not found", 404, "cardNotFound");
    }
    if (cart?.completed) {
      throw new _ApiError.default("Card is completed", 400, "cardIsCompleted");
    }
    card.registerCard = "0";
    const paidPrice = cart.products.map(product => product.price).reduce((a, b) => a + b, 0);
    const data = {
      locale: req.user.locale,
      conversationId: (0, _nanoid.default)(),
      price: paidPrice,
      paidPrice: paidPrice,
      currency: _iyzipay.default.CURRENCY.TRY,
      installments: '1',
      basketId: String(cart?._id),
      paymentChannel: _iyzipay.default.PAYMENT_CHANNEL.WEB,
      paymentGroup: _iyzipay.default.PAYMENT_GROUP.PRODUCT,
      callbackUrl: `${process.env.END_POINT}/threeds/payments/complete`,
      paymentCard: card,
      buyer: {
        id: String(req.user._id),
        name: req.user?.name,
        surname: req.user?.surname,
        gsmNumber: req.user?.phoneNumber,
        email: req.user?.email,
        identityNumber: req.user?.identityNumber,
        lastLoginDate: (0, _moment.default)(req.user?.updateAt).format("YYYY-MM-DD HH:mm:ss"),
        registrationDate: (0, _moment.default)(req.user?.createAt).format("YYYY-MM-DD HH:mm:ss"),
        registrationAddress: req.user?.address,
        ip: req.user?.ip,
        city: req.user?.city,
        country: req.user?.country,
        zipCode: req.user?.zipCode
      },
      shippingAddress: {
        contactName: req.user?.name + " " + req.user?.surname,
        city: req.user?.city,
        country: req.user?.country,
        address: req.user?.address,
        zipCode: req.user?.zipCode
      },
      billingAddress: {
        contactName: req.user?.name + " " + req.user?.surname,
        city: req.user?.city,
        country: req.user?.country,
        address: req.user?.address,
        zipCode: req.user?.zipCode
      },
      basketItems: cart.products.map((product, index) => {
        return {
          id: String(product?._id),
          name: product?.name,
          category1: product.categories[0],
          category2: product.categories[1],
          itemType: _iyzipay.default.BASKET_ITEM_TYPE[product?.itemType],
          price: product?.price
        };
      })
    };
    let result = await PaymentsThreeDS.initializePayment(data);
    const html = Buffer.from(result?.threeDSHtmlContent, 'base64').toString();
    // await CompletePayment(result)
    res.send(html);
  });

  //kartı kaydet  3dödeme
  router.post("/threeds/payments/:cartId/with-new-card/register-card", _Session.default, async (req, res) => {
    const {
      card
    } = req.body;
    if (!card) {
      throw new _ApiError.default("Card is reuired", 400, "cardRequired");
    }
    if (!req.params?.cartId) {
      throw new _ApiError.default("Card id is reuired", 400, "cardIdRequired");
    }
    const cart = await _carts.default.findOne({
      _id: req.params?.cartId
    }).populate("buyer").populate("products");
    console.log(cart);
    if (!cart) {
      throw new _ApiError.default("Card not found", 404, "cardNotFound");
    }
    if (cart?.completed) {
      throw new _ApiError.default("Card is completed", 400, "cardIsCompleted");
    }
    if (req.user.cardUserKey) {
      card.cardUserKey = req.user?.cardUserKey;
    }
    card.registerCard = "1";
    const paidPrice = cart.products.map(product => product.price).reduce((a, b) => a + b, 0);
    const data = {
      locale: req.user.locale,
      conversationId: (0, _nanoid.default)(),
      price: paidPrice,
      paidPrice: paidPrice,
      currency: _iyzipay.default.CURRENCY.TRY,
      installments: '1',
      basketId: String(cart?._id),
      paymentChannel: _iyzipay.default.PAYMENT_CHANNEL.WEB,
      paymentGroup: _iyzipay.default.PAYMENT_GROUP.PRODUCT,
      callbackUrl: `${process.env.END_POINT}/threeds/payments/complete`,
      paymentCard: card,
      buyer: {
        id: String(req.user._id),
        name: req.user?.name,
        surname: req.user?.surname,
        gsmNumber: req.user?.phoneNumber,
        email: req.user?.email,
        identityNumber: req.user?.identityNumber,
        lastLoginDate: (0, _moment.default)(req.user?.updateAt).format("YYYY-MM-DD HH:mm:ss"),
        registrationDate: (0, _moment.default)(req.user?.createAt).format("YYYY-MM-DD HH:mm:ss"),
        registrationAddress: req.user?.address,
        ip: req.user?.ip,
        city: req.user?.city,
        country: req.user?.country,
        zipCode: req.user?.zipCode
      },
      shippingAddress: {
        contactName: req.user?.name + " " + req.user?.surname,
        city: req.user?.city,
        country: req.user?.country,
        address: req.user?.address,
        zipCode: req.user?.zipCode
      },
      billingAddress: {
        contactName: req.user?.name + " " + req.user?.surname,
        city: req.user?.city,
        country: req.user?.country,
        address: req.user?.address,
        zipCode: req.user?.zipCode
      },
      basketItems: cart.products.map((product, index) => {
        return {
          id: String(product?._id),
          name: product?.name,
          category1: product.categories[0],
          category2: product.categories[1],
          itemType: _iyzipay.default.BASKET_ITEM_TYPE[product?.itemType],
          price: product?.price
        };
      })
    };
    let result = await PaymentsThreeDS.initializePayment(data);
    const html = Buffer.from(result?.threeDSHtmlContent, 'base64').toString();
    // await CompletePayment(result)
    res.send(html);
  });

  //hazırda olan 3dödeme index
  router.post("/threeds/payments/:cartId/:cartIndex/with-registered-card-index", _Session.default, async (req, res) => {
    const {
      cartIndex
    } = req.params;
    if (!cartIndex) {
      throw new _ApiError.default("Card index is reuired", 400, "cardIndexRequired");
    }
    if (!req.user?.cardUserKey) {
      throw new _ApiError.default("No registered card available", 400, "cardAvailable");
    }
    const cards = await Cards.getUserCards({
      locale: req.user.locale,
      conversationId: (0, _nanoid.default)(),
      cardUserKey: req.user?.cardUserKey
    });
    const index = parseInt(cartIndex);
    if (index >= cards?.cardDetails?.length) {
      throw new _ApiError.default("Card doesnt exists", 400, "cardIbdexInvalid");
    }
    const {
      cardToken
    } = cards?.cardDetails[index];
    const card = {
      cardToken,
      cardUserKey: req.user?.cardUserKey
    };
    if (!req.params?.cartId) {
      throw new _ApiError.default("Card id is reuired", 400, "cardIdRequired");
    }
    const cart = await _carts.default.findOne({
      _id: req.params?.cartId
    }).populate("buyer").populate("products");
    console.log(cart);
    if (!cart) {
      throw new _ApiError.default("Card not found", 404, "cardNotFound");
    }
    if (cart?.completed) {
      throw new _ApiError.default("Card is completed", 400, "cardIsCompleted");
    }
    if (req.user.cardUserKey) {
      card.cardUserKey = req.user?.cardUserKey;
    }
    const paidPrice = cart.products.map(product => product.price).reduce((a, b) => a + b, 0);
    const data = {
      locale: req.user.locale,
      conversationId: (0, _nanoid.default)(),
      price: paidPrice,
      paidPrice: paidPrice,
      currency: _iyzipay.default.CURRENCY.TRY,
      installments: '1',
      basketId: String(cart?._id),
      paymentChannel: _iyzipay.default.PAYMENT_CHANNEL.WEB,
      paymentGroup: _iyzipay.default.PAYMENT_GROUP.PRODUCT,
      callbackUrl: `${process.env.END_POINT}/threeds/payments/complete`,
      paymentCard: card,
      buyer: {
        id: String(req.user._id),
        name: req.user?.name,
        surname: req.user?.surname,
        gsmNumber: req.user?.phoneNumber,
        email: req.user?.email,
        identityNumber: req.user?.identityNumber,
        lastLoginDate: (0, _moment.default)(req.user?.updateAt).format("YYYY-MM-DD HH:mm:ss"),
        registrationDate: (0, _moment.default)(req.user?.createAt).format("YYYY-MM-DD HH:mm:ss"),
        registrationAddress: req.user?.address,
        ip: req.user?.ip,
        city: req.user?.city,
        country: req.user?.country,
        zipCode: req.user?.zipCode
      },
      shippingAddress: {
        contactName: req.user?.name + " " + req.user?.surname,
        city: req.user?.city,
        country: req.user?.country,
        address: req.user?.address,
        zipCode: req.user?.zipCode
      },
      billingAddress: {
        contactName: req.user?.name + " " + req.user?.surname,
        city: req.user?.city,
        country: req.user?.country,
        address: req.user?.address,
        zipCode: req.user?.zipCode
      },
      basketItems: cart.products.map((product, index) => {
        return {
          id: String(product?._id),
          name: product?.name,
          category1: product.categories[0],
          category2: product.categories[1],
          itemType: _iyzipay.default.BASKET_ITEM_TYPE[product?.itemType],
          price: product?.price
        };
      })
    };
    let result = await PaymentsThreeDS.initializePayment(data);
    const html = Buffer.from(result?.threeDSHtmlContent, 'base64').toString();
    // await CompletePayment(result)
    res.send(html);
  });

  //hazırda olan 3dödeme token
  router.post("/threeds/payments/:cartId/with-registered-card-token", _Session.default, async (req, res) => {
    let {
      cardToken
    } = req.body;
    if (!cardToken) {
      throw new _ApiError.default("Card index is reuired", 400, "cardIndexRequired");
    }
    if (!req.user?.cardUserKey) {
      throw new _ApiError.default("No registered card available", 400, "cardAvailable");
    }
    const card = {
      cardToken,
      cardUserKey: req.user?.cardUserKey
    };
    if (!req.params?.cartId) {
      throw new _ApiError.default("Card id is reuired", 400, "cardIdRequired");
    }
    const cart = await _carts.default.findOne({
      _id: req.params?.cartId
    }).populate("buyer").populate("products");
    console.log(cart);
    if (!cart) {
      throw new _ApiError.default("Card not found", 404, "cardNotFound");
    }
    if (cart?.completed) {
      throw new _ApiError.default("Card is completed", 400, "cardIsCompleted");
    }
    if (req.user.cardUserKey) {
      card.cardUserKey = req.user?.cardUserKey;
    }
    const paidPrice = cart.products.map(product => product.price).reduce((a, b) => a + b, 0);
    const data = {
      locale: req.user.locale,
      conversationId: (0, _nanoid.default)(),
      price: paidPrice,
      paidPrice: paidPrice,
      currency: _iyzipay.default.CURRENCY.TRY,
      installments: '1',
      basketId: String(cart?._id),
      paymentChannel: _iyzipay.default.PAYMENT_CHANNEL.WEB,
      paymentGroup: _iyzipay.default.PAYMENT_GROUP.PRODUCT,
      callbackUrl: `${process.env.END_POINT}/threeds/payments/complete`,
      paymentCard: card,
      buyer: {
        id: String(req.user._id),
        name: req.user?.name,
        surname: req.user?.surname,
        gsmNumber: req.user?.phoneNumber,
        email: req.user?.email,
        identityNumber: req.user?.identityNumber,
        lastLoginDate: (0, _moment.default)(req.user?.updateAt).format("YYYY-MM-DD HH:mm:ss"),
        registrationDate: (0, _moment.default)(req.user?.createAt).format("YYYY-MM-DD HH:mm:ss"),
        registrationAddress: req.user?.address,
        ip: req.user?.ip,
        city: req.user?.city,
        country: req.user?.country,
        zipCode: req.user?.zipCode
      },
      shippingAddress: {
        contactName: req.user?.name + " " + req.user?.surname,
        city: req.user?.city,
        country: req.user?.country,
        address: req.user?.address,
        zipCode: req.user?.zipCode
      },
      billingAddress: {
        contactName: req.user?.name + " " + req.user?.surname,
        city: req.user?.city,
        country: req.user?.country,
        address: req.user?.address,
        zipCode: req.user?.zipCode
      },
      basketItems: cart.products.map((product, index) => {
        return {
          id: String(product?._id),
          name: product?.name,
          category1: product.categories[0],
          category2: product.categories[1],
          itemType: _iyzipay.default.BASKET_ITEM_TYPE[product?.itemType],
          price: product?.price
        };
      })
    };
    let result = await PaymentsThreeDS.initializePayment(data);
    const html = Buffer.from(result?.threeDSHtmlContent, 'base64').toString();
    // await CompletePayment(result)
    res.send(html);
  });
};
exports.default = _default;