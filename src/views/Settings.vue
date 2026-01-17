<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'
import type { MinioConfig } from '@/utils/storage'
import {
  saveMinioConfig,
  getMinioConfig,
  clearMinioConfig,
} from '@/utils/storage'
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
  endpoint: [
    { required: true, message: '请输入 MinIO 服务地址', trigger: 'blur' },
  ],
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
        ElMessage.success('连接测试成功！')
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
      ElMessage.success('配置保存成功！')

      setTimeout(() => {
        router.push('/gallery')
      }, 1000)
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

<template>
  <div class="settings-container">
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <span class="title">MinIO 配置</span>
        </div>
      </template>

      <el-form
        ref="formRef"
        :model="configForm"
        :rules="rules"
        label-width="120px"
        class="config-form"
      >
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
          />
        </el-form-item>

        <el-form-item label="使用 SSL">
          <el-switch v-model="configForm.useSSL" />
          <span class="form-tip">是否使用 HTTPS 连接</span>
        </el-form-item>

        <el-form-item label="Access Key" prop="accessKey">
          <el-input
            v-model="configForm.accessKey"
            placeholder="请输入 Access Key"
          />
        </el-form-item>

        <el-form-item label="Secret Key" prop="secretKey">
          <el-input
            v-model="configForm.secretKey"
            type="password"
            placeholder="请输入 Secret Key"
            show-password
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" :loading="loading" @click="handleSave">
            保存配置
          </el-button>
          <el-button :loading="testing" @click="handleTestConnection">
            测试连接
          </el-button>
          <el-button @click="handleClear">清除配置</el-button>
        </el-form-item>
      </el-form>

      <el-alert
        title="安全提示"
        type="info"
        :closable="false"
        class="security-tip"
      >
        <p>您的 MinIO 凭证将使用 AES 加密存储在浏览器本地，不会上传到任何服务器。</p>
        <p>建议定期更换密钥以确保安全。</p>
      </el-alert>
    </el-card>
  </div>
</template>

<style scoped lang="scss">
.settings-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.settings-card {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .title {
      font-size: 18px;
      font-weight: 600;
    }
  }
}

.config-form {
  margin-top: 20px;

  .form-tip {
    margin-left: 10px;
    color: #909399;
    font-size: 12px;
  }
}

.security-tip {
  margin-top: 20px;

  p {
    margin: 5px 0;
    font-size: 13px;
  }
}
</style>
