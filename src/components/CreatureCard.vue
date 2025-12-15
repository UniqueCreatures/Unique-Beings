<template>
  <div class="cardWrapper" @click="goToDetail">
    <div class="imageContainer">
      <!-- We use a helper function to modify the URL for perfect cropping -->
      <img :src="getOptimizedImage(creature.image)" :alt="creature.name" class="cardImage" />
    </div>
    <div class="cardContent">
      <h3 class="cardTitle">{{ creature.name }}</h3>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const props = defineProps(['creature']);
const router = useRouter();

const goToDetail = () => {
  router.push(`/creature/${props.creature.id}`);
};

// Helper to inject Cloudinary transformation parameters
const getOptimizedImage = (url) => {
  if (!url) return 'https://via.placeholder.com/400';
  
  // Only modify if it is actually a Cloudinary URL
  if (url.includes('cloudinary.com')) {
    // Inject: c_fill (Crop Fill), w_400 (Width), h_300 (Height), g_auto (Focus on interesting part/face)
    return url.replace('/upload/', '/upload/c_fill,w_400,h_300,g_auto/');
  }
  
  return url;
};
</script>

<style scoped>
.cardWrapper {
  background-color: var(--cardBg);
  border-radius: 12px;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  cursor: pointer;
  border: 1px solid transparent;
}

.cardWrapper:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4);
  border-color: var(--primaryColor);
}

.imageContainer {
  width: 100%;
  height: 250px;
  background-color: #000;
}

.cardImage {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.cardContent {
  padding: 15px;
  text-align: center;
}

.cardTitle {
  margin: 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: var(--textColor);
  
  /* 🔴 THE FIX: Forces long text to break onto new lines */
  overflow-wrap: break-word; 
  word-break: break-word; 
  hyphens: auto;
}
</style>