import os
import sys
import subprocess
import threading
import time

def print_banner():
    print("""
====================================================================
               SYBILGUARD AI DETECTOR LAUNCHER
====================================================================
  - FastAPI Server: http://127.0.0.1:8000
  - React Frontend: http://localhost:5173 (Vite Default)
====================================================================
""")

def log_stream(stream, prefix, color_code):
    """Logs subprocess output with custom prefix and terminal colors."""
    reset_code = "\033[0m"
    for line in iter(stream.readline, ''):
        if not line:
            break
        cleaned_line = line.strip()
        if cleaned_line:
            print(f"{color_code}{prefix}{reset_code} {cleaned_line}")

def run_backend(cwd):
    """Spawns the FastAPI backend server using uvicorn."""
    cmd = [sys.executable, "-m", "uvicorn", "app.main:app", "--host", "127.0.0.1", "--port", "8000"]
    return subprocess.Popen(
        cmd, 
        cwd=cwd, 
        stdout=subprocess.PIPE, 
        stderr=subprocess.PIPE, 
        text=True, 
        bufsize=1
    )

def run_frontend(cwd):
    """Spawns the Vite dev server."""
    # Use npx/npm command depending on platform
    shell = sys.platform == "win32"
    cmd = ["npm", "run", "dev"]
    return subprocess.Popen(
        cmd, 
        cwd=cwd, 
        stdout=subprocess.PIPE, 
        stderr=subprocess.PIPE, 
        text=True, 
        bufsize=1,
        shell=shell
    )

def main():
    root_dir = os.path.dirname(os.path.abspath(__file__))
    backend_dir = os.path.join(root_dir, "backend")
    frontend_dir = os.path.join(root_dir, "frontend")

    print("Step 1: Installing Python backend dependencies...")
    try:
        subprocess.run(
            [sys.executable, "-m", "pip", "install", "-r", "requirements.txt"],
            cwd=backend_dir,
            check=True
        )
        print("Backend dependencies verified/installed successfully.")
    except subprocess.CalledProcessError as e:
        print(f"Error installing backend dependencies: {e}", file=sys.stderr)
        sys.exit(1)

    print("\nStep 2: Checking frontend dependencies...")
    # Node modules check
    if not os.path.exists(os.path.join(frontend_dir, "node_modules")):
        print("node_modules not found in frontend. Installing dependencies...")
        try:
            shell = sys.platform == "win32"
            subprocess.run(["npm", "install"], cwd=frontend_dir, check=True, shell=shell)
            print("Frontend dependencies installed successfully.")
        except subprocess.CalledProcessError as e:
            print(f"Error installing frontend dependencies: {e}", file=sys.stderr)
            sys.exit(1)
    else:
        print("Frontend node_modules verified.")

    print_banner()

    # Colors for terminal logs
    COLOR_BACKEND = "\033[94m"  # Light Blue
    COLOR_FRONTEND = "\033[95m" # Light Purple
    
    # Spawn processes
    backend_proc = run_backend(backend_dir)
    frontend_proc = run_frontend(frontend_dir)

    # Threads to pipe outputs concurrently without blocking main thread
    threads = []
    
    # Backend stdout & stderr
    t_be_out = threading.Thread(target=log_stream, args=(backend_proc.stdout, "[Backend] ", COLOR_BACKEND), daemon=True)
    t_be_err = threading.Thread(target=log_stream, args=(backend_proc.stderr, "[Backend-Err]", COLOR_BACKEND), daemon=True)
    
    # Frontend stdout & stderr
    t_fe_out = threading.Thread(target=log_stream, args=(frontend_proc.stdout, "[Frontend]", COLOR_FRONTEND), daemon=True)
    t_fe_err = threading.Thread(target=log_stream, args=(frontend_proc.stderr, "[Frontend-Err]", COLOR_FRONTEND), daemon=True)

    for t in [t_be_out, t_be_err, t_fe_out, t_fe_err]:
        t.start()
        threads.append(t)

    print("System active. Press Ctrl+C to terminate both servers.")

    try:
        while True:
            # Check if either process terminated unexpectedly
            be_code = backend_proc.poll()
            fe_code = frontend_proc.poll()
            
            if be_code is not None:
                print(f"\nBackend process terminated with code {be_code}")
                break
            if fe_code is not None:
                print(f"\nFrontend process terminated with code {fe_code}")
                break
                
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nShutdown signal received (Ctrl+C). Terminating servers...")
    finally:
        # Graceful shutdown
        try:
            print("Stopping backend...")
            backend_proc.terminate()
            backend_proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            print("Force-killing backend...")
            backend_proc.kill()

        try:
            print("Stopping frontend...")
            frontend_proc.terminate()
            frontend_proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            print("Force-killing frontend...")
            frontend_proc.kill()

        print("Shutdown complete. Goodbye!")

if __name__ == "__main__":
    main()
