<template>
  <el-dialog
    v-model="visible"
    title="Import Configuration"
    width="700px"
    :close-on-click-modal="false"
    @close="reset"
  >
    <!-- Step 1: File Selection -->
    <div v-if="step === 'select'">
      <el-upload
        drag
        accept=".yaml,.yml,.txt"
        :auto-upload="false"
        :show-file-list="false"
        :on-change="handleFileChange"
      >
        <div style="padding: 20px 0;">
          <el-icon :size="40" style="color: #909399;"><UploadFilled /></el-icon>
          <div style="margin-top: 8px; color: #606266;">Drop config.yaml here or <em>click to browse</em></div>
        </div>
      </el-upload>
      <div v-if="fileName" style="margin-top: 12px; color: #67c23a;">
        Selected: {{ fileName }}
      </div>
      <div v-if="fileContent" style="margin-top: 15px; text-align: right;">
        <el-button type="primary" @click="parseFile">Parse Configuration</el-button>
      </div>
    </div>

    <!-- Step 2: Preview -->
    <div v-if="step === 'preview'">
      <el-alert
        v-if="parseErrors.length > 0"
        type="warning"
        :closable="false"
        style="margin-bottom: 15px;"
      >
        <template #title>Parse Warnings ({{ parseErrors.length }})</template>
        <div v-for="(err, idx) in parseErrors.slice(0, 10)" :key="idx" style="font-size: 12px;">
          {{ err.line ? `Line ${err.line}: ` : '' }}{{ err.message }}
        </div>
        <div v-if="parseErrors.length > 10" style="font-size: 12px; color: #909399;">
          ... and {{ parseErrors.length - 10 }} more warnings
        </div>
      </el-alert>

      <el-alert
        type="info"
        :closable="false"
        style="margin-bottom: 15px;"
      >
        <template #title>
          Found {{ parsedModules.length }} module(s). Module type defaults to H750 Universal Module (0x03).
        </template>
      </el-alert>

      <el-table :data="parsedModules" border size="small">
        <el-table-column prop="sn" label="SN" width="80" />
        <el-table-column label="Latency Topic" min-width="180">
          <template #default="{ row }">{{ row.latency_topic }}</template>
        </el-table-column>
        <el-table-column label="Tasks">
          <template #default="{ row }">
            <el-tag
              v-for="(t, i) in row.task"
              :key="i"
              size="small"
              style="margin: 2px;"
            >
              {{ getAppTypeFriendlyName(t.type) }}
            </el-tag>
            <span v-if="row.task.length === 0" style="color: #909399;">(none)</span>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 15px; text-align: right;">
        <el-button @click="step = 'select'">Back</el-button>
        <el-button type="primary" @click="doImport">
          Import (replace current config)
        </el-button>
      </div>
    </div>

    <!-- Step 3: Done -->
    <div v-if="step === 'done'" style="text-align: center; padding: 20px 0;">
      <el-icon :size="48" style="color: #67c23a;"><CircleCheckFilled /></el-icon>
      <div style="margin-top: 12px; font-size: 16px; font-weight: 500;">Import Successful</div>
      <div style="margin-top: 4px; color: #909399;">
        {{ parsedModules.length }} module(s) loaded into editor
      </div>
      <el-button type="primary" style="margin-top: 20px;" @click="close">Close</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { UploadFilled, CircleCheckFilled } from '@element-plus/icons-vue';
import { parseConfigYaml } from '@/utils/parse-config';

export default {
  name: 'ImportConfigDialog',
  components: { UploadFilled, CircleCheckFilled },
  props: {
    modelValue: Boolean,
  },
  emits: ['update:modelValue', 'imported'],
  data() {
    return {
      step: 'select',
      fileContent: '',
      fileName: '',
      parsedModules: [],
      parseErrors: [],
    };
  },
  computed: {
    visible: {
      get() { return this.modelValue; },
      set(val) { this.$emit('update:modelValue', val); },
    },
  },
  methods: {
    handleFileChange(file) {
      this.fileName = file.name;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.fileContent = e.target.result;
      };
      reader.readAsText(file.raw);
    },

    parseFile() {
      const result = parseConfigYaml(this.fileContent);
      this.parsedModules = result.modules;
      this.parseErrors = result.errors;

      if (this.parsedModules.length === 0) {
        this.parseErrors.push({ message: 'No valid modules found in file' });
        return;
      }
      this.step = 'preview';
    },

    doImport() {
      let uidCounter = Date.now();
      this.parsedModules.forEach(mod => {
        mod._uid = uidCounter++;
        if (mod.task) {
          mod.task.forEach(t => { t._uid = uidCounter++; });
        }
      });
      this.$emit('imported', this.parsedModules);
      this.step = 'done';
    },

    reset() {
      this.step = 'select';
      this.fileContent = '';
      this.fileName = '';
      this.parsedModules = [];
      this.parseErrors = [];
    },

    close() {
      this.visible = false;
    },

    getAppTypeFriendlyName(hexId) {
      switch (hexId) {
        case 1: return 'DJI RC';
        case 2: return 'LkTech Motor';
        case 3: return 'HIPNUC IMU(CAN)';
        case 4: return 'DSHOT600';
        case 5: return 'DJI Motor';
        case 6: return 'OnBoard PWM';
        case 7: return 'External PWM';
        case 8: return 'MS5837(30BA)';
        case 10: return 'PMU(CAN)';
        case 11: return 'SBUS RC';
        case 12: return 'DM Motor';
        case 13: return 'Super Capacitor';
        case 14: return 'DJI VT13';
        case 15: return 'DD Motor';
        default: return `Unknown (${hexId})`;
      }
    },
  },
};
</script>
