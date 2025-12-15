<template>
  <nav class="navContainer">
    <div class="navContent">
      <!-- 1. Logo -->
      <router-link to="/" class="navLogo">UniqueBeings</router-link>
      
      <!-- 2. Desktop Menu (Hidden on Mobile) -->
      <div class="desktopMenu">
        <div class="navLinks">
          <router-link to="/" class="navBtn">Home</router-link>
          <router-link to="/list" class="navBtn">Creatures</router-link>
          <router-link v-if="user" to="/settings" class="navBtn">Settings</router-link>
        </div>

        <div class="authSection">
          <!-- Admin Panel -->
          <div v-if="isAdmin" class="roleGroup">
            <router-link to="/create-user" class="navBtn addUserBtn">
              <span class="plusIcon">+</span> New User
            </router-link>
            <div class="badge adminBadge">Admin Mode</div>
          </div>

          <!-- Creator Panel -->
          <div v-if="isCreator" class="roleGroup">
            <div class="badge creatorBadge">Creator Mode</div>
          </div>

          <!-- Auth -->
          <button v-if="user" @click="handleLogout" class="navBtn logoutBtn">Logout</button>
          <router-link v-else to="/login" class="navBtn loginBtn">Login</router-link>
        </div>
      </div>

      <!-- 3. Hamburger Icon (Visible ONLY on Mobile) -->
      <button class="hamburgerBtn" @click="toggleMenu">
        <img :src="listIcon" alt="Menu" class="menuIcon" />
      </button>
    </div>

    <!-- 4. Mobile Menu Dropdown -->
    <transition name="slide">
      <div v-if="isMenuOpen" class="mobileMenu">
        <router-link to="/" class="mobileLink" @click="closeMenu">Home</router-link>
        <router-link to="/list" class="mobileLink" @click="closeMenu">Creatures</router-link>
        <router-link v-if="user" to="/settings" class="mobileLink" @click="closeMenu">Settings</router-link>
        
        <div class="mobileDivider"></div>

        <!-- Mobile Roles -->
        <div v-if="isAdmin" class="mobileRoleRow">
          <div class="badge adminBadge">Admin Mode</div>
          <router-link to="/create-user" class="mobileLink" style="font-size: 1rem;" @click="closeMenu">
            + New User
          </router-link>
        </div>

        <div v-if="isCreator" class="mobileRoleRow">
          <div class="badge creatorBadge">Creator Mode</div>
        </div>

        <!-- Mobile Auth -->
        <!-- Logout stays as a button (Red) -->
        <button v-if="user" @click="handleLogout" class="navBtn logoutBtn mobileAuthBtn">Logout</button>
        
        <!-- 🔴 FIX: Login is now a standard mobile link so it matches Home/Creatures -->
        <router-link v-else to="/login" class="mobileLink mobileAuthLink" @click="closeMenu">
          Login
        </router-link>
      </div>
    </transition>

  </nav>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'vue-router';
import listIcon from '@/assets/list.svg'; 

// 🔴 CONFIG: YOUR ADMIN EMAIL
const ADMIN_EMAIL = "uniquecreadm1225@gmail.com"; 

const router = useRouter();
const user = ref(null);
const isMenuOpen = ref(false);

onMounted(() => {
  onAuthStateChanged(auth, (u) => user.value = u);
});

const isAdmin = computed(() => user.value && user.value.email === ADMIN_EMAIL);
const isCreator = computed(() => user.value && user.value.email !== ADMIN_EMAIL);

const toggleMenu = () => {
  isMenuOpen.value = !isMenuOpen.value;
};

const closeMenu = () => {
  isMenuOpen.value = false;
};

const handleLogout = async () => {
  await signOut(auth);
  closeMenu();
  router.push('/');
};
</script>

<style scoped>
/* --- BASE NAVBAR --- */
.navContainer {
  height: var(--navHeight);
  background-color: var(--cardBg);
  display: flex;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid #333;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.navContent {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: relative;
}

