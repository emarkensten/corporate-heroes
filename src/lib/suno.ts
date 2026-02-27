const SUNO_API_URL = "https://api.sunoapi.org/api/v1";

interface SunoGenerateRequest {
  customMode: boolean;
  instrumental: boolean;
  model: "V4" | "V4_5" | "V4_5PLUS" | "V4_5ALL" | "V5";
  prompt: string;
  style?: string;
  title?: string;
  callBackUrl?: string;
  vocalGender?: "m" | "f";
  styleWeight?: number;
  weirdnessConstraint?: number;
}

interface SunoTaskResponse {
  code: number;
  msg: string;
  data: {
    taskId: string;
  };
}

interface SunoTaskStatus {
  code: number;
  msg: string;
  data: {
    status: string;
    audioUrl?: string;
    musicDetails?: Array<{
      audioUrl: string;
      title: string;
      duration: number;
    }>;
  };
}

interface StemSeparationResult {
  vocals: string;
  bass: string;
  drums: string;
  other: string;
}

export async function generateMusic(
  lyrics: string,
  title: string = "Arena Anthem"
): Promise<{ taskId: string }> {
  const apiKey = process.env.SUNO_API_KEY;
  if (!apiKey) {
    throw new Error("SUNO_API_KEY is not configured");
  }

  // Callback URL is required by Suno API
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://corporate-heroes.vercel.app";
  const callBackUrl = `${baseUrl}/api/suno-webhook`;

  const requestBody = {
    customMode: true,
    instrumental: false,
    model: "V5",
    prompt: lyrics,
    style: "80s power ballad, arena rock, anthemic chorus, inspirational, hopeful, uplifting, emotional powerful male vocals, soaring guitar solos, synthesizer layers, dramatic drums, stadium rock, english vocals, europe style, survivor style, epic love ballad, stadium anthem, choir harmonies, dramatic build, key change, epic crescendo",
    title: title,
    vocalGender: "m",
    negativeTags: "rap, hip-hop, mumble, death metal, screamo, spoken word, lo-fi, trap, dubstep",
    styleWeight: 0.85,
    weirdnessConstraint: 0.15,
    callBackUrl: callBackUrl,
  };

  console.log("Suno request:", JSON.stringify(requestBody, null, 2));

  const response = await fetch(`${SUNO_API_URL}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  const responseText = await response.text();
  console.log("Suno generate response:", responseText);

  let result;
  try {
    result = JSON.parse(responseText);
  } catch {
    throw new Error(`Suno API returned invalid JSON: ${responseText}`);
  }

  // Check for API-level errors (Suno returns 200 even for errors)
  if (result.code && result.code !== 200) {
    throw new Error(`Suno API error: ${result.msg || JSON.stringify(result)}`);
  }

  if (!response.ok) {
    throw new Error(`Suno API HTTP error (${response.status}): ${responseText}`);
  }

  // Handle different response structures
  const taskId = result.data?.taskId || result.taskId || result.data?.task_id || result.task_id;
  if (!taskId) {
    throw new Error(`Suno API response missing taskId: ${JSON.stringify(result)}`);
  }

  // Initialize task in our local store
  const { initSunoTask } = await import("./suno-store");
  initSunoTask(taskId);

  return { taskId };
}

export async function getMusicStatus(taskId: string): Promise<{
  status: string;
  audioUrl?: string;
  musicDetails?: Array<{
    streamAudioUrl?: string;
    audioUrl: string;
    title: string;
    duration: number;
  }>;
}> {
  const response = await fetch(`${SUNO_API_URL}/generate/record-info?taskId=${taskId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${process.env.SUNO_API_KEY}`,
    },
  });

  const responseText = await response.text();
  console.log(`getMusicStatus(${taskId}):`, responseText);

  if (!response.ok) {
    throw new Error(`Suno status error: ${responseText}`);
  }

  let result;
  try {
    result = JSON.parse(responseText);
  } catch {
    throw new Error(`Invalid JSON from Suno status: ${responseText}`);
  }

  // Handle API errors
  if (result.code && result.code !== 200) {
    throw new Error(`Suno status API error: ${result.msg || responseText}`);
  }

  // Parse the nested response structure from record-info endpoint
  // Response: { code, data: { status, response: { sunoData: [...] } } }
  const status = result.data?.status || result.status || "pending";
  const sunoData = result.data?.response?.sunoData || result.data?.data || [];

  // Map sunoData to musicDetails format
  const musicDetails = sunoData.map((song: {
    audioUrl?: string;
    streamAudioUrl?: string;
    title?: string;
    duration?: number;
    imageUrl?: string;
  }) => ({
    audioUrl: song.audioUrl,
    streamAudioUrl: song.streamAudioUrl,
    title: song.title,
    duration: song.duration,
    imageUrl: song.imageUrl,
  }));

  return {
    status,
    audioUrl: musicDetails[0]?.audioUrl,
    musicDetails: musicDetails.length > 0 ? musicDetails : undefined,
  };
}

export async function separateStems(audioUrl: string): Promise<{ taskId: string }> {
  const response = await fetch(`${SUNO_API_URL}/audio/separate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SUNO_API_KEY}`,
    },
    body: JSON.stringify({
      audioUrl,
      separationType: "full", // Get all stems: vocals, bass, drums, other
    }),
  });

  const responseText = await response.text();
  console.log("separateStems response:", responseText);

  if (!response.ok) {
    throw new Error(`Suno stem separation error: ${responseText}`);
  }

  let result;
  try {
    result = JSON.parse(responseText);
  } catch {
    throw new Error(`Invalid JSON from stem separation: ${responseText}`);
  }

  if (result.code && result.code !== 200) {
    throw new Error(`Stem separation API error: ${result.msg || responseText}`);
  }

  const taskId = result.data?.taskId || result.taskId;
  if (!taskId) {
    throw new Error(`Stem separation missing taskId: ${responseText}`);
  }

  return { taskId };
}

export async function getStemStatus(taskId: string): Promise<{
  status: string;
  stems?: StemSeparationResult;
}> {
  const response = await fetch(`${SUNO_API_URL}/audio/separate/record/${taskId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${process.env.SUNO_API_KEY}`,
    },
  });

  const responseText = await response.text();
  console.log(`getStemStatus(${taskId}):`, responseText);

  if (!response.ok) {
    throw new Error(`Suno stem status error: ${responseText}`);
  }

  let result;
  try {
    result = JSON.parse(responseText);
  } catch {
    throw new Error(`Invalid JSON from stem status: ${responseText}`);
  }

  if (result.code && result.code !== 200) {
    throw new Error(`Stem status API error: ${result.msg || responseText}`);
  }

  return {
    status: result.data?.status || result.status || "pending",
    stems: result.data?.stems || result.stems,
  };
}

// Poll for completion with timeout
export async function waitForMusic(
  taskId: string,
  maxWaitMs: number = 180000,
  pollIntervalMs: number = 5000
): Promise<string> {
  const startTime = Date.now();
  const { getSunoResult } = await import("./suno-store");

  console.log(`Waiting for music task ${taskId}...`);

  while (Date.now() - startTime < maxWaitMs) {
    // First check our local store (updated by webhook)
    const localResult = getSunoResult(taskId);
    if (localResult) {
      console.log(`Local store status for ${taskId}:`, localResult.status);

      if (localResult.status === "completed") {
        // Prioritize stream URL (30-40s) over full URL (2-3min)
        const url = localResult.streamAudioUrl || localResult.audioUrl;
        if (url) {
          console.log(`Task ${taskId} completed via webhook! Using ${localResult.streamAudioUrl ? 'stream' : 'full'} URL`);
          return url;
        }
      }

      if (localResult.status === "failed") {
        throw new Error(localResult.error || "Music generation failed");
      }
    }

    // Also try polling the Suno API directly as backup
    try {
      const status = await getMusicStatus(taskId);
      console.log(`Suno API status for ${taskId}:`, status.status);

      if (status.status === "completed" || status.status === "SUCCESS") {
        // Prioritize stream URL for faster playback
        const streamUrl = status.musicDetails?.[0]?.streamAudioUrl;
        const fullUrl = status.musicDetails?.[0]?.audioUrl || status.audioUrl;
        const url = streamUrl || fullUrl;

        if (url) {
          console.log(`Task ${taskId} completed via API polling! Using ${streamUrl ? 'stream' : 'full'} URL`);
          return url;
        }
      }

      if (status.status === "failed" || status.status === "FAILED") {
        throw new Error("Music generation failed");
      }
    } catch (pollError) {
      // Polling might fail, but webhook should still work
      console.log(`Polling error (will retry): ${pollError}`);
    }

    const elapsed = Math.round((Date.now() - startTime) / 1000);
    console.log(`Still waiting for task ${taskId}... (${elapsed}s elapsed)`);

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error("Music generation timed out (3 minutes). The song may still be processing.");
}

export async function waitForStems(
  taskId: string,
  maxWaitMs: number = 120000,
  pollIntervalMs: number = 3000
): Promise<StemSeparationResult> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const status = await getStemStatus(taskId);

    if ((status.status === "completed" || status.status === "SUCCESS") && status.stems) {
      return status.stems;
    }

    if (status.status === "failed" || status.status === "FAILED") {
      throw new Error("Stem separation failed");
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error("Stem separation timed out");
}
