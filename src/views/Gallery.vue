<template>
  <div class="gallery-page">
    <!-- 顶部操作栏 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-top">
        <div class="title-section">
          <h1 class="page-title">图库</h1>
          <div class="stats">
            <span class="stat">{{ files.length }} 个文件</span>
            <span class="stat-divider"></span>
            <span class="stat">{{ files.filter((f) => f.isImage).length }} 张图片</span>
            <template v-if="selectionMode">
              <span class="stat-divider"></span>
              <span class="stat highlight">已选 {{ selectedCount }}</span>
            </template>
          </div>
        </div>
        <div class="actions">
          <el-select
            v-model="selectedBucket"
            placeholder="选择存储桶"
            @change="handleBucketChange"
            :loading="loading"
            class="bucket-select"
          >
            <el-option
              v-for="bucket in buckets"
              :key="bucket.name"
              :label="bucket.name"
              :value="bucket.name"
            />
          </el-select>

          <template v-if="!selectionMode">
            <el-button type="primary" @click="openUploadDialog">
              <el-icon class="mr-1"><Upload /></el-icon>
              上传
            </el-button>
            <el-button @click="toggleSelectionMode">
              <el-icon class="mr-1"><Select /></el-icon>
              选择
            </el-button>
            <el-button @click="handleRefresh" :loading="loadingFiles" :icon="loadingFiles ? undefined : Refresh" circle />
          </template>

          <template v-if="selectionMode">
            <el-button type="primary" @click="toggleSelectAll">
              {{ isAllSelected ? '取消全选' : '全选' }}
            </el-button>
            <el-button type="danger" @click="handleBatchDelete" :disabled="selectedCount === 0">
              <el-icon class="mr-1"><Delete /></el-icon>
              删除 ({{ selectedCount }})
            </el-button>
            <el-button @click="toggleSelectionMode">取消</el-button>
          </template>
        </div>
      </div>
    </div>
  </div>

    <!-- 文件列表 -->
    <div v-loading="loadingFiles" class="content-area">
      <div v-if="groupedFiles.length === 0" class="empty-state">
        <div class="empty-content">
          <el-icon :size="64" color="#d4d4d8"><Picture /></el-icon>
          <p class="empty-text">暂无文件</p>
          <el-button type="primary" @click="openUploadDialog">
            <el-icon class="mr-1"><Plus /></el-icon>
            上传第一个文件
          </el-button>
        </div>
      </div>

      <div v-else class="file-groups">
        <div v-for="group in groupedFiles" :key="group.date" class="file-group">
          <div class="group-header">
            <span class="group-date">{{ group.date }}</span>
            <span class="group-count">{{ group.files.length }}</span>
          </div>
          <div class="files-grid">
            <div
              v-for="file in group.files"
              :key="file.name"
              :ref="(el) => setFileCardRef(el, file.name)"
              class="file-card"
              :class="{
                'is-selecting': selectionMode,
                'is-selected': selectedFiles.has(file.name),
              }"
              @click="handleCardClick(file)"
            >
              <!-- 选择指示器 -->
              <div
                v-if="selectionMode"
                class="select-checkbox"
                :class="{ checked: selectedFiles.has(file.name) }"
                @click.stop="toggleFileSelection(file.name)"
              >
                <el-icon v-if="selectedFiles.has(file.name)" :size="14">
                  <Check />
                </el-icon>
              </div>

              <!-- 预览区 -->
              <div class="preview-area">
                <template v-if="file.isImage">
                  <img
                    v-if="file.thumbnailUrl"
                    :src="file.thumbnailUrl"
                    :alt="file.name"
                    class="thumbnail"
                    loading="lazy"
                  />
                  <div v-else class="loading-thumb">
                    <el-icon :size="24" color="#d4d4d8"><Picture /></el-icon>
                  </div>
                </template>
                <div v-else class="file-type-icon">
                  <el-icon :size="36" color="#a1a1aa">
                    <component :is="getFileIcon(file.fileType)" />
                  </el-icon>
                  <span class="file-ext">{{ file.name.split('.').pop()?.toUpperCase() }}</span>
                </div>

                <!-- 悬停操作 -->
                <div v-if="!selectionMode" class="hover-actions">
                  <!-- <button class="action-btn" @click.stop="handlePreview(file)" title="复制地址"> -->
                  <button class="action-btn" @click.stop="handleCopy(file)" title="复制地址">
                    <el-icon :size="14"><DocumentCopy /></el-icon>
                  </button>
                  <button class="action-btn" @click.stop="handleDownload(file)" title="下载">
                    <el-icon :size="14"><Download /></el-icon>
                  </button>
                  <button class="action-btn danger" @click.stop="handleDelete(file)" title="删除">
                    <el-icon :size="14"><Delete /></el-icon>
                  </button>
                </div>
              </div>

              <!-- 文件信息 -->
              <div class="file-meta">
                <span class="file-name" :title="file.name">{{ file.name }}</span>
                <div class="file-details">
                  <span>{{ formatFileSize(file.size) }}</span>
                  <span>{{
                    new Date(file.lastModified).toLocaleTimeString('zh-CN', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 无限滚动哨兵元素 -->
        <div ref="loadMoreTrigger" class="load-more-trigger">
          <template v-if="loadingMore">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>正在加载...</span>
          </template>
          <template v-else-if="hasMore">
            <span class="load-hint">已加载 {{ files.length }} 个文件，滚动加载更多</span>
          </template>
          <template v-else>
            <span class="no-more">全部 {{ files.length }} 个文件已加载完成</span>
          </template>
        </div>
      </div>
    </div>

    <!-- 全屏预览 -->
    <Teleport to="body">
      <transition name="preview-fade">
        <div v-if="previewVisible" class="preview-modal" @click="closePreview">
          <button class="preview-close" @click="closePreview">
            <el-icon :size="24"><Close /></el-icon>
          </button>

          <button
            v-if="hasPrevImage && previewFileType === 'image'"
            class="preview-nav prev"
            @click.stop="showPrevImage"
          >
            <el-icon :size="28"><ArrowLeft /></el-icon>
          </button>

          <button
            v-if="hasNextImage && previewFileType === 'image'"
            class="preview-nav next"
            @click.stop="showNextImage"
          >
            <el-icon :size="28"><ArrowRight /></el-icon>
          </button>

          <div class="preview-content" @click.stop>
            <template v-if="previewFileType === 'image'">
              <img
                :src="previewUrl"
                :alt="previewFileName"
                class="preview-img"
                :style="{ transform: imageTransform, cursor: imageScale > 1 ? 'grab' : 'default' }"
                @mousedown="handleMouseDown"
                draggable="false"
              />
            </template>
            <div v-else class="preview-file">
              <el-icon :size="80" color="rgba(255,255,255,0.6)">
                <component :is="getFileIcon(previewFileType)" />
              </el-icon>
              <el-button type="primary" size="large" @click="handleOpen">在新窗口打开</el-button>
            </div>
          </div>

          <div class="preview-info">
            <span class="preview-name">{{ previewFileName }}</span>
            <span v-if="previewFileType === 'image' && imageScale !== 1" class="preview-zoom">
              {{ Math.round(imageScale * 100) }}%
            </span>
          </div>
        </div>
      </transition>
    </Teleport>

    <!-- 上传对话框 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="上传文件"
      width="520px"
      :close-on-click-modal="false"
    >
      <div class="upload-area">
        <el-upload
          v-model:file-list="uploadFileList"
          drag
          multiple
          :auto-upload="false"
          :on-change="handleUploadChange"
          :on-remove="handleUploadRemove"
        >
          <div class="upload-dragger">
            <el-icon :size="40" color="#a1a1aa"><Upload /></el-icon>
            <p class="upload-text">拖拽文件到此处，或 <em>点击选择</em></p>
            <p class="upload-hint">文件将按 年/月/日/时间戳_文件名 格式存储</p>
          </div>
        </el-upload>
      </div>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          @click="handleUpload"
          :loading="uploading"
          :disabled="uploadFileList.length === 0"
        >
          {{ uploading ? '上传中...' : '开始上传' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {computed, nextTick, onMounted, onUnmounted, ref} from 'vue'
import type {UploadProps, UploadUserFile} from 'element-plus'
import {ElMessage, ElMessageBox} from 'element-plus'
import {useRouter} from 'vue-router'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Close,
  Delete,
  Document,
  DocumentCopy,
  Download,
  FolderOpened,
  Headset,
  Loading,
  Picture,
  Plus,
  Refresh,
  Select,
  Upload,
  VideoCamera,
} from '@element-plus/icons-vue'
import type {BucketInfo, FileObject} from '@/services/minio'
import {
  batchRemoveObjects,
  getPresignedUrl,
  initMinioClient,
  listBuckets,
  listObjectsPaginated,
  removeObject,
  uploadFile,
} from '@/services/minio'
import {getMinioConfig, hasMinioConfig} from '@/utils/storage'

const router = useRouter()

const buckets = ref<BucketInfo[]>([])
const selectedBucket = ref('')
const files = ref<FileWithUrl[]>([])
const loading = ref(false)
const loadingFiles = ref(false)

// 分页状态
const pageSize = 100
const nextToken = ref<string | undefined>()
const hasMore = ref(true)
const loadingMore = ref(false)

// 缓存结构
interface BucketCacheData {
  files: FileWithUrl[]
  nextToken?: string
  hasMore: boolean
}
const bucketCache = new Map<string, BucketCacheData>()

// 缩略图懒加载相关
const fileCardRefs = new Map<string, Element>()
let thumbnailObserver: IntersectionObserver | null = null
const loadingThumbnails = new Set<string>() // 防止重复加载

// 无限滚动相关
const loadMoreTrigger = ref<HTMLElement | null>(null)
let loadMoreObserver: IntersectionObserver | null = null

const previewVisible = ref(false)
const previewUrl = ref('')
const previewFileName = ref('')
const previewFileType = ref('')
const currentPreviewIndex = ref(0)
const imageScale = ref(1)
const imageTranslate = ref({ x: 0, y: 0 })
const isDragging = ref(false)
const dragStart = ref({ x: 0, y: 0 })

const uploadDialogVisible = ref(false)
const uploadFileList = ref<UploadUserFile[]>([])
const uploading = ref(false)

const selectionMode = ref(false)
const selectedFiles = ref<Set<string>>(new Set())

const hasNextImage = computed(() => currentPreviewIndex.value < files.value.length - 1)
const hasPrevImage = computed(() => currentPreviewIndex.value > 0)

const imageTransform = computed(() => {
  return `translate(${imageTranslate.value.x}px, ${imageTranslate.value.y}px) scale(${imageScale.value})`
})

const resetImageTransform = () => {
  imageScale.value = 1
  imageTranslate.value = { x: 0, y: 0 }
}

interface GroupedFiles {
  date: string
  files: FileWithUrl[]
}

interface FileWithUrl extends FileObject {
  thumbnailUrl?: string
  loading?: boolean
}

const handleOpen = () => {
  if (previewUrl.value) {
    window.open(previewUrl.value, '_blank', 'noopener,noreferrer')
  }
}

const groupedFiles = computed<GroupedFiles[]>(() => {
  const groups: Record<string, FileWithUrl[]> = {}

  files.value.forEach((file) => {
    const date = new Date(file.lastModified).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(file)
  })

  return Object.entries(groups)
    .map(([date, files]) => ({
      date,
      files: files.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime()),
    }))
    .sort((a, b) => {
      const dateA = new Date(a.files[0]?.lastModified || 0)
      const dateB = new Date(b.files[0]?.lastModified || 0)
      return dateB.getTime() - dateA.getTime()
    })
})

const selectedCount = computed(() => selectedFiles.value.size)

const isAllSelected = computed(() => {
  return files.value.length > 0 && selectedFiles.value.size === files.value.length
})

const getFileIcon = (fileType: string) => {
  const iconMap: Record<string, any> = {
    image: Picture,
    video: VideoCamera,
    audio: Headset,
    pdf: Document,
    word: Document,
    excel: Document,
    ppt: Document,
    text: Document,
    archive: FolderOpened,
    file: Document,
  }
  return iconMap[fileType] || Document
}

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

const loadBuckets = async () => {
  loading.value = true
  try {
    buckets.value = await listBuckets()
    if (buckets.value.length > 0 && buckets.value[0]) {
      selectedBucket.value = buckets.value[0].name
      await loadFiles()
    }
  } catch (error) {
    ElMessage.error('加载桶列表失败：' + (error as Error).message)
  } finally {
    loading.value = false
  }
}

const loadFiles = async (forceRefresh = false) => {
  if (!selectedBucket.value) return

  selectedFiles.value.clear()
  selectionMode.value = false

  // 检查缓存
  const cached = bucketCache.get(selectedBucket.value)
  if (!forceRefresh && cached) {
    files.value = cached.files
    nextToken.value = cached.nextToken
    hasMore.value = cached.hasMore
    // 缓存的数据也需要设置观察器（可能有未加载的缩略图）
    nextTick(() => {
      setupThumbnailObserver()
      setupLoadMoreObserver()
    })
    return
  }

  loadingFiles.value = true
  // 重置分页状态
  nextToken.value = undefined
  hasMore.value = true

  try {
    const result = await listObjectsPaginated(selectedBucket.value, pageSize)
    files.value = result.objects.map((file) => ({
      ...file,
      thumbnailUrl: undefined,
      loading: false,
    }))
    nextToken.value = result.nextToken
    hasMore.value = result.hasMore

    // 更新缓存
    bucketCache.set(selectedBucket.value, {
      files: [...files.value],
      nextToken: nextToken.value,
      hasMore: hasMore.value,
    })
    // 下一帧启动懒加载观察
    nextTick(() => {
      setupThumbnailObserver()
      setupLoadMoreObserver()
    })
  } catch (error) {
    ElMessage.error('加载文件列表失败：' + (error as Error).message)
  } finally {
    loadingFiles.value = false
  }
}

// 加载更多文件
const loadMoreFiles = async () => {
  if (!selectedBucket.value || !hasMore.value || loadingMore.value || !nextToken.value) return

  loadingMore.value = true

  try {
    const result = await listObjectsPaginated(selectedBucket.value, pageSize, nextToken.value)
    const newFiles = result.objects.map((file) => ({
      ...file,
      thumbnailUrl: undefined,
      loading: false,
    }))

    files.value = [...files.value, ...newFiles]
    nextToken.value = result.nextToken
    hasMore.value = result.hasMore

    // 更新缓存
    bucketCache.set(selectedBucket.value, {
      files: [...files.value],
      nextToken: nextToken.value,
      hasMore: hasMore.value,
    })

    // 提示用户新文件可能在上方（因为按时间排序）
    if (newFiles.length > 0) {
      ElMessage.success({
        message: `已加载 ${newFiles.length} 个文件（按时间排序，新内容可能在上方）`,
        duration: 2000,
      })
    }

    // 新文件需要设置缩略图观察
    nextTick(() => {
      setupThumbnailObserver()
    })
  } catch (error) {
    ElMessage.error('加载更多失败：' + (error as Error).message)
  } finally {
    loadingMore.value = false
  }
}

// 设置文件卡片的 ref
const setFileCardRef = (el: unknown, fileName: string) => {
  if (el instanceof Element) {
    fileCardRefs.set(fileName, el)
  } else {
    fileCardRefs.delete(fileName)
  }
}

// 加载单个缩略图
const loadSingleThumbnail = async (fileName: string) => {
  if (loadingThumbnails.has(fileName)) return

  const file = files.value.find(f => f.name === fileName)
  if (!file || !file.isImage || file.thumbnailUrl) return

  loadingThumbnails.add(fileName)
  file.loading = true

  try {
    file.thumbnailUrl = await getPresignedUrl(selectedBucket.value, fileName)
    // 更新缓存
    bucketCache.set(selectedBucket.value, {
      files: [...files.value],
      nextToken: nextToken.value,
      hasMore: hasMore.value,
    })
  } catch (error) {
    console.error(`加载缩略图失败 ${fileName}:`, error)
  } finally {
    file.loading = false
    loadingThumbnails.delete(fileName)
  }
}

// 设置 IntersectionObserver 懒加载
const setupThumbnailObserver = () => {
  // 清理旧的 observer
  if (thumbnailObserver) {
    thumbnailObserver.disconnect()
  }

  thumbnailObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const fileName = [...fileCardRefs.entries()]
            .find(([_, el]) => el === entry.target)?.[0]

          if (fileName) {
            loadSingleThumbnail(fileName)
            // 加载后取消观察
            thumbnailObserver?.unobserve(entry.target)
          }
        }
      })
    },
    {
      rootMargin: '100px', // 提前 100px 开始加载
      threshold: 0.1,
    }
  )

  // 观察所有图片文件卡片
  fileCardRefs.forEach((el, fileName) => {
    const file = files.value.find(f => f.name === fileName)
    if (file?.isImage && !file.thumbnailUrl) {
      thumbnailObserver?.observe(el)
    }
  })
}

