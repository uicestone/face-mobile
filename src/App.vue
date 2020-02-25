<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";
import { api } from "./serivices";
import { Sync } from "vuex-pathify";
import { AuthStore } from "./store/typs";
import { Message, gqlErrorHanding } from "./utils";
import { Toast } from "cube-ui";
import { vm } from "./main";
import { ApolloError } from "apollo-client";

@Component({
  apollo: {
    user: {
      query: api.auth.me,
      skip() {
        return !this.token;
      },
      update({ me }) {
        this.user = me;
        if (!this.user.community) {
          Message({ message: "用户尚未绑定小区" });
        }
        return me;
      },
      error: gqlErrorHanding()
    }
  }
})
export default class App extends Vue {
  @Sync("auth/token") token: AuthStore["token"];
  @Sync("auth/user") user: AuthStore["user"];
}
</script>

<style lang="stylus">
#app
  font-family Avenir, Helvetica, Arial, sans-serif
  -webkit-font-smoothing antialiased
  -moz-osx-font-smoothing grayscale
  // text-align center
  color #2c3e50
  span, div
    // font-size initial
.cube-page
  position absolute
  z-index 10
  top 0
  left 0
  height 100%
  width 100%
  box-sizing border-box
  background #efeff4
  font-size 0.7rem
.padding
  padding 10px
.page-title
  text-align center
  font-size 0.75rem
  margin 1rem auto
.credit
  position absolute
  bottom 0.5rem
  text-align center
  width 100%
  color #888
  font-size 0.4rem
.card
  background: #fff;
  box-shadow: 0.1rem 0.05rem 0.4rem #aaa;
  padding: 0.4rem;
  margin 0.4rem 0;
  border-radius: 0.15rem;
</style>
