<template>
  <div class="container homeContainer">
    <h1 class="mainTitle">Welcome to Unique Beings</h1>
    <p class="subtitle">An archive of the strange and beautiful.</p>
    <router-link to="/list">
      <button class="btn btnPrimary ctaButton">Enter Archive</button>
    </router-link>
  </div>
</template>

<style scoped>
.homeContainer {
  text-align: center;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  flex: 1;
}

.mainTitle {
  font-size: clamp(2rem, 5vw, 3rem);
  margin-bottom: 10px;
  color: var(--primaryColor);
  padding: 0 1rem;
}

.subtitle {
  font-size: 1.2rem;
  color: #aaa;
  margin-bottom: 30px;
}

.ctaButton {
  font-size: 1.2rem;
  padding: 15px 40px;
}
</style>