import { createApp } from 'vue'
import './assets/main.css'
import App from './App.vue'
import router from './router.js'

// 1. Import Quill core along with the Editor component
import { QuillEditor, Quill } from '@vueup/vue-quill'
import '@vueup/vue-quill/dist/vue-quill.snow.css';

// 2. DEFINE THE <HR> TAG (Divider)
const BlockEmbed = Quill.import('blots/block/embed');

class DividerBlot extends BlockEmbed {
  static create() {
    let node = super.create();
    // 1. Make it a standard HR tag
    // 2. Setting contenteditable=false helps browsers treat it as a single unit
    node.setAttribute('contenteditable', 'false'); 
    return node;
  }
}
DividerBlot.blotName = 'divider';
DividerBlot.tagName = 'hr';

Quill.register(DividerBlot);


const app = createApp(App)

app.component('QuillEditor', QuillEditor)

app.use(router)
app.mount('#app')