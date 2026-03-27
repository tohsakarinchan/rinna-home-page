<template>
	<div>
		<div>
			<div :style="xs || sm ? { 'display': 'none' } : { 'font-size': '4rem' }" class="leleo-left-welcome">{{
				configdata.welcometitle }}</div>
		</div>
		<div>
			<v-row align="center">
				<v-col cols="12" md="8">
					<!-- PC 端搜索栏 -->
					<v-text-field class="v-card" :style="xs || sm ? { 'display': 'none' } : {}" v-model="searchQuery"
						placeholder="搜索..." variant="outlined" rounded hide-details="true" @keyup.enter="performSearch">
						<template v-slot:prepend-inner>
							<v-menu>
								<template v-slot:activator="{ props }">
									<v-btn variant="text" v-bind="props" class="engine-btn">
										{{ selectedEngine.title }}
										<v-icon icon="mdi-chevron-down"></v-icon>
									</v-btn>
								</template>
								<v-list class="glass-list">
									<v-list-item v-for="engine in searchEngines" :key="engine.value"
										@click="selectedEngine = engine" density="compact">
										{{ engine.title }}
									</v-list-item>
								</v-list>
							</v-menu>
						</template>
						<template v-slot:append-inner>
							<v-btn :icon="isUrl ? 'mdi-earth' : 'mdi-magnify'" variant="text"
								@click="performSearch"></v-btn>
						</template>
					</v-text-field>

					<!-- 手机端搜索区域 -->
					<div v-if="xs || sm" class="mobile-search-wrapper">
						<!-- 未展开：仅显示搜索图标按钮 -->
						<div v-if="!mobileSearchOpen" class="mobile-search-trigger">
							<v-btn icon variant="tonal" size="36" @click="openMobileSearch"
								style="color: var(--leleo-vcard-color);">
								<v-icon>mdi-magnify</v-icon>
							</v-btn>
						</div>

						<!-- 展开后：完整搜索栏 -->
						<transition name="search-expand">
							<div v-if="mobileSearchOpen" class="mobile-search-bar">
								<v-text-field ref="mobileInput" v-model="searchQuery" placeholder="搜索或输入网址..."
									variant="outlined" rounded hide-details density="compact"
									@keyup.enter="performSearch" class="mobile-search-field">
									<!-- 搜索引擎切换 -->
									<template v-slot:prepend-inner>
										<v-menu>
											<template v-slot:activator="{ props }">
												<v-btn variant="text" v-bind="props" size="small"
													class="engine-btn-mobile" style="font-size: 11px; min-width: 52px;">
													{{ selectedEngine.title }}
													<v-icon size="14">mdi-chevron-down</v-icon>
												</v-btn>
											</template>
											<v-list class="glass-list">
												<v-list-item v-for="engine in searchEngines" :key="engine.value"
													@click="selectedEngine = engine" density="compact">
													{{ engine.title }}
												</v-list-item>
											</v-list>
										</v-menu>
									</template>

									<!-- 搜索 & 关闭 -->
									<template v-slot:append-inner>
										<v-btn :icon="isUrl ? 'mdi-earth' : 'mdi-magnify'" variant="text" size="small"
											@click="performSearch"></v-btn>
										<v-btn icon="mdi-close" variant="text" size="small"
											@click="closeMobileSearch"></v-btn>
									</template>
								</v-text-field>
							</div>
						</transition>
					</div>
				</v-col>

				<v-col cols="12" md="4" align="center">
					<v-card class="ma-3" hover>
						<template v-slot:title>
							<span class="leleo-card-title clock-font">{{ formattedTime }}</span>
						</template>
						<template v-slot:subtitle>
							<span style="font-weight: bold;">{{ formattedDate }}</span>
						</template>
					</v-card>
				</v-col>
			</v-row>

			<blog-inline />
		</div>
	</div>
</template>

<script>
import BlogInline from '../components/BlogInline.vue';
import { useDisplay } from 'vuetify'

