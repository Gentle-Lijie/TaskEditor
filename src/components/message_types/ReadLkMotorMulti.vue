<script>
</script>
<template>
  <div class="msg-type-fields">
    <el-form-item label="Message Type" style="margin: 0">
      <el-tag>custom_msgs/ReadLkMotorMulti</el-tag>
    </el-form-item>
    <el-divider/>
    <el-form-item class="havetag" label="header" style="margin: 0">
      <el-tag size="small">std_msgs/Header</el-tag>
    </el-form-item>

    <div v-for="i in [1, 2, 3, 4]" :key="i*7">
      <el-form-item class="havetag" :label="`motor${i}_online`" style="margin: 0">
        <el-tag size="small">uint8</el-tag>
      </el-form-item>
      <el-form-item class="havetag" :label="`motor${i}_current`" style="margin: 0">
        <el-tag size="small">int16</el-tag>
      </el-form-item>
      <el-form-item class="havetag" :label="`motor${i}_rpm`" style="margin: 0">
        <el-tag size="small">int16</el-tag>
      </el-form-item>
      <el-form-item class="havetag" :label="`motor${i}_encoder`" style="margin: 0">
        <el-tag size="small">uint16</el-tag>
      </el-form-item>
      <el-form-item class="havetag" :label="`motor${i}_temperature`" style="margin: 0">
        <el-tag size="small">uint8</el-tag>
      </el-form-item>
    </div>
  </div>
</template>
