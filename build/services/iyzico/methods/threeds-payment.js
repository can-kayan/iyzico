"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.initializePayment = exports.complatePayment = void 0;
var _iyzipay = _interopRequireDefault(require("../connection/iyzipay"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const initializePayment = data => {
  return new Promise((resolve, reject) => {
    _iyzipay.default.threedsInitialize.create(data, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};
exports.initializePayment = initializePayment;
const complatePayment = data => {
  return new Promise((resolve, reject) => {
    _iyzipay.default.threedsPayment.create(data, (err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
};
exports.complatePayment = complatePayment;