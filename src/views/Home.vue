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
    <div v-else-if="status == 'selectImage'" class="select-image padding">
      <div v-if="selectImageStatus == 'init'">
        <div class="imgs">
          <img :class="{ 'select-img': currentImg == item, face: true }" :src="item" v-for="(item, index) in images" :key="index" @click="checkFace(item)" />
        </div>
        <div v-if="searchResult">
          <div v-for="(item, index) in searchResult" :key="index">
            <div class="face" v-for="(data, index1) in item.Candidates" :key="index1" @click="goResidentDetail(data.PersonId)">
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
        <cube-form class="login-form" :model="createPersonForm" :schema="schema"></cube-form>

        <!-- <cube-input v-model="createPersonForm.PersonName" placeholder="用户名"></cube-input>
        <cube-input type="number" v-model="createPersonForm.PersonAge" placeholder="年龄"></cube-input>
        <cube-radio-group v-model="createPersonForm.Gender" :options="genderOptions" :horizontal="true" />
        <cube-checker type="radio" v-model="createPersonForm.PersonLevel" :options="levelOptions" /> -->

        <div class="action px-2 pb-2">
          <cube-button @click="selectImageStatus = 'init'" :disabled="modeloading || !videoReady">取消</cube-button>
          <cube-button @click="createPerson" class="ml-2" :disabled="modeloading || !videoReady">确认</cube-button>
        </div>
      </div>
    </div>
    <div v-else-if="status == 'residentDetail'">
      <div class="imgs flex justify-center">
        <img class="face" :src="loadImage(curResident.id)" />
      </div>
      <div>
        <span>{{ curResident.unit.building }}栋 {{ curResident.unit.room }}号 </span>
        <cube-button inline :style="{ background: curResident.level }">{{ levelMap[curResident.level] }}</cube-button>
      </div>
      <div>
        <div v-for="(item, index) in curResident.passRecords" :key="index">
          {{ dayjs(item.date).format("YYYY-MM-DD hh时mm分") }} {{ loadDirection({ allow: item.allow, direction: item.direction }) }}
        </div>
      </div>
      <div class="action flex-wrap">
        <cube-button :disabled="handlePassrecordLoaidng" @click="handlePassrecord({ allow: false, direction: 'OUT' })" class="w-1/2 rounded-none	">{{
          loadDirection({ allow: false, direction: "OUT" })
        }}</cube-button>
        <cube-button :disabled="handlePassrecordLoaidng" @click="handlePassrecord({ allow: false, direction: 'IN' })" class="w-1/2 rounded-none	">{{
          loadDirection({ allow: false, direction: "IN" })
        }}</cube-button>
        <cube-button :disabled="handlePassrecordLoaidng" @click="handlePassrecord({ allow: true, direction: 'OUT' })" class="w-1/2 rounded-none	">{{
          loadDirection({ allow: true, direction: "OUT" })
        }}</cube-button>
        <cube-button :disabled="handlePassrecordLoaidng" @click="handlePassrecord({ allow: true, direction: 'IN' })" class="w-1/2 rounded-none	">{{
          loadDirection({ allow: true, direction: "IN" })
        }}</cube-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ApiService } from "../utils/axios";
import config from "../config";
import { Vue, Component } from "vue-property-decorator";
import * as faceapi from "face-api.js";
import { Sync } from "vuex-pathify";
import { AuthStore } from "../store/typs";
import { api } from "../serivices";

@Component
export default class Home extends Vue {
  @Sync("auth/user") user: AuthStore["user"];
  dayjs: any;
  staticRoot = process.env.VUE_APP_STATIC_ROOT;
  video: HTMLVideoElement = null;
  currentImg = null;
  images = [];
  searchResult: Array<any> = null;
  modeloading = true;
  handlePassrecordLoaidng = false;
  videoReady = false;
  status: "init" | "takePhoto" | "selectImage" | "residentDetail" = "init";
  selectImageStatus: "init" | "addNew" = "init";
  levelMap = {
    BLUE: "蓝卡",
    GREEN: "绿卡",
    YELLOW: "黄卡",
    RED: "红卡"
  };

