<template>
  <div class="container" v-if="creature">
    
    <!-- === VIEW MODE === -->
    <div v-if="!isEditing">
      <div class="detailLayout">
        <div class="imageCol">
          <img :src="getOptimizedImage(creature.image)" class="detailImage" />
        </div>
        
        <div class="infoCol">
          <h1 class="creatureTitle">{{ creature.name }}</h1>
          <p class="authorText" v-if="creature.authorEmail">Added by: {{ creature.authorEmail }}</p>
          
          <!-- Rich Text Display -->
          <div class="ql-editor descriptionContent" v-html="creature.description"></div>
          
          <!-- Action Buttons (Edit/Delete) -->
          <div v-if="canModify" class="adminActions">
            <p class="permissionText">
              Actions available because you are {{ isAdmin ? 'an Admin' : 'the Creator' }}.
            </p>
            <div class="btnRow">
              <button @click="startEditing" class="btn btnEdit">Edit Creature</button>
              <button @click="deleteCreature" class="btn btnDelete">Delete</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Gallery Display -->
      <div v-if="creature.gallery && creature.gallery.length > 0" class="gallerySection">
        <h3 class="galleryTitle">Gallery</h3>
        <div class="galleryGrid">
          <div v-for="(img, index) in creature.gallery" :key="index" class="galleryItem">
            <img :src="getGalleryImage(img)" @click="openImage(img)" />
          </div>
        </div>
      </div>
    </div>

    <!-- === EDIT MODE (MODAL OVERLAY) === -->
    <div v-else class="editOverlay">
      <div class="editContainer">
        <h2>Edit Creature</h2>
        
        <!-- Name Edit -->
        <label class="label">Name</label>
        <input v-model="editData.name" class="formInput" />

        <!-- Cover Image Edit -->
        <label class="label">Change Cover Image (Optional)</label>
        <div class="currentImagePreview" v-if="editData.image">
          <img :src="editData.image" style="height: 50px; border-radius: 4px;">
          <small>Current Cover</small>
        </div>
        <div class="fileInputWrapper">
          <input type="file" @change="handleMainImageSelect" accept="image/*" class="formInput" />
        </div>

        <!-- Description Edit (Quill) -->
        <label class="label">Description</label>
        <div class="editorWrapper">
          <QuillEditor 
            ref="editQuillEditor"
            theme="snow" 
            v-model:content="editData.description" 
            contentType="html" 
            :toolbar="toolbarOptions"
            @ready="onEditorReady"
          />
        </div>

        <!-- Gallery Management -->
        <label class="label">Manage Gallery</label>
        
        <!-- 1. List existing images with Delete option -->
        <div class="galleryManager" v-if="editData.gallery.length > 0">
          <div v-for="(img, index) in editData.gallery" :key="index" class="galleryThumb">
            <img :src="getGalleryImage(img)" />
            <button @click="removeGalleryImage(index)" class="removeImgBtn">X</button>
          </div>
        </div>

        <!-- 2. Add new images -->
        <label class="label" style="margin-top: 15px;">Add More Images</label>
        <div class="fileInputWrapper">
          <input type="file" @change="handleGallerySelect" multiple accept="image/*" class="formInput" />
        </div>

        <!-- Action Buttons -->
        <div class="btnRow" style="margin-top: 20px;">
          <!-- 🟢 CHANGED: Class is now 'btnSuccess' -->
          <button @click="saveChanges" class="btn btnSuccess" :disabled="isUploading">
            {{ isUploading ? 'Saving...' : 'Save Changes' }}
          </button>
          <button @click="isEditing = false" class="btn" style="background: #444; color: white;">Cancel</button>
        </div>
        <p v-if="statusMsg" class="statusText">{{ statusMsg }}</p>

      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive, nextTick } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { db, auth } from '../firebase';
import { doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Delta } from '@vueup/vue-quill';

// 🔴 CONFIGURATION
const ADMIN_EMAIL = "uniquecreadm1225@gmail.com"; 
const CLOUD_NAME = "dzj4k39q5"; 
const UPLOAD_PRESET = "unique_preset";

