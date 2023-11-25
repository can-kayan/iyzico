"use strict";

require("express-async-errors");
var _dotenv = _interopRequireDefault(require("dotenv"));
var _config = _interopRequireDefault(require("./config.js"));
var _express = _interopRequireDefault(require("express"));
var _morgan = _interopRequireDefault(require("morgan"));
var _https = _interopRequireDefault(require("https"));
var _fs = _interopRequireDefault(require("fs"));
var _path = _interopRequireDefault(require("path"));
var _helmet = _interopRequireDefault(require("helmet"));
var _cors = _interopRequireDefault(require("cors"));
var _passport = _interopRequireWildcard(require("passport"));
var _passportJwt = require("passport-jwt");
var _db = _interopRequireDefault(require("./db"));
var _users = _interopRequireDefault(require("./db/users.js"));
var _GenericErrorhandler = _interopRequireDefault(require("./middlewares/GenericErrorhandler.js"));
var _ApiError = _interopRequireDefault(require("./error/ApiError.js"));
var _Session = _interopRequireDefault(require("../build/middlewares/Session.js"));
var _mongoose = _interopRequireDefault(require("mongoose"));
var _index = _interopRequireDefault(require("./routes/index.js"));
function _getRequireWildcardCache(e) { if ("function" != typeof WeakMap) return null; var r = new WeakMap(), t = new WeakMap(); return (_getRequireWildcardCache = function (e) { return e ? t : r; })(e); }
function _interopRequireWildcard(e, r) { if (!r && e && e.__esModule) return e; if (null === e || "object" != typeof e && "function" != typeof e) return { default: e }; var t = _getRequireWildcardCache(r); if (t && t.has(e)) return t.get(e); var n = { __proto__: null }, a = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var u in e) if ("default" !== u && Object.prototype.hasOwnProperty.call(e, u)) { var i = a ? Object.getOwnPropertyDescriptor(e, u) : null; i && (i.get || i.set) ? Object.defineProperty(n, u, i) : n[u] = e[u]; } return n.default = e, t && t.set(e, n), n; }
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
const envPath = _config.default?.production ? "./env/.prod" : "./env/.dev";
_dotenv.default.config({
  path: envPath
});

//Begin mongoodb connection
_mongoose.default.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log("connected to mongoDb");
}).catch(err => {
  console.log(err);
});

//End

const app = (0, _express.default)();
app.use((0, _morgan.default)(process.env.LOGGER));
app.use((0, _helmet.default)());
app.use((0, _cors.default)({
  origin: "*"
}));
app.use(_express.default.json({
  limit: "1mb"
}));
app.use(_express.default.urlencoded({
  extended: true
}));
_passport.default.serializeUser((user, done) => {
  done(null, user);
});
_passport.default.deserializeUser((id, done) => {
  done(null, id);
});
app.use(_passport.default.initialize());
const jwtOpts = {
  jwtFromRequest: _passportJwt.ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET
};
_passport.default.use(new _passportJwt.Strategy(jwtOpts, async (jwtPayload, done) => {
  try {
    const user = await _users.default.findOne({
      _id: jwtPayload._id
    });
    if (user) {
      done(null, user.toJSON());
    } else {
      done(new _ApiError.default("Authorization is not valid", 401, "authorizationvalid"));
    }
  } catch (err) {
    return done(err, false);
  }
}));
// app.use("/",(req,res)=>{
//     throw new ApiError("bir hata olştu",404,"somethingWrong")
//     res.json({
//         test:1
//     })
// })
const router = _express.default.Router();
_index.default.forEach((routeFn, index) => {
  routeFn(router);
});
_users.default.initializer();
app.use("/api", router);
app.all("/test-auth", _Session.default, (req, res) => {
  res.json({
    test: true
  });
});
app.use(_GenericErrorhandler.default);
if (process.env.HTTPS_ENABLED == "true") {
  const key = _fs.default.readFileSync(_path.default.join(__dirname, "./certs/key.pem")).toString();
  const cert = _fs.default.readFileSync(_path.default.join(__dirname, "./certs/cert.pem")).toString();
  const server = _https.default.createServer({
    key: key,
    cert: cert
  }, app);
  server.listen(process.env.PORT, () => {
    console.log("Listen" + process.env.PORT);
  });
} else {
  app.listen(process.env.PORT, () => {
    console.log("Listen" + process.env.PORT);
  });
}