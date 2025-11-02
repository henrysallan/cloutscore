// Scoring Constants
export const INITIAL_SCORE = 1000;
export const MIN_SCORE = 100;
export const MAX_SCORE = Infinity; // No upper limit

// Volatility Constants
export const NEW_PROFILE_CHANGE = 100; // ±100 for new profiles
export const ESTABLISHED_PROFILE_CHANGE = 1; // ±1 for established profiles
export const ESTABLISHED_THRESHOLD = 100; // votes needed to be "established"

// Pre-fetching Constants
export const PREFETCH_COUNT = 10; // number of pairs to pre-calculate

// Image Upload Constants
export const MAX_IMAGE_SIZE_MB = 10; // 10MB upload limit
export const COMPRESSED_IMAGE_SIZE_MB = 0.9; // Compress to <1MB
export const MAX_IMAGE_DIMENSION = 1920; // Max width/height

// Rankings Constants
export const RANKINGS_INITIAL_LOAD = 100; // Load top 100 first
export const RANKINGS_LOAD_MORE = 100; // Load 100 more on scroll

// Animation Constants
export const VOTE_ANIMATION_DURATION = 500; // ms for slide up transition
export const SCORE_FLOAT_DURATION = 1000; // ms for floating +/- animation

export const UNPROVEN_VOTE_CHANGE_MIN = 50;
export const UNPROVEN_VOTE_CHANGE_MAX = 150;
export const ESTABLISHED_VOTE_CHANGE_MIN = 5;
export const ESTABLISHED_VOTE_CHANGE_MAX = 30;
export const VOTE_BATCH_INTERVAL_MINUTES = 5;
export const VOTE_BATCH_INTERVAL_MAX_MINUTES = 30;