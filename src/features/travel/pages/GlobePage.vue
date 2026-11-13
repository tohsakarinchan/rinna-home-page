<template>
  <section class="globe-page">
    <header>
      <span class="scene-eyebrow">TRAVEL / 世界与足迹</span>
      <h1>记忆落在哪一片土地？</h1>
      <p>转动地球，选择一个国家。只有实际旅行记录才会留下到访标记。</p>
    </header>
    <p v-if="passportLoading" role="status">正在读取旅行收藏…</p>
    <p v-else-if="passportError" role="alert">暂时无法读取到访记录。<button type="button" @click="loadPassport">重试</button></p>
    <div class="globe-layout">
      <TravelGlobe :visited="visited" @select="enterCountry" />
      <div class="country-list" aria-label="选择旅行国家">
        <article v-for="country in countries" :key="country.id">
          <header><h2>{{ country.name }}</h2><span>{{ status(country) }}</span></header>
          <p>{{ country.domestic ? '按城市 / 地区收藏旅程' : '按旅程翻开私人护照' }}</p>
          <div>
            <button type="button" @click="enterCountry(country)">前往{{ country.name }} →</button>
            <RouterLink :to="`/travel/${country.id}`">直接翻阅</RouterLink>
          </div>
        </article>
      </div>
    </div>
  </section>
</template>
<script setup>
import { computed, inject } from 'vue'
import TravelGlobe from '../components/TravelGlobe.vue'
import { countries, countryTrips } from '../domain/countries.js'
import { travelDataKey } from '../composables/travel-context.js'
import { useExperience } from '../../experience/composables/useExperience.js'
const { trips, passportLoading, passportError, loadPassport } = inject(travelDataKey)
const { travelCue } = useExperience()
const visited = computed(() => countries.filter(country => countryTrips(trips.value, country.id).length))
const status = country => {
  if (passportLoading.value) return '读取中'
  if (passportError.value) return '状态待读取'
  const count = countryTrips(trips.value, country.id).length
  return count ? `${count} 段旅行收藏` : '暂无旅行记录'
}
const enterCountry = country => travelCue('ride', `/travel/${country.id}`, country)
</script>
