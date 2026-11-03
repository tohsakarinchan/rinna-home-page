<template>
<v-card class="blog-inline-card" :to="`/blog/${post.slug}`" hover rounded="lg">
                                    <v-img :src="post.cover" aspect-ratio="1.7778" cover>
                                        <template v-slot:placeholder>
                                            <div class="d-flex align-center justify-center fill-height">
                                                <v-icon size="36" opacity="0.3">mdi-image</v-icon>
                                            </div>
                                        </template>
                                    </v-img>
                                    <v-card-text class="pa-2">
                                        <div class="d-flex align-center mb-1">
                                            <v-icon size="12" class="mr-1" opacity="0.6">mdi-calendar</v-icon>
                                            <span class="text-caption" style="opacity:0.6;font-size:0.7rem!important">
                                                {{ post.date }}
                                            </span>
                                        </div>
                                        <div class="blog-inline-title" v-html="highlightText(post.title)"></div>
                                        <div class="blog-inline-summary" v-html="highlightText(post.summary)"></div>
                                        <div class="mt-1">
                                            <v-chip v-for="tag in post.tags" :key="tag" size="x-small" class="mr-1"
                                                :variant="activeTag === tag ? 'elevated' : 'tonal'"
                                                @click.prevent="$emit('select-tag', tag)">{{ tag }}</v-chip>
                                        </div>
                                    </v-card-text>
                                </v-card>
</template>
<script setup>
import { highlight } from '../domain/search.js'
const props = defineProps({ post: Object, activeTag: String, query: String })
defineEmits(['select-tag'])
const highlightText = text => highlight(text, props.query)
</script>
<style scoped src="../styles/blog-card.css"></style>