// 设置无限滚动观察器
const setupLoadMoreObserver = () => {
  // 清理旧的 observer
  if (loadMoreObserver) {
    loadMoreObserver.disconnect()
  }

  if (!loadMoreTrigger.value) return

  loadMoreObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && hasMore.value && !loadingMore.value) {
          loadMoreFiles()
        }
      })
    },
    {
      rootMargin: '200px', // 提前 200px 开始加载
      threshold: 0.1,
    }
  )

  loadMoreObserver.observe(loadMoreTrigger.value)
}

const handleBucketChange = async () => {
  await loadFiles()
}

const handleRefresh = async () => {
  await loadFiles(true)
}

const handleCopy = async (file: FileObject) => {
  try {
    // 获取当前配置，构建直接 URL（公开桶不需要签名参数）
    const config = getMinioConfig()
    if (!config) {
      ElMessage.error('未找到配置')
      return
    }
    const protocol = config.useSSL ? 'https' : 'http'
    // 标准端口不显示（443 for https, 80 for http）
    const isDefaultPort = (config.useSSL && config.port === 443) || (!config.useSSL && config.port === 80)
    const portPart = isDefaultPort ? '' : `:${config.port}`
    const url = `${protocol}://${config.endpoint}${portPart}/${selectedBucket.value}/${file.name}`
    // 获取文件名（不含路径）
    const fileName = file.name.split('/').pop() || file.name
    // 生成 Markdown 格式链接
    const markdown = file.isImage
      ? `![${fileName}](${url})`
      : `[${fileName}](${url})`
    await navigator.clipboard.writeText(markdown)
    ElMessage.success('已复制 Markdown 链接')
  } catch (error) {
    ElMessage.error('复制失败：' + (error as Error).message)
  }
}

