import cloudinary from "cloudinary";


// Configure Cloudinary with API key
cloudinary.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export const uploadImagesToCloudinary = async (images: string[]) => {
    try {
        // Process each image individually and collect results
        const uploadPromises = images.map(async (base64Image) => {
            const uploadResult = await cloudinary.v2.uploader.upload(base64Image, {
                resource_type: "image",
            });
            
            // Return just the URL from the result
            return uploadResult.secure_url;
        });
        
        // Wait for all uploads to complete
        const uploadedImageUrls = await Promise.all(uploadPromises);
        return uploadedImageUrls;
    } catch (error) {
        console.error("Error uploading images to Cloudinary:", error);
        throw new Error("Failed to upload images to Cloudinary");
    }
}

export const uploadPdfToCloudinary = async (pdfBuffer: Buffer): Promise<string> => {
    try {
        // Upload PDF file to Cloudinary using a promise for stream handling
        const data = await new Promise<any>((resolve, reject) => {
            const uploadStream = cloudinary.v2.uploader.upload_stream(
                {
                    resource_type: "raw",
                    format: "pdf"
                },
                (error, result) => {
                    if (error || !result) {
                        console.error("Error uploading PDF to Cloudinary:", error);
                        reject(new Error("Failed to upload PDF to Cloudinary"));
                        return;
                    }
                    resolve(result);
                }
            );
            
            uploadStream.end(pdfBuffer);
        });

        return data.secure_url;
    } catch (error) {
        console.error("Error uploading PDF to Cloudinary:", error);
        console.log("Cloudinary upload failed", error);
        throw new Error("Failed to upload PDF to Cloudinary");
    }
}