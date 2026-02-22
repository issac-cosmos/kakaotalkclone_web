<template>
    <div style="padding: 16px">
      <h2>Rooms</h2>
  
      <div v-if="!store.connected" style="margin: 8px 0;">WS connecting...</div>
  
      <button @click="loadRooms">reload</button>
  
      <div style="margin-top: 12px">
        <div
          v-for="r in store.rooms"
          :key="r.roomId"
          style="padding: 10px; border: 1px solid #ddd; margin-bottom: 8px; cursor: pointer;"
          @click="goRoom(r.roomId)"
        >
          <div style="display:flex; justify-content:space-between;">
            <div>
              <div><b>{{ r.title ?? r.roomId }}</b> <small>({{ r.type }})</small></div>
              <div style="font-size: 13px; color: #555;">
                lastMessageId: {{ r.lastMessageId ?? "-" }}
              </div>
            </div>
  
            <div v-if="r.unreadCount > 0" style="font-weight:700;">
              🔴 {{ r.unreadCount }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { onMounted, watch } from "vue";
  import { useRouter } from "vue-router";
  import { chatStore as store } from "../store/chatStore";
  
  const router = useRouter();
  let badgeSub = null;
  
  async function loadRooms() {
    const res = await fetch("http://localhost:8080/api/rooms", {
      headers: { "X-User-Id": store.userId },
    });
    store.rooms = await res.json();
  }
  
  function subscribeBadges() {
    if (!store.stompClient || !store.connected) return;
  
    // 중복 구독 방지
    badgeSub?.unsubscribe();
    badgeSub = store.stompClient.subscribe(`/sub/user/${store.userId}/rooms`, (frame) => {
      const evt = JSON.parse(frame.body);
  
      const room = store.rooms.find((r) => r.roomId === evt.roomId);
      if (!room) return;
  
      // delta 적용 (+1)
      if (evt.deltaUnread != null) {
        room.unreadCount = Math.max(0, (room.unreadCount || 0) + evt.deltaUnread);
      }
  
      // last message preview (있으면)
      if (evt.lastMessageId != null) room.lastMessageId = evt.lastMessageId;
    });
  }
  
  function goRoom(roomId) {
    router.push(`/rooms/${roomId}`);
  }
  
  onMounted(async () => {
    await loadRooms();
  });
  
  // WS 연결이 된 시점에 구독 걸기
  watch(
    () => store.connected,
    (v) => {
      if (v) subscribeBadges();
      else {
        badgeSub?.unsubscribe();
        badgeSub = null;
      }
    },
    { immediate: true }
  );
  </script>