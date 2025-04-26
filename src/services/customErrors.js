export class AppError extends Error {
  constructor(message, type = 'error', statusCode = 500, details = {}) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message, details = {}) {
    super(message, 'validation', 400, details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends AppError {
  constructor(message, details = {}) {
    super(message, 'authentication', 401, details);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends AppError {
  constructor(message, details = {}) {
    super(message, 'authorization', 403, details);
    this.name = 'AuthorizationError';
  }
}

export class ResourceNotFoundError extends AppError {
  constructor(message, details = {}) {
    super(message, 'not_found', 404, details);
    this.name = 'ResourceNotFoundError';
  }
}

export class DatabaseError extends AppError {
  constructor(message, details = {}) {
    super(message, 'database', 500, details);
    this.name = 'DatabaseError';
  }
}

export class FileSystemError extends AppError {
  constructor(message, details = {}) {
    super(message, 'filesystem', 500, details);
    this.name = 'FileSystemError';
  }
} 