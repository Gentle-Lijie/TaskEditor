<template>
  <el-form-item :label="label">
    <el-input
        v-model="row[field]"
        @input="onInput"
    >
      <template #append v-if="unit">{{ unit }}</template>
    </el-input>
  </el-form-item>
</template>

<script>
export default {
  name: "NumberInput",
  props: {
    row: {type: Object, required: true},
    field: {type: String, required: true},
    label: {type: String, default: ""},
    unit: {type: String, default: ""},
    regex: {
      type: RegExp,
      default: () => /^\D*(\d*(?:\.\d{0,})?).*$/g
    }
  },
  methods: {
    onInput(value) {
      this.row[this.field] = value.replace(this.regex, '$1');
    }
  }
}
</script>
