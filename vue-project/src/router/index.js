import { createRouter, createWebHistory } from "vue-router";
import RoomListView from "../views/RoomListView.vue";
import ChatRoomView from "../views/ChatRoomView.vue";

const routes = [
  { path: "/", redirect: "/rooms" },
  { path: "/rooms", component: RoomListView },
  { path: "/rooms/:roomId", component: ChatRoomView, props: true },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});