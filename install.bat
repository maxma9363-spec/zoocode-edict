@echo off
setlocal

echo Searching for the correct folder...

rem Searching for correct folder. If provided address, use it.
if not "%~1"=="" (
    set "install_dir=%~1"
) else (
    rem three possible default data directory including cursor and windsurf
    if exist "%APPDATA%\Code\User\globalStorage\zoocodeorganization.zoo-code\" (
        set "install_dir=%APPDATA%\Code\User\globalStorage\zoocodeorganization.zoo-code"
    ) else if exist "%APPDATA%\Code - Insiders\User\globalStorage\zoocodeorganization.zoo-code\" (
        set "install_dir=%APPDATA%\Code - Insiders\User\globalStorage\zoocodeorganization.zoo-code"
    ) else if exist "%APPDATA%\VSCodium\User\globalStorage\zoocodeorganization.zoo-code\" (
        set "install_dir=%APPDATA%\VSCodium\User\globalStorage\zoocodeorganization.zoo-code"
    ) else if exist "%APPDATA%\Cursor\User\globalStorage\zoocodeorganization.zoo-code\" (
        set "install_dir=%APPDATA%\Cursor\User\globalStorage\zoocodeorganization.zoo-code"
    ) else if exist "%APPDATA%\Windsurf\User\globalStorage\zoocodeorganization.zoo-code\" (
        set "install_dir=%APPDATA%\Windsurf\User\globalStorage\zoocodeorganization.zoo-code"
    )
)
rem validation
rem If folder was not found and user did not provide address:
if not defined install_dir (
    echo [ERROR] Could not find the correct folder. Please provide the path to the zoocode or the IDE user data folder as an argument.
    goto error
)

rem If address was provided but invalid folder:
if not exist "%install_dir%\" (
    echo [ERROR] Provided folder does not exist. Please provide a valid path to the folder.
    goto error
)
rem correct folder or user provided settings folder
if exist "%install_dir%\custom_modes.yaml" (
    echo Found the correct folder: %install_dir%
    goto install
)
if exist "%install_dir%\settings\custom_modes.yaml" (
    echo Found the correct parent folder, moving to settings folder
    set "install_dir=%install_dir%\settings"
    goto install
)
if exist "%install_dir%\User\globalStorage\zoocodeorganization.zoo-code\settings\custom_modes.yaml" (
    echo Found the IDE user data folder, moving to settings folder
    set "install_dir=%install_dir%\User\globalStorage\zoocodeorganization.zoo-code\settings"
    goto install
)
rem If address was provided, valid folder, but wrong folder:
echo [ERROR] Provided folder is not the correct folder. Check if zoo code is installed (not roo code) and the path to your IDE's user data directory is correct.
goto error

:install
rem make backup of current custom_modes.yaml if it exists
if exist "%install_dir%\custom_modes.yaml" (
    copy "%install_dir%\custom_modes.yaml" "%install_dir%\custom_modes.yaml.bak" >nul
    echo [INFO] Backed up existing custom_modes.yaml
) else (
    echo [INFO] No existing custom_modes.yaml found, no backup needed
)

rem locate source dir and copy files
set "source_dir=%~dp0"
if exist "%source_dir%custom_modes.yaml" (
    copy "%source_dir%custom_modes.yaml" "%install_dir%\custom_modes.yaml" >nul
    echo [INFO] edict custom_modes config loaded.
    echo Press any key to exit...
    pause >nul
    exit /b 0
) else (
    echo [ERROR] custom_modes.yaml not found. 
    goto error
)

:error
echo.
echo Press any key to exit...
pause >nul
exit /b 1