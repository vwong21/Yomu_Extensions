import axios from 'axios';

const baseURL = 'https://api.mangadex.org';
const baseCoverURL = 'https://uploads.mangadex.org/covers';

const searchManga = async (title) => {
	try {
		const res = await axios.get(`${baseURL}/manga?includes[]=cover_art`, {
			params: { title },
		});

		const mangaList = res.data.data.map((manga) => {
			const id = manga.id;

			// Use the entire title object or safely fallback to English title string
			// (You can adjust this depending on what your frontend expects)
			const titleObj = manga.attributes.title;
			// If you want just English title string, do:
			// const title = titleObj.en || titleObj['ja-ro'] || Object.values(titleObj)[0] || '';
			// But here I keep the whole title object for flexibility:
			const titleToReturn = titleObj;

			// Find the cover_art relationship object, if any
			const coverArtRel = manga.relationships.find(
				(relation) => relation.type === 'cover_art'
			);

			// Safely get the fileName if it exists
			const cover_art_filename =
				coverArtRel && coverArtRel.attributes && coverArtRel.attributes.fileName
					? coverArtRel.attributes.fileName
					: null;

			// Construct coverArt URL only if filename is available
			const coverArt = cover_art_filename
				? `${baseCoverURL}/${id}/${cover_art_filename}`
				: null;

			return {
				id,
				title: titleToReturn,
				coverArt,
			};
		});

		return mangaList;
	} catch (error) {
		console.error(error);
		return [];
	}
};

const browseManga = async (offset = 0) => {
	if (typeof offset !== 'number' || isNaN(offset)) {
		offset = 0;
	}
	const mangaList = [];
	try {
		const res = await axios.get(
			`${baseURL}/manga?offset=${offset}&limit=40&includes[]=cover_art`,
			{
				params: {
					'order[followedCount]': 'desc',
				},
			}
		);
		const data = res.data.data;
		data.forEach((manga) => {
			const id = manga.id;
			const title = manga.attributes.title;
			const coverArtRel = manga.relationships.find(
				(relation) => relation.type === 'cover_art'
			);

			const coverArt =
				coverArtRel && coverArtRel.attributes && coverArtRel.attributes.fileName
					? `${baseCoverURL}/${id}/${coverArtRel.attributes.fileName}`
					: null;

			mangaList.push({
				id,
				title,
				coverArt,
			});
		});
		return mangaList;
	} catch (error) {
		console.error(error);
		throw new Error(`Error retrieving manga list: ${error}`);
	}
};

export { searchManga, browseManga };
