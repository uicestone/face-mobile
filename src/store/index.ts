import Vue from "vue";
import Vuex from "vuex";
import pathify, { make } from "vuex-pathify";

import auth from "./auth";
import { AuthStore } from "./typs";

const state = {};

pathify.options.mapping = "simple";

const mutations = make.mutations(state);
Vue.use(Vuex);

const store = new Vuex.Store<{
  auth: AuthStore;
}>({
  plugins: [pathify.plugin],
  //@ts-ignore
  state,
  mutations,
  modules: { auth }
});

Vue.prototype.$store = store;

export default store;
