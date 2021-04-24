import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import './plugins/element-ui.js'
import './style/index.scss'
import './assets/ant-icon'
// import axios from '@/plugins/axios'
import '@/plugins/frog-ui'
// import _ from 'lodash'
import { BootstrapVue } from 'bootstrap-vue'
import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import Toasted from 'vue-toasted';
require('@/style/search/style.css')


Vue.use(BootstrapVue)
Vue.use(Toasted)

// Vue.config.productionTip = false;

Vue.prototype.$vars = store.state.style.vars;

// Vue.prototype.$axios = axios;

new Vue({
	router,
	store,
	render: h => h(App)
}).$mount('#app');
