<template>
  <div class="container settingsContainer">
    <h2>User Settings</h2>
    <p class="subtitle">Manage how your name appears on your creatures.</p>

    <div class="settingsCard">
      <!-- Nickname Section -->
      <label class="label">Display Nickname</label>
      <div class="inputGroup">
        <input 
          v-model="nickname" 
          type="text" 
          placeholder="Enter nickname" 
          class="formInput" 
          maxlength="16"
          :disabled="isAnonymous"
        />
        <button 
          @click="saveNickname" 
          class="btn btnPrimary saveBtn" 
          :disabled="isAnonymous || isLoading"
        >
          Save
        </button>
      </div>
      <small class="charCount">{{ nickname.length }}/16 characters</small>

      <!-- Anonymous Switch -->
      <div class="switchRow">
        <label class="switchLabel">Appear as anonymous</label>
        <div 
          class="toggleSwitch" 
          :class="{ active: isAnonymous }" 
          @click="toggleAnonymous"
        >
          <div class="toggleThumb"></div>
        </div>
      </div>
      
      <p v-if="statusMsg" class="statusText">{{ statusMsg }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

const nickname = ref('');
const isAnonymous = ref(false);
const isLoading = ref(false);
const statusMsg = ref('');
const userId = ref(null);

const loadUserData = async (uid) => {
  userId.value = uid;
  const docRef = doc(db, "profiles", uid);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    nickname.value = data.nickname || '';
    isAnonymous.value = data.isAnonymous || false;
  }
};

onMounted(() => {
  onAuthStateChanged(auth, (user) => {
    if (user) loadUserData(user.uid);
  });
});

const saveNickname = async () => {
  if (!userId.value) return;
  isLoading.value = true;
  try {
    const docRef = doc(db, "profiles", userId.value);
    await setDoc(docRef, { 
      nickname: nickname.value,
      isAnonymous: isAnonymous.value 
    }, { merge: true });
    statusMsg.value = "Nickname updated!";
    setTimeout(() => statusMsg.value = '', 3000);
  } catch (e) {
    statusMsg.value = "Error saving.";
  } finally {
    isLoading.value = false;
  }
};

const toggleAnonymous = async () => {
  if (!userId.value) return;
  isAnonymous.value = !isAnonymous.value;
  try {
    const docRef = doc(db, "profiles", userId.value);
    await setDoc(docRef, { isAnonymous: isAnonymous.value }, { merge: true });
    statusMsg.value = isAnonymous.value ? "You are now anonymous" : "Identity revealed";
    setTimeout(() => statusMsg.value = '', 3000);
  } catch (e) {
    console.error(e);
  }
};
</script>

<style scoped>
.settingsContainer {
  max-width: 500px;
  margin-top: 50px;
}

.subtitle {
  color: #aaa;
  margin-bottom: 30px;
}

.settingsCard {
  background: var(--cardBg);
  padding: 30px;
  border-radius: 12px;
  border: 1px solid #333;
}

.label {
  display: block;
  font-weight: bold;
  color: var(--primaryColor);
  margin-bottom: 10px;
}

.inputGroup {
  display: flex;
  gap: 10px;
}

.saveBtn {
  height: 42px; /* Matches form input height */
  white-space: nowrap;
}

.charCount {
  display: block;
  text-align: right;
  color: #666;
  font-size: 0.8rem;
  margin-top: 5px;
}

.switchRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #333;
}

.switchLabel {
  font-weight: 600;
  color: #ddd;
}

/* Custom Toggle Switch */
.toggleSwitch {
  width: 50px;
  height: 26px;
  background: #444;
  border-radius: 13px;
  position: relative;
  cursor: pointer;
  transition: background 0.3s;
}

.toggleSwitch.active {
  background: var(--primaryColor);
}

.toggleThumb {
  width: 20px;
  height: 20px;
  background: white;
  border-radius: 50%;
  position: absolute;
  top: 3px;
  left: 3px;
  transition: transform 0.3s;
}

.toggleSwitch.active .toggleThumb {
  transform: translateX(24px);
}

.formInput:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.statusText {
  margin-top: 20px;
  text-align: center;
  color: #4cd137;
  font-weight: bold;
}
</style>