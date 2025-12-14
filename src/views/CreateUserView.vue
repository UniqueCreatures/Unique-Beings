<template>
  <div class="container createContainer">
    <h2>Create New Creator</h2>
    <p class="subtitle">Only you (Admin) can see this.</p>
    
    <form @submit.prevent="handleCreateUser">
      <label class="label">New Creator Email</label>
      <input v-model="email" type="email" placeholder="friend@example.com" class="formInput" required />
      
      <label class="label">Assign Password</label>
      <input v-model="password" type="password" placeholder="Min 6 characters" class="formInput" required />
      
      <button type="submit" class="btn btnPrimary blockBtn" :disabled="isLoading">
        {{ isLoading ? 'Creating...' : 'Create Account' }}
      </button>

      <p v-if="successMsg" class="successText">{{ successMsg }}</p>
      <p v-if="errorMsg" class="errorText">{{ errorMsg }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { auth, firebaseConfig } from '../firebase'; // Import main auth and config
import { initializeApp, getApp, deleteApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

const email = ref('');
const password = ref('');
const errorMsg = ref('');
const successMsg = ref('');
const isLoading = ref(false);
const router = useRouter();

// 🔴 CONFIG: Your Admin Email
const ADMIN_EMAIL = "uniquecreadm1225@gmail.com"; 

onMounted(() => {
  // Security Check: Kick user out if they are not the admin
  const currentUser = auth.currentUser;
  if (!currentUser || currentUser.email !== ADMIN_EMAIL) {
    alert("Access Denied: Admins Only");
    router.push('/');
  }
});

const handleCreateUser = async () => {
  errorMsg.value = "";
  successMsg.value = "";
  isLoading.value = true;

  // 1. Initialize a "Secondary" Firebase App
  // This allows us to create a user WITHOUT changing the current Admin's session
  const secondaryAppName = "secondaryApp";
  const secondaryApp = initializeApp(firebaseConfig, secondaryAppName);
  const secondaryAuth = getAuth(secondaryApp);

  try {
    // 2. Create the user on the secondary app
    await createUserWithEmailAndPassword(secondaryAuth, email.value, password.value);
    
    // 3. Immediately sign that new user out (just to be safe)
    await signOut(secondaryAuth);

    successMsg.value = `Success! Account created for ${email.value}`;
    email.value = "";
    password.value = "";

  } catch (err) {
    if (err.code === 'auth/email-already-in-use') errorMsg.value = "That email is already registered.";
    else if (err.code === 'auth/weak-password') errorMsg.value = "Password must be at least 6 chars.";
    else errorMsg.value = err.message;
  } finally {
    // 4. Cleanup: Delete the secondary app instance to free memory
    deleteApp(secondaryApp);
    isLoading.value = false;
  }
};
</script>

<style scoped>
.createContainer {
  max-width: 400px;
  margin-top: 50px;
  background-color: var(--cardBg);
  padding: 30px;
  border-radius: 12px;
  border: 1px solid #333;
}

.subtitle {
  color: #aaa;
  font-size: 0.9rem;
  margin-bottom: 20px;
}

.label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
  color: var(--primaryColor);
}

.blockBtn {
  width: 100%;
  margin-top: 10px;
}

.successText {
  color: #4cd137;
  margin-top: 15px;
  font-weight: bold;
  background: rgba(76, 209, 55, 0.1);
  padding: 10px;
  border-radius: 5px;
}

.errorText {
  color: #ff4757;
  margin-top: 15px;
  background: rgba(255, 71, 87, 0.1);
  padding: 10px;
  border-radius: 5px;
}
</style>