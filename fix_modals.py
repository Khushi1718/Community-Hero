import os
import glob

def fix_modals(directory):
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r') as f:
                    content = f.read()

                modified = False
                
                # We need to look for <div className="fixed inset-0 z-[...]" followed by backdrop, then the fixed top-1/2...
                # Actually, an easier way:
                # Replace 'className="fixed inset-0 z-[50]"' with 'className="fixed inset-0 z-[50] flex items-center justify-center p-4"'
                # Replace 'className="fixed inset-0 z-[1000]"' with 'className="fixed inset-0 z-[1000] flex items-center justify-center p-4"'
                # Replace 'className="fixed inset-0 z-[1050]"' with 'className="fixed inset-0 z-[1050] flex items-center justify-center p-4"'
                # Replace 'className="fixed inset-0 z-[9999]"' with 'className="fixed inset-0 z-[9999] flex items-center justify-center p-4"'
                
                # Replace 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ' with 'relative '
                # Replace 'w-[calc(100%-2rem)]' with 'w-full'
                
                new_content = content
                
                # Add flex classes to the outer fixed wrapper if not there
                for z in ['z-[50]', 'z-[1000]', 'z-[1050]', 'z-[9999]']:
                    new_content = new_content.replace(f'className="fixed inset-0 {z}"', f'className="fixed inset-0 {z} flex items-center justify-center p-4"')
                
                # Remove the broken positioning
                new_content = new_content.replace('fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2', 'relative')
                
                # Fix width
                new_content = new_content.replace('w-[calc(100%-2rem)]', 'w-full')
                
                if new_content != content:
                    with open(filepath, 'w') as f:
                        f.write(new_content)
                    print(f"Fixed {filepath}")

fix_modals('src/app')
