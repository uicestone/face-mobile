<template>
  <div id="app">
    <router-view></router-view>
  </div>
</template>

<script lang="ts">
import { Vue, Component } from "vue-property-decorator";

@Component
export default class App extends Vue {}
</script>

<style lang="stylus">
#app
  font-family Avenir, Helvetica, Arial, sans-serif
  -webkit-font-smoothing antialiased
  -moz-osx-font-smoothing grayscale
  text-align center
  color #2c3e50
  span
    font-size initial
.cube-page
  position absolute
  z-index 10
  top 0
  left 0
  height 100%
  width 100%
  box-sizing border-box
  background #efeff4
.padding
  padding 10px
</style>
