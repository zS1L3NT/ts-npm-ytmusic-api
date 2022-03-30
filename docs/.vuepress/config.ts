import { defineUserConfig } from "vuepress"
import type { DefaultThemeOptions } from "vuepress"

export default defineUserConfig<DefaultThemeOptions>({
	title: "YTMusic API",
	description: "Unofficial YouTube Music API for TypeScript",
	plugins: [
		[
			"@vuepress/plugin-search",
			{
				locales: {
					"/": {
						placeholder: "Search"
					}
				}
			}
		]
	],
	themeConfig: {
		repo: "zS1L3NT/ts-npm-ytmusic-api",
		editLink: false,
		navbar: [
			{
				text: "Home",
				link: "/"
			},
			{
				text: "Guides",
				link: "/guides/getting-started.html"
			},
			{
				text: "References",
				link: "/references/ytmusic.html"
			}
		],
		sidebar: [
			{
				text: "Guides",
				collapsible: true,
				children: [
					{
						text: "Getting Started",
						link: "/guides/getting-started.html"
					},
					{
						text: "Usage",
						link: "/guides/usage.html",
						children: [
							{
								text: "Getting search suggestions",
								link: "/guides/usage/getSearchSuggestions.html"
							},
							{
								text: "Searching for results",
								link: "/guides/usage/search.html"
							},
							{
								text: "Searching for songs",
								link: "/guides/usage/searchSongs.html"
							},
							{
								text: "Searching for videos",
								link: "/guides/usage/searchVideos.html"
							},
							{
								text: "Searching for artists",
								link: "/guides/usage/searchArtists.html"
							},
							{
								text: "Searching for albums",
								link: "/guides/usage/searchAlbums.html"
							},
							{
								text: "Searching for playlists",
								link: "/guides/usage/searchPlaylists.html"
							},
							{
								text: "Getting a song",
								link: "/guides/usage/getSong.html"
							},
							{
								text: "Getting a video",
								link: "/guides/usage/getVideo.html"
							},
							{
								text: "Getting an artist",
								link: "/guides/usage/getArtist.html"
							},
							{
								text: "Getting an artist's top songs",
								link: "/guides/usage/getArtistSongs.html"
							},
							{
								text: "Getting an artist's top albums",
								link: "/guides/usage/getArtistAlbums.html"
							},
							{
								text: "Getting an album",
								link: "/guides/usage/getAlbum.html"
							},
							{
								text: "Getting a playlist",
								link: "/guides/usage/getPlaylist.html"
							},
							{
								text: "Getting a playlist's videos",
								link: "/guides/usage/getPlaylistVideos.html"
							}
						]
					}
				]
			},
			{
				text: "References",
				collapsible: true,
				children: [
					{
						text: "YTMusic Class",
						link: "/references/ytmusic.html",
						children: [
							{
								text: "getSearchSuggestions",
								link: "/references/ytmusic/getSearchSuggestions.html"
							},
							{
								text: "search",
								link: "/references/ytmusic/search.html"
							},
							{
								text: "searchSongs",
								link: "/references/ytmusic/searchSongs.html"
							},
							{
								text: "searchVideos",
								link: "/references/ytmusic/searchVideos.html"
							},
							{
								text: "searchArtists",
								link: "/references/ytmusic/searchArtists.html"
							},
							{
								text: "searchAlbums",
								link: "/references/ytmusic/searchAlbums.html"
							},
							{
								text: "searchPlaylists",
								link: "/references/ytmusic/searchPlaylists.html"
							},
							{
								text: "getSong",
								link: "/references/ytmusic/getSong.html"
							},
							{
								text: "getVideo",
								link: "/references/ytmusic/getVideo.html"
							},
							{
								text: "getArtist",
								link: "/references/ytmusic/getArtist.html"
							},
							{
								text: "getArtistSongs",
								link: "/references/ytmusic/getArtistSongs.html"
							},
							{
								text: "getArtistAlbums",
								link: "/references/ytmusic/getArtistAlbums.html"
							},
							{
								text: "getAlbum",
								link: "/references/ytmusic/getAlbum.html"
							},
							{
								text: "getPlaylist",
								link: "/references/ytmusic/getPlaylist.html"
							},
							{
								text: "getPlaylistVideos",
								link: "/references/ytmusic/getPlaylistVideos.html"
							}
						]
					},
					{
						text: "Interfaces",
						link: "/references/interfaces.html",
						children: [
							{
								text: "ThumbnailFull",
								link: "/references/interfaces/ThumbnailFull.html"
							},
							{
								text: "SongDetailed",
								link: "/references/interfaces/SongDetailed.html"
							},
							{
								text: "SongFull",
								link: "/references/interfaces/SongFull.html"
							},
							{
								text: "VideoDetailed",
								link: "/references/interfaces/VideoDetailed.html"
							},
							{
								text: "VideoFull",
								link: "/references/interfaces/VideoFull.html"
							},
							{
								text: "ArtistBasic",
								link: "/references/interfaces/ArtistBasic.html"
							},
							{
								text: "ArtistDetailed",
								link: "/references/interfaces/ArtistDetailed.html"
							},
							{
								text: "ArtistFull",
								link: "/references/interfaces/ArtistFull.html"
							},
							{
								text: "AlbumBasic",
								link: "/references/interfaces/AlbumBasic.html"
							},
							{
								text: "AlbumDetailed",
								link: "/references/interfaces/AlbumDetailed.html"
							},
							{
								text: "AlbumFull",
								link: "/references/interfaces/AlbumFull.html"
							},
							{
								text: "PlaylistFull",
								link: "/references/interfaces/PlaylistFull.html"
							}
						]
					},
					{
						text: "Types",
						link: "/references/types.html",
						children: [
							{
								text: "SearchResult",
								link: "/references/types/SearchResult.html"
							}
						]
					}
				]
			}
		]
	}
})
