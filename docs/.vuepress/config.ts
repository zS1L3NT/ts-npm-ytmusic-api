import { defineUserConfig } from "vuepress"
import type { DefaultThemeOptions } from "vuepress"

export default defineUserConfig<DefaultThemeOptions>({
	title: "YTMusic API",
	description: "Unofficial YouTube Music API for TypeScript",
	themeConfig: {
		repo: "zS1L3NT/ts-npm-ytmusic-api",
		editLink: false,
		navbar: [
			{ text: "Home", link: "/" },
			{ text: "Docs", link: "/docs/getting-started.html" }
		],
		sidebar: [
			{
				text: "Documentation",
				children: [
					{
						text: "Getting Started",
						link: "/docs/getting-started.html"
					},
					{
						text: "Usage",
						link: "/docs/usage.html"
					},
					{
						text: "References",
						link: "/docs/references.html"
					}
				]
			}
		]
	}
})