const handlePreview = async (file: FileObject) => {
  if (selectionMode.value) return
  try {
    const index = files.value.findIndex((f) => f.name === file.name)
    if (index !== -1) {
      currentPreviewIndex.value = index
    }
    previewUrl.value = await getPresignedUrl(selectedBucket.value, file.name)
    previewFileName.value = file.name
    previewFileType.value = file.fileType
    previewVisible.value = true
    document.body.style.overflow = 'hidden'
  } catch (error) {
    ElMessage.error('获取预览链接失败：' + (error as Error).message)
  }
}

const closePreview = () => {
  previewVisible.value = false
  previewUrl.value = ''
  previewFileName.value = ''
  previewFileType.value = ''
  resetImageTransform()

  document.body.style.overflow = ''
}

const showNextImage = async () => {
  if (!hasNextImage.value) return

  currentPreviewIndex.value++
  const nextFile = files.value[currentPreviewIndex.value]
  resetImageTransform()

  if (nextFile) {
    try {
      const url = await getPresignedUrl(selectedBucket.value, nextFile.name)
      previewUrl.value = url
      previewFileName.value = nextFile.name
      previewFileType.value = nextFile.fileType
    } catch (error) {
      ElMessage.error('加载下一张失败')
    }
  }
}

const showPrevImage = async () => {
  if (!hasPrevImage.value) return

  currentPreviewIndex.value--
  const prevFile = files.value[currentPreviewIndex.value]
  resetImageTransform()

  if (prevFile) {
    try {
      const url = await getPresignedUrl(selectedBucket.value, prevFile.name)
      previewUrl.value = url
      previewFileName.value = prevFile.name
      previewFileType.value = prevFile.fileType
    } catch (error) {
      ElMessage.error('加载上一张失败')
    }
  }
}

