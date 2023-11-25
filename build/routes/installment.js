"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _mongoose = require("mongoose");
var _moment = _interopRequireDefault(require("moment"));
var _Session = _interopRequireDefault(require("../middlewares/Session"));
var _nanoid = _interopRequireDefault(require("../utils/nanoid"));
var Installment = _interopRequireWildcard(require("../services/iyzico/methods/installmetns"));
var _ApiError = _interopRequireDefault(require("../error/ApiError"));
var _carts = _interopRequireDefault(require("../db/carts"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const {
  ObjectId
} = _mongoose.Types;
var _default = router => {
  //fiyata göre taksit kontrolü
  router.post("/installments", _Session.default, async (req, res) => {
    const {
      binNumber,
      price
    } = req.body;
    if (!binNumber || !price) {
      throw new _ApiError.default("Missing parameters", 400, "missingParameter");
    }
    const result = await Installment.checkInstallment({
      locale: req.user.locale,
      conversationId: (0, _nanoid.default)(),
      binNumber: binNumber,
      price: price
    });
    res.json(result);
  });

  //spete göre taksit kontrolü
  router.post("/installments/:cardId", _Session.default, async (req, res) => {
    const {
      binNumber
    } = req.body;
    const {
      cardId
    } = req.params;
    if (!cardId) {
      throw new _ApiError.default("Card id is required", 400, "cardIdrequired");
    }
    const cart = await _carts.default.findOne({
      _id: cardId
    }).populate("products", {
      _id: 1,
      price: 1
    });
    const price = cart.products.map(product => product.price).reduce((a, b) => a + b, 0);
    if (!binNumber || !price) {
      throw new _ApiError.default("Missing parameters", 400, "missingParameter");
    }
    const result = await Installment.checkInstallment({
      locale: req.user.locale,
      conversationId: (0, _nanoid.default)(),
      binNumber: binNumber,
      price: price
    });
    res.json(result);
  });
};
exports.default = _default;