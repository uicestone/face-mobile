<template>
  <div class="cube-page">
    <div class="padding" v-if="status == 'init'" style="display:flex; flex-direction: column; justify-content: center; height:100%">
      <cube-button @click="takePhoto" :disabled="modeloading" primary>拍照</cube-button>
      <cube-button style="margin-top: 50px" @click="logout" outline>退出</cube-button>
    </div>
    <div class="take-photo" v-else-if="status == 'takePhoto'">
      <video ref="video" class="camera" loop></video>
      <canvas ref="canvas" style="display: none"></canvas>
      <cube-button @click="getImage" :disabled="!videoReady">拍照</cube-button>
    </div>
    <div v-else class="select-image padding">
      <div v-if="selectImageStatus == 'init'">
        <div class="imgs">
          <img :class="{ 'select-img': currentImg == item, face: true }" :src="item" v-for="(item, index) in images" :key="index" @click="checkFace(item)" />
        </div>
        <div v-if="searchResult">
          <div v-for="(item, index) in searchResult" :key="index">
            <div class="face" v-for="(data, index1) in item.Candidates" :key="index1">
              <img :src="loadImage(data.PersonId)" width="100" height="100" />
              <div>{{ data.PersonName }}</div>
              <div>{{ data.Score }}</div>
            </div>
          </div>
        </div>
        <div class="action px-2 pb-2">
          <cube-button @click="takePhoto">重拍</cube-button>
          <cube-button @click="selectImageStatus = 'addNew'" class="ml-2" :disabled="!currentImg">新增</cube-button>
        </div>
      </div>
      <div v-else-if="selectImageStatus == 'addNew'">
        <div class="imgs flex justify-center">
          <img class="face" :src="currentImg" />
        </div>
        <cube-input v-model="createPersonForm.PersonName" placeholder="用户名"></cube-input>
        <cube-input type="number" v-model="createPersonForm.PersonAge" placeholder="年龄"></cube-input>
        <cube-radio-group v-model="createPersonForm.Gender" :options="genderOptions" :horizontal="true" />
        <cube-checker type="radio" v-model="createPersonForm.PersonLevel" :options="levelOptions" />

        <div class="action px-2 pb-2">
          <cube-button @click="selectImageStatus = 'init'" :disabled="modeloading || !videoReady">取消</cube-button>
          <cube-button @click="selectImageStatus = 'addNew'" class="ml-2" :disabled="modeloading || !videoReady">确认</cube-button>
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
  currentImg = null;
  images = [];
  searchResult: Array<any> = null;
  modeloading = true;
  videoReady = false;
  status: "init" | "takePhoto" | "selectImage" = "init";
  selectImageStatus: "init" | "addNew" = "init";
  isGettingImage = false;
  createPersonForm = {
    PersonName: null,
    Gender: 1,
    PersonLevel: "BLUE",
    PersonAge: null,
    UnitId: null,
    CommunityId: null
  };
  genderOptions = [
    { label: "男", value: 1 },
    { label: "女", value: 2 }
  ];
  levelOptions = [
    { text: "blue", value: "BLUE" },
    { text: "green", value: "GREEN" },
    { text: "yellow", value: "YELLOW" },
    { text: "red", value: "RED" }
  ];

  get canCreatePersonForm() {
    const { PersonName, Gender } = this.createPersonForm;
    return PersonName && Gender;
  }

  mounted() {
    this.init();
  }

  loadImage(PersonId: string) {
    return `${this.apiRoot}/static/${PersonId}.png`;
  }

  async takePhoto() {
    this.status = "takePhoto";
    this.searchResult = null;
    this.currentImg = null;
    this.images = [];
    this.$nextTick(() => {
      this.initVideo();
    });
  }
  async logout() {
    localStorage.removeItem("token");
    window.location.reload();
  }

  async getImage() {
    const loadingToast = this.$createToast({
      time: 0,
      txt: "Loading..."
    });
    loadingToast.show();
    const canvas = this.$refs.canvas as HTMLCanvasElement;
    const imgs = this.$refs.imgs as HTMLDivElement;
    canvas.width = this.video!.videoWidth;
    canvas.height = this.video!.videoHeight;
    canvas.getContext("2d")!.drawImage(this.video!, 0, 0, canvas.width, canvas.height);
    const detections = await faceapi.detectAllFaces(this.video, new faceapi.TinyFaceDetectorOptions());
    const faceImages = await faceapi.extractFaces(canvas, detections);
    loadingToast.hide();
    if (detections.length == 0 || faceImages.length == 0) {
      this.$createToast({
        time: 1000,
        type: "txt",
        txt: "未检测到人脸，请重新拍摄."
      }).show();
    } else {
      this.images = Array(4).fill(faceImages.map(i => i.toDataURL())[0]);
      this.status = "selectImage";
    }

    this.isGettingImage = false;
  }

  async init() {
    await this.initFaceApi();
  }
  async initVideo() {
    const toast = this.$createToast({
      txt: "Loading...",
      time: 0,
      mask: true
    });
    toast.show();
    let video = (this.video = this.$refs.video as HTMLVideoElement);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          width: { min: 300, ideal: 500 },
          height: { min: 300, ideal: 500 }
        }
      });
      this.video!.srcObject = stream;
      this.video.addEventListener("play", () => {
        this.videoReady = true;
        setTimeout(() => {
          toast.hide();
        }, 1000);
      });
      this.video.play();
    } catch (error) {
      console.log(error);
      this.$createToast({
        time: 1000,
        txt: "摄像头打开失败,请检查权限设置!"
      }).show();
    }
  }
  async initFaceApi() {
    const MODEL_URL = "/models";

    await Promise.all([faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL), faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)]);
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
  async checkFace(img: string) {
    this.currentImg = img;
    const result = await ApiService.SearchPersons({ Image: img });
    this.searchResult = result.data.Results;
  }
  async createPerson() {
    const Image = this.currentImg;
    //@ts-ignore
    const result = await ApiService.CreatePerson({ Image, ...this.createPersonForm });
    console.log(result);
  }
}
</script>

<style lang="stylus">
.face
  width 25%
.select-image
  .imgs
    display flex
    flex-wrap wrap
    width 100%

    .select-img
      border solid 2px orange
  .action
    position fixed
    left 0
    bottom 0
    width 100vw
    display flex
.take-photo
  background #222
  min-width: 100vw
  min-height: 100vh
  .camera
      min-width: 100vw
      min-height: 80vh
</style>