const handleWheel = (event: WheelEvent) => {
  if (!previewVisible.value || previewFileType.value !== 'image') return

  if (event.ctrlKey || event.metaKey) {
    event.preventDefault()

    const delta = event.deltaY > 0 ? -0.1 : 0.1
    const newScale = Math.max(0.5, Math.min(5, imageScale.value + delta))
    imageScale.value = newScale
  }
}

const handleMouseDown = (event: MouseEvent) => {
  if (imageScale.value <= 1) return

  isDragging.value = true
  dragStart.value = {
    x: event.clientX - imageTranslate.value.x,
    y: event.clientY - imageTranslate.value.y,
  }
}

const handleMouseMove = (event: MouseEvent) => {
  if (!isDragging.value) return

  const newX = event.clientX - dragStart.value.x
  const newY = event.clientY - dragStart.value.y

  const maxOffset = Math.max(window.innerWidth, window.innerHeight) * 1.5

  imageTranslate.value = {
    x: Math.max(-maxOffset, Math.min(maxOffset, newX)),
    y: Math.max(-maxOffset, Math.min(maxOffset, newY)),
  }
}

const handleMouseUp = () => {
  isDragging.value = false
}

const handlePreviewKeydown = (event: KeyboardEvent) => {
  if (!previewVisible.value) return

  if (event.key === 'ArrowRight') {
    showNextImage()
  } else if (event.key === 'ArrowLeft') {
    showPrevImage()
  } else if (event.key === 'Escape') {
    closePreview()
  }
}

