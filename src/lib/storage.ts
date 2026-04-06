import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { randomUUID } from 'crypto'

const s3 = new S3Client({
  region: process.env.STORAGE_REGION ?? 'auto',
  endpoint: process.env.STORAGE_ENDPOINT,
  credentials: {
    accessKeyId: process.env.STORAGE_ACCESS_KEY_ID!,
    secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = process.env.STORAGE_BUCKET_NAME!
const PUBLIC_URL = process.env.NEXT_PUBLIC_STORAGE_PUBLIC_URL!

export async function uploadAudio(
  buffer: Buffer,
  userId: string,
  format: 'mp3' | 'opus' | 'aac' | 'flac' = 'mp3'
): Promise<{ key: string; url: string }> {
  const key = `audio/${userId}/${randomUUID()}.${format}`
  const contentTypeMap = {
    mp3: 'audio/mpeg',
    opus: 'audio/ogg',
    aac: 'audio/aac',
    flac: 'audio/flac',
  }
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: contentTypeMap[format],
      Metadata: { userId },
    })
  )
  return { key, url: `${PUBLIC_URL}/${key}` }
}

export async function uploadVoiceSample(
  buffer: Buffer,
  userId: string,
  filename: string
): Promise<string> {
  const ext = filename.split('.').pop() ?? 'wav'
  const key = `voice-samples/${userId}/${randomUUID()}.${ext}`
  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: `audio/${ext}`,
    })
  )
  return key
}

export async function getPresignedDownloadUrl(key: string, expiresIn = 3600): Promise<string> {
  return getSignedUrl(
    s3,
    new GetObjectCommand({ Bucket: BUCKET, Key: key }),
    { expiresIn }
  )
}

export async function deleteObject(key: string): Promise<void> {
  await s3.send(new DeleteObjectCommand({ Bucket: BUCKET, Key: key }))
}
