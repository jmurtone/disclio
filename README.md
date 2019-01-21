# Disclio - Discogs CLI

Discogs command line interface. Based on Vorpal CLI framework and Disconnect library.

Built and run with node 10 and npm 6.

Prerequisites:
- Generate your user token in https://www.discogs.com/settings/developers.
- npm install in directory root

## Usage

Start app by commanding ```node disclio.js```.

Disclio supports command completion with tabs.

- Set user with ```user <username>```.
- Download you collection with ```download```.
- See your collection folders with ```ls``` or ```list```.
- Navigate to a folder with ```cd <folder>```.
- See artists in folder with ```ls``` or ```list``` (supports filtering by artist name, supports wildcards).
- Navigate to artist with ```cd <artist>```.
- See artist's items in collection with ```ls``` (supports ```-l``` option).

For further instructions, type ```help```.

## Statistics

Disclio shows some statistics of listenings and purchases. To accomplish this, you must provide that information in custom fields.

<img src='discogs_notes.png' width=30%/>

Fields can be managed at https://www.discogs.com/settings/collection.

<img src='discogs_custom_fields.png' width=30%/>

In collection folder, you can list purchases or general stats for a given year, e.g.
```purchases -s date 2018``` 
```stats 2018```

## Clear local cache

Clear your local cache, including user and collection data: Remove ```data``` directory in project root.

## TODO

- ```listened``` feature (similar to ```purchases```)
- stats (e.g. purchases) for multiple, arbitrary years
- artist name completion when filtering stats
- show details of a specific item
- show discogs suggested prices in item listings 
- search for an album or artist
- sorting options of artist's album listings
- show folder's artists listing in table format
- sort and filtering options in folder's artist listing
- ```clear cache``` command
- etc...

## License

See the <a href='LICENSE.md'>LICENSE</a> file for license rights and limitations (MIT).
