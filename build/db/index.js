"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _users = _interopRequireDefault(require("./users"));
var _product = _interopRequireDefault(require("./product"));
var _carts = _interopRequireDefault(require("./carts"));
var _paymentSuccess = _interopRequireDefault(require("./payment-success"));
var _paymentFail = _interopRequireDefault(require("./payment-fail"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var _default = exports.default = [_users.default, _product.default, _carts.default, _paymentSuccess.default, _paymentFail.default];