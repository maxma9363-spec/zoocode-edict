import os
import sys
import platform
import shutil
from pathlib import Path

def error(message):
    print(f"[ERROR] {message}")
    input("Press Enter to exit... ")
    sys.exit(1)

def install(data_dir, src_dir):
    #make backup of current config
    dest_file = Path(data_dir / "custom_modes.yaml")
    backup_file = dest_file.with_name(dest_file.name + ".bak")
    shutil.copy2(dest_file, backup_file)

    #copy the new config file
    src_file = Path(src_dir / "custom_modes.yaml")
    if src_file.is_file():
        shutil.copy(src_file, dest_file)
        print("[INFO] Config loaded successfully. ")
        input("Press Enter to exit...")
        sys.exit(0)
    else:
        error("custom config file was not found.")


def main():
    system = platform.system()
    source_dir = Path(__file__).parent.resolve()

    if system == "Windows":
        APPDATA = os.getenv("APPDATA")
        default_dir = [
            Path(APPDATA) / "Code" / "User" / "globalStorage" / "zoocodeorganization.zoo-code", 
            Path(APPDATA) / "Code - Insiders" / "User" / "globalStorage" / "zoocodeorganization.zoo-code",
            Path(APPDATA) / "VSCodium" / "User" / "globalStorage" / "zoocodeorganization.zoo-code",
            Path(APPDATA) / "Cursor" / "User" / "globalStorage" / "zoocodeorganization.zoo-code",
            Path(APPDATA) / "Windsurf" / "User" / "globalStorage" / "zoocodeorganization.zoo-code",
        ]
    elif system == "Darwin": #macos
        HOME = Path.home() / "Library" / "Application Support"
        default_dir = [
            HOME / "Code" / "User" / "globalStorage" / "zoocodeorganization.zoo-code", 
            HOME / "Code - Insiders" / "User" / "globalStorage" / "zoocodeorganization.zoo-code",
            HOME / "VSCodium" / "User" / "globalStorage" / "zoocodeorganization.zoo-code",
            HOME / "Cursor" / "User" / "globalStorage" / "zoocodeorganization.zoo-code",
            HOME / "Windsurf" / "User" / "globalStorage" / "zoocodeorganization.zoo-code",
        ]
    elif system == "Linux": 
        HOME = Path.home() / ".config"
        default_dir = [
            HOME / "Code" / "User" / "globalStorage" / "zoocodeorganization.zoo-code", 
            HOME / "Code - Insiders" / "User" / "globalStorage" / "zoocodeorganization.zoo-code",
            HOME / "VSCodium" / "User" / "globalStorage" / "zoocodeorganization.zoo-code",
            HOME / "Cursor" / "User" / "globalStorage" / "zoocodeorganization.zoo-code",
            HOME / "Windsurf" / "User" / "globalStorage" / "zoocodeorganization.zoo-code",
        ]
    else:
        error(f"Unsupported system: {system}")

    if len(sys.argv) == 2:
        data_dir = Path(sys.argv[1]).resolve()
    elif len(sys.argv) == 1:
        data_dir = None
        for dir in default_dir:
            if dir.is_dir():
                data_dir = dir
                break

        if data_dir is None:
            error("Default data directory not found. Please include the custom data directory as an argument.")
    else:
        #in case user provided more than 2 argv
        error(f"Invalid number of arguments provided. Maximum 2, provided {len(sys.argv)}")

    #Validation
    #Provided settings folder
    if Path(data_dir / "custom_modes.yaml").is_file():
        print("Subfolder found")
        install(data_dir, source_dir)

    elif Path(data_dir / "settings" / "custom_modes.yaml").is_file(): #parent folder
        print("Parent folder found. Moving to subfolder")
        data_dir = Path(data_dir / "settings")
        install(data_dir, source_dir)

    elif Path(data_dir / "User" / "globalStorage" / "zoocodeorganization.zoo-code" \
              / "settings" / "custom_modes.yaml").is_file(): #IDE user data folder
        print("IDE user data found. Moving to settings folder")
        data_dir = Path(data_dir / "User" / "globalStorage" / "zoocodeorganization.zoo-code" / "settings")
        install(data_dir, source_dir)

    else:
        error("Invalid install location. Please check if zoo code is installed and the path to your IDE's user data directory is correct.")

if __name__ == "__main__":
    main()