.navLogo {
  font-size: 1.5rem;
  font-weight: 800;
  color: var(--primaryColor);
  text-transform: uppercase;
  letter-spacing: 1px;
  text-decoration: none;
  background: transparent !important;
  box-shadow: none !important;
  z-index: 102;
}

/* --- DESKTOP LAYOUT --- */
.desktopMenu {
  display: flex;
  align-items: center;
  width: 100%;
  justify-content: space-between;
  margin-left: 30px;
}

.navLinks {
  display: flex;
  gap: 10px;
  align-items: center;
}

.authSection {
  display: flex;
  gap: 15px;
  align-items: center;
}

.roleGroup {
  display: flex;
  align-items: center;
  gap: 10px;
  padding-right: 15px;
  border-right: 1px solid #444;
  margin-right: 5px;
}

/* --- HAMBURGER BUTTON --- */
.hamburgerBtn {
  display: none;
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  z-index: 102;
}

.menuIcon {
  width: 30px;
  height: 30px;
  filter: invert(1);
}

/* --- MOBILE MENU OVERLAY --- */
.mobileMenu {
  position: absolute;
  top: var(--navHeight);
  left: 0;
  right: 0;
  background-color: var(--cardBg);
  border-bottom: 1px solid #333;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  box-shadow: 0 10px 20px rgba(0,0,0,0.5);
}

.mobileLink {
  font-size: 1.2rem;
  font-weight: bold;
  color: white;
  text-decoration: none;
  padding: 10px;
  border-radius: 6px;
  transition: background 0.2s;
  display: block; /* Ensures full width click area */
}

.mobileLink:hover, .mobileLink.router-link-active {
  background-color: #333;
  color: var(--primaryColor);
}

.mobileDivider {
  height: 1px;
  background-color: #444;
  margin: 5px 0;
}

.mobileRoleRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 5px;
}

/* Mobile Logout Button */
.mobileAuthBtn {
  width: 100%;
  text-align: center;
  margin-top: 10px;
  padding: 12px;
}

/* Mobile Login Link - Matches other links but adds spacing */
.mobileAuthLink {
  margin-top: 10px;
  border: 1px solid #444; /* Optional: Keep a subtle border to make it pop slightly */
  text-align: center;
}

/* --- SHARED STYLES --- */
.navBtn {
  display: inline-block;
  text-decoration: none;
  color: #ccc;
  background-color: transparent;
  padding: 8px 16px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.95rem;
  transition: all 0.2s ease;
  border: 1px solid transparent;
  cursor: pointer;
  white-space: nowrap;
}

.navBtn:hover {
  background-color: rgba(255, 255, 255, 0.1);
  color: white;
}

.navBtn.router-link-exact-active {
  background-color: var(--primaryColor);
  color: white;
  box-shadow: 0 2px 8px rgba(100, 108, 255, 0.4);
  border-color: var(--primaryColor);
}

.addUserBtn {
  font-size: 0.85rem;
  border: 1px solid #666;
  padding: 6px 12px;
}

.loginBtn { border: 1px solid #444; }
.logoutBtn { background-color: #ff4757; color: white; border: none; }

.badge {
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  user-select: none;
  cursor: default;
}

.adminBadge {
  background: rgba(76, 209, 55, 0.15);
  color: #4cd137;
  border: 1px solid rgba(76, 209, 55, 0.3);
}

.creatorBadge {
  background: rgba(251, 197, 49, 0.15);
  color: #fbc531;
  border: 1px solid rgba(251, 197, 49, 0.3);
}

/* --- RESPONSIVE LOGIC --- */
@media (max-width: 768px) {
  .desktopMenu { display: none; }
  .hamburgerBtn { display: block; }
}

.slide-enter-active, .slide-leave-active {
  transition: all 0.3s ease;
}
.slide-enter-from, .slide-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>