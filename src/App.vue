<template>
  <div class="container">
    <HeaderComponent />

    <div class="main-content">
      <el-input v-model="content" type="textarea" :rows="8" placeholder="请输入需要检测的内容（最多3000字）" maxlength="3000"
        show-word-limit></el-input>

      <div class="vpi-radio-group">
        <span class="radio-label">维普检测结果：</span>
        <el-radio-group v-model="vipCheckResult">
          <el-radio label="未检测" />
          <el-radio label="检测为AI" />
          <el-radio label="检测为人工" />
        </el-radio-group>
      </div>

      <el-button class="detect-button" type="primary" @click="detectAIGC" :loading="isDetecting">检测AI率</el-button>

      <div v-if="detectionStream" class="result-card">
        <div class="stream-header" @click="showDetectionStream = !showDetectionStream">
          <h3>检测过程</h3>
          <span class="toggle-icon">{{ showDetectionStream ? '▲' : '▼' }}</span>
        </div>
        <pre v-if="showDetectionStream" class="stream-content">{{ detectionStream }}</pre>
      </div>

      <div v-if="aiDetectionResult !== null" class="result-card">
        <h3>检测结果（仅供参考）</h3>
        <div class="ai-rate">AI 概率：{{ aiDetectionResult }}%</div>
        <el-button type="warning" @click="reduceAIGC" :loading="isOptimizing">降 AI</el-button>
      </div>

      <div v-if="suggestionGenerationStream" class="result-card">
        <div class="stream-header" @click="showSuggestionGeneration = !showSuggestionGeneration">
          <h3>优化建议生成过程</h3>
          <span class="toggle-icon">{{ showSuggestionGeneration ? '▲' : '▼' }}</span>
        </div>
        <pre v-if="showSuggestionGeneration" class="stream-content">{{ suggestionGenerationStream }}</pre>
      </div>

      <div v-if="optimizationSuggestions.length > 0" class="result-card">
        <h3>优化建议（需参考修改，不要直接使用）</h3>
        <ul class="suggestion-list">
          <li v-for="(item, index) in optimizationSuggestions" :key="index" class="suggestion-item">
            <div class="suggestion-header">
              <span class="order-index">#{{ index + 1 }}</span>
              <strong class="suggestion-title">{{ item.suggestion }}</strong>
            </div>
            <div class="comparison-container">
              <div class="comparison-box original">
                <div class="comparison-header">
                  <span class="version-tag">修改前</span>
                  <el-tag type="danger" size="small">AI 特征</el-tag>
                </div>
                <div class="comparison-content">{{ item.origin }}</div>
              </div>
              <div class="comparison-arrow">⇒</div>
              <div class="comparison-box revised">
                <div class="comparison-header">
                  <span class="version-tag">修改后</span>
                  <el-tag type="success" size="small">人工特征</el-tag>
                </div>
                <div class="comparison-content">{{ item.result }}</div>
              </div>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import { streamCompletion } from '@/services/api'
import { buildDetectionPrompt, buildOptimizationPrompt } from '@/utils/prompts'
import HeaderComponent from '@/components/HeaderComponent.vue'

// 用户输入
const content = ref('')
const vipCheckResult = ref('未检测')

// 检测结果
const aiDetectionResult = ref(null)
const isDetecting = ref(false)
const detectionStream = ref('')
const showDetectionStream = ref(true)

// 优化建议相关
const optimizationSuggestions = ref([])
const suggestionGenerationStream = ref('')
const suggestionContent = ref('')
const showSuggestionGeneration = ref(true)
const isOptimizing = ref(false)

// AI检测
const detectAIGC = async () => {
  if (!validateInput()) return

  try {
    resetDetectionStates()
    const finalContent = await streamCompletion({
      model: 'deepseek-ai/DeepSeek-R1',
      temperature: 0,
      messages: [
        { role: 'system', content: buildDetectionPrompt(vipCheckResult.value) },
        { role: 'user', content: content.value }
      ]
    }, {
      onReasoning: text => detectionStream.value += text
    })

    parseDetectionResult(finalContent)
  } catch (error) {
    handleError(error)
  } finally {
    isDetecting.value = false
  }
}

// 降AI
const reduceAIGC = async () => {
  if (!validateOptimizationPreconditions()) return

  try {
    resetOptimizationStates()
    const finalContent = await streamCompletion({
      model: 'deepseek-ai/DeepSeek-R1',
      temperature: 0.4,
      messages: [
        { role: 'system', content: buildOptimizationPrompt() },
        { role: 'user', content: `### 原始文本\n${content.value}\n\n\n### 检测报告\n${detectionStream.value}\n\n\n请提供优化建议：` }
      ]
    }, {
      onReasoning: text => suggestionGenerationStream.value += text,
      onContent: text => {
        suggestionContent.value += text
        try {
          const jsonMatch = (suggestionContent.value + '"}]}').match(/```json\n([\s\S]*?)(?=\n```\s*$|$)/)
          optimizationSuggestions.value = JSON.parse(jsonMatch[1]).suggestions
        } catch (error) {}
      }
    })

    parseOptimizationResult(finalContent)
    ElMessage.success('优化完成！')
  } catch (error) {
    handleError(error)
  } finally {
    isOptimizing.value = false
  }
}

// 辅助方法
const validateInput = () => {
  if (!content.value) {
    ElMessage.error('请输入需要检测的内容')
    return false
  }
  return true
}

const resetDetectionStates = () => {
  isDetecting.value = true
  detectionStream.value = ''
  aiDetectionResult.value = null
  suggestionGenerationStream.value = ''
  optimizationSuggestions.value = []
}

const parseDetectionResult = (content) => {
  const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/)
  if (!jsonMatch) throw new Error('返回数据格式异常：' + content)
  aiDetectionResult.value = JSON.parse(jsonMatch[1]).aiRate
}

// 优化相关辅助方法
const validateOptimizationPreconditions = () => {
  if (!validateInput()) return false
  if (aiDetectionResult.value === null) {
    ElMessage.error('请先进行AI检测')
    return false
  }
  return true
}

const resetOptimizationStates = () => {
  isOptimizing.value = true
  suggestionGenerationStream.value = ''
  optimizationSuggestions.value = []
}

const parseOptimizationResult = (content) => {
  const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/)
  if (!jsonMatch) throw new Error('优化建议格式异常')
  optimizationSuggestions.value = JSON.parse(jsonMatch[1]).suggestions
}

// 通用方法
const handleError = (error) => {
  console.error(error)
  ElMessage.error(error.message)
}
</script>

<style>
@import './assets/styles.scss';
</style>