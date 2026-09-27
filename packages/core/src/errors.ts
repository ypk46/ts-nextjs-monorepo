/** Base class for errors that services raise on purpose and adapters map to responses. */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

/** The resource doesn't exist or belongs to another user. */
export class NotFoundError extends DomainError {
  constructor(resource: string) {
    super(`${resource} not found`);
  }
}

/** The input failed validation. */
export class ValidationError extends DomainError {}
