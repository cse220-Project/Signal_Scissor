"""HTTP integration for noise removal, including request limits and cleanup."""

import asyncio
import logging
import tempfile
from contextlib import asynccontextmanager, suppress
from typing import Annotated

from fastapi import APIRouter, File, Form, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from noise_config import FORMATS, NOISE_LEVELS, NoiseConfig
from noise_service import NoiseError, NoiseService

logger = logging.getLogger(__name__)
service = NoiseService(NoiseConfig.from_env())


async def clean_periodically():
    while True:
        try:
            await asyncio.to_thread(service.storage.cleanup)
        except OSError:
            logger.exception("Noise storage cleanup failed")
        await asyncio.sleep(service.config.cleanup_interval)


@asynccontextmanager
async def lifespan(app):
    try:
        service.dependencies()
    except NoiseError as exc:
        logger.warning(exc.detail)
    task = asyncio.create_task(clean_periodically())
    try:
        yield
    finally:
        task.cancel()
        with suppress(asyncio.CancelledError):
            await task


router = APIRouter(
    prefix="/api/noise-removal", tags=["Noise removal"], lifespan=lifespan
)


class NoiseUploadLimit:
    """Count actual body bytes, including chunked uploads, before multipart spooling."""

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if (
            scope["type"] != "http"
            or scope.get("method") != "POST"
            or scope["path"].rstrip("/") != "/api/noise-removal"
        ):
            await self.app(scope, receive, send)
            return
        try:
            await self.receive_upload(scope, receive, send)
        except OSError:
            logger.exception("Could not spool noise-removal upload")
            await JSONResponse(
                status_code=500,
                content={
                    "detail": "Could not store the upload. Please try again later."
                },
            )(scope, receive, send)

    async def receive_upload(self, scope, receive, send):
        limit = service.config.max_bytes + 65536  # bounded multipart envelope
        headers = dict(scope.get("headers", []))
        try:
            content_length = int(headers.get(b"content-length", b"0"))
        except ValueError:
            content_length = 0
        if content_length > limit:
            await JSONResponse(
                status_code=413,
                content={"detail": "Upload exceeds the server's file-size limit."},
            )(scope, receive, send)
            return
        # Bound the body before Starlette's multipart parser creates upload files.
        # Spooling also guarantees cleanup when a chunked request crosses the cap.
        with tempfile.SpooledTemporaryFile(max_size=1024 * 1024) as body:
            received = 0
            while True:
                message = await receive()
                if message["type"] == "http.disconnect":
                    return
                chunk = message.get("body", b"")
                received += len(chunk)
                if received > limit:
                    await JSONResponse(
                        status_code=413,
                        content={
                            "detail": "Upload exceeds the server's file-size limit."
                        },
                    )(scope, receive, send)
                    return
                await asyncio.to_thread(body.write, chunk)
                if not message.get("more_body", False):
                    break
            body.seek(0)

            async def replay():
                chunk = await asyncio.to_thread(body.read, 1024 * 1024)
                return {
                    "type": "http.request",
                    "body": chunk,
                    "more_body": body.tell() < received,
                }

            await self.app(scope, replay, send)


@router.get("/config")
def noise_config():
    try:
        service.dependencies()
        available = True
        message = None
    except NoiseError as exc:
        available = False
        message = exc.detail
    return {
        "formats": list(FORMATS),
        "levels": list(NOISE_LEVELS),
        "max_bytes": service.config.max_bytes,
        "max_duration_seconds": service.config.max_duration,
        "timeout_seconds": service.config.timeout,
        "retention_seconds": service.config.retention,
        "available": available,
        "message": message,
    }


@router.post("")
def remove_noise(
    file: Annotated[UploadFile, File()], level: Annotated[str, Form()] = "balanced"
):
    # FastAPI executes this synchronous handler in its thread pool. No event-loop
    # blocking or shared workstation mutation; the service bounds FFmpeg workers.
    try:
        return service.process(file, level)
    except NoiseError as exc:
        return JSONResponse(status_code=exc.status, content={"detail": exc.detail})
    finally:
        file.file.close()


@router.get("/{token}/audio")
def noise_audio(token: str, download: bool = False):
    try:
        path = service.storage.resolve(token)
        if path is None:
            return JSONResponse(
                status_code=404,
                content={
                    "detail": "This result has expired or does not exist. Process the file again."
                },
            )
        return FileResponse(
            path,
            media_type="audio/wav",
            filename=f"cleaned-{token[:12]}.wav",
            content_disposition_type="attachment" if download else "inline",
            headers={
                "Cache-Control": "private, no-store",
                "X-Content-Type-Options": "nosniff",
                "Referrer-Policy": "no-referrer",
            },
        )
    except OSError:
        logger.exception("Could not read noise-removal result")
        return JSONResponse(
            status_code=500,
            content={
                "detail": "Could not retrieve the cleaned audio. Please try again."
            },
        )


@router.get("/{invalid_path:path}", include_in_schema=False)
def unknown_noise_resource(invalid_path: str):
    # Keep malformed identifiers within this API; never fall through to the SPA.
    return JSONResponse(
        status_code=404, content={"detail": "Noise-removal resource not found."}
    )
