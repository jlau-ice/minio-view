import CryptoJS from 'crypto-js'

const STORAGE_KEY = 'minio_config'
const SECRET_KEY = 'minio-view-secret-key-2024' // 在实际使用中可以让用户设置一个主密码

export interface MinioConfig {
  endpoint: string
  port: number
  useSSL: boolean
  accessKey: string
  secretKey: string
}

/**
 * 加密并保存 MinIO 配置
 */
export function saveMinioConfig(config: MinioConfig): void {
  try {
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(config),
      SECRET_KEY
    ).toString()
    localStorage.setItem(STORAGE_KEY, encrypted)
  } catch (error) {
    console.error('保存配置失败:', error)
    throw new Error('保存配置失败')
  }
}

/**
 * 读取并解密 MinIO 配置
 */
export function getMinioConfig(): MinioConfig | null {
  try {
    const encrypted = localStorage.getItem(STORAGE_KEY)
    if (!encrypted) return null

    const decrypted = CryptoJS.AES.decrypt(encrypted, SECRET_KEY).toString(
      CryptoJS.enc.Utf8
    )

    if (!decrypted) return null

    return JSON.parse(decrypted) as MinioConfig
  } catch (error) {
    console.error('读取配置失败:', error)
    return null
  }
}

/**
 * 清除 MinIO 配置
 */
export function clearMinioConfig(): void {
  localStorage.removeItem(STORAGE_KEY)
}

/**
 * 检查是否已配置
 */
export function hasMinioConfig(): boolean {
  return !!localStorage.getItem(STORAGE_KEY)
}
