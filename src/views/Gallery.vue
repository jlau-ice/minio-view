<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import {
  Delete,
  Download,
  ZoomIn,
  Picture,
  Document,
  VideoCamera,
  Headset,
  FolderOpened,
  Upload,
  Refresh,
  Plus,
  Select,
  CloseBold,
} from '@element-plus/icons-vue'
import type { BucketInfo, FileObject } from '@/services/minio'
import {
  listBuckets,
  listObjects,
  getPresignedUrl,
  removeObject,
  initMinioClient,
  uploadFile,
  batchRemoveObjects,
} from '@/services/minio'
import { getMinioConfig, hasMinioConfig } from '@/utils/storage'
import type { UploadProps, UploadUserFile } from 'element-plus'

const router = useRouter()

const buckets = ref<BucketInfo[]>([])
const selectedBucket = ref('')
const files = ref<FileWithUrl[]>([])
const loading = ref(false)
const loadingFiles = ref(false)

const previewVisible = ref(false)
const previewUrl = ref('')
const previewFileName = ref('')
const previewFileType = ref('')

const uploadDialogVisible = ref(false)
const uploadFileList = ref<UploadUserFile[]>([])
const uploading = ref(false)

// 批量选择相关
const selectionMode = ref(false)
const selectedFiles = ref<Set<string>>(new Set())

interface GroupedFiles {
  date: string
  files: FileWithUrl[]
}

interface FileWithUrl extends FileObject {
  thumbnailUrl?: string
  loading?: boolean
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
      files: files.sort(
        (a, b) => b.lastModified.getTime() - a.lastModified.getTime()
      ),
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
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

onMounted(async () => {
  if (!hasMinioConfig()) {
    ElMessage.warning('请先配置 MinIO 连接信息')
    router.push('/settings')
    return
  }

  const config = getMinioConfig()
  if (config) {
    initMinioClient(config)
    await loadBuckets()
  }
})

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

const loadFiles = async () => {
  if (!selectedBucket.value) return

  loadingFiles.value = true
  selectedFiles.value.clear()
  selectionMode.value = false

  try {
    const objectList = await listObjects(selectedBucket.value)
    files.value = objectList.map((file) => ({
      ...file,
      thumbnailUrl: undefined,
      loading: false,
    }))

    loadThumbnails()
  } catch (error) {
    ElMessage.error('加载文件列表失败：' + (error as Error).message)
  } finally {
    loadingFiles.value = false
  }
}

const loadThumbnails = async () => {
  for (const file of files.value) {
    if (file.isImage && !file.thumbnailUrl) {
      file.loading = true
      try {
        file.thumbnailUrl = await getPresignedUrl(selectedBucket.value, file.name)
      } catch (error) {
        console.error(`加载缩略图失败 ${file.name}:`, error)
      } finally {
        file.loading = false
      }
    }
  }
}

const handleBucketChange = async () => {
  await loadFiles()
}

const handlePreview = async (file: FileObject) => {
  if (selectionMode.value) return

  try {
    const url = await getPresignedUrl(selectedBucket.value, file.name)
    previewUrl.value = url
    previewFileName.value = file.name
    previewFileType.value = file.fileType
    previewVisible.value = true
  } catch (error) {
    ElMessage.error('获取预览链接失败：' + (error as Error).message)
  }
}

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
    await ElMessageBox.confirm(
      `确定要删除文件 "${file.name}" 吗？此操作不可恢复！`,
      '删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    await removeObject(selectedBucket.value, file.name)
    ElMessage.success('删除成功')
    await loadFiles()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败：' + (error as Error).message)
    }
  }
}

const closePreview = () => {
  previewVisible.value = false
  previewUrl.value = ''
  previewFileName.value = ''
  previewFileType.value = ''
}

const openUploadDialog = () => {
  if (!selectedBucket.value) {
    ElMessage.warning('请先选择一个桶')
    return
  }
  uploadDialogVisible.value = true
  uploadFileList.value = []
}

