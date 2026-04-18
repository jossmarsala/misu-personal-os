import sys
import re
import os

log_path = '/Users/jossmarsala/.gemini/antigravity/brain/02889849-7a40-4e92-9301-196e7724a977/.system_generated/logs/overview.txt'

try:
    with open(log_path, 'r', encoding='utf-8') as f:
        content = f.read()
except FileNotFoundError:
    print(f"Log not found at {log_path}")
    sys.exit(1)

# Find the start of the data
match = re.search(r'static const uint32_t new_piskel_data\[1\]\[4096\] = \{\s*\{\s*(0x[0-9a-fA-F, \n]+)\}', content)
if not match:
    # Maybe try a more relaxed regex just finding a huge block of 0x...
    matches = re.findall(r'0x[0-9a-fA-F]{8}', content)
    if not matches:
        print("Could not find the hex data in the log.")
        sys.exit(1)
    hex_list = matches
else:
    hex_list = re.findall(r'0x[0-9a-fA-F]{8}', match.group(1))

# Keep the last 4096 elements if there are multiple, or just take 4096
if len(hex_list) < 4096:
    print(f"Only found {len(hex_list)} elements, need 4096")
    sys.exit(1)

# Let's assume the last big block of 4096 hex codes is our data, in case there were multiple
data = hex_list[-4096:]

width = 64
height = 64
paths = []

for y in range(height):
    for x in range(width):
        idx = y * width + x
        val = int(data[idx], 16)
        if val != 0:
            paths.append(f"M{x},{y}h1v1h-1z")

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <path fill="currentColor" fill-rule="evenodd" d="{' '.join(paths)}" />
</svg>'''

svg_path = '/Users/jossmarsala/Documents/misu/src/assets/logo.svg'
with open(svg_path, 'w') as f:
    f.write(svg_content)
    
print(f"Successfully wrote {len(paths)} pixels to {svg_path}")
