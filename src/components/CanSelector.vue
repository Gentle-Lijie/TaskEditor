<template>
  <div>
    <el-form-item label="CAN Port">
      <el-radio-group v-model="row.can_inst">
        <el-radio :label="1">CAN1</el-radio>
        <el-radio :label="2">CAN2</el-radio>
      </el-radio-group>
    </el-form-item>

    <el-form-item label="CAN Baudrate" v-if="showBaudrate">
      <el-tag>{{ baudrate }}</el-tag>
    </el-form-item>
  </div>
</template>

<script>
export default {
  name: "CanSelector",
  props: {
    row: {type: Object, required: true},
    showBaudrate: {type: Boolean, default: true},
    baudrate: {type: String, default: "1 Mbit/s"}
  }
}
</script>
