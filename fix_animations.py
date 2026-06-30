import os
import re

def fix_animations(directory):
    classes_to_remove = [
        "animate-in", "fade-in", "zoom-in-95", "duration-200",
        "animate-slide-up", "sm:animate-fade-in", "animate-slide-in-right",
        "animate-fade-in-up", "animate-fade-in"
    ]
    
    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx'):
                filepath = os.path.join(root, file)
                with open(filepath, 'r') as f:
                    content = f.read()

                new_content = content
                for cls in classes_to_remove:
                    # Remove the class with a space before or after
                    new_content = re.sub(rf'\s+{cls}\b', '', new_content)
                    new_content = re.sub(rf'\b{cls}\s+', '', new_content)
                
                # Replace 'relative bg-white' with 'relative bg-white animate-[modalIn_0.25s_ease-out]' for modal bodies
                # Actually, I added .modal-box, but it might override other styles. 
                # Let's just add `modal-box` to any div that has max-h-[90vh]
                # Wait, simpler is to just remove the buggy classes and let it render normally, maybe add a simple custom class.
                
                if new_content != content:
                    with open(filepath, 'w') as f:
                        f.write(new_content)
                    print(f"Fixed animations in {filepath}")

fix_animations('src/app')
