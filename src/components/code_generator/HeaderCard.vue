<template>
  <el-card class="box-card" shadow="hover">
    <template #header>
      <div class="clearfix">
        Header
      </div>
    </template>
    <div class="text item code" style="white-space: pre-wrap;">{{ header }}</div>
  </el-card>
</template>

<script>
export default {
  name: 'HeaderCard',
  props: {
    header: {
      type: String,
      required: true,
    },
  },
};
</script>
