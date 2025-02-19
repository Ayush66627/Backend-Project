import asyncHandler from "../utils/asyncHandler.js";
import apiError from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import ApiResponse from "../utils/apiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  const { fullName, username, email, password } = req.body;
  console.log("email: ", email);

  if (
    [fullName, username, email, password].some((field) => field?.trim() === "")
  ) {
    throw new apiError("All fields are required", 400);
  }

  if (email.includes("@") === false) {
    throw new apiError("Invalid email", 400);
  }

  const existedUser = User.findOne({
    $or: [{ email }, { username }],
  });
  console.log("existedUser: ", existedUser);

  if (existedUser) {
    throw new apiError("User already exists", 409);
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  console.log("avatar: ", avatarLocalPath);

  const coverImageLocalPath = req.files?.coverImage[0]?.path;
  console.log("coverImage: ", coverImageLocalPath);

  if (!avatarLocalPath) {
    throw new apiError("Avatar is required", 400);
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new apiError("Avatar is required", 400);
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

    return status(201).json(
        new ApiResponse(200, "User registered successfully", createdUser)
    )

});

export default registerUser;
