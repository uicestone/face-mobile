import Axios from "axios";
import config from "@/config";

export const axios = Axios.create({
  baseURL: config.apiRoot
});

axios.interceptors.request.use(config => {
  return config;
});

axios.interceptors.response.use(
  res => {
    return res;
  },
  async err => {
    return Promise.reject(err);
  }
);

export class ApiService {
  static async getSignature({ method = "GET", action }: { method?: string; action: string }) {
    return axios.request({
      url: "/tx/signature",
      params: {
        method,
        action
      }
    });
  }
  static async SearchFaces(data: { Image: string; GroupIds?: Array<string>; [key: string]: any }) {
    return axios.request({
      method: "post",
      url: "/tx/SearchFaces",
      data
    });
  }
  static async SearchPersons(data: { Image: string; GroupIds?: Array<string>; [key: string]: any }) {
    return axios.request({
      method: "post",
      url: "/tx/SearchPersons",
      data
    });
  }
  static async CreatePerson(data: { Image: string; PersonName: string; PersonId: number; Gender: number; [key: string]: any }) {
    return axios.request({
      method: "post",
      url: "/tx/CreatePerson",
      data
    });
  }
}
