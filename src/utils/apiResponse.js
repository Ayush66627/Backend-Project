class apiResponse {
    constructor(
        statusCode,
        message = "Success",
        data = [],

    ){
        this.data = data
        this.message = message
        this.statusCode = statusCode
        this.success = statusCode < 400;
    }
}