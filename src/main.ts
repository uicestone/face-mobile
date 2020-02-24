import Vue from "vue";
import App from "./App.vue";
import router from "./router";
import store from "./store";
import { createProvider } from "./vue-apollo";
import "amfe-flexible";
import "./cube-ui";
import "./index.css";
import dayjs from "dayjs";
import "webrtc-adapter";

Vue.config.productionTip = false;

Vue.prototype.dayjs = dayjs;

new Vue({
  router,
  store,
  apolloProvider: createProvider(),
  render: h => h(App)
}).$mount("#app");
