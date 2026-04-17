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
      <!-- Fixable issues — will be auto-corrected -->
      <el-alert
        v-if="fixableErrors.length > 0"
        type="info"
        :closable="false"
        style="margin-bottom: 15px;"
      >
        <template #title>Auto-fixable Issues ({{ fixableErrors.length }}) — will be corrected on import</template>
        <div v-for="(err, idx) in fixableErrors" :key="'f'+idx" style="font-size: 12px;">
          {{ formatVerifyIssue(err) }}
        </div>
      </el-alert>

      <!-- Unfixable errors — affected tasks will be skipped -->
      <el-alert
        v-if="unfixableErrors.length > 0"
        type="warning"
        :closable="false"
        style="margin-bottom: 15px;"
      >
        <template #title>Issues Found ({{ unfixableErrors.length }}) — affected tasks will be skipped</template>
        <div v-for="(err, idx) in unfixableErrors.slice(0, 10)" :key="'u'+idx" style="font-size: 12px;">
          {{ formatVerifyIssue(err) }}
        </div>
        <div v-if="unfixableErrors.length > 10" style="font-size: 12px; color: #909399;">
          ... and {{ unfixableErrors.length - 10 }} more issues
        </div>
      </el-alert>

      <!-- Warnings -->
      <el-alert
        v-if="verifyResult && verifyResult.warnings.length > 0"
        type="warning"
        :closable="false"
        style="margin-bottom: 15px;"
      >
        <template #title>Warnings ({{ verifyResult.warnings.length }})</template>
        <div v-for="(warn, idx) in verifyResult.warnings.slice(0, 10)" :key="'w'+idx" style="font-size: 12px;">
          {{ formatVerifyIssue(warn) }}
        </div>
        <div v-if="verifyResult.warnings.length > 10" style="font-size: 12px; color: #909399;">
          ... and {{ verifyResult.warnings.length - 10 }} more warnings
        </div>
      </el-alert>

      <!-- Parse warnings -->
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

      <!-- All clean -->
      <el-alert
        v-if="verifyResult && verifyResult.errors.length === 0 && verifyResult.warnings.length === 0"
        type="success"
        :closable="false"
        style="margin-bottom: 15px;"
      >
        <template #title>Verification Passed</template>
      </el-alert>

      <!-- Import summary -->
      <el-alert
        type="info"
        :closable="false"
        style="margin-bottom: 15px;"
      >
        <template #title>{{ importSummaryText }}</template>
      </el-alert>

      <!-- Module table with status indicators -->
      <el-table :data="parsedModules" border size="small">
        <el-table-column prop="sn" label="SN" width="70" />
        <el-table-column label="Status" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="isModuleBroken(row.sn)" type="danger" size="small">Skip</el-tag>
            <el-tag v-else-if="getModuleBrokenTaskCount(row) > 0" type="warning" size="small">Partial</el-tag>
            <el-tag v-else type="success" size="small">OK</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="Latency Topic" min-width="160">
          <template #default="{ row }">{{ row.latency_topic }}</template>
        </el-table-column>
        <el-table-column label="Tasks">
          <template #default="{ row }">
            <template v-for="(t, i) in row.task" :key="i">
              <el-tag
                v-if="isTaskBroken(row.sn, i + 1)"
                type="danger"
                size="small"
                style="margin: 2px; text-decoration: line-through;"
              >
                {{ getAppTypeFriendlyName(t.type) }}
              </el-tag>
              <el-tag
                v-else
                size="small"
                style="margin: 2px;"
              >
                {{ getAppTypeFriendlyName(t.type) }}
              </el-tag>
            </template>
            <span v-if="row.task.length === 0" style="color: #909399;">(none)</span>
          </template>
        </el-table-column>
      </el-table>

      <div style="margin-top: 15px; text-align: right;">
        <el-button @click="step = 'select'">Back</el-button>
        <el-button
          type="primary"
          :disabled="!hasSomethingToImport"
          @click="startImport"
        >
          {{ importButtonText }}
        </el-button>
      </div>
    </div>

    <!-- Step 3: Done -->
    <div v-if="step === 'done'" style="text-align: center; padding: 20px 0;">
      <el-icon :size="48" style="color: #67c23a;"><CircleCheckFilled /></el-icon>
      <div style="margin-top: 12px; font-size: 16px; font-weight: 500;">Import Successful</div>
      <div style="margin-top: 4px; color: #909399;">
        {{ importedModuleCount }} module(s) with {{ importedTaskCount }} task(s) loaded
      </div>
      <div v-if="skippedTaskCount > 0" style="margin-top: 4px; color: #e6a23c;">
        {{ skippedTaskCount }} task(s) skipped due to errors
      </div>
      <el-button type="primary" style="margin-top: 20px;" @click="close">Close</el-button>
    </div>
  </el-dialog>
</template>

