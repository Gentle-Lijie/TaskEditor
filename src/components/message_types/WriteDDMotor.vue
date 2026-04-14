<script>
</script>
<template>
  <div>
    <el-form-item label="Message Type" style="margin: 0">
      <el-tag>custom_msgs/WriteDJIMotor</el-tag>
    </el-form-item>
    <el-divider/>
    <div v-for="i in [1, 2, 3, 4]" :key="i*7">
      <el-form-item :label="`motor${i}_enable`" class="havetag" style="margin: 0">
        <el-tag size="small">uint8</el-tag>
      </el-form-item>
      <el-form-item :label="`motor${i}_cmd`" class="havetag" style="margin: 0">
        <el-tag size="small">int16</el-tag>
      </el-form-item>
    </div>
  </div>
</template>
