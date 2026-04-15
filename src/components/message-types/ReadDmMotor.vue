<template>
  <div class="msg-type-fields">
    <el-form-item label="Message Type" style="margin: 0">
      <el-tag>custom_msgs/ReadDmMotor</el-tag>
    </el-form-item>
    <el-divider/>
    <el-form-item class="havetag" label="header" style="margin: 0">
      <el-tag size="small">std_msgs/Header</el-tag>
    </el-form-item>
    <el-form-item class="havetag" label="disabled" style="margin: 0">
      <el-tag size="small">uint8</el-tag>
    </el-form-item>
    <el-form-item class="havetag" label="enabled" style="margin: 0">
      <el-tag size="small">uint8</el-tag>
    </el-form-item>
    <el-form-item class="havetag" label="overvoltage" style="margin: 0">
      <el-tag size="small">uint8</el-tag>
    </el-form-item>
    <el-form-item class="havetag" label="overcurrent" style="margin: 0">
      <el-tag size="small">uint8</el-tag>
    </el-form-item>
    <el-form-item class="havetag" label="mos_overtemperature" style="margin: 0">
      <el-tag size="small">uint8</el-tag>
    </el-form-item>
    <el-form-item class="havetag" label="rotor_overtemperature" style="margin: 0">
      <el-tag size="small">uint8</el-tag>
    </el-form-item>
    <el-form-item class="havetag" label="communication_lost" style="margin: 0">
      <el-tag size="small">uint8</el-tag>
    </el-form-item>
    <el-form-item class="havetag" label="overload" style="margin: 0">
      <el-tag size="small">uint8</el-tag>
    </el-form-item>
    <el-form-item class="havetag" label="position" style="margin: 0">
      <el-tag size="small">float32</el-tag>
    </el-form-item>
    <el-form-item class="havetag" label="velocity" style="margin: 0">
      <el-tag size="small">float32</el-tag>
    </el-form-item>
    <el-form-item class="havetag" label="torque" style="margin: 0">
      <el-tag size="small">float32</el-tag>
    </el-form-item>
    <el-form-item class="havetag" label="mos_temperature" style="margin: 0">
      <el-tag size="small">uint8</el-tag>
    </el-form-item>
    <el-form-item class="havetag" label="rotor_temperature" style="margin: 0">
      <el-tag size="small">uint8</el-tag>
    </el-form-item>
  </div>
</template>
