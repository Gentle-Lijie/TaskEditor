<template>
  <el-form-item :label="`Action When Connection Lost - ${label}`">
    <el-radio-group v-model="currentValue">
      <el-radio :label="0x01">Keep Last</el-radio>
      <el-radio :label="0x02">Reset to Default</el-radio>
    </el-radio-group>
  </el-form-item>
</template>

<script>
export default {
  name: 'ConnectionLostActionSelector',
  props: {
    modelValue: {
      type: Number,
      default: 0x01,
    },
    label: {
      type: String,
      default: 'Publisher',
    },
  },
  emits: ['update:modelValue'],
  computed: {
    currentValue: {
      get() {
        return this.modelValue;
      },
      set(val) {
        this.$emit('update:modelValue', val);
      },
    },
  },
};
</script>
