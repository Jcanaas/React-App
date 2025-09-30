# 🔧 Configuración de Shell Integration para PowerShell

## 1. Habilitar Shell Integration en VS Code

### Configuración en settings.json:
```json
{
    "terminal.integrated.shellIntegration.enabled": true,
    "terminal.integrated.shellIntegration.decorationsEnabled": true,
    "terminal.integrated.shellIntegration.history": true,
    "terminal.integrated.commandHistory.maxLength": 1000,
    "terminal.integrated.enablePersistentSessions": true,
    "terminal.integrated.persistentSessionReviveProcess": "onExit"
}
```

## 2. Configurar PowerShell Profile

### Crear/editar el profile de PowerShell:
```powershell
# Verificar si existe el profile
Test-Path $PROFILE

# Si no existe, crearlo
if (!(Test-Path $PROFILE)) {
    New-Item -ItemType File -Path $PROFILE -Force
}

# Editar el profile
notepad $PROFILE
```

### Agregar al archivo $PROFILE:
```powershell
# Shell Integration mejorada para VS Code
if ($env:TERM_PROGRAM -eq "vscode") {
    # Habilitar predicciones
    Set-PSReadLineOption -PredictionSource History
    Set-PSReadLineOption -PredictionViewStyle ListView
    
    # Mejorar la experiencia de autocompletado
    Set-PSReadlineKeyHandler -Key Tab -Function MenuComplete
    Set-PSReadLineKeyHandler -Key UpArrow -Function HistorySearchBackward
    Set-PSReadLineKeyHandler -Key DownArrow -Function HistorySearchForward
    
    # Prompt personalizado con información útil
    function prompt {
        $location = Get-Location
        $gitBranch = ""
        if (Test-Path .git) {
            $gitBranch = " [$(git branch --show-current)]"
        }
        "PS $location$gitBranch> "
    }
}
```

## 3. Instalar/Actualizar PSReadLine

```powershell
# Instalar la versión más reciente de PSReadLine
Install-Module -Name PSReadLine -Force -SkipPublisherCheck

# O actualizar si ya está instalado
Update-Module PSReadLine
```

## 4. Configuraciones adicionales de VS Code

### En settings.json agregar:
```json
{
    "terminal.integrated.profiles.windows": {
        "PowerShell": {
            "source": "PowerShell",
            "icon": "terminal-powershell",
            "args": ["-NoExit", "-Command", "Set-Location '${workspaceFolder}'"]
        }
    },
    "terminal.integrated.defaultProfile.windows": "PowerShell",
    "terminal.integrated.cwd": "${workspaceFolder}",
    "terminal.integrated.automationShell.windows": "powershell.exe"
}
```

## 5. Verificar Execution Policy

```powershell
# Verificar política actual
Get-ExecutionPolicy

# Si es Restricted, cambiar a RemoteSigned
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

## 6. Comandos útiles para testing

```powershell
# Verificar que Shell Integration funciona
$env:TERM_PROGRAM

# Verificar PSReadLine
Get-Module PSReadLine

# Test de autocompletado y historial
# (Debería funcionar con Tab y flechas)
```

## 🎯 Beneficios después de la configuración:

✅ **Mejor navegación de historial**
✅ **Autocompletado inteligente** 
✅ **Persistencia de sesiones**
✅ **Mejor integración con Git**
✅ **Comandos más fluidos**
✅ **Menos errores de path/directorio**

## 🚨 Problemas comunes y soluciones:

### Error: "No se puede cargar el archivo... políticas de ejecución"
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### El profile no se carga:
```powershell
# Forzar recarga del profile
. $PROFILE
```

### Shell Integration no aparece:
- Reiniciar VS Code completamente
- Verificar que la versión de VS Code sea reciente
- Comprobar que PowerShell esté actualizado

## 📋 Checklist de verificación:

- [ ] Shell Integration habilitado en VS Code
- [ ] Profile de PowerShell configurado
- [ ] PSReadLine instalado/actualizado
- [ ] Execution Policy configurado
- [ ] Terminal se abre en workspace folder
- [ ] Autocompletado con Tab funciona
- [ ] Historial con flechas funciona
- [ ] Predicciones aparecen