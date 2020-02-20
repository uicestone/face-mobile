<template>
  <div class="home" style="display:flex">
    <video ref="video" style="width: 100px;height: 100px" loop preload=""></video>
    <canvas ref="canvas" style="width: 100px;height: 100px"></canvas>
    <div>
      <el-input v-model="createPersonForm.PersonName" placeholder="用户名"></el-input>
      <el-radio v-model="createPersonForm.Gender" :label="1">男</el-radio>
      <el-radio v-model="createPersonForm.Gender" :label="2">女</el-radio>

      <div>
        <el-button @click="checkFace">检测人脸</el-button>
        <el-button @click="createPerson" :disabled="!canCreatePersonForm">创建人员</el-button>
      </div>
      <div v-if="searchResult">
        <div v-for="(item, index) in searchResult" :key="index">
          <div v-for="(data, index1) in item.Candidates" :key="index1">
            <img :src="loadImage(data.FaceId)" width="100" height="100" />
            <div>{{ data.PersonName }}</div>
            <div>{{ data.Score }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ApiService } from "../utils/axios";
import config from "../config";

export default {
  name: "Home",
  data() {
    return {
      apiRoot: config.apiRoot,
      video: undefined as HTMLVideoElement | undefined,
      mediaStreamTrack: undefined as MediaStream | undefined,
      photoUrl: "",
      searchResult: undefined as Array<any> | undefined,
      createPersonForm: {
        PersonName: null,
        Gender: null
      }
    };
  },
  mounted() {
    this.init();
  },
  computed: {
    canCreatePersonForm() {
      //@ts-ignore
      const { PersonName, Gender } = this.createPersonForm;
      return PersonName && Gender;
    }
  },
  methods: {
    loadImage(faceId: string) {
      return `${this.apiRoot}/static/${faceId}.png`;
    },
    async checkFace() {
      this.getImage();
      const Image = this.photoUrl;
      const result = await ApiService.SearchFaces({ Image });
      console.log(result);
      this.searchResult = result.data.Results;
    },
    async createPerson() {
      this.getImage();
      const Image = this.photoUrl;
      //@ts-ignore
      const result = await ApiService.CreatePerson({ Image, ...this.createPersonForm });
      console.log(result);
    },
    getImage() {
      const canvas = this.$refs.canvas as HTMLCanvasElement;
      canvas.width = this.video!.videoWidth;
      canvas.height = this.video!.videoHeight;
      canvas.getContext("2d")!.drawImage(this.video!, 0, 0, canvas.width, canvas.height);
      this.photoUrl = canvas.toDataURL("image/png");
    },
    init() {
      //@ts-ignore
      let video = (this.video = this.$refs.video as HTMLVideoElement);
      navigator.mediaDevices
        .getUserMedia({
          audio: false,
          video: {
            width: { min: 100, ideal: 100 },
            height: { min: 100, ideal: 100 }
          }
        })
        .then(stream => {
          this.mediaStreamTrack = stream;
          this.video!.srcObject = stream;
          this.video!.play();
        })
        .catch(error => {
          console.log(error);
          this.$message.error("摄像头打开失败,请检查权限设置!");
        });
    }
  }
};
</script>
