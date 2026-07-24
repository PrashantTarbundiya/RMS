"""
release_signer.py — Operator-side tool for packaging and signing releases.

This script is run by YOU (the platform operator), NOT by customers.
It creates a signed, checksummed release package that customers can
safely download and apply.

Usage:
  python release_signer.py --source_dir ./backend --version 1.1.0 --output_dir ./releases

Output:
  - releases/rms-face-ai-1.1.0.tar.gz  (the release package)
  - releases/rms-face-ai-1.1.0.manifest.json  (manifest entry for this release)
"""

import os
import sys
import json
import hashlib
import hmac
import tarfile
import argparse
from datetime import datetime, timezone

# Must match UPDATE_SIGNING_KEY in update_checker.py
DEFAULT_SIGNING_KEY = 'rms-update-signing-key-change-in-production'


def package_release(source_dir, version, output_dir, signing_key=None):
    """
    Create a signed release package from a source directory.
    
    Returns (package_path, manifest_dict)
    """
    os.makedirs(output_dir, exist_ok=True)
    
    package_name = f"rms-face-ai-{version}.tar.gz"
    package_path = os.path.join(output_dir, package_name)
    
    # Files to include in the release
    include_extensions = {
        '.py', '.json', '.txt', '.cfg', '.ini', '.mako',
        '.jsx', '.js', '.css', '.html', '.md',
    }
    
    # Directories to exclude
    exclude_dirs = {
        'venv', '__pycache__', 'node_modules', '.git',
        'backups', 'staging', 'dataset', 'data',
        '.env', 'encodings.pickle',
    }
    
    print(f"\n{'='*50}")
    print(f"  RMS Face AI — Release Packager")
    print(f"{'='*50}")
    print(f"  Version:    {version}")
    print(f"  Source:     {source_dir}")
    print(f"  Output:     {package_path}")
    print(f"{'='*50}\n")
    
    file_count = 0
    with tarfile.open(package_path, 'w:gz') as tar:
        for root, dirs, files in os.walk(source_dir):
            # Skip excluded directories
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            
            for fname in files:
                ext = os.path.splitext(fname)[1]
                if ext in include_extensions and fname not in exclude_dirs:
                    full_path = os.path.join(root, fname)
                    arcname = os.path.relpath(full_path, os.path.dirname(source_dir))
                    tar.add(full_path, arcname=arcname)
                    file_count += 1
    
    print(f"  Files packaged: {file_count}")
    
    # Compute checksum
    sha256 = hashlib.sha256()
    with open(package_path, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            sha256.update(chunk)
    checksum = sha256.hexdigest()
    
    # Compute HMAC signature
    key = (signing_key or DEFAULT_SIGNING_KEY).encode('utf-8')
    h = hmac.new(key, digestmod=hashlib.sha256)
    with open(package_path, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            h.update(chunk)
    signature = h.hexdigest()
    
    size_mb = os.path.getsize(package_path) / (1024 * 1024)
    print(f"  Package size: {size_mb:.1f} MB")
    print(f"  SHA-256: {checksum}")
    print(f"  HMAC Sig: {signature[:32]}...")
    
    # Create manifest entry
    manifest = {
        'latest_version': version,
        'changelog': f'v{version} release',
        'download_url': f'https://releases.rmsface.ai/v{version}/{package_name}',
        'checksum': f'sha256:{checksum}',
        'signature': signature,
        'min_upgrade_from': '0.9.0',
        'severity': 'recommended',
        'released_at': datetime.now(timezone.utc).isoformat(),
    }
    
    manifest_path = os.path.join(output_dir, f"rms-face-ai-{version}.manifest.json")
    with open(manifest_path, 'w') as f:
        json.dump(manifest, f, indent=2)
    
    print(f"\n  Manifest saved: {manifest_path}")
    print(f"\n{'='*50}")
    print(f"  Release {version} packaged successfully!")
    print(f"{'='*50}\n")
    
    return package_path, manifest


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Package and sign an RMS Face AI release')
    parser.add_argument('--source_dir', required=True, help='Source directory to package')
    parser.add_argument('--version', required=True, help='Version string (e.g., 1.1.0)')
    parser.add_argument('--output_dir', default='./releases', help='Output directory')
    parser.add_argument('--signing_key', default=None, help='HMAC signing key (uses default if not provided)')
    parser.add_argument('--severity', default='recommended', choices=['critical', 'recommended', 'optional'])
    parser.add_argument('--changelog', default=None, help='Changelog text')
    
    args = parser.parse_args()
    
    path, manifest = package_release(
        args.source_dir, args.version, args.output_dir, args.signing_key
    )
    
    if args.changelog:
        manifest['changelog'] = args.changelog
    manifest['severity'] = args.severity
    
    # Re-write manifest with updated fields
    manifest_path = os.path.join(args.output_dir, f"rms-face-ai-{args.version}.manifest.json")
    with open(manifest_path, 'w') as f:
        json.dump(manifest, f, indent=2)
