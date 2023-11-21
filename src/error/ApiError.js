class ApiError extends Error{
    constructor(message,status=500,code){
        super(message);
        this.status=status;
        this.name=this.constructor.name;
        this.code=code;
        Error.captureStackTrace(this,this.constructor)
    }
}
export default ApiError;