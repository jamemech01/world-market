import { Injectable } from '@nestjs/common'
import { v2 as cloudinary } from 'cloudinary'

type UploadFile = {
  buffer: Buffer
}

@Injectable()
export class CloudinaryService {
  constructor() {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })
  }

  uploadImage(file: UploadFile) {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: 'world-market/products',
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        },
      )

      stream.end(file.buffer)
    })
  }
}