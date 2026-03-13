import os
import subprocess
import time

def run_command(cmd):
    print(f"Running: {cmd}")
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        print(f"Error: {result.stderr}")
    else:
        print(f"Success: {result.stdout}")
    return result.returncode

def main():
    cwd = r"c:\Proyectos\VelvetSync_Catalogo\velvetsynccatalog"
    os.chdir(cwd)
    
    # Kill any git process
    subprocess.run("taskkill /F /IM git.exe", shell=True)
    
    lock_file = os.path.join(cwd, ".git", "index.lock")
    if os.path.exists(lock_file):
        os.remove(lock_file)
        print("Removed lock file")

    run_command("git add .")
    run_command('git commit -m "chore: migrate to supabase and update media helpers"')
    run_command("git push origin main")

if __name__ == "__main__":
    main()
