<template>
  <div class="settings-page">
    <div class="page-header">
      <h1 class="page-title">设置</h1>
      <p class="page-desc">管理 MinIO 连接配置</p>
    </div>
    <!-- 配置列表 -->
    <div class="config-list">
      <div class="list-header">
        <span class="list-title">连接配置</span>
        <el-button type="primary" @click="openAddDialog">
          <el-icon class="mr-1"><Plus /></el-icon>
          添加配置
        </el-button>
      </div>

      <div v-if="configs.length === 0" class="empty-state">
        <el-icon :size="48" color="#d4d4d8"><Connection /></el-icon>
        <p>暂无配置，点击上方按钮添加</p>
      </div>

      <div v-else class="config-cards">
        <div
          v-for="config in configs"
          :key="config.id"
          class="config-card"
          :class="{ 'is-active': config.id === activeConfigId }"
          @click="handleSwitchConfig(config.id)"
        >
          <div class="card-header">
            <div class="card-status">
              <el-icon v-if="config.id === activeConfigId" color="#10b981"><CircleCheck /></el-icon>
            </div>
            <div class="card-actions">
              <el-button
                text
                size="small"
                @click.stop="openEditDialog(config)"
              >
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button
                text
                size="small"
                type="danger"
                @click.stop="handleDelete(config)"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
          <div class="card-body">
            <h3 class="config-name">{{ config.name }}</h3>
            <p class="config-endpoint">
              {{ config.useSSL ? 'https' : 'http' }}://{{ config.endpoint }}:{{ config.port }}
            </p>
          </div>
          <div class="card-footer">
            <span class="config-time">{{ formatTime(config.updatedAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <div class="security-notice">
      <el-icon :size="16" color="#71717a"><Lock /></el-icon>
      <p>所有凭证使用 AES 加密存储在本地浏览器，不会上传到任何服务器。</p>
    </div>

    <!-- 添加/编辑配置对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEditing ? '编辑配置' : '添加配置'"
      width="600px"
      class="!p-8"
      :close-on-click-modal="false"
    >
      <el-form
        ref="formRef"
        :model="configForm"
        :rules="rules"
        label-position="top"
        class="config-form"
      >
        <el-form-item label="配置名称" prop="name">
          <el-input
            v-model="configForm.name"
            placeholder="例如: 公司服务器、家里 NAS"
          />
        </el-form-item>

        <div class="form-row">
          <el-form-item label="服务地址" prop="endpoint" class="flex-1">
            <el-input
              v-model="configForm.endpoint"
              placeholder="192.168.1.100"
            />
          </el-form-item>
          <el-form-item label="端口" prop="port" class="port-input">
            <el-input-number
              v-model="configForm.port"
              :controls="false"
              :min="1"
              :max="65535"
            />
          </el-form-item>
        </div>

        <div class="ssl-row">
          <span class="ssl-label">使用 SSL (HTTPS)</span>
          <el-switch v-model="configForm.useSSL" size="small" />
        </div>

        <el-form-item label="Access Key" prop="accessKey">
          <el-input v-model="configForm.accessKey" placeholder="请输入 Access Key" />
        </el-form-item>

        <el-form-item label="Secret Key" prop="secretKey">
          <el-input
            v-model="configForm.secretKey"
            type="password"
            placeholder="请输入 Secret Key"
            show-password
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="success" plain @click="handleTestConnection" :loading="testing">
          测试连接
        </el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">
          {{ isEditing ? '保存' : '添加' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import { Plus, Edit, Delete, Lock, Connection, CircleCheck } from '@element-plus/icons-vue'
import type { MinioConfig } from '@/utils/storage'
import {
  getAllConfigs,
  getActiveConfigId,
  setActiveConfig,
  addConfig,
  updateConfig,
  deleteConfig,
} from '@/utils/storage'
import { testConnection, initMinioClient } from '@/services/minio'

const router = useRouter()

const configs = ref<MinioConfig[]>([])
const activeConfigId = ref<string | null>(null)

const dialogVisible = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)

const formRef = ref()
const configForm = ref({
  name: '',
  endpoint: '',
  port: 9000,
  useSSL: false,
  accessKey: '',
  secretKey: '',
})

const saving = ref(false)
const testing = ref(false)

const rules = {
  name: [{ required: true, message: '请输入配置名称', trigger: 'blur' }],
  endpoint: [{ required: true, message: '请输入服务地址', trigger: 'blur' }],
  port: [{ required: true, message: '请输入端口号', trigger: 'blur' }],
  accessKey: [{ required: true, message: '请输入 Access Key', trigger: 'blur' }],
  secretKey: [{ required: true, message: '请输入 Secret Key', trigger: 'blur' }],
}

const loadConfigs = () => {
  configs.value = getAllConfigs()
  activeConfigId.value = getActiveConfigId()
}

onMounted(() => {
  loadConfigs()
})

const formatTime = (timestamp: number) => {
  return new Date(timestamp).toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

const resetForm = () => {
  configForm.value = {
    name: '',
    endpoint: '',
    port: 9000,
    useSSL: false,
    accessKey: '',
    secretKey: '',
  }
  editingId.value = null
  isEditing.value = false
}

const openAddDialog = () => {
  resetForm()
  dialogVisible.value = true
}

const openEditDialog = (config: MinioConfig) => {
  isEditing.value = true
  editingId.value = config.id
  configForm.value = {
    name: config.name,
    endpoint: config.endpoint,
    port: config.port,
    useSSL: config.useSSL,
    accessKey: config.accessKey,
    secretKey: config.secretKey,
  }
  dialogVisible.value = true
}

const handleTestConnection = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    testing.value = true
    try {
      const success = await testConnection(configForm.value)
      if (success) {
        ElMessage.success('连接测试成功')
      } else {
        ElMessage.error('连接测试失败，请检查配置')
      }
    } catch (error) {
      ElMessage.error('连接测试失败：' + (error as Error).message)
    } finally {
      testing.value = false
    }
  })
}

const handleSave = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return

    saving.value = true
    try {
      // 先测试连接
      const success = await testConnection(configForm.value)
      if (!success) {
        ElMessage.error('连接测试失败，请检查配置')
        saving.value = false
        return
      }

      if (isEditing.value && editingId.value) {
        // 更新配置
        updateConfig(editingId.value, configForm.value)
        ElMessage.success('配置已更新')
      } else {
        // 添加新配置
        const newConfig = addConfig(configForm.value)
        // 自动切换到新配置
        setActiveConfig(newConfig.id)
        initMinioClient(newConfig)
        ElMessage.success('配置已添加')
      }

      loadConfigs()
      dialogVisible.value = false

      // 如果是第一个配置，跳转到图库
      if (configs.value.length === 1) {
        setTimeout(() => router.push('/gallery'), 500)
      }
    } catch (error) {
      ElMessage.error('保存失败：' + (error as Error).message)
    } finally {
      saving.value = false
    }
  })
}

