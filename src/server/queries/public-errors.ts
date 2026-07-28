export class PublicDataError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "NO_ACTIVE_SEMESTER"
      | "EMPTY_SEMESTER"
      | "CONNECTION_FAILED"
      | "EVENT_NOT_FOUND"
      | "INVALID_RANGE",
  ) {
    super(message);
    this.name = "PublicDataError";
  }
}

export function toPublicDataError(error: unknown): PublicDataError {
  if (error instanceof PublicDataError) {
    return error;
  }

  if (error instanceof Error) {
    return new PublicDataError(error.message, "CONNECTION_FAILED");
  }

  return new PublicDataError(
    "Falha ao carregar dados públicos.",
    "CONNECTION_FAILED",
  );
}
