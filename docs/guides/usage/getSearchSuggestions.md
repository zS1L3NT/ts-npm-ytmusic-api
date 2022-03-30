# Getting search suggestions

`getSearchSuggestions()` will fetch you a list of search suggestions based on the query

```ts
ytmusic.getSearchSuggestions("Lilac").then(res => {
	console.log(res)
})
// > [
// >     "lilac",
// >     "lilac iu",
// >     "lilac band",
// >     "lilac wine",
// >     "lilac wine miley cyrus",
// >     "lilac close my eyes forever",
// >     "lilac holy diver"
// > ]
```

See the [reference](../../references/ytmusic/getSearchSuggestions.html) for information.
