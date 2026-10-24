import axios from "axios";

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const firstIssueMessage = (value: unknown): string | undefined => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const issue = value.find(
    (item) => isRecord(item) && typeof item.message === "string",
  );

  return isRecord(issue) && typeof issue.message === "string"
    ? issue.message
    : undefined;
};

export const getApiErrorMessage = (
  error: unknown,
  fallback: string,
): string => {
  if (!axios.isAxiosError(error)) {
    return error instanceof Error ? error.message : fallback;
  }

  const responseData: unknown = error.response?.data;
  if (isRecord(responseData)) {
    const issueMessage =
      firstIssueMessage(responseData.errors) ??
      firstIssueMessage(responseData.issues);
    if (issueMessage) {
      return issueMessage;
    }

    if (typeof responseData.message === "string" && responseData.message) {
      return responseData.message;
    }

    if (typeof responseData.error === "string" && responseData.error) {
      return responseData.error;
    }
  }

  if (!error.response) {
    return "Unable to connect to the server. Check your connection and try again.";
  }

  return fallback;
};
