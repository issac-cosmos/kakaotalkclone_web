<script setup>
import { ref, onMounted } from "vue"
import { Client } from "@stomp/stompjs"
import SockJS from "sockjs-client/dist/sockjs"

const userId = "u1"

const rooms = ref([])

let client = null

// 1️⃣ 초기 방 목록 조회
async function loadRooms() {
  const res = await fetch("http://localhost:8080/api/rooms", {
    headers: { "X-User-Id": userId }
  })
  rooms.value = await res.json()
}

// 2️⃣ unread 실시간 구독
function subscribeBadge() {
  client = new Client({
    webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
    reconnectDelay: 2000,
    onConnect: () => {
      client.subscribe(`/sub/user/${userId}/rooms`, (frame) => {
        const evt = JSON.parse(frame.body)

        const room = rooms.value.find(r => r.roomId === evt.roomId)
        if (!room) return

        room.unreadCount += evt.deltaUnread
        room.lastMessageId = evt.lastMessageId
      })
    }
  })

  client.activate()
}

onMounted(async () => {
  await loadRooms()
  subscribeBadge()
})
</script>

<template>
  <div>
    <h3>방 목록</h3>
    <div v-for="room in rooms" :key="room.roomId">
      {{ room.title }}
      <span v-if="room.unreadCount > 0">
        🔴 {{ room.unreadCount }}
      </span>
    </div>
  </div>
</template>