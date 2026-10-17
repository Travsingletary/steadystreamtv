import { fetchXtreamChannels } from "./xtreamService";

export interface Channel {
  id: number;
  name: string;
  category: string;
  logo: string;
  url: string;
  description?: string;
  epg_id?: string;
  stream_id?: number;
}

export const channelCategories = [
  "Sports",
  "Movies",
  "News",
  "Entertainment",
  "Kids",
  "Documentary",
  "Music",
  "Live",
];

export type FetchChannelsResult = {
  channels: Channel[];
  source: "xtream" | "empty";
  error?: string;
  message?: string;
  playlistUrl?: string;
};

/**
 * Load live channels from the user's MegaOTT / Xtream provisioning.
 * Mocks removed — without credentials the player shows an empty state + TiviMate interim path.
 */
export const fetchChannels = async (): Promise<Channel[]> => {
  const result = await fetchChannelsDetailed();
  return result.channels;
};

export const fetchChannelsDetailed = async (): Promise<FetchChannelsResult> => {
  try {
    const catalog = await fetchXtreamChannels(500);

    if (catalog.success && catalog.channels.length > 0) {
      return {
        channels: catalog.channels,
        source: "xtream",
        playlistUrl: catalog.playlistUrls?.m3u,
      };
    }

    return {
      channels: [],
      source: "empty",
      error: catalog.error || "no_channels",
      message:
        catalog.message ||
        "No live channels available. Check your subscription credentials or open Connect Apps for TiviMate setup.",
      playlistUrl: catalog.playlistUrls?.m3u,
    };
  } catch (error) {
    console.error("Error fetching channels:", error);
    return {
      channels: [],
      source: "empty",
      error: "fetch_failed",
      message: error instanceof Error ? error.message : "Failed to load channels",
    };
  }
};

export const fetchChannelById = async (
  id: number,
): Promise<Channel | null> => {
  const channels = await fetchChannels();
  return channels.find((c) => c.id === id) || null;
};
