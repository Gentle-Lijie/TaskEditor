<template>
  <el-form-item :label="label">
    <el-input v-model="row[field]">
      <template #prefix>0x</template>
    </el-input>
  </el-form-item>
</template>

<script>
export default {
  name: "HexInput",
  props: {
    row: {type: Object, required: true},
    field: {type: String, required: true},
    label: {type: String, default: "ID"}
  },
}
</script>
