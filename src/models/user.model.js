import mongoose, {Schema} from mongoose
import jwt from "jsonwebtoken"
import bcrypt from "bcrypt"


const userSchema = new Schema({
   username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true
   },

   email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
   },

   fullName: {
    type: String,
    required: true,
    trim: true,
    index: true,
   },

   password: {
    type: String,
    required: [true, "Password is required"],
    unique: true,
   },

   avatar: {
    type: String,
    required: true,
   },

   coverImage: {
     type: String,
     required: true
   },

   watchHistory: [
   { 
       type: Schema.Types.ObjectId,
       ref: "VIDEO"
    }],
    
   rfreshTToken: {
      type: String
   }

}, {timestamps: true})

userSchema.pre("save", async function(next) {
    if(!this.isMOdified("password")) {
       return next()
    }
    this.password = bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.ispasswordMatch = async function(password) {
   return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function(){
   return jwt.sign(
        {
            _id: this._id,
            username: this.username,
            email: this.email,
            fullName: this.fullname,
        },
        process.env.ACCES_TOKEN_SECRET,
        {expiresIn: process.env.ACCES_TOKEN_EXPIRY }
    )
}
userSchema.methods.generateRefreshToken = function(){
   return jwt.sign(
        {
            _id: this._id,
        },
        process.env.REFRESH_TOKEN_SECRET,
        {expiresIn: process.env.REFRESH_TOKEN_EXPIRY }
    )
}

export const USER = mongoose.model("USER", userSchema)