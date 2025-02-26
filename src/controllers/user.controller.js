import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import  {User}  from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";


const generateAccessAndRefreshToken = async(userId) => {
    try {

    const user = await User.findById(userId);
     const refreshToken = user.generateRefreshToken();
     user.refreshToken = refreshToken;
     await user.save({validateBeforeSave: false});

     const accessToken = user.generateAccessToken();

     return { accessToken, refreshToken }

    } catch (error) {
      throw new apiError("Something went wrong while generating tokens", 500);
    }
}

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, username, email, password } = req.body;
  console.log("email: ", email);

  if (
    [fullName, username, email, password, ].some((field) => field?.trim() === "")
  ) {
    throw new apiError("All fields are required", 400);
  }

  if (email.includes("@") === false) {
    throw new apiError("Invalid email", 400);
  }

  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });
  console.log("existedUser: ", existedUser);

  if (existedUser) {
    throw new apiError("User already exists", 409);
  }

  // const avatarLocalPath = req.files?.avatar[0]?.path;
  // console.log("avatar: ", avatarLocalPath);

  let avatarLocalPath;
  if (req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
    avatarLocalPath = req.files.avatar[0].path;
  }

  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  // console.log("coverImage: ", coverImageLocalPath);

  let coverImageLocalPath;
  if (req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length > 0) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new apiError("Avatar is required", 400);
  }

  const avatar = avatarLocalPath?  await uploadOnCloudinary(avatarLocalPath): null;
  const coverImage =coverImageLocalPath? await uploadOnCloudinary(coverImageLocalPath): null;

  if (!avatar) {
    throw new apiError("Avatar is not upoded on cloudinary", 401);
  }

  const user = await User.create({
        fullName,
        username: username.toLowerCase(),
        email,
        password,
        avatar: avatar.url,
        coverImage: coverImage?.url || null,
   });

   const createdUser = await User.findById(user._id)
   .select("-password -refreshToken")

    if(!createdUser){
        throw new apiError("Something went wrong while registering the user", 500)
    }

     console.log("createdUser: ", createdUser);
     

    return res.status (201).json(
        new ApiResponse(200, "User registered successfully", createdUser)
    )
    
    

});

const loginUser = asyncHandler(async (req, res) => {
   
  const {email, username, password} = req.body

    if(!(username || email)){
        throw new apiError("Username or email is required", 400)
    }

   const user = await User.findOne({
      $or: [
      { email },
       { username }
      ],  
  })
      
  if(!user){
      throw new apiError("User not found", 404)
  }
   
   const isPasswordValid = await user.ispasswordMatch(password)

    if(!isPasswordValid){
      throw new apiError("Invalid password", 401)
    }
   
  const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id)

  const loggedInUser = await User.findById(user._id).select("-password -refreshToken")
   
   

  const options = {
    httpOnly: true,
    secure: true
  }

   return res
   .status(200)
   .cookie("refreshToken", refreshToken, options)
   .cookie("accessToken", accessToken, options)
   .json(
        new ApiResponse(200, {
           user: loggedInUser,
            accessToken,
            refreshToken,
            message: "User logged in successfully"
        }),
         
      )
      
})
    

const userLogout = asyncHandler(async(req, res) => {
  await User.findByIdAndUpdate(req.user._id, 
     {$set: {refreshToken: undefined, new: true}},
   )
   const options = {
    httpOnly: true,
    secure: true
  }
     return res.status(200)
     .clearCookie("accessToken", options)
     .clearCookie("refreshToken", options)
     .json(new ApiResponse(200, {}, "logged out"))
})

const refreshAccessToken = asyncHandler(async(req, res) => {
   const incomingrefreshToken = req.cookies.refreshToken || req.body.refreshToken

   if(!incomingrefreshToken){
     throw new apiError("Unauthorized Request", 401)
   }
try {
  
     const decodedToken = jwt.verify(incomingrefreshToken, process.env.REFRESH_TOKEN_SECRET)
  
     const user = await User.findById(decodedToken?._id)
  
     if(!user){
       throw new apiError("Invalid Refresh Token", 401)
     }
  
     if(incomingrefreshToken !== user?.refreshToken){
        throw new apiError("Expired Refresh Token", 401)
     }
  
       const options = 
        {
          httpOnly: true,
          secure: true
        }
  
     const {accessToken, newRefreshToken} = await generateAccessAndRefreshToken(user._id)
  
      return res
      .status(200)
      .cookie("refreshToken", newRefreshToken, options)
      .cookie("accessToken", accessToken, options)
      .json(
        new ApiResponse(200, {
          accessToken,
          refreshToken: newRefreshToken,
          message: "Token refreshed successfully"
        })
      )
 }
     catch (error) {
      console.log("error: ", error);
      
      throw new apiError("Invalid Refresh Token", 401)
  
}
})


export {loginUser, registerUser, userLogout, refreshAccessToken};