const handleUploadChange: UploadProps['onChange'] = (uploadFile, uploadFiles) => {
  uploadFileList.value = uploadFiles
}

const handleUploadRemove: UploadProps['onRemove'] = (uploadFile, uploadFiles) => {
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
    await loadFiles()
  } catch (error) {
    ElMessage.error('上传失败：' + (error as Error).message)
  } finally {
    uploading.value = false
  }
}

// 批量选择相关方法
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
    files.value.forEach(file => {
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
      `确定要删除选中的 ${selectedFiles.value.size} 个文件吗？此操作不可恢复！`,
      '批量删除确认',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    const fileNames = Array.from(selectedFiles.value)
    await batchRemoveObjects(selectedBucket.value, fileNames)
    ElMessage.success('批量删除成功')
    await loadFiles()
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

<template>
  <div class="gallery-container">
    <div class="header-section">
      <div class="header-content">
        <h1 class="page-title">图库</h1>
        <div class="header-actions">
          <el-select
            v-model="selectedBucket"
            placeholder="请选择桶"
            @change="handleBucketChange"
            :loading="loading"
            size="large"
            class="bucket-select"
          >
            <el-option
              v-for="bucket in buckets"
              :key="bucket.name"
              :label="bucket.name"
              :value="bucket.name"
            />
          </el-select>

          <el-button
            v-if="!selectionMode"
            type="primary"
            :icon="Upload"
            @click="openUploadDialog"
            size="large"
          >
            上传文件
          </el-button>

          <el-button
            v-if="!selectionMode"
            :icon="Select"
            @click="toggleSelectionMode"
            size="large"
          >
            批量选择
          </el-button>

          <template v-if="selectionMode">
            <el-button
              type="primary"
              @click="toggleSelectAll"
              size="large"
            >
              {{ isAllSelected ? '取消全选' : '全选' }}
            </el-button>
            <el-button
              type="danger"
              :icon="Delete"
              @click="handleBatchDelete"
              size="large"
              :disabled="selectedCount === 0"
            >
              删除选中 ({{ selectedCount }})
            </el-button>
            <el-button
              :icon="CloseBold"
              @click="toggleSelectionMode"
              size="large"
            >
              取消
            </el-button>
          </template>

          <el-button
            v-if="!selectionMode"
            :icon="Refresh"
            @click="loadFiles"
            :loading="loadingFiles"
            size="large"
          >
            刷新
          </el-button>
        </div>
      </div>
      <div class="stats-bar">
        <span class="stat-item">
          <span class="stat-label">总文件数：</span>
          <span class="stat-value">{{ files.length }}</span>
        </span>
        <span class="stat-item">
          <span class="stat-label">图片：</span>
          <span class="stat-value">{{ files.filter(f => f.isImage).length }}</span>
        </span>
        <span v-if="selectionMode" class="stat-item">
          <span class="stat-label">已选中：</span>
          <span class="stat-value selection">{{ selectedCount }}</span>
        </span>
      </div>
    </div>

    <div v-loading="loadingFiles" class="timeline-container">
      <div v-if="groupedFiles.length === 0" class="empty-state">
        <el-empty description="暂无文件">
          <el-button type="primary" @click="openUploadDialog" :icon="Plus">
            上传第一个文件
          </el-button>
        </el-empty>
      </div>

      <div v-else class="timeline">
        <div
          v-for="group in groupedFiles"
          :key="group.date"
          class="timeline-group"
        >
          <div class="timeline-date">
            <span class="date-text">{{ group.date }}</span>
            <span class="date-count">{{ group.files.length }} 个文件</span>
          </div>
          <div class="files-grid">
            <div
              v-for="file in group.files"
              :key="file.name"
              class="file-card"
              :class="{
                'selection-mode': selectionMode,
                'selected': selectedFiles.has(file.name)
              }"
              @click="handleCardClick(file)"
            >
              <!-- 选择框 -->
              <div v-if="selectionMode" class="selection-checkbox">
                <el-checkbox
                  :model-value="selectedFiles.has(file.name)"
                  @change="toggleFileSelection(file.name)"
                  @click.stop
                  size="large"
                />
              </div>

              <div class="file-preview">
                <div v-if="file.isImage" class="image-preview">
                  <img
                    v-if="file.thumbnailUrl"
                    :src="file.thumbnailUrl"
                    :alt="file.name"
                    class="thumbnail-image"
                  />
                  <div v-else class="loading-placeholder">
                    <el-icon class="is-loading">
                      <Picture />
                    </el-icon>
                  </div>
                  <div v-if="!selectionMode" class="preview-overlay">
                    <el-icon :size="32">
                      <ZoomIn />
                    </el-icon>
                  </div>
                </div>
                <div v-else class="icon-preview">
                  <el-icon :size="48" class="file-type-icon">
                    <component :is="getFileIcon(file.fileType)" />
                  </el-icon>
                  <div class="file-ext">{{ file.name.split('.').pop()?.toUpperCase() }}</div>
                </div>
              </div>

              <div class="file-info">
                <div class="file-name" :title="file.name">
                  {{ file.name }}
                </div>
                <div class="file-meta">
                  <span class="meta-item">
                    <el-icon><Document /></el-icon>
                    {{ formatFileSize(file.size) }}
                  </span>
                  <span class="meta-item">
                    {{
                      new Date(file.lastModified).toLocaleTimeString('zh-CN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })
                    }}
                  </span>
                </div>
              </div>

              <div v-if="!selectionMode" class="file-actions">
                <el-tooltip content="预览" placement="top">
                  <el-button
                    type="primary"
                    size="small"
                    :icon="ZoomIn"
                    @click.stop="handlePreview(file)"
                    circle
                  />
                </el-tooltip>
                <el-tooltip content="下载" placement="top">
                  <el-button
                    type="success"
                    size="small"
                    :icon="Download"
                    @click.stop="handleDownload(file)"
                    circle
                  />
                </el-tooltip>
                <el-tooltip content="删除" placement="top">
                  <el-button
                    type="danger"
                    size="small"
                    :icon="Delete"
                    @click.stop="handleDelete(file)"
                    circle
                  />
                </el-tooltip>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 预览对话框 -->
    <el-dialog
      v-model="previewVisible"
      :title="previewFileName"
      width="90%"
      @close="closePreview"
      class="preview-dialog"
    >
      <div class="preview-content">
        <img
          v-if="previewFileType === 'image'"
          :src="previewUrl"
          :alt="previewFileName"
          class="preview-image"
        />
        <div v-else class="preview-other">
          <el-icon :size="80" class="file-icon">
            <component :is="getFileIcon(previewFileType)" />
          </el-icon>
          <p class="file-name-text">{{ previewFileName }}</p>
          <el-button type="primary" @click="window.open(previewUrl, '_blank')">
            在新窗口打开
          </el-button>
        </div>
      </div>
    </el-dialog>

    <!-- 上传对话框 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="上传文件"
      width="600px"
      :close-on-click-modal="false"
    >
      <div class="upload-container">
        <el-alert
          title="文件存储规则"
          type="info"
          :closable="false"
          class="mb-4"
        >
          文件将按照 <strong>年/月/日/时间戳_文件名</strong> 的格式存储<br />
          例如：2026/01/17/1737202800000_image.jpg
        </el-alert>
        <el-upload
          v-model:file-list="uploadFileList"
          drag
          multiple
          :auto-upload="false"
          :on-change="handleUploadChange"
          :on-remove="handleUploadRemove"
        >
          <el-icon class="el-icon--upload"><Upload /></el-icon>
          <div class="el-upload__text">
            将文件拖到此处，或<em>点击选择</em>
          </div>
          <template #tip>
            <div class="el-upload__tip">支持任意类型的文件</div>
          </template>
        </el-upload>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="uploadDialogVisible = false">取消</el-button>
          <el-button
            type="primary"
            @click="handleUpload"
            :loading="uploading"
            :disabled="uploadFileList.length === 0"
          >
            {{ uploading ? '上传中...' : '开始上传' }}
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped lang="scss">
.gallery-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.header-section {
  margin-bottom: 30px;

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    .page-title {
      font-size: 28px;
      font-weight: 600;
      color: #303133;
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 12px;
      align-items: center;

      .bucket-select {
        width: 220px;
      }
    }
  }

  .stats-bar {
    display: flex;
    gap: 30px;
    padding: 15px 20px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);

    .stat-item {
      display: flex;
      align-items: center;
      gap: 8px;

      .stat-label {
        color: #909399;
        font-size: 14px;
      }

      .stat-value {
        color: #409eff;
        font-size: 18px;
        font-weight: 600;

        &.selection {
          color: #67c23a;
        }
      }
    }
  }
}

