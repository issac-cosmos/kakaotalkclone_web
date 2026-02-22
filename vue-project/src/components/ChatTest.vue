<template>
    <div>
    <button @click="connect" :disabled="connected">connect</button>
    <button @click="disconnect" :disabled="!connected">disconnect</button>

    <div style="margin-top:8px;">
      <input v-model="roomId" />
      <button @click="changeRoom(roomId)">re-subscribe</button>
    </div>

    <div style="margin-top:8px;">
      <input v-model="senderId" placeholder="senderId"/>
      <input v-model="content" placeholder="message" @keyup.enter="send"/>
      <button @click="send" :disabled="!connected">send</button>
    </div>

    <pre>readState: {{ readState }}</pre>

    <div v-for="(m,i) in messages" :key="i">
      [{{ m.roomId }}] {{ m.senderId }}: {{ m.content }} ({{ m.messageId }})
    </div>
  </div>
  </template>
  
  <script setup>
  import { ref, onBeforeUnmount } from "vue";
  import SockJS from "sockjs-client/dist/sockjs";
  import { Client } from "@stomp/stompjs";
  
  const roomId = ref("r1");
  const senderId = ref("u1");
  const content = ref("hi");
  const messages = ref([]);
  const connected = ref(false);
  
  // 읽음 상태 예시: { userId: lastReadMessageId }
  const readState = ref({});

  let client = null;
  let subscription = null;
  let readSub = null;
  
  function connect() {
    client = new Client({
      webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
      reconnectDelay: 2000,
      debug: () => {}, // 필요하면 console.log로 바꿔
      onConnect: () => {
        connected.value = true;
  
        // room 구독
        subscription = client.subscribe(`/sub/room/${roomId.value}`, (frame) => {
          const msg = JSON.parse(frame.body);
          messages.value.push(msg);
        });
      },
      onStompError: (f) => console.error("STOMP ERROR", f),
      onWebSocketError: (e) => console.error("WS ERROR", e),
    });
  
    client.activate();
  }
  function subscribeRoom(targetRoomId) {
  // ✅ room 바꾸거나 재연결 시 “기존 구독 제거”가 먼저
  msgSub?.unsubscribe();
  readSub?.unsubscribe();
  msgSub = null;
  readSub = null;

  // 1) 메시지 구독
  msgSub = client.subscribe(`/sub/room/${targetRoomId}`, (frame) => {
    const msg = JSON.parse(frame.body);
    messages.value.push(msg);
  });

  // 2) 읽음 구독
  readSub = client.subscribe(`/sub/room/${targetRoomId}/read`, (frame) => {
    const evt = JSON.parse(frame.body);
    // evt: { roomId, userId, lastReadMessageId, ... }

    // 내 이벤트는 무시(원하면 표시)
    if (evt.userId === senderId.value) return;

    // read 상태 업데이트
    readState.value = {
      ...readState.value,
      [evt.userId]: evt.lastReadMessageId,
    };

    console.log("READ EVENT", evt);
  });
}
  function disconnect() {
    subscription?.unsubscribe();
    subscription = null;
    client?.deactivate();
    client = null;
    connected.value = false;
  }
  
  function send() {
    if (!client || !connected.value) return;
  
    const payload = {
      roomId: roomId.value,
      messageId: crypto.randomUUID(), // 브라우저 UUID
      senderId: senderId.value,
      content: content.value,
    };
  
    client.publish({
      destination: "/pub/chat.send",
      body: JSON.stringify(payload),
    });
  }
  // 방 바꾸기 버튼용 예시
function changeRoom(newRoomId) {
  roomId.value = newRoomId;
  messages.value = [];
  readState.value = {};

  if (client && connected.value) {
    subscribeRoom(newRoomId);
  }
}
  onBeforeUnmount(() => disconnect());
  </script>
  