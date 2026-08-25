"""
dev.py — Development server with auto-restart on file changes.

This is the Python equivalent of Node.js 'nodemon'. It watches backend/*.py
files for changes and automatically restarts the Flask server process.

Usage:
    python dev.py              # Start server with auto-restart
    python dev.py --no-watch   # Start server without watching (like normal)

Features:
    - Watches .py files in backend/ for modifications
    - Debounces rapid saves (500ms window)
    - Excludes __pycache__, .pyc, data/, venv/, node_modules/
    - Color-coded terminal output
    - Graceful process shutdown on restart
    - Clean Ctrl+C handling
"""

import sys
import os
import time
import signal
import subprocess
import threading

# ─── Colors for terminal output ─────────────────────────────────────
class Colors:
    CYAN = '\033[96m'
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    MAGENTA = '\033[95m'
    BOLD = '\033[1m'
    DIM = '\033[2m'
    RESET = '\033[0m'

def cprint(color, msg):
    print(f"{color}{msg}{Colors.RESET}")

# ─── Configuration ──────────────────────────────────────────────────
BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))
SERVER_SCRIPT = os.path.join(BACKEND_DIR, 'server.py')
PYTHON_EXE = sys.executable

# Directories/patterns to ignore
IGNORE_DIRS = {
    '__pycache__', '.pyc', 'data', 'venv', 'node_modules',
    '.git', '.expo', 'dist', 'web-build', 'build',
    'migrations', '.mypy_cache', '.pytest_cache'
}

# File extensions to watch
WATCH_EXTENSIONS = {'.py'}

# Debounce window in seconds
DEBOUNCE_SECONDS = 0.5


class ServerProcess:
    """Manages the Flask server subprocess."""

    def __init__(self):
        self.process = None
        self._lock = threading.Lock()

    def start(self):
        """Start the server process."""
        with self._lock:
            if self.process and self.process.poll() is None:
                self.stop()

            cprint(Colors.CYAN, "\n  ⚡ Starting Flask server...")
            self.process = subprocess.Popen(
                [PYTHON_EXE, SERVER_SCRIPT],
                cwd=BACKEND_DIR,
                # Inherit stdio so server output appears in this terminal
                stdout=sys.stdout,
                stderr=sys.stderr,
                # On Windows, create a new process group for clean shutdown
                creationflags=subprocess.CREATE_NEW_PROCESS_GROUP if os.name == 'nt' else 0
            )
            cprint(Colors.GREEN, f"  ✓ Server started (PID: {self.process.pid})")

    def stop(self):
        """Gracefully stop the server process."""
        with self._lock:
            if self.process and self.process.poll() is None:
                cprint(Colors.YELLOW, f"  ↻ Stopping server (PID: {self.process.pid})...")
                try:
                    if os.name == 'nt':
                        # Windows: send CTRL_BREAK_EVENT to the process group
                        self.process.send_signal(signal.CTRL_BREAK_EVENT)
                    else:
                        # Unix: send SIGTERM
                        self.process.terminate()

                    # Wait up to 3 seconds for graceful shutdown
                    try:
                        self.process.wait(timeout=3)
                    except subprocess.TimeoutExpired:
                        cprint(Colors.RED, "  ⚠ Force killing server...")
                        self.process.kill()
                        self.process.wait(timeout=2)
                except Exception as e:
                    cprint(Colors.RED, f"  ⚠ Error stopping server: {e}")
                    try:
                        self.process.kill()
                    except Exception:
                        pass
                finally:
                    self.process = None

    def restart(self, trigger_file=None):
        """Restart the server, optionally logging what triggered it."""
        if trigger_file:
            rel_path = os.path.relpath(trigger_file, BACKEND_DIR)
            cprint(Colors.MAGENTA, f"\n  📝 Change detected: {rel_path}")

        cprint(Colors.YELLOW, "  ↻ Restarting server...")
        self.stop()
        time.sleep(0.3)  # Brief pause for port release
        self.start()

    def is_running(self):
        return self.process is not None and self.process.poll() is None


