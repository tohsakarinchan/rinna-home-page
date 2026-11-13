<template><div class="travel-layer"><nav class="travel-breadcrumb" aria-label="旅行层级"><RouterLink to="/archer">弓凛入口</RouterLink><span>/</span><RouterLink to="/travel">地球与国家</RouterLink><template v-if="country"><span>/</span><RouterLink :to="`/travel/${country.id}`">{{ country.name }}收藏</RouterLink></template><span v-if="route.params.tripId">/ 旅程</span></nav><RouterView /></div></template>
<script setup>
import { computed, provide, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { usePassportData } from '../composables/usePassportData.js'
import { travelDataKey } from '../composables/travel-context.js'
import { findCountry } from '../domain/countries.js'
const data = usePassportData()
provide(travelDataKey, data)
const route = useRoute()
const country = computed(() => findCountry(route.params.country))
onMounted(data.loadPassport)
</script>
