# sgoyt-link-summary

A little script for finding previous plays of a specific game in "Solitaire
Games On Your Table" threads on boardgamegeek.

This is probably not useful to anyone other than me.

## Usage

`npm start -- -u BGG_USERNAME -g BGG_GAME_ID`

This will find all previous SGOYT entries for the given user playing the given
game (including if it was logged as one of that game's expansions). It will then
copy BGG forum code to the clipboard with a list of links to those previous
entries.
