import CryptoJS from 'crypto-js'

const STORAGE_KEY = 'minio_configs'
const SECRET_KEY = 'minio-view-secret-key-2024'

// 基础配置（用于连接测试等）
export interface MinioConfigBase {
  endpoint: string
  port: number
  useSSL: boolean
  accessKey: string
  secretKey: string
}

// 完整配置（包含元数据）
export interface MinioConfig extends MinioConfigBase {
  id: string
  name: string
  createdAt: number
  updatedAt: number
}

interface ConfigStorage {
  configs: MinioConfig[]
  activeId: string | null
}

/**
 * 生成唯一 ID
 */
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * 获取存储数据
 */
function getStorage(): ConfigStorage {
  try {
    const encrypted = localStorage.getItem(STORAGE_KEY)
    if (!encrypted) return { configs: [], activeId: null }

    const decrypted = CryptoJS.AES.decrypt(encrypted, SECRET_KEY).toString(CryptoJS.enc.Utf8)
    if (!decrypted) return { configs: [], activeId: null }

    return JSON.parse(decrypted) as ConfigStorage
  } catch (error) {
    console.error('读取配置失败:', error)
    return { configs: [], activeId: null }
  }
}

/**
 * 保存存储数据
 */
function setStorage(storage: ConfigStorage): void {
  try {
    const encrypted = CryptoJS.AES.encrypt(JSON.stringify(storage), SECRET_KEY).toString()
    localStorage.setItem(STORAGE_KEY, encrypted)
  } catch (error) {
    console.error('保存配置失败:', error)
    throw new Error('保存配置失败')
  }
}

/**
 * 获取所有配置
 */
export function getAllConfigs(): MinioConfig[] {
  return getStorage().configs
}

/**
 * 获取当前激活的配置
 */
export function getActiveConfig(): MinioConfig | null {
  const storage = getStorage()
  if (!storage.activeId) return null
  return storage.configs.find(c => c.id === storage.activeId) || null
}

/**
 * 获取当前激活的配置 ID
 */
export function getActiveConfigId(): string | null {
  return getStorage().activeId
}

/**
 * 设置激活的配置
 */
export function setActiveConfig(id: string): void {
  const storage = getStorage()
  const config = storage.configs.find(c => c.id === id)
  if (!config) throw new Error('配置不存在')
  storage.activeId = id
  setStorage(storage)
}

/**
 * 添加新配置
 */
export function addConfig(config: Omit<MinioConfig, 'id' | 'createdAt' | 'updatedAt'>): MinioConfig {
  const storage = getStorage()
  const now = Date.now()
  const newConfig: MinioConfig = {
    ...config,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }
  storage.configs.push(newConfig)
  // 如果是第一个配置，自动激活
  if (storage.configs.length === 1) {
    storage.activeId = newConfig.id
  }
  setStorage(storage)
  return newConfig
}

/**
 * 更新配置
 */
export function updateConfig(id: string, updates: Partial<Omit<MinioConfig, 'id' | 'createdAt'>>): MinioConfig {
  const storage = getStorage()
  const index = storage.configs.findIndex(c => c.id === id)
  if (index === -1) throw new Error('配置不存在')

  const existing = storage.configs[index]!
  const updated: MinioConfig = {
    id: existing.id,
    name: updates.name ?? existing.name,
    endpoint: updates.endpoint ?? existing.endpoint,
    port: updates.port ?? existing.port,
    useSSL: updates.useSSL ?? existing.useSSL,
    accessKey: updates.accessKey ?? existing.accessKey,
    secretKey: updates.secretKey ?? existing.secretKey,
    createdAt: existing.createdAt,
    updatedAt: Date.now(),
  }
  storage.configs[index] = updated
  setStorage(storage)
  return updated
}

/**
 * 删除配置
 */
export function deleteConfig(id: string): void {
  const storage = getStorage()
  const index = storage.configs.findIndex(c => c.id === id)
  if (index === -1) throw new Error('配置不存在')

  storage.configs.splice(index, 1)

  // 如果删除的是当前激活的配置，切换到第一个
  if (storage.activeId === id) {
    storage.activeId = storage.configs[0]?.id || null
  }
  setStorage(storage)
}

/**
 * 检查是否有配置
 */
export function hasMinioConfig(): boolean {
  const storage = getStorage()
  return storage.configs.length > 0 && storage.activeId !== null
}

/**
 * 获取当前配置（兼容旧 API）
 */
export function getMinioConfig(): MinioConfig | null {
  return getActiveConfig()
}

/**
 * 清除所有配置
 */
export function clearAllConfigs(): void {
  localStorage.removeItem(STORAGE_KEY)
}
