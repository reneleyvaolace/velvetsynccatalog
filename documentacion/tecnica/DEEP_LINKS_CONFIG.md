# Velvet Sync - Configuración de Deep Links

## Resumen

Este documento describe cómo configurar los **Deep Links** para permitir que la web app (`velvetsynccatalog`) abra la app nativa de Velvet Sync directamente en dispositivos móviles.

---

## URL Scheme Configurado

**Scheme:** `velvetsync://`

**Ejemplo de URL:**
```
velvetsync://device?device_id=8154&action=connect&source=web_catalog&timestamp=1234567890
```

---

## Parámetros Soportados

| Parámetro | Tipo | Requerido | Descripción |
|-----------|------|-----------|-------------|
| `device_id` | number | Sí | ID del dispositivo en Supabase |
| `action` | string | No | Acción a realizar: `connect`, `pair`, `control` |
| `source` | string | No | Origen de la navegación: `web_catalog` |
| `timestamp` | number | No | Timestamp para cache-busting |

---

## Configuración para Android

### 1. AndroidManifest.xml

Agregar el **Intent Filter** en el `Activity` principal:

```xml
<activity android:name=".MainActivity">
    <!-- Deep Link - URL Scheme -->
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        
        <!-- Custom URL Scheme -->
        <data android:scheme="velvetsync" />
    </intent-filter>
    
    <!-- App Links - HTTPS (Android 6.0+) -->
    <intent-filter android:autoVerify="true">
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        
        <data android:scheme="https" />
        <data android:host="velvetsync.com" />
        <data android:pathPrefix="/app" />
    </intent-filter>
    
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>
</activity>
```

### 2. assetlinks.json (para App Links HTTPS)

Crear archivo en `https://velvetsync.com/.well-known/assetlinks.json`:

```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.velvetsync.app",
    "sha256_cert_fingerprints": [
      "XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX:XX"
    ]
  }
}]
```

### 3. Manejar el Intent en MainActivity.kt/Java

```kotlin
// MainActivity.kt
override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    
    intent?.let { handleIntent(it) }
}

override fun onNewIntent(intent: Intent) {
    super.onNewIntent(intent)
    handleIntent(intent)
}

private fun handleIntent(intent: Intent) {
    val action = intent.action
    val data = intent.data
    
    if (Intent.ACTION_VIEW == action && data != null) {
        val deviceId = data.getQueryParameter("device_id")
        val actionType = data.getQueryParameter("action")
        
        // Navegar a la pantalla de conexión del dispositivo
        deviceId?.let { 
            navigateToDeviceConnection(it, actionType)
        }
    }
}

private fun navigateToDeviceConnection(deviceId: String, action: String?) {
    // Implementar lógica para conectar al dispositivo
    // Ejemplo: Iniciar servicio BLE, mostrar UI de conexión, etc.
}
```

---

## Configuración para iOS

### 1. Info.plist

Agregar los **URL Types**:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>com.velvetsync.app</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>velvetsync</string>
        </array>
    </dict>
</array>
```

### 2. Associated Domains (para Universal Links)

En `Info.plist`:

```xml
<key>com.apple.developer.associated-domains</key>
<array>
    <string>applinks:velvetsync.com</string>
</array>
```

### 3. apple-app-site-association

Crear archivo en `https://velvetsync.com/apple-app-site-association` (sin extensión):

```json
{
  "applinks": {
    "apps": [],
    "details": [
      {
        "appID": "TEAM_ID.com.velvetsync.app",
        "paths": [
          "/app/*"
        ]
      }
    ]
  }
}
```

### 4. Manejar URL en AppDelegate.swift

