<template>
  <div class="msg-type-fields">
    <el-form-item label="Message Type" style="margin: 0">
      <el-tag>custom_msgs/ReadLkMotor</el-tag>
    </el-form-item>
    <el-divider/>
    <el-form-item class="havetag" label="header" style="margin: 0">
      <el-tag size="small">std_msgs/Header</el-tag>
    </el-form-item>
    <el-form-item class="havetag" label="online" style="margin: 0">
      <el-tag size="small">uint8</el-tag>
    </el-form-item>
    <el-form-item class="havetag" label="enabled" style="margin: 0">
      <el-tag size="small">uint8</el-tag>
    </el-form-item>
    <el-form-item class="havetag" label="current" style="margin: 0">
      <el-tag size="small">int16</el-tag>
    </el-form-item>
    <el-form-item class="havetag" label="rpm" style="margin: 0">
      <el-tag size="small">int16</el-tag>
    </el-form-item>
    <el-form-item class="havetag" label="encoder" style="margin: 0">
      <el-tag size="small">uint16</el-tag>
    </el-form-item>
    <el-form-item class="havetag" label="temperature" style="margin: 0">
      <el-tag size="small">uint8</el-tag>
    </el-form-item>
  </div>
</template>
