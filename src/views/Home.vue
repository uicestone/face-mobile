<template>
  <div class="cube-page">
    <div class="credit" v-if="status == 'init'">诗序软件 &copy;2020</div>
    <div class="padding" v-if="status == 'init'" style="display:flex; flex-direction: column; justify-content: center; height:100%; align-items:center">
      <cube-button @click="takePhoto" :disabled="modeloading" primary class="open-camera">拍照</cube-button>
      <a @click="logout" class="logout">退出</a>
    </div>
    <div class="take-photo" v-else-if="status == 'takePhoto'">
      <video ref="video" class="camera" loop></video>
      <canvas ref="canvas" style="display:none"></canvas>
      <div style="display:flex;justify-content:center">
        <cube-button @click="getImage" :disabled="!videoReady" class="shot"></cube-button>
      </div>
    </div>
    <div v-else-if="status == 'selectImage'" class="select-image padding">
      <div v-if="selectImageStatus == 'init'">
        <div class="card">
          <div class="section-title">检测到的人脸</div>
          <div class="section-subtitle">点击选择/切换</div>
          <div class="imgs">
            <img :class="{ 'select-img': currentImg == item, face: true }" :src="item" v-for="(item, index) in images" :key="index" @click="checkFace(item)" />
          </div>
        </div>
        <div v-if="searchResult" class="card">
          <div class="section-title">搜索到的人</div>
          <div class="section-subtitle">点击选择</div>
          <div v-for="(item, index) in searchResult" :key="index">
            <div class="face" v-for="(data, index1) in item.Candidates" :key="index1" @click="goResidentDetail(data.PersonId)">
              <img :src="loadImage(data.PersonId)" width="100" height="100" />
              <div class="person-name">{{ data.PersonName }}</div>
              <div class="score">{{ data.Score.toFixed(1) }}%</div>
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
        <cube-form class="login-form" ref="createPersonForm" :model="createPersonForm" :schema="schema"></cube-form>
        <div class="action px-2 pb-2">
          <cube-button @click="selectImageStatus = 'init'">取消</cube-button>
          <cube-button @click="createPerson" class="ml-2" :disabled="!createPersonForm.searchUnit">确认</cube-button>
        </div>
      </div>
    </div>
    <div v-else-if="status == 'residentDetail'" class="padding">
      <div class="card" style="display:flex">
        <img class="detail-face" :src="loadImage(curResident.id)" />
        <div style="width:100%">
          <ul class="list">
            <li>{{ curResident.name }}</li>
            <li>{{ curResident.unit.building }}号 {{ curResident.unit.room }}室</li>
          </ul>
        </div>
      </div>
      <div class="level-card" :style="{ background: curResident.unit.level }">{{ levelMap[curResident.unit.level] }}</div>
      <div class="card">
        <div class="section-title">
          近期通行记录
        </div>
        <ul class="list">
          <li v-for="(item, index) in curResident.passRecords" :key="index">{{ dayjs(item.date).format("MM-DD hh:mm") }} {{ loadDirection({ allow: item.allow, direction: item.direction }) }}</li>
        </ul>
      </div>
      <div class="action flex-wrap">
        <cube-button @click="handlePassrecord({ allow: false, direction: 'OUT' })" class="w-1/2 rounded-none	">{{ loadDirection({ allow: false, direction: "OUT" }) }}</cube-button>
        <cube-button @click="handlePassrecord({ allow: false, direction: 'IN' })" class="w-1/2 rounded-none	">{{ loadDirection({ allow: false, direction: "IN" }) }}</cube-button>
        <cube-button @click="handlePassrecord({ allow: true, direction: 'OUT' })" class="w-1/2 rounded-none	">{{ loadDirection({ allow: true, direction: "OUT" }) }}</cube-button>
        <cube-button @click="handlePassrecord({ allow: true, direction: 'IN' })" class="w-1/2 rounded-none	">{{ loadDirection({ allow: true, direction: "IN" }) }}</cube-button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { ApiService } from "../utils/axios";
import { Vue, Component, Watch } from "vue-property-decorator";
import * as faceapi from "face-api.js";
import { Sync } from "vuex-pathify";
import { AuthStore } from "../store/typs";
import { api } from "../serivices";
import { gqlErrorHanding, Message } from "../utils";
import { resident } from "../serivices/resident";
import { loading } from "../utils/index";
import { _ } from "../utils/loadash";

