import {v2 as cloudinary} from "cloudinary"
import { log } from "console";

import fs from "fs"


cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET 
    });


    const uploadOnCloudinary = async function(localfilepath){
        try{
            if(!localfilepath) return null
           const response= await cloudinary.uploader.upload(localfilepath,{
                resource_type: "auto"
            })
            // console.log("file uploaded successfully on cloudinary",response.url);
             fs.unlinkSync(localfilepath)

            return response;

        } catch (error) {
    console.error("❌ Cloudinary upload error:", error.message);

    // Agar file exist karti ho toh hi delete karo
    if (fs.existsSync(localfilepath)) {
        fs.unlinkSync(localfilepath);
    }

    return null;
}

    }

export {uploadOnCloudinary}    

