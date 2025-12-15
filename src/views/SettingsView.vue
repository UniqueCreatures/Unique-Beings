<template>
  <div class="container settingsContainer">
    <h2>User Settings</h2>
    <p class="subtitle">Manage your profile and security.</p>

    <!-- 1. PROFILE SETTINGS CARD -->
    <div class="settingsCard">
      <h3>Public Profile</h3>
      
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
      
      <p v-if="profileMsg" class="statusText" :class="{ errorText: isProfileError }">
        {{ profileMsg }}
      </p>
    </div>

    <!-- 2. SECURITY CARD (New) -->
    <div class="settingsCard securityCard">
      <h3>Change Password</h3>
      <p class="warningText">⚠️ Warning: You will need to use the new password next time you login.</p>

      <label class="label">Current Password</label>
      <input v-model="passwords.old" type="password" placeholder="Required" class="formInput" />

      <label class="label">New Password</label>
      <input v-model="passwords.new" type="password" placeholder="Min 6 characters" class="formInput" />

      <label class="label">Confirm New Password</label>
      <input v-model="passwords.confirm" type="password" placeholder="Repeat new password" class="formInput" />

      <button @click="handleChangePassword" class="btn btnPrimary blockBtn" :disabled="isProcessingPass">
        {{ isProcessingPass ? 'Updating...' : 'Update Password' }}
      </button>

      <!-- Security Feedback Messages -->
      <p v-if="securityMsg" class="statusText" :class="{ errorText: isSecurityError }">
        {{ securityMsg }}
      </p>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { db, auth } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { 
  onAuthStateChanged, 
  reauthenticateWithCredential, 
  EmailAuthProvider, 
  updatePassword 
} from 'firebase/auth';

// --- PROFILE STATE ---
const nickname = ref('');
const isAnonymous = ref(false);
const isLoading = ref(false);
const profileMsg = ref('');
const isProfileError = ref(false);
const userId = ref(null);

// --- SECURITY STATE ---
const passwords = reactive({
  old: '',
  new: '',
  confirm: ''
});
const isProcessingPass = ref(false);
const securityMsg = ref('');
const isSecurityError = ref(false);

// --- INIT ---
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

// --- PROFILE FUNCTIONS ---
const saveNickname = async () => {
  if (!userId.value) return;
  isLoading.value = true;
  isProfileError.value = false;
  
  try {
    const docRef = doc(db, "profiles", userId.value);
    await setDoc(docRef, { 
      nickname: nickname.value,
      isAnonymous: isAnonymous.value 
    }, { merge: true });
    profileMsg.value = "Nickname updated successfully!";
    setTimeout(() => profileMsg.value = '', 3000);
  } catch (e) {
    isProfileError.value = true;
    profileMsg.value = "Error saving profile.";
  } finally {
    isLoading.value = false;
  }
};

const toggleAnonymous = async () => {
  if (!userId.value) return;
  isAnonymous.value = !isAnonymous.value;
  // Auto-save when toggled
  try {
    const docRef = doc(db, "profiles", userId.value);
    await setDoc(docRef, { isAnonymous: isAnonymous.value }, { merge: true });
    profileMsg.value = isAnonymous.value ? "You are now anonymous" : "Identity revealed";
    setTimeout(() => profileMsg.value = '', 3000);
  } catch (e) {
    console.error(e);
  }
};

// --- SECURITY FUNCTIONS (New) ---
const handleChangePassword = async () => {
  // 1. Validation
  securityMsg.value = "";
  isSecurityError.value = false;

  if (!passwords.old || !passwords.new || !passwords.confirm) {
    isSecurityError.value = true;
    securityMsg.value = "Please fill in all fields.";
    return;
  }

  if (passwords.new !== passwords.confirm) {
    isSecurityError.value = true;
    securityMsg.value = "New passwords do not match.";
    return;
  }

  if (passwords.new.length < 6) {
    isSecurityError.value = true;
    securityMsg.value = "Password must be at least 6 characters.";
    return;
  }

  // 2. Warning Confirmation
  if (!confirm("Are you sure you want to change your password?")) return;

  isProcessingPass.value = true;
  const user = auth.currentUser;

  try {
    // 3. Re-Authenticate (Security requirement)
    // We create a credential using the OLD password to prove identity
    const credential = EmailAuthProvider.credential(user.email, passwords.old);
    await reauthenticateWithCredential(user, credential);

    // 4. Update Password
    await updatePassword(user, passwords.new);

    // Success
    securityMsg.value = "Password updated successfully!";
    passwords.old = '';
    passwords.new = '';
    passwords.confirm = '';

  } catch (error) {
    isSecurityError.value = true;
    
    // Handle specific Firebase Errors
    if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
      securityMsg.value = "Incorrect current password.";
    } else if (error.code === 'auth/weak-password') {
      securityMsg.value = "New password is too weak.";
    } else {
      securityMsg.value = "Error: " + error.message;
    }
  } finally {
    isProcessingPass.value = false;
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
  margin-bottom: 30px; /* Space between cards */
}

h3 {
  margin-top: 0;
  border-bottom: 1px solid #444;
  padding-bottom: 10px;
  margin-bottom: 20px;
  color: white;
}

.label {
  display: block;
  font-weight: bold;
  color: var(--primaryColor);
  margin-bottom: 10px;
  margin-top: 15px; /* Spacing for stacked inputs */
}

.inputGroup {
  display: flex;
  gap: 10px;
}

.saveBtn {
  height: 42px;
  white-space: nowrap;
}

.charCount {
  display: block;
  text-align: right;
  color: #666;
  font-size: 0.8rem;
  margin-top: 5px;
}

/* Switches */
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

/* Feedback Messages */
.statusText {
  margin-top: 20px;
  text-align: center;
  color: #4cd137; /* Success Green */
  font-weight: bold;
  background: rgba(76, 209, 55, 0.1);
  padding: 10px;
  border-radius: 6px;
}

.statusText.errorText {
  color: #ff4757; /* Error Red */
  background: rgba(255, 71, 87, 0.1);
}

/* Security Specific Styles */
.securityCard {
  border: 1px solid #444;
}

.warningText {
  font-size: 0.9rem;
  color: #fbc531; /* Yellow warning */
  background: rgba(251, 197, 49, 0.1);
  padding: 10px;
  border-radius: 6px;
  margin-bottom: 15px;
}

.blockBtn {
  width: 100%;
  margin-top: 20px;
}
</style>