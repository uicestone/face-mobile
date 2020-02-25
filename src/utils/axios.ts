import Axios from "axios";
import { Toast } from "cube-ui";
import { Message } from "./index";

export const axios = Axios.create({
  baseURL: process.env.VUE_APP_API_BASE
});

axios.interceptors.request.use(config => {
  return config;
});

axios.interceptors.response.use(
  res => {
    return res;
  },
  async err => {
    Message({
      message: err.message
    }).show();
    return Promise.reject(err);
  }
);

export class ApiService {
  static async getSignature({ method = "GET", action }: { method?: string; action: string }) {
    return axios.request({
      url: "tx/signature",
      params: {
        method,
        action
      }
    });
  }
  static async SearchFaces(data: { Image: string; GroupIds?: Array<string>; [key: string]: any }) {
    return axios.request({
      method: "post",
      url: "tx/SearchFaces",
      data
    });
  }
  static async SearchPersons(data: { Image: string; GroupIds?: Array<string>; [key: string]: any }) {
    return axios.request({
      method: "post",
      url: "tx/SearchPersons",
      data
    });
  }
  static async CreatePerson(data: { Image: string; PersonName: string; Gender: number; [key: string]: any }) {
    return axios.request({
      method: "post",
      url: "tx/CreatePerson",
      data
    });
  }
}
