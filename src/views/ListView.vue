<template>
  <div class="container">
    <div class="headerRow">
      <div class="titleSection">
        <h2>Creature Catalog</h2>
        
        <!-- 🔴 NEW: Sort Dropdown -->
        <select v-model="sortBy" class="sortSelect">
          <option value="newest">Newest to Oldest</option>
          <option value="oldest">Oldest to Newest</option>
          <option value="az">Name (A-Z)</option>
          <option value="za">Name (Z-A)</option>
        </select>
      </div>

      <button v-if="user" @click="showAddForm = !showAddForm" class="btn btnPrimary">
        {{ showAddForm ? 'Cancel' : '+ Add New' }}
      </button>
    </div>

    <!-- ADD FORM -->
    <div v-if="showAddForm && user" class="addForm">
      
      <!-- Name -->
      <label class="label">Name</label>
      <input v-model="newCreature.name" placeholder="Creature Name" class="formInput" />
      
      <!-- Main Image -->
      <label class="label">Main Cover Image</label>
      <div class="fileInputWrapper">
        <input type="file" @change="handleMainImageSelect" accept="image/*" class="formInput" />
      </div>

      <!-- RICH TEXT EDITOR -->
      <label class="label">Description & Details</label>
      <div class="editorWrapper">
        <QuillEditor 
          ref="myQuillEditor"
          theme="snow" 
          v-model:content="newCreature.description" 
          contentType="html" 
          :toolbar="toolbarOptions" 
          @ready="onEditorReady"  
        />
        
        <!-- Clear Button Footer -->
        <div class="editorFooter">
          <button type="button" @click="clearEditor" class="clearBtn">
            Clear all text
          </button>
        </div>
      </div>

      <!-- Gallery Images -->
      <label class="label">Gallery (Extra Images)</label>
      <div class="fileInputWrapper">
        <input type="file" @change="handleGallerySelect" multiple accept="image/*" class="formInput" />
        <small style="color: #aaa">Hold Ctrl/Cmd to select multiple files</small>
      </div>
      
      <!-- Save Button -->
      <button @click="uploadToCloudinary" class="btn btnPrimary blockBtn" :disabled="isUploading">
        {{ isUploading ? 'Uploading & Saving...' : 'Save Creature' }}
      </button>
      
      <p v-if="statusMsg" class="statusText">{{ statusMsg }}</p>
    </div>

    <!-- Grid Layout -->
    <!-- 🔴 CHANGED: We now loop through 'sortedCreatures' instead of 'creatures' -->
    <div class="gridContainer">
      <CreatureCard v-for="c in sortedCreatures" :key="c.id" :creature="c" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, reactive, computed } from 'vue';
import { db, auth } from '../firebase';
import { collection, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import CreatureCard from '../components/CreatureCard.vue';
import { Delta } from '@vueup/vue-quill';

// 🔴 CONFIGURATION
const CLOUD_NAME = "dzj4k39q5"; 
const UPLOAD_PRESET = "unique_preset";

// Toolbar settings
const toolbarOptions = [
  [{ 'header': [1, 2, 3, false] }], 
  ['bold', 'underline', 'strike'], 
  [{ 'color': [] }, { 'background': [] }], 
  [{ 'list': 'ordered'}, { 'list': 'bullet' }], 
  ['divider'], 
  ['clean'] 
];

const creatures = ref([]);
const user = ref(null);
const showAddForm = ref(false);
const isUploading = ref(false);
const statusMsg = ref("");

// 🔴 NEW: Sort State
const sortBy = ref('newest'); // Default sort

// Direct reference to editor
const myQuillEditor = ref(null);

const mainFile = ref(null);
const galleryFiles = ref([]);

const newCreature = reactive({
  name: '',
  description: '', 
  image: ''
});

// 🔴 NEW: Sorting Logic
const sortedCreatures = computed(() => {
  // Create a copy of the array to sort
  return [...creatures.value].sort((a, b) => {
    
    // 1. Newest to Oldest (Based on createdAt timestamp)
    if (sortBy.value === 'newest') {
      // If createdAt doesn't exist (old data), treat it as 0
      return (b.createdAt || 0) - (a.createdAt || 0);
    }
    
    // 2. Oldest to Newest
    if (sortBy.value === 'oldest') {
      return (a.createdAt || 0) - (b.createdAt || 0);
    }
    
    // 3. A-Z
    if (sortBy.value === 'az') {
      return a.name.localeCompare(b.name);
    }
    
    // 4. Z-A
    if (sortBy.value === 'za') {
      return b.name.localeCompare(a.name);
    }
  });
});

const clearEditor = () => {
  if (confirm("Are you sure? This will clear all text.")) {
    newCreature.description = '';
    if (myQuillEditor.value) {
      myQuillEditor.value.setHTML('');
    }
  }
};

const handleMainImageSelect = (event) => {
  mainFile.value = event.target.files[0];
};

const handleGallerySelect = (event) => {
  galleryFiles.value = Array.from(event.target.files);
};

const uploadOneFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
    method: "POST", body: formData
  });
  
  if (!response.ok) throw new Error("Upload failed");
  const data = await response.json();
  return data.secure_url;
};

