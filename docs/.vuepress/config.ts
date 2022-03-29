import { defineConfig } from "vuepress/config"

export default defineConfig({
	title: "YTMusic API",
	description: "Unofficial YouTube Music API for TypeScript",
	themeConfig: {
		repo: "zS1L3NT/ts-npm-ytmusic-api",
		searchPlaceholder: "Search",
		smoothScroll: true,
		//@ts-ignore
		displayAllHeaders: true,
		activeHeaderLinks: true,
		nav: [
			{ text: "Home", link: "/" },
			{ text: "Docs", link: "/docs/getting-started.html" }
		],
		sidebar: [
			{
				title: "Documentation",
				collapsable: false,
				sidebarDepth: 2,
				children: [
					["/docs/getting-started", "Getting Started"],
					["/docs/references", "References"]
				]
			}
		]
	}
})
