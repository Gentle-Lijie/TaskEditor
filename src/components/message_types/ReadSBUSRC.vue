<script>
</script>
<template>
  <div class="msg-type-fields">
    <el-form-item label="Message Type" style="margin: 0">
      <el-tag>custom_msgs/ReadSBUSRC</el-tag>
    </el-form-item>
    <el-divider/>
    <el-form-item class="havetag" label="header" style="margin: 0">
      <el-tag size="small">std_msgs/Header</el-tag>
    </el-form-item>
    <el-form-item class="havetag" label="online" style="margin: 0">
      <el-tag size="small">uint8</el-tag>
    </el-form-item>
    <el-form-item class="havetag" label="channels" style="margin: 0">
      <el-tag size="small">uint16[16]</el-tag>
    </el-form-item>
    <el-form-item class="havetag" label="ch17" style="margin: 0">
      <el-tag size="small">uint8</el-tag>
    </el-form-item>
    <el-form-item class="havetag" label="ch18" style="margin: 0">
      <el-tag size="small">uint8</el-tag>
    </el-form-item>
    <el-form-item class="havetag" label="fail_safe" style="margin: 0">
      <el-tag size="small">uint8</el-tag>
    </el-form-item>
    <el-form-item class="havetag" label="frame_lost" style="margin: 0">
      <el-tag size="small">uint8</el-tag>
    </el-form-item>
  </div>
</template>