  curResident = {
    id: null,
    name: null,
    level: null,
    unit: {
      building: null,
      room: null
    },
    passRecords: []
  };
  createPersonForm = {
    PersonName: null,
    Gender: 1,
    Building: 0,
    Room: 0,
    PersonLevel: "BLUE",
    PersonAge: null
  };
  schema = {
    groups: [
      {
        legend: "新增用户",
        fields: [
          {
            type: "input",
            modelKey: "PersonName",
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
            modelKey: "Building",
            label: "单元",
            props: {
              type: "number",
              placeholder: "请输入单元"
            },
            rules: {
              required: true
            },
            triger: "blur"
          },
          {
            type: "input",
            modelKey: "Room",
            label: "房间",
            props: {
              type: "number",
              placeholder: "请输入房间"
            },
            rules: {
              required: true
            },
            triger: "blur"
          },
          {
            type: "input",
            modelKey: "PersonAge",
            label: "年龄",
            props: {
              type: "number",
              placeholder: "请输入年龄"
            },
            rules: {
              required: true
            },
            triger: "blur"
          },
          {
            type: "radio-group",
            modelKey: "Gender",
            label: "性别",
            props: {
              options: [
                { label: "男", value: 1 },
                { label: "女", value: 2 }
              ]
            },
            rules: {
              required: true
            }
          },
          {
            type: "checker",
            modelKey: "PersonLevel",
            label: "分级",
            props: {
              type: "radio",
              options: [
                // { text: "blue", value: "BLUE" },
                { text: this.levelMap["GREEN"], value: "GREEN" },
                { text: this.levelMap["YELLOW"], value: "YELLOW" },
                { text: this.levelMap["RED"], value: "RED" }
              ]
            },
            rules: {
              required: true
            }
          }
        ]
      }
    ]
  };

  mounted() {
    this.init();
  }

  loadImage(PersonId: string) {
    return `${this.staticRoot}${PersonId}.png`;
  }

  loadDirection({ allow, direction }: { allow: boolean; direction: string }) {
    const d = direction == "IN" ? "入" : "出";
    const a = allow ? "✔" : "X";
    return d + a;
  }

  async handlePassrecord({ allow, direction }: { allow: boolean; direction: string }) {
    const { id: residentId } = this.curResident;
    const { id: communityId } = this.user.community;
    this.handlePassrecordLoaidng = true;
    const result = await this.$apollo
      .mutate({
        mutation: api.passRecord.createOnePassRecord,
        variables: {
          data: {
            date: new Date(),
            allow,
            direction,
            resident: {
              connect: {
                id: residentId
              }
            },
            community: {
              connect: {
                id: communityId
              }
            }
          }
        }
      })
      .then(() => {
        this.$createToast({
          type: "txt",
          txt: "添加成功",
          time: 1000
        }).show();
      })
      .finally(() => {
        this.handlePassrecordLoaidng = false;
        this.status = "init";
      });
  }

  async goResidentDetail(id: string) {
    const data = await this.$apollo.query({
      query: api.resident.resident,
      variables: {
        where: {
          id
        }
      }
    });
    this.curResident = data.data.resident;
    this.status = "residentDetail";
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
      this.images = faceImages.map(i => i.toDataURL());
      this.status = "selectImage";
    }
  }

  async init() {
    await this.initFaceApi();
  }
  async initVideo() {
    const {camera = "back"} = this.$route.query
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
          facingMode: camera == "back" ? { exact: "environment" } : "user",
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

    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)
      // faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    ]);
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
    const { id: CommunityId } = this.user.community;
    const Image = this.currentImg;
    //@ts-ignore
    const {
      data: { person, resident }
    } = await ApiService.CreatePerson({ Image, CommunityId, ...this.createPersonForm });
    this.goResidentDetail(person.id);
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
  min-width 100vw
  min-height 100vh
  .camera
    min-width 100vw
    min-height 80vh
</style>
