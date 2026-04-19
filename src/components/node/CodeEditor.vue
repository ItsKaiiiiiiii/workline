<template>
  <div class="code-editor">
    <div class="editor-header">
      <div class="header-title">
        <Code2 class="w-4 h-4" />
        <span>输出转换代码</span>
      </div>
      <div class="header-actions">
        <button class="action-btn" @click="formatCode" title="格式化代码">
          <AlignLeft class="w-4 h-4" />
        </button>
        <button class="action-btn" @click="resetCode" title="重置为默认">
          <RefreshCw class="w-4 h-4" />
        </button>
      </div>
    </div>
    <textarea
      ref="textareaRef"
      v-model="internalCode"
      class="code-textarea"
      placeholder="在此输入自定义转换代码..."
      spellcheck="false"
      @input="handleInput"
      @keydown="handleKeydown"
    />
    <div class="editor-footer">
      <div class="hint-text">
        <Lightbulb class="w-4 h-4" />
        <span>使用 <code>input</code> 访问节点原始输出，返回处理后的数据</span>
      </div>
      <div v-if="error" class="error-text">
        <AlertCircle class="w-4 h-4" />
        <span>{{ error }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue';
import { Code2, AlignLeft, RefreshCw, Lightbulb, AlertCircle } from 'lucide-vue-next';

const props = defineProps<{
  modelValue: string;
  defaultCode?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string];
  'validate': [isValid: boolean];
}>();

const textareaRef = ref<HTMLTextAreaElement>();
const internalCode = ref('');
const error = ref('');

watch(() => props.modelValue, (newVal) => {
  if (newVal !== internalCode.value) {
    internalCode.value = newVal || '';
  }
}, { immediate: true });

watch(internalCode, (newVal) => {
  emit('update:modelValue', newVal);
  validateCode(newVal);
});

function validateCode(code: string) {
  if (!code.trim()) {
    error.value = '';
    emit('validate', true);
    return;
  }

  try {
    // 简单的语法检查
    new Function('input', code);
    error.value = '';
    emit('validate', true);
  } catch (e) {
    error.value = (e as Error).message;
    emit('validate', false);
  }
}

function handleInput() {
  // 自动调整高度
  nextTick(() => {
    if (textareaRef.value) {
      textareaRef.value.style.height = 'auto';
      textareaRef.value.style.height = Math.min(textareaRef.value.scrollHeight, 400) + 'px';
    }
  });
}

function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Tab') {
    event.preventDefault();
    const textarea = textareaRef.value;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;

    internalCode.value = value.substring(0, start) + '  ' + value.substring(end);

    nextTick(() => {
      textarea.selectionStart = textarea.selectionEnd = start + 2;
    });
  }
}

function formatCode() {
  try {
    // 简单的格式化
    const code = internalCode.value;
    let formatted = '';
    let indent = 0;

    for (let i = 0; i < code.length; i++) {
      const char = code[i];
      if (char === '{') {
        indent++;
        formatted += char + '\n' + '  '.repeat(indent);
      } else if (char === '}') {
        indent = Math.max(0, indent - 1);
        formatted += '\n' + '  '.repeat(indent) + char;
      } else if (char === '\n') {
        formatted += char + '  '.repeat(indent);
      } else {
        formatted += char;
      }
    }

    internalCode.value = formatted.trim();
  } catch {
    // 格式化失败就保持原样
  }
}

function resetCode() {
  if (props.defaultCode) {
    internalCode.value = props.defaultCode;
  }
}
</script>

<style scoped>
.code-editor {
  display: flex;
  flex-direction: column;
  background: #1e1e1e;
  border-radius: 12px;
  overflow: hidden;
}

.editor-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #2d2d2d;
  border-bottom: 1px solid #404040;
}

.header-title {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #cccccc;
  font-size: 13px;
  font-weight: 500;
}

.header-actions {
  display: flex;
  gap: 4px;
}

.action-btn {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  color: #888888;
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: #404040;
  color: #ffffff;
}

.code-textarea {
  width: 100%;
  min-height: 150px;
  max-height: 400px;
  padding: 14px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 13px;
  line-height: 1.6;
  color: #d4d4d4;
  background: #1e1e1e;
  border: none;
  outline: none;
  resize: none;
  box-sizing: border-box;
}

.code-textarea::placeholder {
  color: #666666;
}

.editor-footer {
  padding: 10px 14px;
  background: #2d2d2d;
  border-top: 1px solid #404040;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.hint-text {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #888888;
  font-size: 12px;
}

.hint-text code {
  padding: 2px 6px;
  background: #404040;
  border-radius: 4px;
  color: #d4d4d4;
}

.error-text {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #f44747;
  font-size: 12px;
}
</style>
