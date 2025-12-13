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
  title: string = "Corporate Gangsta"
): Promise<{ taskId: string }> {
  const response = await fetch(`${SUNO_API_URL}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.SUNO_API_KEY}`,
    },
    body: JSON.stringify({
      customMode: true,
      instrumental: false,
      model: "V5",
      prompt: lyrics,
      style: "90s west coast gangsta rap, g-funk, heavy bassline, aggressive swedish male vocals, dr dre style",
      title: title,
      vocalGender: "m",
    } satisfies SunoGenerateRequest),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Suno API error: ${error}`);
  }

  const result: SunoTaskResponse = await response.json();
  return { taskId: result.data.taskId };
}

export async function getMusicStatus(taskId: string): Promise<{
  status: string;
  audioUrl?: string;
  musicDetails?: Array<{ audioUrl: string; title: string; duration: number }>;
}> {
  const response = await fetch(`${SUNO_API_URL}/generate/record/${taskId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${process.env.SUNO_API_KEY}`,
    },
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Suno status error: ${error}`);
  }

  const result: SunoTaskStatus = await response.json();
  return result.data;
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

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Suno stem separation error: ${error}`);
  }

  const result = await response.json();
  return { taskId: result.data.taskId };
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

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Suno stem status error: ${error}`);
  }

  const result = await response.json();
  return {
    status: result.data.status,
    stems: result.data.stems,
  };
}

// Poll for completion with timeout
export async function waitForMusic(
  taskId: string,
  maxWaitMs: number = 180000,
  pollIntervalMs: number = 3000
): Promise<string> {
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const status = await getMusicStatus(taskId);

    if (status.status === "completed" || status.status === "SUCCESS") {
      // Get audio URL from musicDetails or direct audioUrl
      const audioUrl = status.musicDetails?.[0]?.audioUrl || status.audioUrl;
      if (audioUrl) return audioUrl;
    }

    if (status.status === "failed" || status.status === "FAILED") {
      throw new Error("Music generation failed");
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  throw new Error("Music generation timed out");
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
