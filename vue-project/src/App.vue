<template>
  <ChatTest />
</template>

<script setup>
import SockJS from "sockjs-client/dist/sockjs";
import { Client } from "@stomp/stompjs";
import { onMounted, onBeforeUnmount } from "vue";
import { chatStore } from "./store/chatStore";

let client = null;

function connectWS() {
  client = new Client({
    webSocketFactory: () => new SockJS("http://localhost:8080/ws"),
    reconnectDelay: 2000,
    debug: () => {},
    onConnect: () => {
      chatStore.connected = true;
      chatStore.stompClient = client;
    },
    onWebSocketClose: () => {
      chatStore.connected = false;
      chatStore.stompClient = null;
    },
  });

  client.activate();
}

onMounted(() => connectWS());

onBeforeUnmount(() => {
  client?.deactivate();
  client = null;
});
</script>