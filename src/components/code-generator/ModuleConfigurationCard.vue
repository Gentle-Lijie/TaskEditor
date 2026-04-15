<template>
  <el-card class="box-card" shadow="hover">
    <template #header>
      <div class="clearfix">
        <div>
          Slave <b><u>{{ index + 1 }}</u></b> -
          SN <b><u>{{ moduleConfiguration.sn }}</u></b> -
          <b><u>{{ getTypeFriendlyName(moduleConfiguration.type) }}</u></b>
        </div>
        <div style="margin-top: 5px">
          TXPDO (slv to master) Len
          <b><u>{{ moduleConfiguration.pdoread_offset }} / {{ getPdoLen(moduleConfiguration.type)[0] }}</u></b> -

          RXPDO (master to slv) Len
          <b><u>{{ moduleConfiguration.pdowrite_offset }} / {{ getPdoLen(moduleConfiguration.type)[1] }}</u></b>

          <el-tag v-if="moduleConfiguration.pdoread_offset > getPdoLen(moduleConfiguration.type)[0]" type="danger"
                  size="small"
                  style="margin-left: 10px">TXPDO Overflow
          </el-tag>

          <el-tag v-if="moduleConfiguration.pdowrite_offset > getPdoLen(moduleConfiguration.type)[1]" type="danger"
                  size="small"
                  style="margin-left: 10px">RXPDO Overflow
          </el-tag>

          <el-tag
              v-if="moduleConfiguration.pdoread_offset <= getPdoLen(moduleConfiguration.type)[0]
                  && moduleConfiguration.pdowrite_offset <= getPdoLen(moduleConfiguration.type)[1]"
              type="success" size="small" style="margin-left: 10px">OK
          </el-tag>
        </div>
      </div>
    </template>
    <div class="text item code">
      <highlightjs language="yaml" :code="moduleConfiguration.configuration"/>
    </div>
  </el-card>
</template>

<script>
import highlightjs from '@/components/code-generator/HighlightedCodeArea.vue';

export default {
  name: 'ModuleConfigurationCard',
  components: { highlightjs },
  props: {
    moduleConfiguration: {
      type: Object,
      required: true,
    },
    index: {
      type: Number,
      required: true,
    },
    getTypeFriendlyName: {
      type: Function,
      required: true,
    },
    getPdoLen: {
      type: Function,
      required: true,
    },
  },
};
</script>
