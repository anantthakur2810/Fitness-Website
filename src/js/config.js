/**
 * Centralized Runtime Configuration
 * Reads Vite/Vercel VITE_* environment variables with safe fallback defaults.
 */

const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};

export const CONFIG = {
  gymName: env.VITE_GYM_NAME || 'Anytime Fitness',
  gymBranch: env.VITE_GYM_BRANCH || 'Sohna',
  gymFullName: env.VITE_GYM_FULL_NAME || 'Anytime Fitness — Sector 34, Sohna',
  gymAddress: env.VITE_GYM_ADDRESS || '4th & 5th Floor, The Leaf Mall, Sector 34, Sohna, Gurugram, Haryana 122103',
  gymPhone: env.VITE_GYM_PHONE || '+91 87965 67500',
  gymWhatsApp: env.VITE_GYM_WHATSAPP || '918796567500',

  mapsUrl: env.VITE_GYM_MAPS_URL || 'https://maps.app.goo.gl/yWkfrEVoVgs1v3Ao6',
  instagramUrl: env.VITE_GYM_INSTAGRAM_URL || 'https://www.instagram.com/anytimefitnesssec34sohna/',
  facebookUrl: env.VITE_GYM_FACEBOOK_URL || 'https://www.facebook.com/ATFitnessIN',
  youtubeUrl: env.VITE_GYM_YOUTUBE_URL || 'https://www.youtube.com/@AnytimeFitnessIndiaATFITNESSIN',
  xUrl: env.VITE_GYM_X_URL || 'https://x.com/ATFitnessIN',
  linkedinUrl: env.VITE_GYM_LINKEDIN_URL || 'https://www.linkedin.com/company/anytime-fitness-india/',
  websiteUrl: env.VITE_GYM_WEBSITE_URL || 'https://www.anytimefitness.co.in/gyms/sohna-haryana/',

  defaultTheme: env.VITE_DEFAULT_THEME || 'theme-dark',
  currencyCode: env.VITE_CURRENCY_CODE || 'INR',
  defaultGraceDays: Number(env.VITE_DEFAULT_GRACE_DAYS ?? 5),
  defaultPenaltyPerDay: Number(env.VITE_DEFAULT_PENALTY_PER_DAY ?? 10),
  defaultMaxPenalty: Number(env.VITE_DEFAULT_MAX_PENALTY ?? 500),
  storageKey: env.VITE_STORAGE_KEY || 'GYM_DB_STORAGE_V4',

  // Razorpay Payment Gateway Configuration
  razorpayKeyId: env.VITE_RAZORPAY_KEY_ID || 'rzp_test_1DP5mmOlF5G5ag',
  razorpayMerchantName: env.VITE_RAZORPAY_MERCHANT_NAME || 'Anytime Fitness Sohna'
};
