<template>
  <div class="container loginContainer">
    <h2>Login</h2>
    
    <form @submit.prevent="handleLogin">
      <input v-model="email" type="email" placeholder="Email" class="formInput" required />
      <input v-model="password" type="password" placeholder="Password" class="formInput" required />
      
      <button type="submit" class="btn btnPrimary blockBtn">Login</button>

      <p v-if="error" class="errorText">{{ error }}</p>
    </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { auth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'vue-router';

const email = ref('');
const password = ref('');
const error = ref('');
const router = useRouter();

const handleLogin = async () => {
  error.value = "";
  try {
    await signInWithEmailAndPassword(auth, email.value, password.value);
    router.push('/list');
  } catch (err) {
    error.value = "Invalid email or password.";
  }
};
</script>

<style scoped>
.loginContainer {
  max-width: 400px;
  margin-top: 50px;
  text-align: center;
}

.blockBtn {
  width: 100%;
  margin-top: 10px;
}

.errorText {
  color: #ff4757;
  margin-top: 10px;
  font-size: 0.9rem;
}
</style>