const uploadToCloudinary = async () => {
  if (!newCreature.name) return alert("Name is required");
  
  isUploading.value = true;
  statusMsg.value = "Starting upload...";

  try {
    let mainImageUrl = "https://via.placeholder.com/400";
    if (mainFile.value) {
      statusMsg.value = "Uploading Cover Image...";
      mainImageUrl = await uploadOneFile(mainFile.value);
    }

    let galleryUrls = [];
    if (galleryFiles.value.length > 0) {
      statusMsg.value = `Uploading ${galleryFiles.value.length} gallery images...`;
      galleryUrls = await Promise.all(galleryFiles.value.map(file => uploadOneFile(file)));
    }

  statusMsg.value = "Saving to Database...";

    // 1. Check for Nickname/Anonymous status locally for the "snapshot" name
    let displayName = user.value.email; 
    try {
      const profileSnap = await getDoc(doc(db, "profiles", user.value.uid));
      if (profileSnap.exists()) {
        const data = profileSnap.data();
        if (data.isAnonymous) displayName = "Anonymous User";
        else if (data.nickname) displayName = data.nickname;
      }
    } catch (e) {
      console.log("Profile check failed, using email");
    }

    // 2. Save to Firebase
    await addDoc(collection(db, "creatures"), { 
      name: newCreature.name,
      description: newCreature.description,
      image: mainImageUrl,
      gallery: galleryUrls, 
      
      createdBy: user.value.uid,
      
      // 🔴 IMPORTANT FIX: We must save BOTH the email and the display name
      authorEmail: user.value.email, // <--- THIS WAS MISSING
      authorName: displayName,       
      
      createdAt: Date.now() 
    });

    newCreature.name = ''; 
    newCreature.description = '';
    if (myQuillEditor.value) myQuillEditor.value.setHTML(''); 
    mainFile.value = null;
    galleryFiles.value = [];
    showAddForm.value = false;
    statusMsg.value = "";
    
    fetchCreatures();

  } catch (error) {
    console.error(error);
    statusMsg.value = "Error: " + error.message;
  } finally {
    isUploading.value = false;
  }
};

const fetchCreatures = async () => {
  const querySnapshot = await getDocs(collection(db, "creatures"));
  creatures.value = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

onMounted(() => {
  fetchCreatures();
  onAuthStateChanged(auth, (u) => user.value = u);
});

const onEditorReady = (quill) => {
  const toolbar = quill.getModule('toolbar');
  toolbar.addHandler('divider', () => {
    const range = quill.getSelection(true);
    quill.insertEmbed(range.index, 'divider', true);
    quill.setSelection(range.index + 1);
  });
  quill.clipboard.addMatcher('IMG', (node, delta) => new Delta());
  quill.root.addEventListener('drop', (event) => {
    if (event.dataTransfer?.files?.length > 0) {
      event.preventDefault();
      alert("⚠️ Dragging images is disabled to protect the database.\n\nPlease use the Gallery upload below!");
    }
  });
};
</script>

<style scoped>
.headerRow {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  flex-wrap: wrap; /* Allows wrapping on mobile */
  gap: 15px;
}

.titleSection {
  display: flex;
  align-items: center;
  gap: 20px;
}

/* 🔴 SORT DROPDOWN STYLE */
.sortSelect {
  background-color: var(--cardBg);
  color: white;
  border: 1px solid #444;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  outline: none;
}

.sortSelect:hover {
  border-color: var(--primaryColor);
}

.gridContainer {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.addForm {
  background: var(--cardBg);
  padding: 20px;
  border-radius: 10px;
  margin-bottom: 30px;
  border: 1px solid #333;
}

.label {
  display: block;
  margin-bottom: 8px;
  color: var(--primaryColor);
  font-weight: bold;
  font-size: 0.9rem;
}

.fileInputWrapper {
  margin-bottom: 20px;
}

/* --- EDITOR STYLES --- */

.editorWrapper {
  background: white;
  color: black;
  margin-bottom: 20px;
  border-radius: 5px;
  overflow: hidden;
  border: 1px solid #444;
  display: flex;
  flex-direction: column;
}

.editorWrapper :deep(.ql-editor),
.editorWrapper :deep(.ql-editor *) {
  font-family: 'Inter', sans-serif !important;
}

.editorWrapper :deep(.ql-editor) {
  min-height: 300px;
  resize: vertical;
  overflow-y: auto;
  font-size: 16px; 
  line-height: 1.6;
}

.editorWrapper :deep(.ql-toolbar) {
  background-color: #f0f0f0;
  border-bottom: 1px solid #ccc;
  z-index: 10;
}

.editorWrapper :deep(pre.ql-syntax) {
  background-color: #23241f;
  color: #f8f8f2;
  padding: 10px;
  border-radius: 4px;
  white-space: pre-wrap; 
  margin-bottom: 10px;
}

.editorWrapper :deep(.ql-divider) {
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.editorWrapper :deep(.ql-divider)::after {
  content: "—";
  font-size: 18px;
}

.editorWrapper :deep(hr) {
  border: none;
  border-top: 2px solid #ccc;
  margin: 20px 0;
  cursor: default;
}

/* --- FOOTER & CLEAR BUTTON --- */
.editorFooter {
  background: #f9f9f9;
  padding: 8px 15px;
  border-top: 1px solid #ccc;
  text-align: right;
}

.clearBtn {
  background: transparent;
  border: 1px solid #ff4757;
  color: #ff4757;
  padding: 5px 12px;
  border-radius: 4px;
  font-size: 0.8rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
}

.clearBtn:hover {
  background: #ff4757;
  color: white;
}

.blockBtn {
  width: 100%;
  margin-top: 10px;
}

.statusText {
  margin-top: 10px;
  color: #4cd137;
  font-weight: bold;
  text-align: center;
}
</style>