const defaultCreatePersonForm = {
  Building: "0",
  Room: "0",
  searchUnit: null
};

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
      room: null,
      level: null
    },
    passRecords: []
  };

  createPersonForm = { ...defaultCreatePersonForm };
  schema = {
    groups: [
      {
        legend: "新增用户",
        fields: [
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
          }
        ]
      }
    ]
  };

  @Watch("createPersonForm.Building")
  @Watch("createPersonForm.Room")
  async onSearchUnit() {
    const { Building, Room } = this.createPersonForm;
    const { id: communityId } = this.user.community;

    if (Building && Room && Building.match(/\d{3,}/) && Room.match(/\d{3,}/)) {
      const loadingToast = await loading();
      this.$apollo
        .mutate({
          mutation: api.unit.units,
          variables: {
            where: {
              building: { equals: Building },
              room: { equals: Room },
              community: { id: { equals: communityId } }
            }
          }
        })
        .then(res => {
          const unit = _.get(res, "data.units.0");
          this.createPersonForm.searchUnit = unit;
          if (!unit) {
            return this.$createDialog({
              type: "alert",
              content: "未找到该小区"
            }).show();
          }
        })
        .catch(gqlErrorHanding())
        .finally(() => {
          loadingToast.hide();
        });
    }
  }

  mounted() {
    this.init();
  }

  loadImage(PersonId: string) {
    return `${this.staticRoot}${PersonId}.png`;
  }

  loadDirection({ allow, direction }: { allow: boolean; direction: string }) {
    const d = direction == "IN" ? "入" : "出";
    const a = allow ? "✅" : "❌";
    return d + a;
  }

  async handlePassrecord({ allow, direction }: { allow: boolean; direction: string }) {
    const loadingToast = loading();
    const { id: residentId } = this.curResident;
    const { id: communityId } = this.user.community;
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
        this.status = "init";
      })
      .catch(gqlErrorHanding())
      .finally(() => {
        loadingToast.hide();
      });
  }

  async goResidentDetail(id: string) {
    const loadingToast = loading();
    this.$apollo
      .query({
        query: api.resident.resident,
        variables: {
          where: {
            id
          }
        }
      })
      .then(data => {
        this.curResident = data.data.resident;
        this.status = "residentDetail";
      })
      .catch(gqlErrorHanding())
      .finally(() => {
        loadingToast.hide();
      });
  }

  async takePhoto() {
    this.status = "takePhoto";
    this.selectImageStatus = "init";
    this.createPersonForm = { ...defaultCreatePersonForm };
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
      this.stopStreamVideo();
    }
  }

  async stopStreamVideo() {
    //@ts-ignore
    let stream = this.$refs.video.srcObject;
    if (stream) {
      let tracks = stream.getTracks();
      tracks.forEach(track => {
        // stops the video track
        track.stop();
        //@ts-ignore
        this.$refs.video.srcObject = null;
      });
    }
  }

  async init() {
    await this.initFaceApi();
  }
  async initVideo() {
    const { camera = "back" } = this.$route.query;
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
      await this.video.play();
      await faceapi.detectAllFaces(this.video, new faceapi.TinyFaceDetectorOptions());
      this.videoReady = true;
      toast.hide();
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

    await Promise.all([faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL)]);
    this.modeloading = false;
    console.log("load model finished");
  }
  async checkFace(img: string) {
    this.currentImg = img;
    const loadingToast = loading();
    ApiService.SearchPersons({ Image: img })
      .then(result => {
        this.searchResult = result.data.Results;
      })
      .catch(err => {
        Message({ message: "搜索人脸失败: " + err.message });
      })
      .finally(() => {
        loadingToast.hide();
      });
  }
  async createPerson() {
    //@ts-ignore
    this.$refs.createPersonForm.validate(async e => {
      if (!e) return;
      const loadingToast = loading();
      const { id: CommunityId } = this.user.community;
      const { Room, Building } = this.createPersonForm;
      const Image = this.currentImg;
      //@ts-ignore
      ApiService.CreatePerson({ Image, CommunityId, Room, Building })
        .then(res => {
          const {
            data: { resident, person }
          } = res;
          if (person.SimilarPersonId) {
            this.$createDialog({
              type: "alert",
              content: "该人员已存在"
            }).show();
          }
          this.goResidentDetail(resident.id || person.SimilarPersonId);
        })
        .catch(err => {
          Message({ message: "创建人员失败: " + err.message });
        })
        .finally(() => {
          loadingToast.hide();
        });
    });
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
.open-camera
  width 5rem !important
  height 5rem !important
  border-radius 2.5rem !important
  margin auto
  font-size 1.2rem !important
.shot
  background #eee !important
  border 0.15rem solid #888 !important
  width 2.8rem !important
  height 2.8rem !important
  border-radius 1.4rem !important
  font-size 1.4rem !important
.section-title
  font-size: 0.75rem;
  margin: 0.5rem 0 0.5rem;
  border-bottom: 1px #ccc solid;
  padding-bottom: 0.2rem;
.section-subtitle
  font-size 0.5rem
  margin 0.2rem 0
  text-align right
.person-name
  font-size 0.48rem
  text-align center
  margin-top 0.2rem
.score
  font-size 0.4rem
  text-align right
  border-top 1px dashed #888
  margin-top 0.1rem
  padding-top 0.1rem
.level-card
  height 3rem
  font-size 0.5rem
  color rgba(255, 255, 255, 0.6)
  box-shadow: 0.1rem 0.05rem 0.4rem #aaa;
  padding: 0.4rem;
  margin 0.4rem 0;
  border-radius: 0.15rem;
.logout
  position absolute
  right 0.5rem
  top 0.5rem
  color #888
  font-size 0.4rem
.detail-face
  width 33vw
  border-radius 0.15rem
.list
  padding 0 0.5rem
  > *
    font-size 0.9em
    border-bottom 1px #aaa dashed
    padding 0.3rem 0
</style>
