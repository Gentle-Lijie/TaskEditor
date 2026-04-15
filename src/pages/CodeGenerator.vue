<template>
  <div>
    <el-divider><span>Downloads</span></el-divider>
    <div style="text-align: center">
      <el-button @click="update">Refresh</el-button>
      <el-button @click="downloadAll">Download configuration file</el-button>
    </div>

    <el-divider>
      <span>
        Split views
      </span>
    </el-divider>

    <div>
      <header-card :header="header"/>

      <module-configuration-card
          v-for="(moduleConfiguration, index) in module_configurations"
          :key="moduleConfiguration.sn"
          :module-configuration="moduleConfiguration"
          :index="index"
          :get-type-friendly-name="getTypeFriendlyName"
          :get-pdo-len="getPdoLen"
      />
    </div>

  </div>
</template>

<script>
import {generateModuleDef} from '@/utils/generate-module-def';
import HeaderCard from '@/components/code-generator/HeaderCard.vue';
import ModuleConfigurationCard from '@/components/code-generator/ModuleConfigurationCard.vue';

export default {
  name: 'CodeGenerator',
  components: {
    HeaderCard,
    ModuleConfigurationCard,
  },
  data() {
    return {
      modules: [],
      module_configurations: [],
      header: 'slaves:\n',
    };
  },
  mounted() {
    this.update();
  },
  methods: {
    getTypeFriendlyName(hexId) {
      switch (hexId) {
        case 0x03:
          return 'H750 Universal Module';
        case 0x04:
          return 'H750 Universal Module (Large PDO V.)';
      }
    },
    getPdoLen(hexId) {
      switch (hexId) {
        case 0x03:
          return [80, 80];
        case 0x04:
          return [112, 80];
      }
    },
    downloadAll() {
      let textToSave = this.header;
      this.module_configurations.forEach(module_configuration => {
        textToSave += module_configuration.configuration;
      });

      const blob = new Blob([textToSave], {type: 'text/plain;charset=utf-8'});
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'config.yaml');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    },
    update() {
      if (localStorage.getItem('modules_info') != null) {
        this.modules = JSON.parse(localStorage.getItem('modules_info'));
        this.module_configurations = [];
        this.modules.forEach(module => {
          this.module_configurations.push(generateModuleDef(module));
        });
      }
    },
  },
};
</script>

<style scoped>
.box-card {
  margin-bottom: 20px;
}
</style>
