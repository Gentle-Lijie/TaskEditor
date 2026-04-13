import { createApp } from 'vue';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import enLang from 'element-plus/es/locale/lang/en';
import App from './App.vue';

const app = createApp(App);

app.use(ElementPlus, {
  size: 'default',
  locale: enLang,
});

app.mount('#app');
