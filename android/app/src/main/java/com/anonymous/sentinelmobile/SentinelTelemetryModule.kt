package com.anonymous.sentinelmobile

import android.app.ActivityManager
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.content.pm.ApplicationInfo
import android.content.pm.PackageManager
import android.net.TrafficStats
import android.os.BatteryManager
import android.os.Build
import android.os.Environment
import android.os.StatFs
import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class SentinelTelemetryModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "SentinelTelemetry"

    private fun getSystemProperty(key: String): String {
        return try {
            val c = Class.forName("android.os.SystemProperties")
            val get = c.getMethod("get", String::class.java)
            (get.invoke(c, key) as? String)?.trim() ?: ""
        } catch (e: Exception) {
            ""
        }
    }

    private fun detectOsFlavor(): String {
        try {
            // Xiaomi / Redmi / POCO
            val hyperOsVersion = getSystemProperty("ro.mi.os.version.name")
            if (hyperOsVersion.isNotEmpty()) return "HyperOS $hyperOsVersion"
            val miuiVersion = getSystemProperty("ro.miui.ui.version.name")
            if (miuiVersion.isNotEmpty()) return "MIUI $miuiVersion"
            if (Build.MANUFACTURER.contains("Xiaomi", ignoreCase = true) ||
                Build.BRAND.contains("Redmi", ignoreCase = true) ||
                Build.BRAND.contains("POCO", ignoreCase = true)) {
                return if (Build.VERSION.SDK_INT >= 34) "HyperOS" else "MIUI"
            }

            // Samsung One UI
            val oneUiVersion = getSystemProperty("ro.build.version.oneui")
            if (oneUiVersion.isNotEmpty()) return "One UI $oneUiVersion"
            if (Build.MANUFACTURER.contains("samsung", ignoreCase = true)) return "One UI"

            // OnePlus OxygenOS / Oppo ColorOS / Realme UI
            val oppoRom = getSystemProperty("ro.build.version.opporom")
            if (Build.MANUFACTURER.contains("oneplus", ignoreCase = true)) return "OxygenOS"
            if (Build.MANUFACTURER.contains("oppo", ignoreCase = true)) return "ColorOS"
            if (Build.MANUFACTURER.contains("realme", ignoreCase = true)) return "realme UI"

            // Google Pixel UI
            if (Build.MANUFACTURER.contains("google", ignoreCase = true)) return "Pixel UI"

            // Motorola Hello UI / My UX
            if (Build.MANUFACTURER.contains("motorola", ignoreCase = true)) return "Hello UI"

            // Vivo / iQOO Funtouch OS or OriginOS
            if (Build.MANUFACTURER.contains("vivo", ignoreCase = true)) return "Funtouch OS"

            // Nothing OS
            if (Build.MANUFACTURER.contains("nothing", ignoreCase = true)) return "Nothing OS"

            // Huawei EMUI / Honor MagicOS
            if (Build.MANUFACTURER.contains("huawei", ignoreCase = true)) return "EMUI"
            if (Build.MANUFACTURER.contains("honor", ignoreCase = true)) return "MagicOS"
        } catch (e: Exception) {
            // Safe fallback
        }

        val formattedMfr = Build.MANUFACTURER.replaceFirstChar {
            if (it.isLowerCase()) it.titlecase() else it.toString()
        }
        return if (formattedMfr.isNotEmpty()) "$formattedMfr OS" else "Android"
    }

    @ReactMethod
    fun getDeviceMetrics(promise: Promise) {
        try {
            val root = Arguments.createMap()

            // 1. Device Info
            val manufacturer = Build.MANUFACTURER.replaceFirstChar {
                if (it.isLowerCase()) it.titlecase() else it.toString()
            }
            val model = Build.MODEL
            val marketName = when {
                model.contains("2201116P", ignoreCase = true) ||
                Build.DEVICE.contains("peux", ignoreCase = true) ||
                Build.DEVICE.contains("veux", ignoreCase = true) -> "Redmi Note 11 Pro+ 5G"
                model.startsWith(manufacturer, ignoreCase = true) -> model
                model.isNotEmpty() -> "$manufacturer $model"
                else -> "Android Device"
            }
            val osFlavor = detectOsFlavor()

            val deviceMap = Arguments.createMap().apply {
                putString("manufacturer", Build.MANUFACTURER)
                putString("model", Build.MODEL)
                putString("brand", Build.BRAND)
                putString("device", Build.DEVICE)
                putString("androidVersion", Build.VERSION.RELEASE)
                putInt("sdkInt", Build.VERSION.SDK_INT)
                putString("marketName", marketName)
                putString("osName", osFlavor)
            }
            root.putMap("device", deviceMap)

            // 2. Battery
            val batteryFilter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
            val batteryIntent = reactContext.registerReceiver(null, batteryFilter)
            val level = batteryIntent?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
            val scale = batteryIntent?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
            val levelPercent = if (scale > 0 && level >= 0) (level * 100 / scale) else 85
            val tempTenths = batteryIntent?.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, 320) ?: 320
            val voltageMv = batteryIntent?.getIntExtra(BatteryManager.EXTRA_VOLTAGE, 4100) ?: 4100
            val status = batteryIntent?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
            val isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING || status == BatteryManager.BATTERY_STATUS_FULL
            val plugged = batteryIntent?.getIntExtra(BatteryManager.EXTRA_PLUGGED, -1) ?: -1
            val pluggedType = when (plugged) {
                BatteryManager.BATTERY_PLUGGED_AC -> "AC"
                BatteryManager.BATTERY_PLUGGED_USB -> "USB"
                BatteryManager.BATTERY_PLUGGED_WIRELESS -> "Wireless"
                else -> "Battery"
            }
            val healthCode = batteryIntent?.getIntExtra(BatteryManager.EXTRA_HEALTH, BatteryManager.BATTERY_HEALTH_GOOD) ?: BatteryManager.BATTERY_HEALTH_GOOD
            val health = when (healthCode) {
                BatteryManager.BATTERY_HEALTH_OVERHEAT -> "OVERHEAT"
                BatteryManager.BATTERY_HEALTH_DEAD -> "DEAD"
                BatteryManager.BATTERY_HEALTH_OVER_VOLTAGE -> "OVER_VOLTAGE"
                BatteryManager.BATTERY_HEALTH_COLD -> "COLD"
                else -> "GOOD"
            }
            val technology = batteryIntent?.getStringExtra(BatteryManager.EXTRA_TECHNOLOGY) ?: "Li-ion"

            val batteryMap = Arguments.createMap().apply {
                putInt("level", levelPercent)
                putDouble("temperature", if (tempTenths > 0) tempTenths / 10.0 else 32.0)
                putDouble("voltage", if (voltageMv > 0) Math.round((voltageMv / 1000.0) * 100.0) / 100.0 else 4.10)
                putBoolean("isCharging", isCharging)
                putString("plugged", pluggedType)
                putString("health", health)
                putString("technology", technology)
            }
            root.putMap("battery", batteryMap)

            // 3. Memory (RAM)
            val actManager = reactContext.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
            val memInfo = ActivityManager.MemoryInfo()
            if (actManager != null) {
                actManager.getMemoryInfo(memInfo)
                val totalMb = (memInfo.totalMem / (1024 * 1024)).toInt()
                val availMb = (memInfo.availMem / (1024 * 1024)).toInt()
                val usedMb = (totalMb - availMb).coerceAtLeast(0)
                val usedPct = if (totalMb > 0) (usedMb * 100 / totalMb) else 65

                val memMap = Arguments.createMap().apply {
                    putInt("totalMb", totalMb)
                    putInt("availMb", availMb)
                    putInt("usedMb", usedMb)
                    putInt("usedPercent", usedPct)
                }
                root.putMap("memory", memMap)
            }

            // 4. Storage (/data partition)
            try {
                val dataPath = Environment.getDataDirectory()
                val stat = StatFs(dataPath.path)
                val blockSize = stat.blockSizeLong
                val totalBlocks = stat.blockCountLong
                val availBlocks = stat.availableBlocksLong
                val totalBytes = totalBlocks * blockSize
                val availBytes = availBlocks * blockSize
                val usedBytes = (totalBytes - availBytes).coerceAtLeast(0)

                val totalGb = totalBytes.toDouble() / (1024 * 1024 * 1024)
                val freeGb = availBytes.toDouble() / (1024 * 1024 * 1024)
                val usedGb = usedBytes.toDouble() / (1024 * 1024 * 1024)
                val usedPct = if (totalGb > 0) ((usedGb / totalGb) * 100).toInt() else 35

                val storageMap = Arguments.createMap().apply {
                    putDouble("totalGb", Math.round(totalGb * 10.0) / 10.0)
                    putDouble("freeGb", Math.round(freeGb * 10.0) / 10.0)
                    putDouble("usedGb", Math.round(usedGb * 10.0) / 10.0)
                    putInt("usedPercent", usedPct)
                }
                root.putMap("storage", storageMap)
            } catch (e: Exception) {
                // Ignore storage read error
            }

            // 5. Installed Third-Party & Launchable Applications
            val pm = reactContext.packageManager
            val installedAppsArray = Arguments.createArray()
            val apps = pm.getInstalledApplications(PackageManager.GET_META_DATA)
            for (app in apps) {
                val isSystem = (app.flags and ApplicationInfo.FLAG_SYSTEM) != 0
                val isUpdatedSystem = (app.flags and ApplicationInfo.FLAG_UPDATED_SYSTEM_APP) != 0
                val hasLaunchIntent = pm.getLaunchIntentForPackage(app.packageName) != null

                // Include user-installed apps, updated system apps, and launchable apps with an icon
                if (!isSystem || isUpdatedSystem || hasLaunchIntent) {
                    val label = pm.getApplicationLabel(app).toString()
                    val appMap = Arguments.createMap().apply {
                        putString("appName", label)
                        putString("packageName", app.packageName)
                        putBoolean("isSystem", isSystem && !isUpdatedSystem)
                    }
                    installedAppsArray.pushMap(appMap)
                }
            }
            root.putArray("installedApps", installedAppsArray)

            // 6. Network TrafficStats
            val mobileRx = TrafficStats.getMobileRxBytes().coerceAtLeast(0)
            val mobileTx = TrafficStats.getMobileTxBytes().coerceAtLeast(0)
            val totalRx = TrafficStats.getTotalRxBytes().coerceAtLeast(0)
            val totalTx = TrafficStats.getTotalTxBytes().coerceAtLeast(0)
            val trafficMap = Arguments.createMap().apply {
                putDouble("mobileRxMb", Math.round((mobileRx.toDouble() / (1024.0 * 1024.0)) * 10.0) / 10.0)
                putDouble("mobileTxMb", Math.round((mobileTx.toDouble() / (1024.0 * 1024.0)) * 10.0) / 10.0)
                putDouble("totalRxMb", Math.round((totalRx.toDouble() / (1024.0 * 1024.0)) * 10.0) / 10.0)
                putDouble("totalTxMb", Math.round((totalTx.toDouble() / (1024.0 * 1024.0)) * 10.0) / 10.0)
            }
            root.putMap("traffic", trafficMap)

            promise.resolve(root)
        } catch (e: Exception) {
            promise.reject("TELEMETRY_ERROR", e.message, e)
        }
    }
}
