<template>
  <div class="appLayout">
    <NavBar />
    <main class="mainContent">
      <router-view />
    </main>
    <footer class="appFooter">
      <p>&copy; 2025 Unique Beings Archive</p>
    </footer>
  </div>
</template>

<script setup>
import NavBar from './components/NavBar.vue';
</script>

<style scoped>
.appLayout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.mainContent {
  flex: 1;
  padding-bottom: 40px;
}

.appFooter {
  text-align: center;
  padding: 20px;
  background-color: var(--cardBg);
  color: #888;
  border-top: 1px solid #333;
}
</style>