<script>
import { UploadFilled, CircleCheckFilled } from '@element-plus/icons-vue';
import { ElMessageBox } from 'element-plus';
import { parseConfigYaml } from '@/utils/parse-config';
import { verifyConfig } from '@/utils/verify-config';

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
      verifyResult: null,
      importedModuleCount: 0,
      importedTaskCount: 0,
      skippedTaskCount: 0,
    };
  },
  computed: {
    visible: {
      get() { return this.modelValue; },
      set(val) { this.$emit('update:modelValue', val); },
    },
    fixableErrors() {
      if (!this.verifyResult) return [];
      return this.verifyResult.errors.filter(e => e.fixable);
    },
    unfixableErrors() {
      if (!this.verifyResult) return [];
      return this.verifyResult.errors.filter(e => !e.fixable);
    },
    brokenTaskKeys() {
      const keys = new Set();
      for (const err of this.unfixableErrors) {
        if (err.module && err.task) {
          keys.add(`${err.module}:${err.task}`);
        }
      }
      return keys;
    },
    brokenModuleSns() {
      const sns = new Set();
      for (const err of this.unfixableErrors) {
        if (err.module && !err.task) {
          sns.add(err.module);
        }
      }
      return sns;
    },
    hasSomethingToImport() {
      return this.parsedModules.some(mod => {
        if (this.brokenModuleSns.has(mod.sn)) return false;
        return (mod.task || []).some((t, i) => !this.brokenTaskKeys.has(`${mod.sn}:app_${i + 1}`));
      });
    },
    importSummaryText() {
      const total = this.parsedModules.length;
      let cleanModules = 0, cleanTasks = 0, brokenTasks = 0;
      for (const mod of this.parsedModules) {
        if (this.brokenModuleSns.has(mod.sn)) continue;
        cleanModules++;
        for (let i = 0; i < (mod.task || []).length; i++) {
          if (this.brokenTaskKeys.has(`${mod.sn}:app_${i + 1}`)) {
            brokenTasks++;
          } else {
            cleanTasks++;
          }
        }
      }
      const brokenModules = total - cleanModules;
      let text = `Found ${total} module(s), ${cleanTasks} task(s) will be imported.`;
      if (brokenModules > 0) text += ` ${brokenModules} module(s) skipped.`;
      if (brokenTasks > 0) text += ` ${brokenTasks} task(s) skipped.`;
      if (this.fixableErrors.length > 0) text += ` ${this.fixableErrors.length} issue(s) will be auto-corrected.`;
      return text;
    },
    importButtonText() {
      if (this.fixableErrors.length > 0 && this.unfixableErrors.length > 0) {
        return 'Import (fix & skip broken)';
      }
      if (this.fixableErrors.length > 0) return 'Import (auto-fix)';
      if (this.unfixableErrors.length > 0) return 'Import (skip broken)';
      return 'Import (replace current config)';
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

      // Run verification
      this.verifyResult = verifyConfig(this.fileContent);

      if (this.parsedModules.length === 0) {
        this.parseErrors.push({ message: 'No valid modules found in file' });
        return;
      }
      this.step = 'preview';
    },

    startImport() {
      if (this.fixableErrors.length > 0) {
        const lines = this.fixableErrors.map(e => this.formatVerifyIssue(e)).join('\n');
        ElMessageBox.confirm(
          `The following issues will be auto-corrected:\n\n${lines}\n\nProceed with import?`,
          'Confirm Auto-fix',
          { confirmButtonText: 'Import with fixes', cancelButtonText: 'Cancel', type: 'info' }
        ).then(() => {
          this.doImport();
        }).catch(() => {});
      } else {
        this.doImport();
      }
    },

    doImport() {
      // Filter out broken modules and tasks
      const cleanModules = this.parsedModules
        .filter(mod => !this.brokenModuleSns.has(mod.sn))
        .map(mod => {
          const cleanTasks = (mod.task || []).filter(
            (t, i) => !this.brokenTaskKeys.has(`${mod.sn}:app_${i + 1}`)
          );
          return { ...mod, task: cleanTasks };
        });

      let uidCounter = Date.now();
      this.importedModuleCount = cleanModules.length;
      this.importedTaskCount = 0;
      this.skippedTaskCount = 0;

      cleanModules.forEach(mod => {
        mod._uid = uidCounter++;
        if (mod.task) {
          mod.task.forEach(t => {
            t._uid = uidCounter++;
            this.importedTaskCount++;
          });
        }
      });

      // Count skipped tasks
      for (const mod of this.parsedModules) {
        if (this.brokenModuleSns.has(mod.sn)) {
          this.skippedTaskCount += (mod.task || []).length;
        } else {
          for (let i = 0; i < (mod.task || []).length; i++) {
            if (this.brokenTaskKeys.has(`${mod.sn}:app_${i + 1}`)) {
              this.skippedTaskCount++;
            }
          }
        }
      }

      this.$emit('imported', cleanModules);
      this.step = 'done';
    },

    reset() {
      this.step = 'select';
      this.fileContent = '';
      this.fileName = '';
      this.parsedModules = [];
      this.parseErrors = [];
      this.verifyResult = null;
      this.importedModuleCount = 0;
      this.importedTaskCount = 0;
      this.skippedTaskCount = 0;
    },

    close() {
      this.visible = false;
    },

    isModuleBroken(sn) {
      return this.brokenModuleSns.has(sn);
    },

    getModuleBrokenTaskCount(mod) {
      return (mod.task || []).filter(
        (t, i) => this.brokenTaskKeys.has(`${mod.sn}:app_${i + 1}`)
      ).length;
    },

    isTaskBroken(sn, appNum) {
      return this.brokenTaskKeys.has(`${sn}:app_${appNum}`);
    },

    formatVerifyIssue(issue) {
      const parts = [];
      if (issue.module) parts.push(`sn${issue.module}`);
      if (issue.task) parts.push(issue.task);
      const loc = parts.length > 0 ? `[${parts.join('/')}] ` : '';
      const line = issue.line ? `L${issue.line}: ` : '';
      return `${loc}${line}${issue.message}`;
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
