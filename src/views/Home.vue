<template>
  <div class="home" style="display:flex">
    <video ref="video" style="width: 300px;height: 300px" loop preload=""></video>
    <canvas ref="canvas" style="display: none"></canvas>
    <div ref="imgs">
      <div :class="{ 'select-img': (currentImg = item) }" v-for="(item, index) in images" :key="index" @click="currentImg = item">
        <img :src="item" />
      </div>
    </div>

    <div>
      <el-input v-model="createPersonForm.PersonName" placeholder="用户名"></el-input>
      <el-radio v-model="createPersonForm.Gender" :label="1">男</el-radio>
      <el-radio v-model="createPersonForm.Gender" :label="2">女</el-radio>

      <div>
        <el-button @click="getFace" :loading="modeloading || !videoReady">拍照</el-button>
        <el-button @click="checkFace" :loading="modeloading || !videoReady">检测人脸</el-button>
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
import { Vue, Component } from "vue-property-decorator";
import * as faceapi from "face-api.js";

@Component
export default class Home extends Vue {
  apiRoot = config.apiRoot;
  video: HTMLVideoElement = null;
  currentImg = "";
  images = [];
  searchResult: Array<any> = null;
  modeloading = true;
  videoReady = false;
  createPersonForm = {
    PersonName: null,
    Gender: null
  };

  get canCreatePersonForm() {
    const { PersonName, Gender } = this.createPersonForm;
    return PersonName && Gender;
  }

  mounted() {
    this.init();
  }

  loadImage(faceId: string) {
    return `${this.apiRoot}/static/${faceId}.png`;
  }

  async getImage() {
    const canvas = this.$refs.canvas as HTMLCanvasElement;
    const imgs = this.$refs.imgs as HTMLDivElement;
    canvas.width = this.video!.videoWidth;
    canvas.height = this.video!.videoHeight;
    canvas.getContext("2d")!.drawImage(this.video!, 0, 0, canvas.width, canvas.height);
    const detections = await faceapi.detectAllFaces(this.video, new faceapi.TinyFaceDetectorOptions());
    const faceImages = await faceapi.extractFaces(canvas, detections);
    this.images = faceImages.map(i => i.toDataURL());
  }

  async init() {
    await this.initFaceApi();
  }
  async initVideo() {
    //@ts-ignore
    let video = (this.video = this.$refs.video as HTMLVideoElement);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          width: { min: 300, ideal: 300 },
          height: { min: 300, ideal: 300 }
        }
      });
      this.video!.srcObject = stream;
      this.video.addEventListener("play", () => {
        this.videoReady = true;
      });
      this.video.play();
    } catch (error) {
      console.log(error);
      this.$message.error("摄像头打开失败,请检查权限设置!");
    }
  }
  async initFaceApi() {
    const MODEL_URL = "/models";

    await Promise.all([faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL), faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL), this.initVideo()]);
    this.modeloading = false;
    // this.video.addEventListener("play", () => {
    //   const canvas = faceapi.createCanvasFromMedia(this.video);
    //   const canvasBox = this.$refs.canvas as HTMLDivElement;
    //   canvasBox.appendChild(canvas);
    //   const displaySize = { width: this.video.videoWidth, height: this.video.videoHeight };
    //   faceapi.matchDimensions(canvas, displaySize);
    //   setInterval(async () => {
    //     const detections = await faceapi.detectAllFaces(this.video, new faceapi.TinyFaceDetectorOptions());
    //     const faceImages = await faceapi.extractFaces(this.vi)
    //     console.log(detections);
    //     const resizedDetections = faceapi.resizeResults(detections, displaySize);
    //     const c2d = canvas.getContext("2d");
    //     c2d.clearRect(0, 0, canvas.width, canvas.height);
    //     c2d.drawImage(this.video!, 0, 0, canvas.width, canvas.height);
    //     faceapi.draw.drawDetections(canvas, resizedDetections);
    //   }, 1000);
    // });
    // setTimeout(() => {
    //   this.video.play();
    // }, 500);
    console.log("load model finished");
  }
  async getFace() {
    this.getImage();
  }

  async checkFace() {
    const Image = this.currentImg;
    const result = await ApiService.SearchFaces({ Image });
    this.searchResult = result.data.Results;
  }
  async createPerson() {
    this.getImage();
    const Image = this.currentImg;
    //@ts-ignore
    const result = await ApiService.CreatePerson({ Image, ...this.createPersonForm });
    console.log(result);
  }
}
</script>


<style lang="stylus" scoped>
.select-img
  border solid 2px blue
</style>