<template>
  <nav class="navContainer">
    <div class="navContent">
      <!-- Logo -->
      <router-link to="/" class="navLogo">UniqueBeings</router-link>
      
      <!-- Main Navigation -->
      <div class="navLinks">
        <router-link to="/" class="navBtn">Home</router-link>
        <router-link to="/list" class="navBtn">Creatures</router-link>
      </div>

      <!-- Right Side: Auth & Roles -->
      <div class="authSection">
        
        <!-- 🛡️ ADMIN PANEL 🛡️ -->
        <div v-if="isAdmin" class="roleGroup">
          <!-- The 'Add User' button appears next to the badge -->
          <router-link to="/create-user" class="navBtn addUserBtn">
            <span class="plusIcon">+</span> New User
          </router-link>
          
          <div class="badge adminBadge">
            <!--span class="icon">🛡️</span--> Admin Mode
          </div>
        </div>

        <!-- 🎨 CREATOR PANEL 🎨 -->
        <div v-if="isCreator" class="roleGroup">
          <div class="badge creatorBadge">
            <!--span class="icon">🎨</span--> Creator Mode
          </div>
        </div>

        <!-- Login / Logout -->
        <button v-if="user" @click="handleLogout" class="navBtn logoutBtn">
          Logout
        </button>

        <router-link v-else to="/login" class="navBtn loginBtn">
          Login
        </router-link>
      </div>
    </div>
  </nav>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { auth } from '../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { useRouter } from 'vue-router';

// 🔴 CONFIG: YOUR ADMIN EMAIL
const ADMIN_EMAIL = "uniquecreadm1225@gmail.com"; 

const router = useRouter();
const user = ref(null);

onMounted(() => {
  onAuthStateChanged(auth, (u) => user.value = u);
});

// Computed: Is the user the Admin?
const isAdmin = computed(() => {
  return user.value && user.value.email === ADMIN_EMAIL;
});

// Computed: Is the user logged in BUT NOT the admin?
const isCreator = computed(() => {
  return user.value && user.value.email !== ADMIN_EMAIL;
});

const handleLogout = async () => {
  await signOut(auth);
  router.push('/');
};
</script>

<style scoped>
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
  margin-right: 20px;
}

.navLinks {
  display: flex;
  gap: 10px;
  align-items: center;
  flex: 1; /* Pushes auth section to the right */
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
  border-right: 1px solid #444; /* Separator line */
  margin-right: 5px;
}

/* --- BUTTON STYLES --- */

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
  transform: translateY(-1px);
}

/* Active Link State */
.navBtn.router-link-exact-active {
  background-color: var(--primaryColor);
  color: white;
  box-shadow: 0 2px 8px rgba(100, 108, 255, 0.4);
  border-color: var(--primaryColor);
}

.navBtn.router-link-exact-active:hover {
  background-color: var(--primaryColor);
  opacity: 0.9;
}

/* --- SPECIAL BUTTONS --- */

/* Add User Button (Small & Subtle) */
.addUserBtn {
  font-size: 0.85rem;
  border: 1px solid #666;
  padding: 6px 12px;
}

.addUserBtn:hover {
  border-color: #fff;
}

.plusIcon {
  color: #4cd137;
  font-weight: bold;
  margin-right: 2px;
}

.loginBtn {
  border: 1px solid #444;
}

.logoutBtn {
  background-color: #ff4757;
  color: white;
  border: none;
}

.logoutBtn:hover {
  background-color: #ff6b81;
}

/* --- BADGES --- */

.badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  user-select: none;
  cursor: default;
}

.icon {
  font-size: 1rem;
}

/* Admin Badge: Green */
.adminBadge {
  background: rgba(76, 209, 55, 0.15);
  color: #4cd137;
  border: 1px solid rgba(76, 209, 55, 0.3);
  box-shadow: 0 0 10px rgba(76, 209, 55, 0.1);
}

/* Creator Badge: Yellow */
.creatorBadge {
  background: rgba(251, 197, 49, 0.15);
  color: #fbc531;
  border: 1px solid rgba(251, 197, 49, 0.3);
  box-shadow: 0 0 10px rgba(251, 197, 49, 0.1);
}

/* Mobile Responsiveness */
@media (max-width: 768px) {
  .navLogo { font-size: 1.2rem; }
  .badge { display: none; } /* Hide badges on small phones to save space */
  .roleGroup { border: none; padding: 0; }
  .navBtn { padding: 6px 10px; font-size: 0.85rem; }
}
</style>