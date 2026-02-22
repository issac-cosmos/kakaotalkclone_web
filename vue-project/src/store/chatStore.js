import { reactive } from "vue";

export const chatStore = reactive({
  userId: "u1",          // MVP: 나중에 로그인 붙이면 교체
  rooms: [],             // 방 목록
  messagesByRoom: {},    // { [roomId]: [] }
  unreadByRoom: {},      // { [roomId]: number }
  stompClient: null,
  connected: false,
});