onMounted(async () => {
  if (!hasMinioConfig()) {
    ElMessage.warning('请先配置 MinIO 连接信息')
    await router.push('/settings')
    return
  }

  const config = getMinioConfig()
  if (config) {
    initMinioClient(config)
    await loadBuckets()
  }

  window.addEventListener('keydown', handlePreviewKeydown)
  window.addEventListener('wheel', handleWheel, { passive: false })
  window.addEventListener('mousemove', handleMouseMove)
  window.addEventListener('mouseup', handleMouseUp)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handlePreviewKeydown)
  window.removeEventListener('wheel', handleWheel)
  window.removeEventListener('mousemove', handleMouseMove)
  window.removeEventListener('mouseup', handleMouseUp)
  document.body.style.overflow = ''

  // 清理 IntersectionObserver
  if (thumbnailObserver) {
    thumbnailObserver.disconnect()
    thumbnailObserver = null
  }
  if (loadMoreObserver) {
    loadMoreObserver.disconnect()
    loadMoreObserver = null
  }
  fileCardRefs.clear()
  loadingThumbnails.clear()
})

const handleDownload = async (file: FileObject) => {
  try {
    const url = await getPresignedUrl(selectedBucket.value, file.name)
    const link = document.createElement('a')
    link.href = url
    link.download = file.name
    link.click()
  } catch (error) {
    ElMessage.error('下载失败：' + (error as Error).message)
  }
}

