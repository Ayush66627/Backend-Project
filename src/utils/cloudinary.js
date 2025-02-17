import {v2 as cloud} from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const upload = async (file) => {
    try {
        if(!file){
            return null;
          const response = await cloudinary.uploader.upload(file, {
                resource_type: "auto",
            });
        }
           console.log("File uploaded successfully", response.url);
           return response.url;
    } catch (error) {
        fs.unlinkSync(file);
        return null;
    }
}

export default upload;