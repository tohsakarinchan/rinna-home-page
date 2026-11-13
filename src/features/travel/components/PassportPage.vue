<template>
          <section class="passport-page" :class="side === 0 ? 'page-left' : 'page-right'" :aria-label="`护照第 ${pageNumber} 页`" :aria-hidden="decorative || undefined" :inert="decorative || undefined">
          <div class="page-number"><span>RINNA / {{ country.label }}</span><span>{{ String(pageNumber).padStart(2, '0') }}</span></div>
          <header class="passport-page-heading"><h2>{{ side === 0 ? '旅行印记' : '旅途记录' }}</h2><span>TRAVEL MEMORIES / 私人收藏</span></header>
          <div class="sticker-grid">
          <button v-for="({ trip, number }) in page" :key="trip.id" class="trip-sticker" type="button" :style="{ '--ink': trip.color }"
            :class="[`effect-${trip.effect}`, { 'effects-on': effects }]" :aria-label="`${trip.month} ${trip.places}，展开旅行`" aria-haspopup="dialog" @click="$emit('open', trip)">
            <span class="sticker-head"><span>旅 JOURNEY RECORD</span><span>No. {{ String(number).padStart(2, '0') }}</span></span>
            <span class="sticker-body"><span class="sticker-text"><span class="trip-date">{{ trip.month }}</span><strong>{{ trip.title }}</strong><span class="trip-subtitle">{{ trip.subtitle }}</span></span>
              <span class="travel-stamp" aria-hidden="true"><span>{{ country.label }}</span><v-icon :icon="trip.icon" size="32"/><span>{{ trip.stamp }}</span></span></span>
            <span class="trip-places"><span class="places-full">{{ trip.places }}</span><span class="places-compact">{{ compactPlaces(trip.places) }}</span></span>
            <span class="sticker-foot"><span>MEMORIES, NOT MILES.</span><span>打开回忆 ↗</span></span>
            <span class="sticker-effect" aria-hidden="true"><i v-for="n in 5" :key="n" :style="{ '--n': n }">{{ trip.effect === 'snow' ? '❄' : trip.effect === 'petals' ? '✿' : trip.effect === 'lights' ? '✧' : '〜' }}</i></span>
          </button>
          <div v-if="page.length < 2" class="next-memory" :class="{ 'empty-page': !page.length }"><v-icon icon="mdi-airplane-takeoff" size="28"/><span>下一枚印记，留给下一次出发。</span><small>TO BE CONTINUED</small></div>
          </div>
          <footer class="passport-page-footer"><span>{{ side === 0 ? '纪念贴纸 · 非官方出入境凭证' : '把每一次出发，留在这里。' }}</span><span>{{ country.label }} / {{ String(pageNumber).padStart(2, '0') }}</span></footer>
          </section>
</template>
<script setup>
defineProps({ page: { type:Array, required:true }, side: { type:Number, required:true }, pageNumber: { type:Number, required:true }, country: { type:Object, required:true }, effects: Boolean, decorative: Boolean })
defineEmits(['open'])
function compactPlaces(places = '') {
  const items = places.split(/[·、]/).map(place => place.trim()).filter(Boolean)
  return items.slice(0, 2).join(' · ') + (items.length > 2 ? ' 等' : '')
}
</script>
<style scoped src="../styles/passport-page.css"></style>
