<template>
  <div class="appLayout">
    <NavBar />
    
    <main class="mainContent">
      <router-view />
    </main>
    
    <footer class="appFooter">
      <p>&copy; 2025 Unique Beings Archive</p>
    </footer>

    <!-- SCROLL TO TOP BUTTON -->
    <transition name="fade">
      <button 
        v-show="showScrollBtn" 
        @click="scrollToTop" 
        class="scrollTopBtn"
        title="Scroll to top"
      >
        <!-- Triangle Icon -->
        ▲
      </button>
    </transition>
  </div>
</template>

<script setup>
import NavBar from './components/NavBar.vue';
import { ref, onMounted, onUnmounted } from 'vue';

const showScrollBtn = ref(false);

const handleScroll = () => {
  showScrollBtn.value = window.scrollY > 300;
};

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
});
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

/* 🔴 UPDATED SCROLL BUTTON STYLES */
.scrollTopBtn {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 50px;
  height: 50px;
  
  /* Dark Black-ish Background */
  background-color: #222;
  
  /* Purple Outline */
  border: 2px solid var(--primaryColor);
  
  /* Purple Icon */
  color: var(--primaryColor);
  
  /* Rounded Square */
  border-radius: 12px;
  
  font-size: 1.2rem;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
  z-index: 99;
  transition: all 0.2s ease;
  
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 3px; /* visual center fix for triangle */
}

/* Hover Effect: Fill with Purple, turn Icon White */
.scrollTopBtn:hover {
  background-color: var(--primaryColor);
  color: white;
  transform: translateY(-5px);
  box-shadow: 0 6px 15px rgba(100, 108, 255, 0.4);
}

.scrollTopBtn:active {
  transform: scale(0.9);
}

/* Animation */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(20px);
}

@media (max-width: 768px) {
  .scrollTopBtn {
    bottom: 20px;
    right: 20px;
    width: 45px;
    height: 45px;
  }
}
</style>