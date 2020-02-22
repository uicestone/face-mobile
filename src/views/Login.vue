<template>
  <div class="cube-page">
    <cube-form class="login-form" :model="model" :schema="schema" :options="options" @submit="login"></cube-form>
  </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { Sync } from "vuex-pathify";
import { api } from "../serivices/index";
import { login } from "../serivices/auth";
import { AuthStore } from "../store/typs";

@Component
export default class Login extends Vue {
  @Sync("auth/token") token: string;
  @Sync("auth/user") user: AuthStore["user"];

  model = {
    login: "",
    password: ""
  };

  options = {
    scrollToInvalidField: true,
    layout: "standard"
  };

  schema = {
    groups: [
      {
        legend: "登录",
        fields: [
          {
            type: "input",
            modelKey: "login",
            label: "用户名",
            props: {
              placeholder: "请输入用户名"
            },
            rules: {
              required: true
            },
            triger: "blur"
          },
          {
            type: "input",
            modelKey: "password",
            label: "密码",
            props: {
              placeholder: "请输入密码"
            },
            rules: {
              required: true
            },
            triger: "blur"
          }
        ]
      },
      {
        fields: [
          {
            type: "submit",
            label: "登录"
          }
        ]
      }
    ]
  };
  created() {
    this.checkLogin();
  }
  checkLogin() {
    if (this.token) {
      this.$router.push("/");
    }
  }

  async login(e) {
    e.preventDefault();
    const { login, password } = this.model;
    const result = await this.$apollo.mutate({
      mutation: api.auth.login,
      variables: {
        login,
        password
      }
    });

    const {
      data: { login: datas }
    } = result;
    this.token = datas.token;
    this.user = datas.user;
    window.localStorage.setItem("token", this.token);
    this.checkLogin();
  }
}
</script>

<style lang="stylus" scoped>
.login-form
  margin 40px 10px 0
</style>
