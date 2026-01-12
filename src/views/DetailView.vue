<template>
  <div class="container" v-if="creature">
    
    <!-- === VIEW MODE === -->
    <div v-if="!isEditing">
      
      <div class="detailGrid">
        
        <!-- LEFT PANEL: Title, Visuals, Meta -->
        <div class="sidePanel">
          <h1 class="creatureTitle">{{ creature.name }}</h1>

          <!-- Visuals Section (Hidden if no images) -->
          <div class="visualsSection" v-if="allImages.length > 0">
             <div class="mainImageWrapper">
                <img 
                  :src="getOptimizedImage(displayCoverImage)" 
                  class="detailImage" 
                  @click="openLightbox(0)"
                />
             </div>

             <!-- Gallery Grid -->
             <div class="galleryGrid" v-if="effectiveGallery.length > 0">
                <div 
                  v-for="(img, index) in visibleGalleryItems" 
                  :key="index" 
                  class="galleryItem"
                  @click="openLightbox(index + 1)" 
                >
                  <img :src="getGalleryImage(img)" />
                </div>

                <!-- MORE BOX -->
                <div 
                  v-if="hiddenGalleryCount > 0" 
                  class="galleryItem moreBox" 
                  @click="openLightbox(visibleGalleryItems.length + 1)"
                  :title="`${hiddenGalleryCount} more images`"
                >
                  <div class="moreBoxContent">
                    <img src="@/assets/images.svg" class="moreIcon" alt="More" />
                    <span class="moreText">+{{ hiddenGalleryCount }}</span>
                  </div>
                </div>
             </div>
          </div>

          <!-- Meta Info (Always shows under visuals, or under title if no visuals) -->
          <div class="metaInfo">
            <p class="authorText">
              Added by: {{ authorDisplayName }}
            </p>

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

        <!-- RIGHT PANEL: Description -->
        <div class="contentPanel">
           <div class="ql-editor descriptionContent" v-html="creature.description"></div>
        </div>

      </div>

    </div>

    <!-- === EDIT MODE (MODAL OVERLAY) === -->
    <div v-else class="editOverlay">
      <div class="editContainer">
        <h2>Edit Creature</h2>
        
        <label class="label">Name</label>
        <input v-model="editData.name" class="formInput" />

        <label class="label">Change Cover Image (Optional)</label>
        <div class="currentImagePreview" v-if="editData.image">
          <img :src="editData.image" style="height: 50px; border-radius: 4px;">
          <small>Current Cover</small>
        </div>
        <div class="fileInputWrapper">
          <input type="file" @change="handleMainImageSelect" accept="image/*" class="formInput" />
        </div>

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

        <label class="label">Manage Gallery</label>
        <div class="galleryManager" v-if="editData.gallery.length > 0">
          <div v-for="(img, index) in editData.gallery" :key="index" class="galleryThumb">
            <img :src="getGalleryImage(img)" />
            <button @click="removeGalleryImage(index)" class="removeImgBtn">X</button>
          </div>
        </div>

        <label class="label" style="margin-top: 15px;">Add More Images</label>
        <div class="fileInputWrapper">
          <input type="file" @change="handleGallerySelect" multiple accept="image/*" class="formInput" />
        </div>

        <div class="btnRow" style="margin-top: 20px;">
          <button @click="saveChanges" class="btn btnSuccess" :disabled="isUploading">
            {{ isUploading ? 'Saving...' : 'Save Changes' }}
          </button>
          <button @click="isEditing = false" class="btn" style="background: #444; color: white;">Cancel</button>
        </div>
        <p v-if="statusMsg" class="statusText">{{ statusMsg }}</p>

      </div>
    </div>

    <!-- === LIGHTBOX OVERLAY === -->
    <transition name="fade">
      <div v-if="lightboxIndex !== null" class="lightboxOverlay" @click.self="closeLightbox">
        <button class="lightboxClose" @click="closeLightbox">×</button>
        
        <!-- Left Arrow -->
        <button class="lightboxArrow arrowLeft" @click.stop="prevImage">
           ◀
        </button>

        <div class="lightboxContent">
          <img :src="getOptimizedImage(allImages[lightboxIndex])" class="lightboxImg" />
        </div>

        <!-- Right Arrow -->
        <button class="lightboxArrow arrowRight" @click.stop="nextImage">
           ▶
        </button>
      </div>
    </transition>

  </div>
</template>

