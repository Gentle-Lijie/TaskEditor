<template>
  <div id="app">
    <h2 style="margin-bottom: 10px; font-size: 18px; font-weight: bold;">University of Nottingham EtherCAT Module
      Configuration</h2>
    <el-tabs v-model="activeName" :before-leave="call_update" stretch>
      <el-tab-pane label="Module Settings" name="assignment">
        <module-settings/>
      </el-tab-pane>

      <el-tab-pane label="Config Generator" name="generator">
        <code-generator ref="generator"/>
      </el-tab-pane>
    </el-tabs>

    <div class="copyright">
      <div class="c_top">
        <div class="xh">Made<br>with love</div>
      </div>
      <div>2025.12 v2.1</div>
    </div>
  </div>
</template>

<script>
import ModuleSettings from "@/pages/module_settings.vue";
import CodeGenerator from "@/pages/code_generator.vue";

export default {
  name: 'TaskAssignment',
  components: {
    ModuleSettings,
    CodeGenerator
  },
  mounted() {
    document.title = 'TaskAssignment'
  },
  data() {
    return {
      activeName: 'assignment'
    };
  },
  methods: {
    call_update() {
      this.$refs.generator.update()
    }
  }
}
</script>
<style>
#app {
  margin: 25px;
  font-family: Arial, serif !important;
}

.el-page-header__left {
  display: none !important;
}

.xh {
  font-size: 15px;
  padding-left: 15px;
  padding-top: 10px;
}

.copyright {
  position: relative;
  bottom: 10px;
  margin-top: 30px;
  user-select: none;
  width: 100%;
  text-align: center;
  font-size: 12px;
  color: #555;
}

.c_top {
  display: inline-block;
  height: 70px;
  padding-top: 19px;
  padding-left: 75px;
  font-size: 17px;

  vertical-align: top;
  background: url('@/assets/images/xh.png') no-repeat left center;
  background-size: contain;
}
</style>
