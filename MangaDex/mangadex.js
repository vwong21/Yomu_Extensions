import axios from 'axios';

const baseURL = 'https://api.mangadex.org'; // Base URL for MangaDex API
const baseCoverURL = 'https://uploads.mangadex.org/covers'; // Base URL for cover images

// Function to search manga by title
const searchManga = async (title) => {
	try {
		// Send GET request to manga endpoint with cover_art included
		const res = await axios.get(`${baseURL}/manga?includes[]=cover_art`, {
			params: { title }, // Pass the title as a query parameter
		});

		// Map the response data into a simpler array of manga info
		const mangaList = res.data.data.map((manga) => {
			const id = manga.id;

			// Keep the entire title object (can include multiple languages)
			const titleObj = manga.attributes.title;
			const titleToReturn = titleObj;

			// Find the cover_art relationship to get cover image filename
			const coverArtRel = manga.relationships.find(
				(relation) => relation.type === 'cover_art'
			);

			// Extract filename safely if it exists
			const cover_art_filename =
				coverArtRel &&
				coverArtRel.attributes &&
				coverArtRel.attributes.fileName
					? coverArtRel.attributes.fileName
					: null;

			// Construct full cover image URL or null if unavailable
			const coverArt = cover_art_filename
				? `${baseCoverURL}/${id}/${cover_art_filename}`
				: null;

			return {
				id,
				title: titleToReturn,
				coverArt,
			};
		});

		return mangaList; // Return the simplified manga list
	} catch (error) {
		console.error(error); // Log error if request fails
		return []; // Return empty list on error
	}
};

// Function to browse manga with pagination and ordering by followed count (popularity)
const browseManga = async (offset = 0) => {
	// Validate offset, default to 0 if invalid
	if (typeof offset !== 'number' || isNaN(offset)) {
		offset = 0;
	}
	const mangaList = [];
	try {
		// Fetch manga with pagination, limit 40 per request, including cover art
		const res = await axios.get(
			`${baseURL}/manga?offset=${offset}&limit=40&includes[]=cover_art`,
			{
				params: {
					'order[followedCount]': 'desc', // Order by number of followers descending
				},
			}
		);
		const data = res.data.data;

		// Extract relevant info for each manga in the response
		data.forEach((manga) => {
			const id = manga.id;
			const title = manga.attributes.title;

			// Find cover_art relationship for cover image filename
			const coverArtRel = manga.relationships.find(
				(relation) => relation.type === 'cover_art'
			);

			const coverArt =
				coverArtRel &&
				coverArtRel.attributes &&
				coverArtRel.attributes.fileName
					? `${baseCoverURL}/${id}/${coverArtRel.attributes.fileName}`
					: null;

			mangaList.push({
				id,
				title,
				coverArt,
			});
		});
		return mangaList; // Return array of manga objects
	} catch (error) {
		console.error(error);
		throw new Error(`Error retrieving manga list: ${error}`); // Propagate error
	}
};

// Function to get detailed info about a single manga, including chapters
const getDetails = async (id) => {
	try {
		id = id.trim(); // Remove any whitespace from the id

		// Fetch manga details including cover art
		const res = await axios.get(
			`${baseURL}/manga/${id}?includes[]=cover_art`
		);

		// Extract title (grab first language version available)
		const title = Object.values(res.data.data.attributes.title)[0];

		// Extract English description (could add fallback if needed)
		const description = res.data.data.attributes.description.en;

		// Find cover_art relationship for cover image filename
		const coverArtRel = res.data.data.relationships.find(
			(relation) => relation.type === 'cover_art'
		);

		// Construct cover art URL or null if missing
		const coverArt =
			coverArtRel &&
			coverArtRel.attributes &&
			coverArtRel.attributes.fileName
				? `${baseCoverURL}/${id}/${coverArtRel.attributes.fileName}`
				: null;

		// Fetch chapters filtered by English translation and ordered ascending by chapter number
		const getChapters = await axios.get(
			`${baseURL}/chapter?translatedLanguage[]=en`,
			{
				params: {
					manga: id,
					order: { chapter: 'asc' }, // Ascending order of chapters
				},
			}
		);

		const seen = new Map();

		for (const chapter of getChapters.data.data) {
			const chapterNo = parseFloat(chapter.attributes.chapter || 0);
			const existing = seen.get(chapterNo);

			if (
				!existing || // if we haven't seen this chapter yet
				// prefer chapters with titles over ones without
				(!existing.attributes.title && chapter.attributes.title) ||
				// if both have titles (or both don't), prefer newer publishAt
				(!existing.attributes.title === !chapter.attributes.title &&
					new Date(chapter.attributes.publishAt) >
						new Date(existing.attributes.publishAt))
			) {
				seen.set(chapterNo, chapter);
			}
		}

		const uniqueChapters = Array.from(seen.values()).sort(
			(a, b) =>
				parseFloat(a.attributes.chapter) -
				parseFloat(b.attributes.chapter)
		);

		// Return all details in a single object
		const data = {
			title: title,
			description: description,
			coverArt: coverArt,
			chapters: uniqueChapters, // Pass only the chapters array data
		};
		console.log(data.chapters);
		return data;
	} catch (error) {
		console.error(error);
		throw new Error(`Error retrieving manga details: ${error}`);
	}
};

getDetails('32d76d19-8a05-4db0-9fc2-e0b0648fe9d0');

export { searchManga, browseManga, getDetails };
