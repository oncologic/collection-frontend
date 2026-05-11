#!/bin/bash

# Script to update documentation index
# This helps maintain the documentation structure

echo "Contexlia Documentation Structure"
echo "========================================"
echo ""
echo "docs/"

# Function to print tree structure
print_tree() {
    local dir=$1
    local prefix=$2
    local items=($(ls -1 "$dir" 2>/dev/null | grep -E '\.(md|MD)$|^[^.]'))
    local count=${#items[@]}
    
    for i in "${!items[@]}"; do
        local item="${items[$i]}"
        local path="$dir/$item"
        
        # Determine if it's the last item
        if [ $((i + 1)) -eq $count ]; then
            echo "${prefix}└── $item"
            local new_prefix="${prefix}    "
        else
            echo "${prefix}├── $item"
            local new_prefix="${prefix}│   "
        fi
        
        # Recursively process directories
        if [ -d "$path" ]; then
            print_tree "$path" "$new_prefix"
        fi
    done
}

# Start from docs directory
cd "$(dirname "$0")"
print_tree "." ""

echo ""
echo "Total documentation files: $(find . -name "*.md" -type f | wc -l | tr -d ' ')"
echo ""
echo "Last updated: $(date '+%Y-%m-%d %H:%M:%S')"
