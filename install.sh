#!/bin/sh

error() {
    #linux somehow cannot understand read -p. use printf and read variable
    printf "Press Enter to exit..."
    read _
    exit 1
}

install() {
    #make backup of existing custom_modes.yaml
    if [ -f "$install_dir/custom_modes.yaml" ]; then
        cp "$install_dir/custom_modes.yaml" "$install_dir/custom_modes.yaml.bak"
        echo "[INFO] Backup made."
    else
        echo "[INFO] No custom_modes.yaml found. No backup needed."
    
    fi

    #load the config
    source_dir=$(cd -- "$(dirname "$0")" && pwd)
    if [ -f "$source_dir/custom_modes.yaml" ]; then
        cp "$source_dir/custom_modes.yaml" "$install_dir/custom_modes.yaml"
        echo "[INFO] config loaded successfully. "
        printf "Press Enter to exit..."
        read _
        exit 0
    else
        echo "[ERROR] custom config file was not found. "
        error

    fi

}

case "$(uname -s)" in
    Darwin)
        if [ -n "$1" ]; then
            install_dir="$1"
        else
            #default data directory for vs code, cursor, and windsurf
            for dir in "$HOME/Library/Application Support/Code/User/globalStorage/zoocodeorganization.zoo-code" \
            "$HOME/Library/Application Support/Code - Insiders/User/globalStorage/zoocodeorganization.zoo-code" \
            "$HOME/Library/Application Support/VSCodium/User/globalStorage/zoocodeorganization.zoo-code" \
            "$HOME/Library/Application Support/Cursor/User/globalStorage/zoocodeorganization.zoo-code" \
            "$HOME/Library/Application Support/Windsurf/User/globalStorage/zoocodeorganization.zoo-code"
            do 
                if [ -d "$dir" ]; then
                    install_dir="$dir"
                    break
                fi
            done
            #if missed, install_dir is not defined.
            if [ -z "$install_dir" ]; then
                echo "[ERROR] Default data directory not found. Please provide custom path to zoocode or IDE user data directory as an argument."
                error
            fi
        fi

        #validation. Directory confirmed to exist and is valid. Check if folder provided is correct
        if [ -f "$install_dir/custom_modes.yaml" ]; then
            echo "Subfolder found"
            install
        elif [ -f "$install_dir/settings/custom_modes.yaml" ]; then
            echo "Parent folder found. Moving to subfolder"
            install_dir="$install_dir/settings"
            install
        elif [ -f "$install_dir/User/globalStorage/zoocodeorganization.zoo-code/settings/custom_modes.yaml" ]; then
            echo "IDE user data directory found. Moving to settings"
            install_dir="$install_dir/User/globalStorage/zoocodeorganization.zoo-code/settings"
            install
        else
            echo "[ERROR] Invalid install location. Please check if zoo code is installed and the path to your IDE's user data directory is correct."
            error
        fi
        ;;
    Linux)
        if [ -n "$1" ]; then
            install_dir="$1"
        else
            #default data directory for vs code, cursor, and windsurf
            for dir in "$HOME/.config/Code/User/globalStorage/zoocodeorganization.zoo-code" \
            "$HOME/.config/Code - Insiders/User/globalStorage/zoocodeorganization.zoo-code" \
            "$HOME/.config/VSCodium/User/globalStorage/zoocodeorganization.zoo-code" \
            "$HOME/.config/Cursor/User/globalStorage/zoocodeorganization.zoo-code" \
            "$HOME/.config/Windsurf/User/globalStorage/zoocodeorganization.zoo-code"
            do 
                if [ -d "$dir" ]; then
                    install_dir="$dir"
                    break
                fi
            done
            #if missed, install_dir is not defined.
            if [ -z "$install_dir" ]; then
                echo "[ERROR] Default data directory not found. Please provide custom path to zoocode or IDE user data directory as an argument."
                error
            fi
        fi

        #validation. Directory confirmed to exist and is valid. Check if folder provided is correct
        if [ -f "$install_dir/custom_modes.yaml" ]; then
            echo "Subfolder found"
            install
        elif [ -f "$install_dir/settings/custom_modes.yaml" ]; then
            echo "Parent folder found. Moving to subfolder"
            install_dir="$install_dir/settings"
            install
        elif [ -f "$install_dir/User/globalStorage/zoocodeorganization.zoo-code/settings/custom_modes.yaml" ]; then
            echo "IDE user data directory found. Moving to settings"
            install_dir="$install_dir/User/globalStorage/zoocodeorganization.zoo-code/settings"
            install
        else
            echo "[ERROR] Invalid install location. Please check if zoo code is installed and the path to your IDE's user data directory is correct."
            error
        fi
        ;;
    *)
        echo "[ERROR] Unsupported OS: $(uname -s)"
        error
        ;;

esac