```swift
// AppDelegate.swift
func application(_ app: UIApplication, 
                 open url: URL, 
                 options: [UIApplication.OpenURLOptionsKey : Any] = [:]) -> Bool {
    
    handleDeepLink(url)
    return true
}

func application(_ application: UIApplication, 
                 continue userActivity: NSUserActivity, 
                 restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
    
    if userActivity.activityType == NSUserActivityTypeBrowsingWeb,
       let url = userActivity.webpageURL {
        handleDeepLink(url)
    }
    return true
}

private func handleDeepLink(_ url: URL) {
    guard let components = URLComponents(url: url, resolvingAgainstBaseURL: true),
          let deviceId = components.queryItems?.first(where: { $0.name == "device_id" })?.value else {
        return
    }
    
    let action = components.queryItems?.first(where: { $0.name == "action" })?.value ?? "connect"
    
    // Navegar a la pantalla de conexión del dispositivo
    navigateToDeviceConnection(deviceId, action: action)
}

private func navigateToDeviceConnection(_ deviceId: String, action: String) {
    // Implementar lógica para conectar al dispositivo
    // Ejemplo: Iniciar conexión BLE, mostrar UI, etc.
}
```

### 5. SwiftUI (si aplica)

```swift
// En tu ContentView o App principal
import SwiftUI

struct ContentView: View {
    @State private var deviceIdToConnect: String?
    
    var body: some View {
        NavigationView {
            // Tu contenido principal
            DeviceListView(deviceIdToConnect: $deviceIdToConnect)
        }
        .onOpenURL { url in
            handleURL(url)
        }
    }
    
    private func handleURL(_ url: URL) {
        let components = URLComponents(url: url, resolvingAgainstBaseURL: true)
        if let deviceId = components?.queryItems?.first(where: { $0.name == "device_id" })?.value {
            deviceIdToConnect = deviceId
        }
    }
}
```

---

## Pruebas

### Android

1. **ADB Command:**
```bash
adb shell am start -W -a android.intent.action.VIEW \
  -d "velvetsync://device?device_id=8154&action=connect" \
  com.velvetsync.app
```

2. **Chrome Browser:**
   - Abrir Chrome en Android
   - Navegar a: `velvetsync://device?device_id=8154&action=connect`

### iOS

1. **Safari:**
   - Abrir Safari en iOS
   - Navegar a: `velvetsync://device?device_id=8154&action=connect`

2. **Xcode Console:**
```bash
xcrun simctl openurl booted "velvetsync://device?device_id=8154&action=connect"
```

---

## Fallback para Usuarios sin la App

La implementación web incluye un **fallback automático**:

1. Intenta abrir `velvetsync://` (app nativa)
2. Si falla (2-3 segundos), redirige a `https://velvetsync.com/app/...` (Universal Link)
3. Si no está instalada, permanece en la web app

### Código Web (deepLinking.js)

```javascript
// La web ya implementa esta lógica
import { openNativeApp } from '../utils/deepLinking';

// Uso:
await openNativeApp(deviceId, 'connect');
// Retorna: 'opened' | 'fallback' | 'unsupported'
```

---

## Consideraciones de Seguridad

1. **Validar siempre los parámetros** en la app nativa
2. **Sanitizar inputs** para prevenir inyección de código
3. **Usar HTTPS** para Universal Links/App Links
4. **Verificar el certificado** de la app en assetlinks.json

---

## Troubleshooting

### La app no se abre en Android

1. Verificar que el `package_name` en assetlinks.json sea correcto
2. Confirmar que el Intent Filter está en el Activity correcto
3. Probar con ADB command para debug

### La app no se abre en iOS

1. Verificar que el URL Scheme está en Info.plist
2. Confirmar que el Associated Domain está configurado
3. Para Universal Links: mantener presionado el link para ver opciones

### El fallback no funciona

1. Verificar que el timeout está configurado (2000ms)
2. Confirmar que el visibilitychange event se dispara
3. Revisar console.log para errores

---

## Referencias

- [Android Deep Links](https://developer.android.com/training/app-links/deep-linking)
- [iOS Universal Links](https://developer.apple.com/ios/universal-links/)
- [URL Schemes Best Practices](https://developer.apple.com/documentation/xcode/defining-a-custom-url-scheme-for-your-app)

---

**Última actualización:** 14 de marzo de 2026  
**Versión:** 1.0
