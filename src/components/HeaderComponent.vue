<template>
    <div class="header">
        <h1 class="title">佩伦降AI系统</h1>
        <div class="api-key-group">
            <el-input v-model="apiKey" placeholder="请输入 API Key" show-password @change="handleSave" style="width: 300px;"></el-input>
            <el-button type="info" @click="dialogVisible = true">获取 API Key</el-button>
        </div>

        <el-dialog v-model="dialogVisible" title="获取 API Key" width="600px">
            <div class="guide-content">
                <ol class="steps-list">
                    <li>打开 <el-link href="https://cloud.siliconflow.cn/i/RayoBmBY" target="_blank"
                            type="primary">https://cloud.siliconflow.cn/i/RayoBmBY</el-link>，邀请码填写 RayoBmBY</li>
                    <li>注册 / 登录账号</li>
                    <li>菜单 → API 密钥 → 新建API密钥 → 复制密钥</li>
                </ol>
            </div>
        </el-dialog>
    </div>
</template>

<script setup>
import { useApiKeyStore } from '@/stores/apiKeyStore'
import { ElMessage } from 'element-plus'
import { ref, computed } from 'vue'

const apiKeyStore = useApiKeyStore()
const dialogVisible = ref(false)

const apiKey = computed({
    get: () => apiKeyStore.apiKey,
    set: (value) => { apiKeyStore.apiKey = value }
})

const handleSave = () => {
    apiKeyStore.saveApiKey(apiKey.value)
    ElMessage.success('API Key 保存成功')
}
</script>

<style scoped lang="scss">
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  border-radius: 12px;
  padding: 1.5rem;
  background: #262626;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);

  .title {
    font-size: 2.2rem;
    background: linear-gradient(135deg, #00ff88 30%, #00b4ff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    text-align: center;
    font-weight: 600;
    margin: 0;
  }
}

.api-key-group {
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: center;

  .el-button {
    background: linear-gradient(135deg, #00b4ff, #0066ff);
    border: none;
    transition: transform 0.2s, box-shadow 0.2s;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 180, 255, 0.4);
    }

    &+.el-button {
      margin-left: 0;
    }
  }
}
</style>