const handleSwitchConfig = (id: string) => {
  if (id === activeConfigId.value) return

  try {
    setActiveConfig(id)
    const config = configs.value.find(c => c.id === id)
    if (config) {
      initMinioClient(config)
    }
    activeConfigId.value = id
    ElMessage.success('已切换配置')
  } catch (error) {
    ElMessage.error('切换失败：' + (error as Error).message)
  }
}

const handleDelete = async (config: MinioConfig) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除配置「${config.name}」吗？`,
      '删除确认',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    deleteConfig(config.id)
    loadConfigs()
    ElMessage.success('配置已删除')
  } catch {
    // 用户取消
  }
}
</script>

<style scoped lang="scss">
.settings-page {
  min-height: 100%;
  padding: 24px;
  max-width: 800px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: #18181b;
  margin: 0 0 8px;
  letter-spacing: -0.02em;
}

.page-desc {
  font-size: 15px;
  color: #71717a;
  margin: 0;
}

.config-list {
  background: white;
  border-radius: 16px;
  border: 1px solid #e4e4e7;
  padding: 20px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;

  .mr-1 {
    margin-right: 4px;
  }
}

.list-title {
  font-size: 16px;
  font-weight: 600;
  color: #18181b;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 48px 20px;
  color: #71717a;

  p {
    margin: 16px 0 0;
    font-size: 14px;
  }
}

.config-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
}

.config-card {
  border: 1px solid #e4e4e7;
  border-radius: 12px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;

  &:hover {
    border-color: #d4d4d8;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  }

  &.is-active {
    border-color: #10b981;
    background: #f0fdf4;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.card-status {
  width: 20px;
  height: 20px;
}

.card-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;

  .config-card:hover & {
    opacity: 1;
  }
}

.card-body {
  .config-name {
    font-size: 15px;
    font-weight: 600;
    color: #18181b;
    margin: 0 0 4px;
  }

  .config-endpoint {
    font-size: 13px;
    color: #71717a;
    margin: 0;
    word-break: break-all;
  }
}

.card-footer {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #f4f4f5;

  .config-time {
    font-size: 12px;
    color: #a1a1aa;
  }
}

.security-notice {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 16px;
  padding: 16px;
  background: #fafafa;
  border-radius: 10px;

  p {
    font-size: 13px;
    color: #71717a;
    margin: 0;
    line-height: 1.5;
  }
}

// 对话框表单样式
.config-form {
  .form-row {
    display: flex;
    gap: 12px;
    .flex-1 {
      flex: 1;
    }

    .port-input {
      width: 100px;
    }
  }

  .ssl-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    background: #fafafa;
    border-radius: 8px;
    margin-bottom: 18px;
  }

  .ssl-label {
    font-size: 13px;
    font-weight: 500;
    color: #3f3f46;
  }

  :deep(.el-form-item) {
    margin-bottom: 18px;
  }

  :deep(.el-form-item__label) {
    font-size: 13px;
    font-weight: 500;
    color: #3f3f46;
    padding-bottom: 6px;
  }

  :deep(.el-input__wrapper),
  :deep(.el-input-number__wrapper) {
    border-radius: 8px;
  }
}

@media (max-width: 640px) {
  .settings-page {
    padding: 16px;
  }

  .config-cards {
    grid-template-columns: 1fr;
  }

  .config-form .form-row {
    flex-direction: column;

    .port-input {
      width: 100%;
    }
  }
}
</style>
