<script>
export default {
	name: "CodeLink",
	props: ["left", "text", "link", "right"]
}
</script>

<style scoped>
a {
	font-family: var(--font-family-code);
	font-size: 0.85em;
	background-color: var(--c-bg-light);
}

.pad-left {
	padding: 0.25rem 0.125rem 0.25rem 0.5rem;
}

.pad-right {
	padding: 0.25rem 0.5rem 0.25rem 0.125rem;
}

.pad-both {
	padding: 0.25rem 0.125rem;
}

.flat-left {
	border-top-left-radius: 0;
	border-bottom-left-radius: 0;
}

.flat-right {
	border-top-right-radius: 0;
	border-bottom-right-radius: 0;
}
</style>

<template>
	<code
		v-if="left"
		:class="{
			'pad-left': true,
			'flat-right': true
		}"
		>{{ left }}</code
	>
	<a
		:href="link + '.html'"
		:class="{
			'flat-left': left,
			'flat-right': right,
			'pad-right': left && !right,
			'pad-left': right && !left,
			'pad-both': left && right
		}"
		>{{ text }}</a
	>
	<code
		v-if="right"
		:class="{
			'pad-right': true,
			'flat-left': true
		}"
		>{{ right }}</code
	>
</template>
