<template>
  <div class="appLayout">
    <NavBar />
    
    <main class="mainContent">
      <router-view />
    </main>
    
    <footer class="appFooter">
      <p>&copy; 2025 Unique Beings Archive</p>
    </footer>

    <!-- 🔴 NEW: Scroll To Top Button -->
    <!-- v-show hides it using CSS (display: none) so it keeps working in background -->
    <transition name="fade">
      <button 
        v-show="showScrollBtn" 
        @click="scrollToTop" 
        class="scrollTopBtn"
        title="Scroll to top"
      >
        <!-- Simple Arrow Icon using CSS/Text -->
        ↑
      </button>
    </transition>
  </div>
</template>

<script setup>
import NavBar from './components/NavBar.vue';
import { ref, onMounted, onUnmounted } from 'vue';

// 🔴 SCROLL LOGIC
const showScrollBtn = ref(false);

const handleScroll = () => {
  // Show button if user scrolled down more than 300px
  showScrollBtn.value = window.scrollY > 300;
};

const scrollToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth' // Makes it slide up nicely instead of jumping
  });
};

// Attach the event listener when the app starts
onMounted(() => {
  window.addEventListener('scroll', handleScroll);
});

// Clean up the listener if the app closes (good practice)
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

/* 🔴 SCROLL BUTTON STYLES */
.scrollTopBtn {
  position: fixed; /* Sticks to the screen */
  bottom: 30px;
  right: 30px;
  width: 50px;
  height: 50px;
  background-color: var(--primaryColor);
  color: white;
  border: none;
  border-radius: 50%; /* Circle */
  font-size: 1.5rem;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
  z-index: 99; /* Stays on top of content */
  transition: transform 0.2s, background-color 0.2s;
  
  /* Center the arrow */
  display: flex;
  align-items: center;
  justify-content: center;
  padding-bottom: 5px; /* Visual tweak for text arrow alignment */
}

.scrollTopBtn:hover {
  background-color: #535bf2; /* Slightly darker/different purple */
  transform: translateY(-5px); /* Moves up slightly on hover */
}

.scrollTopBtn:active {
  transform: scale(0.9);
}

/* Animation for appearing/disappearing */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Mobile Tweak: Move it slightly in so it doesn't cover content */
@media (max-width: 768px) {
  .scrollTopBtn {
    bottom: 20px;
    right: 20px;
    width: 45px;
    height: 45px;
    font-size: 1.2rem;
  }
}
</style>