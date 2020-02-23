import { make } from "vuex-pathify";
import { AuthStore } from "./typs";

const state: AuthStore = {
  token: localStorage.getItem("token") || "",
  user: {
    id: "",
    name: "",
    community: {
      id: "",
      address: "",
      name: ""
    }
  }
};

const mutations = make.mutations(state);

export default {
  namespaced: true,
  state,
  mutations
};
