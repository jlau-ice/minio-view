<template>
  <div class="settings-page">
    <div class="page-header">
      <h1 class="page-title">设置</h1>
      <p class="page-desc">配置 MinIO 连接信息</p>
    </div>

    <div class="settings-card">
      <el-form
        ref="formRef"
        :model="configForm"
        :rules="rules"
        label-position="top"
        class="config-form"
      >
        <div class="form-section">
          <h3 class="section-title">服务器配置</h3>
          <div class="form-grid">
            <el-form-item label="服务地址" prop="endpoint">
              <el-input
                v-model="configForm.endpoint"
                placeholder="例如: 192.168.1.100 或 minio.example.com"
              />
            </el-form-item>
            <el-form-item label="端口" prop="port">
              <el-input-number
                v-model="configForm.port"
                :min="1"
                :max="65535"
                controls-position="right"
                style="width: 100%"
              />
            </el-form-item>
          </div>
          <div class="ssl-row">
            <span class="ssl-label">使用 SSL</span>
            <el-switch v-model="configForm.useSSL" size="small" />
          </div>
        </div>

        <div class="form-section">
          <h3 class="section-title">访问凭证</h3>
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
        </div>

        <div class="form-actions">
          <el-button @click="handleClear">清除配置</el-button>
          <el-button @click="handleTestConnection" :loading="testing">测试连接</el-button>
          <el-button type="primary" :loading="loading" @click="handleSave">保存配置</el-button>
        </div>
      </el-form>

      <div class="security-notice">
        <el-icon :size="16" color="#71717a"><Lock /></el-icon>
        <p>凭证使用 AES 加密存储在本地浏览器，不会上传到任何服务器。</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import { Lock } from '@element-plus/icons-vue'
import type { MinioConfig } from '@/utils/storage'
import { saveMinioConfig, getMinioConfig, clearMinioConfig } from '@/utils/storage'
import { testConnection, initMinioClient } from '@/services/minio'

const router = useRouter()

const formRef = ref()
const configForm = ref<MinioConfig>({
  endpoint: '',
  port: 9000,
  useSSL: false,
  accessKey: '',
  secretKey: '',
})

const loading = ref(false)
const testing = ref(false)

const rules = {
  endpoint: [{ required: true, message: '请输入 MinIO 服务地址', trigger: 'blur' }],
  port: [{ required: true, message: '请输入端口号', trigger: 'blur' }],
  accessKey: [{ required: true, message: '请输入 Access Key', trigger: 'blur' }],
  secretKey: [{ required: true, message: '请输入 Secret Key', trigger: 'blur' }],
}

onMounted(() => {
  const config = getMinioConfig()
  if (config) {
    configForm.value = config
  }
})

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

    loading.value = true
    try {
      const success = await testConnection(configForm.value)
      if (!success) {
        ElMessage.error('连接测试失败，请检查配置')
        loading.value = false
        return
      }

      saveMinioConfig(configForm.value)
      initMinioClient(configForm.value)
      ElMessage.success('配置保存成功')

      setTimeout(() => {
        router.push('/gallery')
      }, 800)
    } catch (error) {
      ElMessage.error('保存失败：' + (error as Error).message)
    } finally {
      loading.value = false
    }
  })
}

const handleClear = () => {
  clearMinioConfig()
  configForm.value = {
    endpoint: '',
    port: 9000,
    useSSL: false,
    accessKey: '',
    secretKey: '',
  }
  ElMessage.success('配置已清除')
}
</script>

<style scoped lang="scss">
.settings-page {
  min-height: 100%;
  padding: 24px;
  max-width: 640px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
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

.settings-card {
  background: white;
  border-radius: 16px;
  border: 1px solid #e4e4e7;
  padding: 32px;
}

.config-form {
  .form-section {
    margin-bottom: 32px;

    &:last-of-type {
      margin-bottom: 0;
    }
  }

  .section-title {
    font-size: 14px;
    font-weight: 600;
    color: #18181b;
    margin: 0 0 20px;
    padding-bottom: 12px;
    border-bottom: 1px solid #f4f4f5;
  }

  .form-grid {
    display: grid;
    grid-template-columns: 1fr 140px;
    gap: 16px;
  }

  :deep(.el-form-item) {
    margin-bottom: 20px;
  }

  :deep(.el-form-item__label) {
    font-size: 13px;
    font-weight: 500;
    color: #3f3f46;
    padding-bottom: 6px;
  }

  :deep(.el-input__wrapper) {
    border-radius: 8px;
    box-shadow: 0 0 0 1px #e4e4e7;
    transition: all 0.2s ease;

    &:hover {
      box-shadow: 0 0 0 1px #d4d4d8;
    }

    &.is-focus {
      box-shadow: 0 0 0 2px rgba(14, 165, 233, 0.2), 0 0 0 1px #0ea5e9;
    }
  }
}

.ssl-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  background: #fafafa;
  border-radius: 8px;
  margin-top: -8px;
}

.ssl-label {
  font-size: 13px;
  font-weight: 500;
  color: #3f3f46;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid #f4f4f5;
}

.security-notice {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  margin-top: 24px;
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

@media (max-width: 640px) {
  .settings-page {
    padding: 16px;
  }

  .settings-card {
    padding: 24px;
  }

  .config-form .form-grid {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;

    .el-button {
      width: 100%;
    }
  }
}
</style>