export default {
	components: {
		BlogInline
	},
	props: ['configdata', 'formattedTime', 'formattedDate', 'projectcards'],
	data() {
		return {
			searchQuery: '',
			mobileSearchOpen: false,
			selectedEngine: { title: 'Bing', value: 'bing' },
			searchEngines: [
				{ title: 'Bing', value: 'bing' },
				{ title: 'Google', value: 'google' },
				{ title: '百度', value: 'baidu' },
				{ title: 'Yandex', value: 'yandex' },
				{ title: 'DuckDuckGo', value: 'duckduckgo' },
			]
		}
	},
	setup() {
		const { xs, sm, md } = useDisplay();
		return { xs, sm, md };
	},
	computed: {
		isUrl() {
			const str = this.searchQuery.trim();
			return this.isLikelyUrl(str);
		}
	},
	methods: {
		openMobileSearch() {
			this.mobileSearchOpen = true;
			this.$nextTick(() => {
				// 展开后自动聚焦输入框
				this.$refs.mobileInput?.focus();
			});
		},
		closeMobileSearch() {
			this.mobileSearchOpen = false;
			this.searchQuery = '';
		},
		projectcardsShow(key) {
			for (let i = 0; i < this.projectcards.length; i++) {
				if (i != key) this.projectcards[i].show = false;
			}
		},
		performSearch() {
			const query = this.searchQuery.trim();
			if (!query) return;

			if (this.isUrl) {
				let url = query;
				if (!/^[a-z]+:\/\//i.test(url)) url = 'http://' + url;
				window.open(url, '_blank');
			} else {
				const engineUrls = {
					google: `https://www.google.com/search?q=${encodeURIComponent(query)}`,
					bing: `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
					baidu: `https://www.baidu.com/s?wd=${encodeURIComponent(query)}`,
					yandex: `https://yandex.com/search/?text=${encodeURIComponent(query)}`,
					duckduckgo: `https://duckduckgo.com/?q=${encodeURIComponent(query)}`
				};
				window.open(engineUrls[this.selectedEngine.value], '_blank');
			}
		},
		isLikelyUrl(input) {
			const str = input.trim();
			if (/^(https?|ftp):\/\//i.test(str)) return true;
			const domainPattern = /^([a-z0-9-]+\.)+[a-z]{2,}(\/.*)?$/i;
			const localPattern = /^(localhost|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?(\/.*)?$/i;
			return domainPattern.test(str) || localPattern.test(str);
		}
	}
};
</script>

<style scoped>
@import url(/css/app.less);
@import url(/css/mobile.less);

.glass-list {
	background: transparent !important;
	backdrop-filter: blur(var(--leleo-blur));
	border-radius: 5%;
	color: var(--leleo-vcard-color);
	overflow: hidden;
}

/* 手机搜索区域 */
.mobile-search-wrapper {
	padding: 4px 12px;
	display: flex;
	align-items: center;
}

.mobile-search-trigger {
	/* 触发按钮靠左，与页面其他图标对齐 */
}

.mobile-search-bar {
	width: 100%;
}

.mobile-search-field :deep(.v-field) {
	background: rgba(255, 255, 255, 0.08);
	backdrop-filter: blur(var(--leleo-blur, 8px));
	color: var(--leleo-vcard-color);
}

.mobile-search-field :deep(.v-field__outline) {
	--v-field-border-opacity: 0.3;
}

/* 展开/收起动画 */
.search-expand-enter-active {
	animation: expandSearch 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.search-expand-leave-active {
	animation: collapseSearch 0.18s ease-in;
}

@keyframes expandSearch {
	from {
		opacity: 0;
		transform: scaleX(0.3) translateX(-10px);
		transform-origin: left center;
	}

	to {
		opacity: 1;
		transform: scaleX(1) translateX(0);
		transform-origin: left center;
	}
}

@keyframes collapseSearch {
	from {
		opacity: 1;
		transform: scaleX(1);
		transform-origin: left center;
	}

	to {
		opacity: 0;
		transform: scaleX(0.3);
		transform-origin: left center;
	}
}
</style>