import {
  S3Client,
  ListBucketsCommand,
  ListObjectsV2Command,
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
} from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import type { MinioConfig } from '@/utils/storage'

export interface BucketInfo {
  name: string
  creationDate: Date
}

export interface FileObject {
  name: string
  lastModified: Date
  size: number
  etag: string
  isImage: boolean
  fileType: string
}

let s3Client: S3Client | null = null

/**
 * 初始化 S3 客户端
 */
export function initMinioClient(config: MinioConfig): S3Client {
  const endpoint = `${config.useSSL ? 'https' : 'http'}://${config.endpoint}:${config.port}`

  s3Client = new S3Client({
    endpoint,
    region: 'us-east-1',
    credentials: {
      accessKeyId: config.accessKey,
      secretAccessKey: config.secretKey,
    },
    forcePathStyle: true,
  })

  return s3Client
}

/**
 * 获取 S3 客户端
 */
export function getMinioClient(): S3Client {
  if (!s3Client) {
    throw new Error('MinIO 客户端未初始化')
  }
  return s3Client
}

/**
 * 测试连接
 */
export async function testConnection(config: MinioConfig): Promise<boolean> {
  try {
    const endpoint = `${config.useSSL ? 'https' : 'http'}://${config.endpoint}:${config.port}`

    const client = new S3Client({
      endpoint,
      region: 'us-east-1',
      credentials: {
        accessKeyId: config.accessKey,
        secretAccessKey: config.secretKey,
      },
      forcePathStyle: true,
    })

    await client.send(new ListBucketsCommand({}))
    return true
  } catch (error) {
    console.error('连接测试失败:', error)
    return false
  }
}

/**
 * 列举所有桶
 */
export async function listBuckets(): Promise<BucketInfo[]> {
  try {
    const client = getMinioClient()
    const response = await client.send(new ListBucketsCommand({}))

    if (!response.Buckets) {
      return []
    }

    return response.Buckets.map((bucket) => ({
      name: bucket.Name || '',
      creationDate: bucket.CreationDate || new Date(),
    })).filter(bucket => bucket.name)
  } catch (error) {
    console.error('获取桶列表失败:', error)
    throw new Error('获取桶列表失败')
  }
}

/**
 * 判断文件是否为图片
 */
function isImageFile(fileName: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg']
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
  return imageExtensions.includes(ext)
}

/**
 * 获取文件类型
 */
function getFileType(fileName: string): string {
  const ext = fileName.toLowerCase().substring(fileName.lastIndexOf('.') + 1)
  if (!ext) return 'unknown'

  const typeMap: Record<string, string> = {
    jpg: 'image',
    jpeg: 'image',
    png: 'image',
    gif: 'image',
    bmp: 'image',
    webp: 'image',
    svg: 'image',
    pdf: 'pdf',
    doc: 'word',
    docx: 'word',
    xls: 'excel',
    xlsx: 'excel',
    ppt: 'ppt',
    pptx: 'ppt',
    txt: 'text',
    zip: 'archive',
    rar: 'archive',
    '7z': 'archive',
    mp4: 'video',
    avi: 'video',
    mov: 'video',
    mp3: 'audio',
    wav: 'audio',
  }

  return typeMap[ext] || 'file'
}

/**
 * 列举桶中的文件
 */
export async function listObjects(bucketName: string): Promise<FileObject[]> {
  try {
    const client = getMinioClient()
    const objects: FileObject[] = []
    let continuationToken: string | undefined

    do {
      const response = await client.send(
        new ListObjectsV2Command({
          Bucket: bucketName,
          ContinuationToken: continuationToken,
        })
      )

      if (response.Contents) {
        response.Contents.forEach((obj) => {
          if (obj.Key) {
            objects.push({
              name: obj.Key,
              lastModified: obj.LastModified || new Date(),
              size: obj.Size || 0,
              etag: obj.ETag || '',
              isImage: isImageFile(obj.Key),
              fileType: getFileType(obj.Key),
            })
          }
        })
      }

      continuationToken = response.NextContinuationToken
    } while (continuationToken)

    return objects
  } catch (error) {
    console.error('获取文件列表失败:', error)
    throw new Error('获取文件列表失败')
  }
}

/**
 * 分页列举桶中的文件结果
 */
export interface ListObjectsResult {
  objects: FileObject[]
  nextToken?: string
  hasMore: boolean
}

/**
 * 分页列举桶中的文件
 */
export async function listObjectsPaginated(
  bucketName: string,
  pageSize: number = 100,
  continuationToken?: string
): Promise<ListObjectsResult> {
  try {
    const client = getMinioClient()

    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: bucketName,
        MaxKeys: pageSize,
        ContinuationToken: continuationToken,
      })
    )

    const objects: FileObject[] = []
    if (response.Contents) {
      response.Contents.forEach((obj) => {
        if (obj.Key) {
          objects.push({
            name: obj.Key,
            lastModified: obj.LastModified || new Date(),
            size: obj.Size || 0,
            etag: obj.ETag || '',
            isImage: isImageFile(obj.Key),
            fileType: getFileType(obj.Key),
          })
        }
      })
    }

    return {
      objects,
      nextToken: response.NextContinuationToken,
      hasMore: !!response.IsTruncated,
    }
  } catch (error) {
    console.error('获取文件列表失败:', error)
    throw new Error('获取文件列表失败')
  }
}

/**
 * 获取文件预签名 URL
 */
export async function getPresignedUrl(
  bucketName: string,
  objectName: string,
  expires = 3600
): Promise<string> {
  try {
    const client = getMinioClient()
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: objectName,
    })

    const url = await getSignedUrl(client, command, { expiresIn: expires })
    return url
  } catch (error) {
    console.error('获取预签名 URL 失败:', error)
    throw new Error('获取预签名 URL 失败')
  }
}

/**
 * 删除文件
 */
export async function removeObject(
  bucketName: string,
  objectName: string
): Promise<void> {
  try {
    const client = getMinioClient()
    await client.send(
      new DeleteObjectCommand({
        Bucket: bucketName,
        Key: objectName,
      })
    )
  } catch (error) {
    console.error('删除文件失败:', error)
    throw new Error('删除文件失败')
  }
}

/**
 * 上传文件
 */
export async function uploadFile(
  bucketName: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<void> {
  try {
    const client = getMinioClient()

    // 生成路径：年/月/日/timestamp_filename
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const timestamp = now.getTime()

    const path = `${year}/${month}/${day}/${timestamp}_${file.name}`

    const fileBuffer = await file.arrayBuffer()

    await client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: path,
        Body: new Uint8Array(fileBuffer),
        ContentType: file.type,
      })
    )

    if (onProgress) {
      onProgress(100)
    }
  } catch (error) {
    console.error('上传文件失败:', error)
    throw new Error('上传文件失败')
  }
}

/**
 * 批量删除文件
 */
export async function batchRemoveObjects(
  bucketName: string,
  objectNames: string[]
): Promise<void> {
  try {
    const client = getMinioClient()

    // AWS SDK 需要逐个删除
    for (const objectName of objectNames) {
      await client.send(
        new DeleteObjectCommand({
          Bucket: bucketName,
          Key: objectName,
        })
      )
    }
  } catch (error) {
    console.error('批量删除文件失败:', error)
    throw new Error('批量删除文件失败')
  }
}

