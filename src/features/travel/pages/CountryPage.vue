<template>
  <section v-if="country" class="country-page"><h1 class="country-title">{{ country.name }}旅行收藏</h1><p v-if="country.domestic" class="country-guide">先选城市或地区，再打开一段旅程。</p><div v-if="country.domestic && regions.length" class="region-selector" role="group" aria-label="城市与地区"><button type="button" :aria-pressed="!region" @click="region = ''">全部地区</button><button v-for="item in regions" :key="item" type="button" :aria-pressed="region === item" @click="region = item">{{ item }}</button></div><TravelPassport :key="country.id" :country="country" :region="region" /></section>
  <section v-else class="space-note"><h1>这个国家还没有收进目录。</h1><RouterLink to="/travel">返回地球选择国家</RouterLink></section>
</template>
<script setup>
import { computed, inject, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import TravelPassport from '../components/TravelPassport.vue'
import { travelDataKey } from '../composables/travel-context.js'
import { findCountry, countryTrips, regionGroups } from '../domain/countries.js'
const route = useRoute(), { trips } = inject(travelDataKey), region = ref('')
const country = computed(() => findCountry(route.params.country))
const regions = computed(() => regionGroups(countryTrips(trips.value, country.value?.id)))
watch(() => route.params.country, () => { region.value = '' })
</script>