const handleDelete = async (file: FileObject) => {
  try {
    await ElMessageBox.confirm(`确定要删除文件 "${file.name}" 吗？`, '删除确认', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning',
    })

    await removeObject(selectedBucket.value, file.name)
    ElMessage.success('删除成功')
    bucketCache.delete(selectedBucket.value) // 清除缓存
    await loadFiles(true)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + (error as Error).message)
    }
  }
}

const openUploadDialog = () => {
  if (!selectedBucket.value) {
    ElMessage.warning('请先选择一个桶')
    return
  }
  uploadDialogVisible.value = true
  uploadFileList.value = []
}

const handleUploadChange: UploadProps['onChange'] = (_uploadFile, uploadFiles) => {
  uploadFileList.value = uploadFiles
}

const handleUploadRemove: UploadProps['onRemove'] = (_uploadFile, uploadFiles) => {
  uploadFileList.value = uploadFiles
}

const handleUpload = async () => {
  if (uploadFileList.value.length === 0) {
    ElMessage.warning('请先选择要上传的文件')
    return
  }

  uploading.value = true
  try {
    for (const uploadFileItem of uploadFileList.value) {
      if (uploadFileItem.raw) {
        await uploadFile(selectedBucket.value, uploadFileItem.raw)
      }
    }
    ElMessage.success('上传成功')
    uploadDialogVisible.value = false
    uploadFileList.value = []
    bucketCache.delete(selectedBucket.value) // 清除缓存
    await loadFiles(true)
  } catch (error) {
    ElMessage.error('上传失败：' + (error as Error).message)
  } finally {
    uploading.value = false
  }
}