// Editor Options
const toolbarOptions = [
  [{ 'header': [1, 2, 3, false] }], 
  ['bold', 'underline', 'strike'], 
  [{ 'color': [] }, { 'background': [] }], 
  [{ 'list': 'ordered'}, { 'list': 'bullet' }], 
  ['divider'], 
  ['clean'] 
];

const route = useRoute();
const router = useRouter();
const creature = ref(null);
const user = ref(null);

const isEditing = ref(false);
const isUploading = ref(false);
const statusMsg = ref("");
const editQuillEditor = ref(null);

const editData = reactive({
  name: '',
  description: '',
  image: '',
  gallery: []
});

const newMainFile = ref(null);
const newGalleryFiles = ref([]);

const isAdmin = computed(() => user.value && user.value.email === ADMIN_EMAIL);
const canModify = computed(() => {
  if (!user.value || !creature.value) return false;
  if (isAdmin.value) return true;
  if (creature.value.createdBy === user.value.uid) return true;
  return false;
});

onMounted(async () => {
  await fetchCreature();
  onAuthStateChanged(auth, (u) => user.value = u);
});

const fetchCreature = async () => {
  const docRef = doc(db, "creatures", route.params.id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    creature.value = { id: docSnap.id, ...docSnap.data() };
  }
};

const startEditing = () => {
  editData.name = creature.value.name;
  editData.description = creature.value.description;
  editData.image = creature.value.image;
  editData.gallery = [...(creature.value.gallery || [])];
  isEditing.value = true;
};

const removeGalleryImage = (index) => {
  editData.gallery.splice(index, 1);
};

const handleMainImageSelect = (e) => newMainFile.value = e.target.files[0];
const handleGallerySelect = (e) => newGalleryFiles.value = Array.from(e.target.files);

const uploadOneFile = async (file) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: formData });
  if (!res.ok) throw new Error("Upload failed");
  const data = await res.json();
  return data.secure_url;
};

const saveChanges = async () => {
  isUploading.value = true;
  statusMsg.value = "Processing...";

  try {
    if (newMainFile.value) {
      statusMsg.value = "Uploading new cover...";
      editData.image = await uploadOneFile(newMainFile.value);
    }
    if (newGalleryFiles.value.length > 0) {
      statusMsg.value = "Uploading new gallery images...";
      const newUrls = await Promise.all(newGalleryFiles.value.map(file => uploadOneFile(file)));
      editData.gallery = [...editData.gallery, ...newUrls];
    }

    statusMsg.value = "Updating database...";
    const docRef = doc(db, "creatures", route.params.id);
    await updateDoc(docRef, {
      name: editData.name,
      description: editData.description,
      image: editData.image,
      gallery: editData.gallery
    });

    await fetchCreature();
    isEditing.value = false;
    newMainFile.value = null;
    newGalleryFiles.value = [];
    statusMsg.value = "";

  } catch (err) {
    console.error(err);
    statusMsg.value = "Error: " + err.message;
  } finally {
    isUploading.value = false;
  }
};

const deleteCreature = async () => {
  if(confirm("Are you sure? This cannot be undone.")) {
    await deleteDoc(doc(db, "creatures", route.params.id));
    router.push('/list');
  }
};

const getOptimizedImage = (url) => {
  if (!url || !url.includes('cloudinary')) return url || 'https://via.placeholder.com/400';
  return url.replace('/upload/', '/upload/c_limit,w_1000/');
};

const getGalleryImage = (url) => {
  if (!url || !url.includes('cloudinary')) return url;
  return url.replace('/upload/', '/upload/c_fill,w_300,h_300/');
};

const openImage = (url) => window.open(url, '_blank');

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
      alert("Please use the image uploader below.");
    }
  });
};
</script>

<style scoped>
/* --- LAYOUT --- */
.detailLayout {
  /* 🔴 CHANGED: Use Flex for mobile to ensure natural stacking order */
  display: flex;
  flex-direction: column;
  gap: 40px;
  margin-bottom: 60px;
}

/* Tablet/Desktop: Switch to Grid */
@media (min-width: 768px) {
  .detailLayout {
    display: grid;
    grid-template-columns: 1fr 1fr;
    align-items: start;
  }
}

