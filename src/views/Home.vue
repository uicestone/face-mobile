<template>
  <div class="home" style="display:flex">
    <video ref="video" style="width: 300px;height: 300px" loop preload=""></video>
    <div ref="canvas" style="width: 300px;height: 300px"></div>
    <!-- <canvas ref="canvas" style="display: none"></canvas> -->
    <div>
      <el-input v-model="createPersonForm.PersonName" placeholder="用户名"></el-input>
      <el-radio v-model="createPersonForm.Gender" :label="1">男</el-radio>
      <el-radio v-model="createPersonForm.Gender" :label="2">女</el-radio>

      <div>
        <el-button @click="getFace">获取人脸</el-button>
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
import { Vue, Component } from "vue-property-decorator";
import * as faceapi from "face-api.js";

@Component
export default class Home extends Vue {
  apiRoot = config.apiRoot;
  video: HTMLVideoElement = null;
  photoUrl = "";
  searchResult: Array<any> = null;
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

  getImage() {
    const canvas = this.$refs.canvas as HTMLCanvasElement;
    canvas.width = this.video!.videoWidth;
    canvas.height = this.video!.videoHeight;
    canvas.getContext("2d")!.drawImage(this.video!, 0, 0, canvas.width, canvas.height);
    this.photoUrl = canvas.toDataURL("image/png");
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
    } catch (error) {
      console.log(error);
      this.$message.error("摄像头打开失败,请检查权限设置!");
    }
  }
  async initFaceApi() {
    const MODEL_URL = "/models";

    await Promise.all([faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL), faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)]);
    await this.initVideo();
    this.video.addEventListener("play", () => {
      const canvas = faceapi.createCanvasFromMedia(this.video);
      const canvasBox = this.$refs.canvas as HTMLDivElement;
      canvasBox.appendChild(canvas);
      const displaySize = { width: this.video.videoWidth, height: this.video.videoHeight };
      faceapi.matchDimensions(canvas, displaySize);
      setInterval(async () => {
        const detections = await faceapi.detectAllFaces(this.video, new faceapi.TinyFaceDetectorOptions());
        console.log(detections);
        const resizedDetections = faceapi.resizeResults(detections, displaySize);
        const c2d = canvas.getContext("2d");
        c2d.clearRect(0, 0, canvas.width, canvas.height);
        c2d.drawImage(this.video!, 0, 0, canvas.width, canvas.height);
        faceapi.draw.drawDetections(canvas, resizedDetections);
      }, 100);
    });
    setTimeout(() => {
      this.video.play();
    }, 500);
    console.log("load model finished");
  }
  async getFace() {
    const face = this.$refs.video as any;
    //@ts-ignore
    const detections = await faceapi.detectAllFaces(face, new faceapi.TinyFaceDetectorOptions());
    console.log(detections);
    const faceImages = await faceapi.extractFaces(face, detections);
    console.log(faceImages);
  }

  async checkFace() {
    this.getImage();
    const Image = this.photoUrl;
    const result = await ApiService.SearchFaces({ Image });
    this.searchResult = result.data.Results;
  }
  async createPerson() {
    this.getImage();
    const Image = this.photoUrl;
    //@ts-ignore
    const result = await ApiService.CreatePerson({ Image, ...this.createPersonForm });
    console.log(result);
  }
}
</script>