const toggleSelectionMode = () => {
  selectionMode.value = !selectionMode.value
  if (!selectionMode.value) {
    selectedFiles.value.clear()
  }
}

const toggleFileSelection = (fileName: string) => {
  if (selectedFiles.value.has(fileName)) {
    selectedFiles.value.delete(fileName)
  } else {
    selectedFiles.value.add(fileName)
  }
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedFiles.value.clear()
  } else {
    files.value.forEach((file) => {
      selectedFiles.value.add(file.name)
    })
  }
}

const handleBatchDelete = async () => {
  if (selectedFiles.value.size === 0) {
    ElMessage.warning('请先选择要删除的文件')
    return
  }

  try {
    await ElMessageBox.confirm(
      `确定要删除选中的 ${selectedFiles.value.size} 个文件吗？`,
      '批量删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    const fileNames = Array.from(selectedFiles.value)
    await batchRemoveObjects(selectedBucket.value, fileNames)
    ElMessage.success('批量删除成功')
    bucketCache.delete(selectedBucket.value) // 清除缓存
    await loadFiles(true)
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('批量删除失败：' + (error as Error).message)
    }
  }
}

const handleCardClick = (file: FileObject) => {
  if (selectionMode.value) {
    toggleFileSelection(file.name)
  } else {
    handlePreview(file)
  }
}
</script>

<style scoped lang="scss">
.gallery-page {
  min-height: 100%;
}

// 头部 - 亚克力毛玻璃效果
.page-header {
  position: sticky;
  top: 0;
  z-index: 100;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
}

.header-content {
  max-width: 1440px;
  margin: 0 auto;
  padding: 12px 24px;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.title-section {
  display: flex;
  align-items: baseline;
  gap: 16px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #18181b;
  margin: 0;
  letter-spacing: -0.02em;
}

.stats {
  display: flex;
  align-items: center;
  gap: 12px;

  .stat {
    font-size: 14px;
    color: #71717a;

    &.highlight {
      color: #0ea5e9;
      font-weight: 500;
    }
  }

  .stat-divider {
    width: 4px;
    height: 4px;
    border-radius: 50%;
    background-color: #d4d4d8;
  }
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;

  .bucket-select {
    width: 180px;
  }

  .mr-1 {
    margin-right: 4px;
  }
}

// 内容区
.content-area {
  min-height: 400px;
  max-width: 1440px;
  margin: 0 auto;
  padding: 24px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  background: white;
  border-radius: 16px;
  border: 1px solid #e4e4e7;
}

.empty-content {
  text-align: center;

  .empty-text {
    margin: 16px 0 24px;
    font-size: 15px;
    color: #71717a;
  }
}

// 文件分组
.file-groups {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.file-group {
  .group-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
    padding-bottom: 12px;
    border-bottom: 1px solid #e4e4e7;
  }

  .group-date {
    font-size: 15px;
    font-weight: 600;
    color: #18181b;
  }

  .group-count {
    font-size: 12px;
    color: #71717a;
    background-color: #f4f4f5;
    padding: 2px 8px;
    border-radius: 10px;
  }
}

// 无限滚动加载更多
.load-more-trigger {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 24px;
  color: #71717a;
  font-size: 14px;

  .is-loading {
    animation: rotating 1.5s linear infinite;
  }

  .load-hint {
    color: #a1a1aa;
  }

  .no-more {
    color: #a1a1aa;
    padding: 8px 16px;
    background: #f4f4f5;
    border-radius: 16px;
  }
}

@keyframes rotating {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.files-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

// 文件卡片
.file-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  border: 1px solid #e4e4e7;
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;

  &:hover {
    border-color: #d4d4d8;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);

    .hover-actions {
      opacity: 1;
    }
  }

  &.is-selecting {
    &:hover {
      border-color: #0ea5e9;
    }
  }

  &.is-selected {
    border-color: #0ea5e9;
    box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.2);
  }
}

