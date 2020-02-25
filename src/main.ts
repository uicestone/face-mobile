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

//@ts-ignore
window.navigator.getUserMedia = navigator.getUserMedia || navigator.webKitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

Vue.config.productionTip = false;

Vue.prototype.dayjs = dayjs;

export const vm = new Vue({
  router,
  store,
  apolloProvider: createProvider(),
  render: h => h(App)
}).$mount("#app");
