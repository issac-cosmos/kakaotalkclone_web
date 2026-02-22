<template>
    <div style="padding: 16px">
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <h2>Room: {{ roomId }}</h2>
        <button @click="back">back</button>
      </div>
  
      <div style="margin-bottom: 8px">
        <input v-model="store.userId" placeholder="userId" />
      </div>
  
      <div style="border: 1px solid #ddd; height: 320px; overflow:auto; padding: 8px;">
        <div v-for="(m, i) in messages" :key="i">
          <b>{{ m.senderId }}</b>: {{ m.content }} <small>({{ m.messageId }})</small>
        </div>
      </div>
  
      <div style="margin-top: 10px; display:flex; gap:8px;">
        <input v-model="content" placeholder="message" style="flex:1" @keyup.enter="send"/>
        <button @click="send" :disabled="!store.connected">send</button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { computed, onBeforeUnmount, ref, watch } from "vue";
  import { useRouter } from "vue-router";
  import { chatStore as store } from "../store/chatStore";
  
  const props = defineProps({ roomId: String });
  const router = useRouter();
  
  const content = ref("hi");
  let msgSub = null;
  
  const messages = computed(() => store.messagesByRoom[props.roomId] ?? []);
  
  function ensureRoomBuffer() {
    if (!store.messagesByRoom[props.roomId]) store.messagesByRoom[props.roomId] = [];
  }
  
  function subscribeRoom() {
    if (!store.stompClient || !store.connected) return;
  
    ensureRoomBuffer();
  
    msgSub?.unsubscribe();
    msgSub = store.stompClient.subscribe(`/sub/room/${props.roomId}`, (frame) => {
      const msg = JSON.parse(frame.body);
      store.messagesByRoom[props.roomId].push(msg);
    });
  }
  
  function send() {
    if (!store.stompClient || !store.connected) return;
  
    const payload = {
      roomId: props.roomId,
      messageId: crypto.randomUUID(),
      senderId: store.userId,
      content: content.value,
    };
  
    store.stompClient.publish({
      destination: "/pub/chat.send",
      body: JSON.stringify(payload),
    });
  }
  
  function back() {
    router.push("/rooms");
  }
  
  watch(
    () => store.connected,
    (v) => {
      if (v) subscribeRoom();
      else {
        msgSub?.unsubscribe();
        msgSub = null;
      }
    },
    { immediate: true }
  );
  
  onBeforeUnmount(() => {
    msgSub?.unsubscribe();
    msgSub = null;
  });
  </script>