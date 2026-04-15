<template>
  <pre><code ref="codeEl" :class="languageClass"><slot>{{ code }}</slot></code></pre>
</template>

<script>
import hljs from 'highlight.js/lib/core';
import yaml from 'highlight.js/lib/languages/yaml';

hljs.registerLanguage('yaml', yaml);

export default {
  name: 'Highlightjs',
  props: {
    code: {
      type: String,
      default: '',
    },
    language: {
      type: String,
      default: 'yaml',
    },
  },
  computed: {
    languageClass() {
      return `code language-${this.language}`;
    },
  },
  watch: {
    code() {
      this.highlight();
    },
  },
  mounted() {
    this.highlight();
  },
  methods: {
    highlight() {
      if (this.$refs.codeEl) {
        this.$refs.codeEl.textContent = this.code;
        hljs.highlightElement(this.$refs.codeEl);
      }
    },
  },
};
</script>

<style>
@import 'highlight.js/styles/github.css';

@import url('https://fonts.googleapis.com/css?family=JetBrains+Mono');

.code {
  font-family: 'JetBrains Mono', serif;
  line-height: 23px !important;
  padding: 0 !important;
}
</style>
