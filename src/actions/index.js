import {
	GET_RECENT_POSTS_REQUEST,
	GET_RECENT_POSTS_SUCCESS,
	GET_RECENT_POSTS_ERROR,
	GET_SINGLE_POST_REQUEST,
	GET_SINGLE_POST_SUCCESS,
	GET_SINGLE_POST_ERROR,
	GET_NEWSFEED_REQUEST,
	GET_NEWSFEED_SUCCESS,
	GET_NEWSFEED_ERROR
} from './types'

import steem from 'steem'
import timeago from 'timeago.js'
const timeagoInstance = timeago();

steem.api.setOptions({url: 'https://api.steemit.com'});

// actions

const getRecentPostsRequest = () => ({
	type: GET_RECENT_POSTS_REQUEST
});

const getRecentPostsSuccess = posts => ({
	type: GET_RECENT_POSTS_SUCCESS,
	payload: posts
});

const getRecentPostsError = error => ({
	type: GET_RECENT_POSTS_ERROR,
	payload: error
});

const getSinglePostRequest = () => ({
	type: GET_SINGLE_POST_REQUEST
});

const getSinglePostSuccess = post => ({
	type: GET_SINGLE_POST_SUCCESS,
	payload: post
});

const getSinglePostError = error => ({
	type: GET_SINGLE_POST_ERROR,
	payload: error
});

const getNewsfeedRequest = () => ({
	type: GET_NEWSFEED_REQUEST
});

const getNewsfeedSuccess = post => ({
	type: GET_NEWSFEED_SUCCESS,
	payload: post
});

const getNewsfeedError = error => ({
	type: GET_NEWSFEED_ERROR,
	payload: error
});

// api call

function getPosts() {
	return new Promise((res, rej) => {
		steem.api.getDiscussionsByBlog({tag: 'creativecrypto', limit: 50}, function (err, result) {
			if (err) rej(err);
			else res(result);
		});
	})
}

function getPost(permlink) {
	return new Promise((res, rej) => {
		const currentDate = new Date().toISOString().split('.')[0];
		steem.api.getDiscussionsByAuthorBeforeDate('creativecrypto', permlink, currentDate, 1, function (err, result) {
			if (err) rej(err);
			else res(result);
		});
	})
}

async function getNewsfeed() {
	const response = await fetch('https://creative-crypto-api.herokuapp.com/');
	const data = await response.json();
	return data;
}

// redux thunks

export const getRecentPosts = () => async dispatch => {
	dispatch(getRecentPostsRequest());

	try {
		const recentPosts = await getPosts();

		console.log(recentPosts[0]);

		const formattedPostsData = recentPosts.map(post => {
			const title = post.title;
			const body = post.body;
			// const timeSincePosted = timeagoInstance.format(new Date(post.created));
      const timeSincePosted = new Date(post.created + 'Z');
			// const bodyPreview = body.slice(0, 70);
			const tags = JSON.parse(post.json_metadata).tags;
			const image = JSON.parse(post.json_metadata).image[0];
			const numberOfVotes = post.active_votes.length;
			// const createdData = post.created;
			const pendingPayoutValue =
				Number(post.pending_payout_value.slice(0, post.pending_payout_value.indexOf(' '))).toFixed(2);
			// const postUrl = post.url;
			const permlink = post.permlink;

			return {
				title,
				body,
				timeSincePosted,
				tags,
				image,
				numberOfVotes,
				pendingPayoutValue,
				permlink
			}
		});

		dispatch(getRecentPostsSuccess(formattedPostsData));

	} catch (err) {
		dispatch(getRecentPostsError(err))
	}
};

export const getSinglePost = permlink => async dispatch => {

	dispatch(getSinglePostRequest());

	try {
		const [singlePost] = await getPost(permlink);
		console.log('single post response: ', singlePost)

		const title = singlePost.title;
		const body = singlePost.body;
		// const timeSincePosted = timeagoInstance.format(new Date(singlePost.created));
    // const timeSincePosted = new Date(singlePost.created);
    const timeSincePosted = new Date(singlePost.created + 'Z');
		const tags = JSON.parse(singlePost.json_metadata).tags;
		const image = JSON.parse(singlePost.json_metadata).image[0];
		const numberOfVotes = singlePost.active_votes.length;
		const pendingPayoutValue =
			Number(singlePost.pending_payout_value.slice(0, singlePost.pending_payout_value.indexOf(' '))).toFixed(2);
		const postPermlink = singlePost.permlink;

		dispatch(getSinglePostSuccess({
			title,
			body,
			timeSincePosted,
			tags,
			image,
			numberOfVotes,
			pendingPayoutValue,
			permlink: postPermlink
		}));

	} catch (err) {
		dispatch(getSinglePostError(err))
	}
};

export const getCurrentNewsfeed = () => async dispatch => {
	dispatch(getNewsfeedRequest());

	try {
		const newsfeed = await getNewsfeed();
		console.log(newsfeed);
		const formattedNewsfeed = newsfeed.map(tweet => {
			const fullText = tweet.full_text;
			const timeSinceTweeted = timeagoInstance.format(new Date(tweet.created_at));
			const tweetId = tweet.id_str;

			return {
				fullText,
				timeSinceTweeted,
				tweetId
			}
		});

		dispatch(getNewsfeedSuccess(formattedNewsfeed));

	} catch (err) {
		dispatch(getNewsfeedError(err))
	}
};