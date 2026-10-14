"""Custom exception classes and FastAPI exception handlers."""

from __future__ import annotations

from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse


class AppException(HTTPException):
    """Base application exception."""

    def __init__(
        self,
        status_code: int,
        detail: str,
        code: str = "APP_ERROR",
    ) -> None:
        super().__init__(status_code=status_code, detail=detail)
        self.code = code


class NotFoundError(AppException):
    def __init__(self, resource: str = "Resource", identifier: str = "") -> None:
        detail = f"{resource} not found"
        if identifier:
            detail = f"{resource} '{identifier}' not found"
        super().__init__(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=detail,
            code="NOT_FOUND",
        )


class DuplicateError(AppException):
    def __init__(self, detail: str = "Resource already exists") -> None:
        super().__init__(
            status_code=status.HTTP_409_CONFLICT,
            detail=detail,
            code="DUPLICATE",
        )


class ForbiddenError(AppException):
    def __init__(self, detail: str = "Access denied") -> None:
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
            code="FORBIDDEN",
        )


class UnauthorizedError(AppException):
    def __init__(self, detail: str = "Authentication required") -> None:
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            code="UNAUTHORIZED",
        )


class ValidationError(AppException):
    def __init__(self, detail: str = "Validation error") -> None:
        super().__init__(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=detail,
            code="VALIDATION_ERROR",
        )


class RateLimitError(AppException):
    def __init__(self, detail: str = "Too many requests") -> None:
        super().__init__(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail=detail,
            code="RATE_LIMITED",
        )


class BusinessRuleError(AppException):
    """Violation of a business rule (e.g. duplicate pregnancy, invalid state transition)."""

    def __init__(self, detail: str) -> None:
        super().__init__(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=detail,
            code="BUSINESS_RULE_VIOLATION",
        )


async def app_exception_handler(_request: Request, exc: AppException) -> JSONResponse:
    """Consistent JSON error format for application exceptions."""
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail, "code": exc.code},
    )
