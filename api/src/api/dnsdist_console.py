"""Minimal encrypted dnsdist console client (NaCl secretbox via PyNaCl).

Protocol matches dnsdist / dnsdist_console: nonce exchange, then length-prefixed
secretbox frames. Avoids the dnsdist-console → scrypt build on Alpine.
"""

from __future__ import annotations

import base64
import socket
import struct
import time

from nacl.secret import SecretBox
from nacl.utils import random as nacl_random


class DnsdistConsole:
    def __init__(
        self,
        key: str,
        host: str = "127.0.0.1",
        port: int = 5199,
        timeout: float = 3.0,
    ) -> None:
        self.host = host
        self.port = port
        self.timeout = timeout
        self.box = SecretBox(base64.b64decode(key))
        self.nonce_c = nacl_random(SecretBox.NONCE_SIZE)
        self.nonce_w: bytes | None = None
        self.nonce_r: bytes | None = None
        self.sock: socket.socket | None = None
        self.connect()

    @staticmethod
    def _increment_nonce(nonce: bytes) -> bytes:
        value = int.from_bytes(nonce[:4], "big") + 1
        return value.to_bytes(4, "big") + nonce[4:]

    def connect(self) -> None:
        try:
            # Resolves IPv4/IPv6/hostnames (e.g. host.docker.internal).
            self.sock = socket.create_connection(
                (self.host, self.port), timeout=self.timeout
            )
            self.sock.setsockopt(socket.IPPROTO_TCP, socket.TCP_NODELAY, 1)
            self.sock.settimeout(self.timeout)
            self.sock.sendall(self.nonce_c)
            nonce_s = self._recv_exact(len(self.nonce_c))
            half = len(self.nonce_c) // 2
            self.nonce_r = self.nonce_c[:half] + nonce_s[half:]
            self.nonce_w = nonce_s[:half] + self.nonce_c[half:]
            # Empty command validates the handshake / key.
            self.send_command("")
        except Exception:
            self.disconnect()
            raise

    def disconnect(self) -> None:
        if self.sock is not None:
            try:
                self.sock.close()
            except OSError:
                pass
            self.sock = None

    def _recv_exact(self, size: int) -> bytes:
        assert self.sock is not None
        chunks = bytearray()
        while len(chunks) < size:
            part = self.sock.recv(size - len(chunks))
            if not part:
                raise ConnectionError("connection closed while reading")
            chunks.extend(part)
        return bytes(chunks)

    def send_command(self, cmd: str, max_retries: int = 2) -> str:
        last_error: Exception | None = None
        for attempt in range(max_retries + 1):
            try:
                if self.sock is None:
                    self.connect()
                assert self.sock is not None
                assert self.nonce_w is not None and self.nonce_r is not None

                encrypted = self.box.encrypt(cmd.encode("utf-8"), self.nonce_w).ciphertext
                self.sock.sendall(struct.pack("!I", len(encrypted)))
                self.sock.sendall(encrypted)

                size_data = self._recv_exact(4)
                (response_size,) = struct.unpack("!I", size_data)
                payload = self._recv_exact(response_size)
                plain = self.box.decrypt(payload, self.nonce_r).decode("utf-8")

                self.nonce_r = self._increment_nonce(self.nonce_r)
                self.nonce_w = self._increment_nonce(self.nonce_w)
                return plain
            except (BrokenPipeError, ConnectionError, OSError, TimeoutError) as e:
                last_error = e
                self.disconnect()
                if attempt < max_retries:
                    time.sleep(1)
                    continue
                raise ConnectionError(
                    f"dnsdist console failed after {max_retries} retries: {last_error}"
                ) from e
        raise ConnectionError(f"dnsdist console failed: {last_error}")
