"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _cards = _interopRequireDefault(require("./cards"));
var _installment = _interopRequireDefault(require("./installment"));
var _test = _interopRequireDefault(require("./test"));
var _users = _interopRequireDefault(require("./users"));
var _payment = _interopRequireDefault(require("./payment"));
var _paymentsThreeds = _interopRequireDefault(require("./payments-threeds"));
var _checkout = _interopRequireDefault(require("./checkout"));
var _cancelPayments = _interopRequireDefault(require("./cancel-payments"));
var _refundPayments = _interopRequireDefault(require("./refund-payments"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var _default = exports.default = [_test.default, _users.default, _cards.default, _installment.default, _payment.default, _paymentsThreeds.default, _checkout.default, _cancelPayments.default, _refundPayments.default];