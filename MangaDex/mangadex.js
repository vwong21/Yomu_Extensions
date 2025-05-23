import axios from 'axios';
const baseURL = 'https://api.mangadex.org';
const baseCoverURL = 'https://uploads.mangadex.org/covers';

const getMangaList = async (title) => {
	try {
		// Gets a list of related manga based on the title
		const res = await axios.get(`${baseURL}/manga?includes[]=cover_art`, {
			params: {
				title: title,
			},
		});

		// Create an array of manga objects containing id, title, and cover_art filename
		const mangaList = res.data.data.map((manga) => {
			const relationships = manga.relationships;

			// Find cover_art attributes
			const coverArt = relationships
				.filter((relationship) => relationship.type === 'cover_art')
				.map((cover) => cover.attributes);

			// Define variables outside the return statement
			const id = manga.id;
			const title = manga.attributes.title.en; // Ensure to extract the title correctly
			const cover_art_filename =
				coverArt.length > 0 ? coverArt[0].fileName : null; // Return the filename or null if none exists
			const coverURL = `${baseCoverURL}/${id}/${cover_art_filename}`;

			return {
				id,
				title,
				cover_art_filename,
				coverURL,
			};
		});

		return mangaList; // Return the array of manga objects
	} catch (error) {
		console.error(error);
		return []; // Return an empty array in case of error
	}
};

const browseMangaDex = async (offset = 0) => {
	if (typeof offset !== 'number' || isNaN(offset)) {
		offset = 0;
	}
	const mangaList = [];
	try {
		const res = await axios.get(
			`${baseURL}/manga?offset=${offset}&limit=40&includes[]=cover_art`
		);
		const data = res.data.data;
		data.forEach((manga) => {
			const id = manga.id;
			const title = manga.attributes.title;
			const coverArt =
				manga.relationships.find(
					(relation) => relation.type === 'cover_art'
				) || null;
			mangaList.push({
				title: title,
				coverArt:
					`https://uploads.mangadex.org/covers/${id}/${coverArt.attributes.fileName}` ||
					null,
			});
		});
		return mangaList;
	} catch (error) {
		console.error(error);
		throw new Error(`Error retrieving manga list: ${error}`);
	}
};

export { getMangaList, browseMangaDex };
