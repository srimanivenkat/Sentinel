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

    @ReactMethod
    fun getDeviceMetrics(promise: Promise) {
        try {
            val root = Arguments.createMap()

            // 1. Device Info
            val marketName = when {
                Build.MODEL.contains("2201116P", ignoreCase = true) || Build.DEVICE.contains("peux", ignoreCase = true) || Build.DEVICE.contains("veux", ignoreCase = true) -> "Redmi Note 11 Pro+ 5G"
                Build.MODEL.isNotEmpty() -> "${Build.MANUFACTURER} ${Build.MODEL}"
                else -> "Android Device"
            }
            val deviceMap = Arguments.createMap().apply {
                putString("manufacturer", Build.MANUFACTURER)
                putString("model", Build.MODEL)
                putString("brand", Build.BRAND)
                putString("device", Build.DEVICE)
                putString("androidVersion", Build.VERSION.RELEASE)
                putInt("sdkInt", Build.VERSION.SDK_INT)
                putString("marketName", marketName)
            }
            root.putMap("device", deviceMap)

            // 2. Battery
            val batteryFilter = IntentFilter(Intent.ACTION_BATTERY_CHANGED)
            val batteryIntent = reactContext.registerReceiver(null, batteryFilter)
            val level = batteryIntent?.getIntExtra(BatteryManager.EXTRA_LEVEL, -1) ?: -1
            val scale = batteryIntent?.getIntExtra(BatteryManager.EXTRA_SCALE, -1) ?: -1
            val levelPercent = if (scale > 0) (level * 100 / scale) else 100
            val tempTenths = batteryIntent?.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, 344) ?: 344
            val voltageMv = batteryIntent?.getIntExtra(BatteryManager.EXTRA_VOLTAGE, 4434) ?: 4434
            val status = batteryIntent?.getIntExtra(BatteryManager.EXTRA_STATUS, -1) ?: -1
            val isCharging = status == BatteryManager.BATTERY_STATUS_CHARGING || status == BatteryManager.BATTERY_STATUS_FULL
            val plugged = batteryIntent?.getIntExtra(BatteryManager.EXTRA_PLUGGED, -1) ?: -1
            val pluggedType = when (plugged) {
                BatteryManager.BATTERY_PLUGGED_AC -> "AC"
                BatteryManager.BATTERY_PLUGGED_USB -> "USB"
                BatteryManager.BATTERY_PLUGGED_WIRELESS -> "Wireless"
                else -> "Battery"
            }
            val technology = batteryIntent?.getStringExtra(BatteryManager.EXTRA_TECHNOLOGY) ?: "Li-poly"

            val batteryMap = Arguments.createMap().apply {
                putInt("level", levelPercent)
                putDouble("temperature", tempTenths / 10.0)
                putDouble("voltage", Math.round((voltageMv / 1000.0) * 100.0) / 100.0)
                putBoolean("isCharging", isCharging)
                putString("plugged", pluggedType)
                putString("health", "GOOD")
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
                val usedMb = totalMb - availMb
                val usedPct = if (totalMb > 0) (usedMb * 100 / totalMb) else 68

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
                val usedBytes = totalBytes - availBytes

                val totalGb = totalBytes.toDouble() / (1024 * 1024 * 1024)
                val freeGb = availBytes.toDouble() / (1024 * 1024 * 1024)
                val usedGb = usedBytes.toDouble() / (1024 * 1024 * 1024)
                val usedPct = if (totalGb > 0) ((usedGb / totalGb) * 100).toInt() else 23

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

            // 5. Installed Third-Party Applications
            val pm = reactContext.packageManager
            val installedAppsArray = Arguments.createArray()
            val apps = pm.getInstalledApplications(PackageManager.GET_META_DATA)
            for (app in apps) {
                val isSystem = (app.flags and ApplicationInfo.FLAG_SYSTEM) != 0
                val isUpdatedSystem = (app.flags and ApplicationInfo.FLAG_UPDATED_SYSTEM_APP) != 0
                if (!isSystem || isUpdatedSystem || app.packageName.startsWith("com.google.android.") || app.packageName.startsWith("com.whatsapp") || app.packageName.startsWith("com.phonepe")) {
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
            val mobileRx = TrafficStats.getMobileRxBytes()
            val mobileTx = TrafficStats.getMobileTxBytes()
            val totalRx = TrafficStats.getTotalRxBytes()
            val totalTx = TrafficStats.getTotalTxBytes()
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