.select-checkbox {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
  width: 22px;
  height: 22px;
  border-radius: 6px;
  background: white;
  border: 2px solid #d4d4d8;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

  &:hover {
    border-color: #0ea5e9;
  }

  &.checked {
    background: #0ea5e9;
    border-color: #0ea5e9;
    color: white;
  }
}

.preview-area {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  background: #f4f4f5;
  overflow: hidden;

  .thumbnail {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .loading-thumb {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #a1a1aa;
  }

  .file-type-icon {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;

    .file-ext {
      font-size: 11px;
      font-weight: 600;
      color: #71717a;
      background: #e4e4e7;
      padding: 2px 6px;
      border-radius: 4px;
    }
  }
}

.hover-actions {
  position: absolute;
  left: calc(50% - 44px);
  bottom: 8px;
  display: flex;
  align-items: center;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.action-btn {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: none;
  background: rgba(255, 255, 255, 0.95);
  color: #18181b;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);

  &:hover {
    background: white;
    transform: scale(1.1);
  }

  &.danger:hover {
    background: #fef2f2;
    color: #ef4444;
  }
}

.file-meta {
  padding: 12px;

  .file-name {
    display: block;
    font-size: 13px;
    font-weight: 500;
    color: #18181b;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    margin-bottom: 4px;
  }

  .file-details {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    color: #a1a1aa;
  }
}

// 预览模态框
.preview-modal {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.95);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: zoom-out;
}

.preview-close {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

.preview-nav {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  z-index: 10;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  &.prev {
    left: 20px;
  }

  &.next {
    right: 20px;
  }
}

.preview-content {
  cursor: default;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 60px;
}

.preview-img {
  max-width: 90vw;
  max-height: 85vh;
  object-fit: contain;
  border-radius: 4px;
  transition: transform 0.1s ease-out;
  user-select: none;
}

.preview-file {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.preview-info {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 10;
}

.preview-name {
  padding: 8px 16px;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(8px);
  border-radius: 8px;
  color: white;
  font-size: 13px;
  max-width: 60vw;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.preview-zoom {
  padding: 6px 12px;
  background: rgba(14, 165, 233, 0.8);
  border-radius: 6px;
  color: white;
  font-size: 12px;
  font-weight: 500;
}

// 动画
.preview-fade-enter-active,
.preview-fade-leave-active {
  transition: opacity 0.25s ease;
}

.preview-fade-enter-from,
.preview-fade-leave-to {
  opacity: 0;
}

// 上传区域
.upload-area {
  .upload-dragger {
    padding: 40px 20px;
    text-align: center;

    .upload-text {
      margin-top: 16px;
      font-size: 14px;
      color: #71717a;

      em {
        color: #0ea5e9;
        font-style: normal;
      }
    }

    .upload-hint {
      margin-top: 8px;
      font-size: 12px;
      color: #a1a1aa;
    }
  }
}

// 响应式
@media (max-width: 768px) {
  .gallery-page {
    padding: 16px;
  }

  .header-top {
    flex-direction: column;
    align-items: flex-start;
  }

  .actions {
    width: 100%;
    flex-wrap: wrap;

    .bucket-select {
      width: 100%;
    }
  }

  .files-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;
  }
}
</style>