.timeline-container {
  min-height: 400px;
}

.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  background: white;
  border-radius: 12px;
}

.timeline {
  .timeline-group {
    margin-bottom: 50px;

    .timeline-date {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 20px;
      font-weight: 600;
      color: #303133;
      margin-bottom: 24px;
      padding: 12px 20px;
      background: linear-gradient(90deg, #409eff 0%, transparent 100%);
      border-radius: 8px;

      .date-text {
        color: white;
      }

      .date-count {
        font-size: 14px;
        color: rgba(255, 255, 255, 0.9);
        font-weight: 400;
      }
    }

    .files-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 24px;
    }
  }
}

.file-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  position: relative;

  &.selection-mode {
    cursor: pointer;
  }

  &.selected {
    box-shadow: 0 0 0 3px #67c23a;
    transform: translateY(-2px);
  }

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);

    &.selected {
      box-shadow: 0 0 0 3px #67c23a, 0 8px 24px rgba(0, 0, 0, 0.15);
    }

    .file-actions {
      opacity: 1;
      transform: translateY(0);
    }

    .preview-overlay {
      opacity: 1;
    }
  }

  .selection-checkbox {
    position: absolute;
    top: 12px;
    left: 12px;
    z-index: 10;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 4px;
    padding: 4px;
  }

  .file-preview {
    width: 100%;
    height: 180px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #f5f7fa;
    cursor: pointer;
    position: relative;
    overflow: hidden;

    .image-preview {
      width: 100%;
      height: 100%;
      position: relative;

      .thumbnail-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }

      .loading-placeholder {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;

        .el-icon {
          font-size: 48px;
          color: #c0c4cc;
        }
      }

      .preview-overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        display: flex;
        align-items: center;
        justify-content: center;
        opacity: 0;
        transition: opacity 0.3s;
        color: white;
      }
    }

    .icon-preview {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;

      .file-type-icon {
        color: #909399;
      }

      .file-ext {
        font-size: 12px;
        color: #606266;
        font-weight: 600;
        padding: 4px 8px;
        background: #e4e7ed;
        border-radius: 4px;
      }
    }
  }

  .file-info {
    padding: 16px;

    .file-name {
      font-size: 14px;
      color: #303133;
      margin-bottom: 10px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-weight: 500;
    }

    .file-meta {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #909399;

      .meta-item {
        display: flex;
        align-items: center;
        gap: 4px;

        .el-icon {
          font-size: 12px;
        }
      }
    }
  }

  .file-actions {
    display: flex;
    justify-content: center;
    gap: 10px;
    padding: 0 16px 16px;
    opacity: 0;
    transform: translateY(-10px);
    transition: all 0.3s;
  }
}

.preview-dialog {
  .preview-content {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 400px;
    max-height: 75vh;

    .preview-image {
      max-width: 100%;
      max-height: 75vh;
      object-fit: contain;
      border-radius: 8px;
    }

    .preview-other {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      padding: 40px;

      .file-icon {
        color: #909399;
      }

      .file-name-text {
        font-size: 16px;
        color: #606266;
        word-break: break-all;
        text-align: center;
      }
    }
  }
}

.upload-container {
  padding: 20px 0;

  .mb-4 {
    margin-bottom: 20px;
  }
}
</style>