def should_watch(path):
    """Check if a file path should trigger a restart."""
    # Must be a watched extension
    _, ext = os.path.splitext(path)
    if ext not in WATCH_EXTENSIONS:
        return False

    # Must not be in an ignored directory
    parts = os.path.normpath(path).split(os.sep)
    for part in parts:
        if part in IGNORE_DIRS:
            return False

    return True


def run_with_watcher():
    """Main entry point: start server and watch for file changes."""
    try:
        from watchdog.observers import Observer
        from watchdog.events import FileSystemEventHandler
    except ImportError:
        cprint(Colors.RED, "  ✗ 'watchdog' package not installed!")
        cprint(Colors.YELLOW, "    Install it: pip install watchdog")
        cprint(Colors.DIM, "    Falling back to no-watch mode...\n")
        run_without_watcher()
        return

    server = ServerProcess()

    # Debounce state
    last_restart_time = [0]
    restart_timer = [None]

    class ChangeHandler(FileSystemEventHandler):
        def on_any_event(self, event):
            # Only care about file modifications, creations, and moves
            if event.is_directory:
                return
            if event.event_type not in ('modified', 'created', 'moved'):
                return

            src_path = event.src_path
            if not should_watch(src_path):
                return

            # Debounce: if we just restarted, skip
            now = time.time()
            if now - last_restart_time[0] < DEBOUNCE_SECONDS:
                return

            # Cancel any pending restart timer
            if restart_timer[0] is not None:
                restart_timer[0].cancel()

            # Schedule restart after debounce window
            def do_restart():
                last_restart_time[0] = time.time()
                server.restart(trigger_file=src_path)

            restart_timer[0] = threading.Timer(DEBOUNCE_SECONDS, do_restart)
            restart_timer[0].daemon = True
            restart_timer[0].start()

    # Print startup banner
    print()
    cprint(Colors.BOLD + Colors.CYAN, "  ╔══════════════════════════════════════════════╗")
    cprint(Colors.BOLD + Colors.CYAN, "  ║   RMS Face AI — Dev Server (Auto-Restart)    ║")
    cprint(Colors.BOLD + Colors.CYAN, "  ╚══════════════════════════════════════════════╝")
    cprint(Colors.DIM, f"  Watching: {BACKEND_DIR}")
    cprint(Colors.DIM, f"  Extensions: {', '.join(WATCH_EXTENSIONS)}")
    cprint(Colors.DIM, f"  Ignoring: {', '.join(sorted(IGNORE_DIRS))}")
    cprint(Colors.GREEN, "  Press Ctrl+C to stop.\n")

    # Start file watcher
    observer = Observer()
    handler = ChangeHandler()
    observer.schedule(handler, BACKEND_DIR, recursive=True)
    observer.start()

    # Start server
    server.start()

    # Keep running until Ctrl+C
    try:
        while True:
            time.sleep(1)
            # Check if server process died unexpectedly
            if not server.is_running():
                cprint(Colors.RED, "\n  ⚠ Server process exited unexpectedly!")
                cprint(Colors.YELLOW, "  ↻ Restarting in 2 seconds...")
                time.sleep(2)
                server.start()
    except KeyboardInterrupt:
        cprint(Colors.YELLOW, "\n  ⏹ Shutting down dev server...")
        observer.stop()
        server.stop()
        observer.join()
        cprint(Colors.GREEN, "  ✓ Dev server stopped cleanly.\n")


def run_without_watcher():
    """Run server directly without file watching."""
    cprint(Colors.CYAN, "  Starting server without file watching...")
    cprint(Colors.DIM, "  (Use 'python dev.py' for auto-restart)\n")

    try:
        subprocess.run(
            [PYTHON_EXE, SERVER_SCRIPT],
            cwd=BACKEND_DIR
        )
    except KeyboardInterrupt:
        cprint(Colors.YELLOW, "\n  Server stopped.")


if __name__ == '__main__':
    # Enable ANSI colors on Windows
    if os.name == 'nt':
        os.system('color')

    if '--no-watch' in sys.argv:
        run_without_watcher()
    else:
        run_with_watcher()
