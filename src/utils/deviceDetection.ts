
/**
 * Detect the user's device type based on user agent
 */
export const detectDevice = (): string => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  if (/(iphone|ipod|ipad)/i.test(userAgent)) {
    return userAgent.indexOf("ipad") !== -1 ? "tablet" : "smartphone";
  } else if (/android/i.test(userAgent)) {
    return userAgent.indexOf("tablet") !== -1 ? "tablet" : "smartphone";
  } else if (/amazon-fire/i.test(userAgent) || /kf[a-z]{2,4}/i.test(userAgent)) {
    return "firestick";
  } else if (/smart-tv|smarttv|googletv|appletv|hbbtv|pov_tv|netcast/i.test(userAgent)) {
    return "smart-tv";
  }
  
  return "web"; // default
};