<script setup>
import { ref, onMounted, computed, reactive, nextTick, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { db, auth } from '../firebase';
import { doc, getDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Delta } from '@vueup/vue-quill';

// 🔴 CONFIGURATION
const ADMIN_EMAIL = "uniquecreadm1225@gmail.com"; 
const CLOUD_NAME = "dzj4k39q5"; 
const UPLOAD_PRESET = "unique_preset";

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
const authorDisplayName = ref("Loading..."); 

const isEditing = ref(false);
const isUploading = ref(false);
const statusMsg = ref("");
const editQuillEditor = ref(null);

// LIGHTBOX STATE
const lightboxIndex = ref(null);

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

// === COMPUTED IMAGE LOGIC ===

// All viewable images (Cover + Gallery flat list)
const allImages = computed(() => {
  if (!creature.value) return [];
  const imgs = [];
  
  // If explicitly has cover image, use it
  if (creature.value.image) {
    imgs.push(creature.value.image);
  }
  
  if (creature.value.gallery && creature.value.gallery.length > 0) {
    if (creature.value.image) {
      // Normal case: Cover + Gallery
      imgs.push(...creature.value.gallery);
    } else {
      // Fallback case: No cover, so entire gallery is the list (1st item acts as cover)
      imgs.push(...creature.value.gallery); 
    }
  }
  return imgs;
});

// The image displayed as the "Cover" (Big Image)
const displayCoverImage = computed(() => {
  if (allImages.value.length > 0) {
    return allImages.value[0];
  }
  return null; 
});

// The gallery thumbs to display (The list MINUS the cover image)
const effectiveGallery = computed(() => {
  if (allImages.value.length <= 1) return []; // Only cover or empty
  return allImages.value.slice(1);
});

// Logic for Truncating Gallery (Max 6 slots total -> 5 items + 1 "More" box)
const MAX_VISIBLE_THUMBS = 6;
const visibleGalleryItems = computed(() => {
  if (effectiveGallery.value.length <= MAX_VISIBLE_THUMBS) {
    return effectiveGallery.value;
  }
  // If we have more, show one LESS than max, so we have room for the "More" box
  return effectiveGallery.value.slice(0, MAX_VISIBLE_THUMBS - 1); // e.g. Show 5
});

const hiddenGalleryCount = computed(() => {
  if (effectiveGallery.value.length <= MAX_VISIBLE_THUMBS) return 0;
  return effectiveGallery.value.length - visibleGalleryItems.value.length;
});

// === METHODS ===

const openLightbox = (index) => {
  if(index < 0 || index >= allImages.value.length) return;
  lightboxIndex.value = index;
  document.body.style.overflow = 'hidden'; 
};

const closeLightbox = () => {
  lightboxIndex.value = null;
  document.body.style.overflow = '';
};

const nextImage = () => {
  if (lightboxIndex.value === null) return;
  lightboxIndex.value = (lightboxIndex.value + 1) % allImages.value.length;
};

const prevImage = () => {
  if (lightboxIndex.value === null) return;
  lightboxIndex.value = (lightboxIndex.value - 1 + allImages.value.length) % allImages.value.length;
};

const handleKeydown = (e) => {
  if (lightboxIndex.value === null) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') nextImage();
  if (e.key === 'ArrowLeft') prevImage();
};

onMounted(async () => {
  await fetchCreature();
  onAuthStateChanged(auth, (u) => user.value = u);
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});

const fetchCreature = async () => {
  const docRef = doc(db, "creatures", route.params.id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    creature.value = { id: docSnap.id, ...docSnap.data() };
    document.title = `Unique Beings - ${creature.value.name}`;
    fetchAuthorProfile(creature.value.createdBy, creature.value.authorEmail);
  }
};

// 🔴 UPDATED PROFILE LOGIC
const fetchAuthorProfile = async (creatorUid, fallbackEmail) => {
  const safeFallback = fallbackEmail || "Unknown Creator";

  if (!creatorUid) {
    authorDisplayName.value = safeFallback;
    return;
  }

  try {
    const profileSnap = await getDoc(doc(db, "profiles", creatorUid));
    if (profileSnap.exists()) {
      const data = profileSnap.data();
      if (data.isAnonymous) {
        authorDisplayName.value = "Anonymous User";
      } else if (data.nickname && data.nickname.trim().length > 0) {
        authorDisplayName.value = data.nickname;
      } else {
        authorDisplayName.value = safeFallback;
      }
    } else {
      authorDisplayName.value = safeFallback;
    }
  } catch (error) {
    console.error("Error fetching profile:", error);
    authorDisplayName.value = safeFallback;
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
/* --- NEW LAYOUT: SIDE & CONTENT PANELS --- */
.detailGrid {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

@media (min-width: 900px) {
  .detailGrid {
    display: grid;
    /* Left Panel (Visuals) needs space, Content needs space. 
       Let's stick to a robust 45% - 55% split for balance. */
    grid-template-columns: 0.8fr 1.2fr; 
    align-items: start;
    gap: 40px;
  }
}

.sidePanel {
  display: flex;
  flex-direction: column;
}

.contentPanel {
  min-width: 0;
}

/* --- VISUALS SECTION --- */
.visualsSection {
  margin-bottom: 20px;
}

.mainImageWrapper {
  width: 100%;
  margin-bottom: 15px;
}

.detailImage {
  width: 100%;
  height: auto;
  max-height: 600px;
  object-fit: contain;
  border-radius: 12px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.5);
  cursor: zoom-in;
  transition: transform 0.2s;
  display: block; 
}

.detailImage:hover {
  transform: scale(1.01);
}

.galleryGrid {
  display: grid;
  grid-template-columns: repeat(3, 1fr); /* 3 cols seems safer for side panel */
  gap: 10px;
}

.galleryItem {
  aspect-ratio: 1; 
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  background: #000;
  border: 1px solid #333;
}

.galleryItem:hover {
  filter: brightness(1.2);
  border-color: var(--primaryColor);
}

.galleryItem img { 
  width: 100%; 
  height: 100%; 
  object-fit: cover; 
}

/* MORE BOX STYLES */
.moreBox {
  background: #222;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px dashed #666;
}
.moreBoxContent {
  text-align: center;
  color: #bbb;
}
.moreIcon {
  width: 30px;
  height: 30px;
  display: block;
  margin: 0 auto 5px;
  filter: invert(0.8);
}
.moreText {
  font-size: 0.9rem;
  font-weight: bold;
}
.moreBox:hover .moreText {
  color: white;
}
.moreBox:hover .moreIcon {
  filter: invert(1);
}

/* --- TEXT & META --- */
.creatureTitle {
  font-size: 3rem;
  margin-top: 0;
  margin-bottom: 20px;
  color: var(--primaryColor);
  line-height: 1.1;
  word-break: break-word;
}

.metaInfo {
  margin-top: 10px;
}

.authorText {
  color: #666;
  font-size: 0.9rem;
  font-style: italic;
  margin-bottom: 15px;
}

.descriptionContent {
  color: #ddd;
  line-height: 1.8;
  font-size: 1.1rem;
}

.descriptionContent :deep(img) {
  max-width: 100%;
  border-radius: 8px;
  margin: 10px 0;
}

.descriptionContent :deep(h1), 
.descriptionContent :deep(h2) {
  color: white;
  margin-top: 20px;
  line-height: 1.2;
}

.descriptionContent :deep(ul), 
.descriptionContent :deep(ol) {
  padding-left: 20px;
}

.descriptionContent :deep(hr) {
  border: none;
  border-top: 2px solid #444;
  margin: 30px 0;
}

/* --- ADMIN ACTIONS --- */
.adminActions {
  padding-top: 10px;
  padding-bottom: 10px;
}

.btnRow {
  display: flex;
  gap: 15px;
  flex-wrap: wrap; 
}

.btnEdit { background-color: #fbc531; color: black; font-weight: bold; }
.btnDelete { background-color: #ff4757; color: white; font-weight: bold; }
.btnSuccess { background-color: #2ecc71; color: white; font-weight: bold; }

.btnEdit:hover, .btnDelete:hover, .btnSuccess:hover {
  filter: brightness(1.1);
}

.permissionText {
  color: #aaa;
  font-size: 0.8rem;
  margin-bottom: 10px;
}

/* --- LIGHTBOX --- */
.lightboxOverlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.95);
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.lightboxContent {
  max-width: 90%;
  max-height: 90vh;
}

.lightboxImg {
  max-width: 100%;
  max-height: 85vh;
  object-fit: contain;
  box-shadow: 0 0 20px rgba(0,0,0,0.8);
  border-radius: 4px;
}

.lightboxClose {
  position: absolute;
  top: 20px;
  right: 30px;
  background: transparent;
  border: none;
  color: white;
  font-size: 3rem;
  cursor: pointer;
  z-index: 2001;
}

.lightboxArrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 60px;
  height: 60px;
  
  /* Reuse styling from ScrollToTop button */
  background-color: #222;
  border: 2px solid var(--primaryColor);
  color: var(--primaryColor);
  border-radius: 12px;
  font-size: 1.5rem;
  cursor: pointer;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.5);
  z-index: 2001;
  
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.arrowLeft { left: 30px; }
.arrowRight { right: 30px; }

.lightboxArrow:hover {
  background-color: var(--primaryColor);
  color: white;
  box-shadow: 0 0 15px var(--primaryColor);
  transform: translateY(-50%) scale(1.1);
}
.lightboxArrow:active {
  transform: translateY(-50%) scale(0.95);
}

/* Mobile Adjustments for Lightbox */
@media (max-width: 768px) {
  .lightboxArrow {
    top: auto;
    bottom: 20px;
    transform: none;
    width: 50px;
    height: 50px;
  }

  .arrowLeft { left: 20px; }
  .arrowRight { right: 20px; }

  /* Ensure hover effect doesn't break positioning on mobile */
  .lightboxArrow:hover {
    transform: scale(1.1);
  }
  .lightboxArrow:active {
    transform: scale(0.95);
  }

  /* Push image up slightly so it doesn't overlap with bottom buttons */
  .lightboxImg {
    max-height: 75vh;
    margin-bottom: 60px; 
  }
}

/* --- EDIT MODAL STYLES --- */
.editOverlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 999;
  padding: 10px; 
}

.editContainer {
  background: var(--cardBg);
  padding: 20px;
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
  width: 70px;
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

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>