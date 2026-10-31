"""
Automated Hugging Face Spaces Deployment Script for ANPR System.
Uploads the Dockerized application to a free 16 GB RAM Space.
"""

import os
import sys
from huggingface_hub import HfApi, login

def main():
    print("=" * 60)
    print(" ANPR System - Hugging Face Spaces Deployment")
    print("=" * 60)
    print("Platform: Hugging Face Spaces")
    print("Free Tier Specs: 16 GB RAM, 2 vCPUs (No Out-Of-Memory Crashes)")
    print("-" * 60)

    token = os.environ.get("HF_TOKEN")
    if not token and len(sys.argv) > 1:
        token = sys.argv[1].strip()

    if not token:
        print("\nTo deploy, you need a free Hugging Face User Access Token:")
        print("1. Go to: https://huggingface.co/settings/tokens")
        print("2. Click 'Create new token' -> choose 'Write' permission")
        print("3. Copy the token (starts with hf_...)\n")
        token = input("Paste your Hugging Face Token here: ").strip()

    if not token:
        print("Error: No token provided. Aborting.")
        return

    try:
        login(token=token, add_to_git_credential=False)
        api = HfApi(token=token)
        user_info = api.whoami()
        username = user_info["name"]
        print(f"\n[+] Successfully authenticated as: {username}")
    except Exception as e:
        print(f"\n[!] Authentication failed: {e}")
        return

    default_space_name = "anpr-system"
    space_input = input(f"Enter Space name [{default_space_name}]: ").strip()
    space_name = space_input if space_input else default_space_name

    repo_id = f"{username}/{space_name}"
    print(f"\n[+] Target Space: {repo_id}")

    # Create the Space if it doesn't already exist (uses 100% FREE Gradio SDK with 16 GB RAM)
    try:
        api.create_repo(
            repo_id=repo_id,
            repo_type="space",
            space_sdk="gradio",
            exist_ok=True,
            private=False
        )
        print(f"[+] Free 16 GB RAM Gradio Space verified/created on Hugging Face!")
    except Exception as e:
        print(f"[!] Note on repo creation: {e}")

    # Ignore unnecessary large training files and virtual environments
    ignore_patterns = [
        "anpr_env/**",
        "venv/**",
        "env/**",
        ".env*",
        "__pycache__/**",
        "*.pyc",
        "dataset/**",
        "images/**",
        "output/**",
        "result/**",
        "backup_before_guide_update/**",
        "backup_before_guide_update_v2/**",
        "*_backup*.py",
        "frontend/**/node_modules/**",
        "runs/detect/predict*/**",
        "runs/detect/runs/**",
        "runs/detect/train-*/**",
        "runs/detect/train-2/**",
        "runs/detect/train-3/**",
        "runs/detect/train-4/**",
        "runs/vehicle/**",
        "runs/detect/train/*.png",
        "runs/detect/train/*.jpg",
        "runs/detect/train/*.csv",
        "runs/detect/train/weights/last.pt",
        ".git/**",
        "deploy_to_hf.py"
    ]

    base_dir = os.path.dirname(os.path.abspath(__file__))
    print(f"\n[+] Uploading project files from {base_dir} to Hugging Face...")
    print("    (Excluding 1.2 GB virtualenv and training datasets)")

    try:
        api.upload_folder(
            folder_path=base_dir,
            repo_id=repo_id,
            repo_type="space",
            ignore_patterns=ignore_patterns,
            commit_message="Deploy ANPR Full-Stack application (Docker + React + Flask)"
        )
        print("\n" + "=" * 60)
        print("  DEPLOYMENT TRIGGERED SUCCESSFULLY!")
        print("=" * 60)
        print(f"\n1. View build logs & status:")
        print(f"   https://huggingface.co/spaces/{repo_id}")
        print(f"\n2. Direct Public Web App URL (after build completes in ~2-3 mins):")
        print(f"   https://{username}-{space_name}.hf.space")
        print("=" * 60)
    except Exception as e:
        print(f"\n[!] Upload failed: {e}")

if __name__ == "__main__":
    main()