.detailImage {
  width: 100%;
  max-height: 600px;
  object-fit: cover;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
  display: block;
}

.infoCol {
  /* 🔴 FIX 1: Allow this column to shrink below the text size */
  min-width: 0; 
  /* (Keep your existing flex properties) */
  display: flex;
  flex-direction: column;
}

.creatureTitle {
  font-size: 3rem;
  margin-top: 0;
  margin-bottom: 5px;
  color: var(--primaryColor);
  line-height: 1.1;
  
  /* 🔴 FIX 2: Force the long title to wrap */
  overflow-wrap: break-word;
  word-break: break-word;
  hyphens: auto;
}

.authorText {
  color: #666;
  font-size: 0.9rem;
  font-style: italic;
  margin-bottom: 25px;
}

.descriptionContent {
  color: #ddd;
  line-height: 1.8;
  font-size: 1.1rem;
  overflow-wrap: break-word;
  word-wrap: break-word;
  margin-bottom: 30px; /* Ensure space before actions */
}

/* Fix images inside text description */
.descriptionContent :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 8px;
  margin: 10px 0;
}

/* --- ADMIN ACTIONS --- */
.adminActions {
  margin-top: auto; /* Pushes to bottom of container if flex */
  padding-top: 20px;
  border-top: 1px solid #333;
  padding-bottom: 10px; /* Add space at bottom */
}

.btnRow {
  display: flex;
  gap: 15px;
  margin-top: 15px;
  flex-wrap: wrap; /* Allow buttons to stack on tiny screens */
}

.btnEdit {
  background-color: #fbc531;
  color: black;
  font-weight: bold;
}

.btnDelete {
  background-color: #ff4757;
  color: white;
  font-weight: bold;
}

.btnSuccess {
  background-color: #2ecc71;
  color: white;
  font-weight: bold;
}

/* Button Hover Effects */
.btnEdit:hover, .btnDelete:hover, .btnSuccess:hover {
  filter: brightness(1.1);
}

.permissionText {
  color: #aaa;
  font-size: 0.8rem;
  margin-bottom: 10px;
}

/* --- GALLERY --- */
.gallerySection {
  margin-top: 50px;
  padding-top: 30px;
  border-top: 1px solid #333;
}

.galleryTitle { font-size: 2rem; margin-bottom: 20px; }

.galleryGrid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); /* Smaller grid items for mobile */
  gap: 15px;
}

.galleryItem {
  aspect-ratio: 1; 
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background: #000;
}

.galleryItem:hover {
  box-shadow: 0 5px 15px rgba(0,0,0,0.5);
  filter: brightness(1.1);
}

.galleryItem img { width: 100%; height: 100%; object-fit: cover; }

/* --- EDIT MODAL STYLES --- */
.editOverlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  padding: 10px; /* Reduced padding for mobile */
}

.editContainer {
  background: var(--cardBg);
  padding: 20px; /* Reduced padding */
  border-radius: 12px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  border: 1px solid #444;
}

.label {
  display: block;
  margin-bottom: 8px;
  margin-top: 15px;
  color: var(--primaryColor);
  font-weight: bold;
}

.galleryManager {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  background: #333;
  padding: 10px;
  border-radius: 8px;
}

.galleryThumb {
  position: relative;
  width: 70px; /* Smaller thumbs */
  height: 70px;
}

.galleryThumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.removeImgBtn {
  position: absolute;
  top: -5px; right: -5px;
  background: red;
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px; height: 20px;
  cursor: pointer;
  font-size: 12px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}

.statusText {
  color: #4cd137;
  font-weight: bold;
  margin-top: 10px;
}

.editorWrapper {
  background: white;
  color: black;
  border-radius: 5px;
  overflow: hidden;
  border: 1px solid #444;
}

.editorWrapper :deep(.ql-editor) {
  min-height: 200px;
  max-height: 400px;
  resize: vertical;
  overflow-y: auto;
  font-family: 'Inter', sans-serif !important;
  font-size: 16px;
}

.editorWrapper :deep(.ql-toolbar) {
  background-color: #f0f0f0;
  border-bottom: 1px solid #ccc;
}
</style>