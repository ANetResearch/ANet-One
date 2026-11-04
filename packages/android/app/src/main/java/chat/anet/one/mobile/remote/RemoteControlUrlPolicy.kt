package chat.anet.one.mobile.remote

import android.net.Uri
import chat.anet.one.mobile.BuildConfig

private const val ANET_REMOTE_SCHEME = "anet"
private const val ANET_REMOTE_HOST = "remote"

object RemoteControlUrlPolicy {
    fun resolve(raw: String?): String? {
        val trimmed = raw?.trim().orEmpty()
        if (trimmed.isEmpty()) {
            return null
        }

        val uri = runCatching { Uri.parse(trimmed) }.getOrNull() ?: return null
        return resolve(uri)
    }

    fun resolve(uri: Uri?): String? {
        if (uri == null) {
            return null
        }

        if (uri.scheme == ANET_REMOTE_SCHEME && uri.host == ANET_REMOTE_HOST) {
            return buildDefaultRemoteUrl(uri)
        }

        if (isAllowedRemoteUrl(uri)) {
            return uri.toString()
        }

        return null
    }

    fun isAllowedRemoteUrl(raw: String?): Boolean {
        val uri = runCatching { Uri.parse(raw?.trim().orEmpty()) }.getOrNull() ?: return false
        return isAllowedRemoteUrl(uri)
    }

    private fun buildDefaultRemoteUrl(uri: Uri): String {
        val base = Uri.parse(BuildConfig.REMOTE_CONTROL_DEFAULT_URL).buildUpon()
        uri.encodedQuery?.let { base.encodedQuery(it) }
        uri.encodedFragment?.let { base.encodedFragment(it) }
        return base.build().toString()
    }

    /**
     * 构建期配置的远控地址所在主机。上游把自有域名写死在允许列表里：远控壳因此
     * 只能连厂商的中转服务端，而且无论 REMOTE_CONTROL_DEFAULT_URL 配成什么都仍放行
     * 该域名。改为从 REMOTE_CONTROL_DEFAULT_URL 推导 —— 允许的就是你自己配的那台。
     * 未配置时为空串，生产包因此不放行任何远端地址。
     */
    private val configuredRemoteHost: String by lazy {
        runCatching { Uri.parse(BuildConfig.REMOTE_CONTROL_DEFAULT_URL).host?.lowercase() }
            .getOrNull()
            .orEmpty()
    }

    private fun isAllowedRemoteUrl(uri: Uri): Boolean {
        val scheme = uri.scheme?.lowercase()
        val host = uri.host?.lowercase().orEmpty()
        val path = uri.path.orEmpty()

        if (!path.startsWith("/remote")) {
            return false
        }

        if (scheme == "https" && host.isNotEmpty() && host == configuredRemoteHost) {
            return true
        }

        if (!BuildConfig.DEBUG) {
            return false
        }

        // Bugfix: 开发机真机调试时二维码会指向局域网 Vite 地址。
        // 生产包只允许构建期配置的那台主机，debug 包才放开本机和局域网 http/https，
        // 避免远控壳变成任意浏览器。
        return (scheme == "http" || scheme == "https") && isDebugHost(host)
    }

    private fun isDebugHost(host: String): Boolean {
        if (host == "localhost" || host == "127.0.0.1" || host == "10.0.2.2") {
            return true
        }
        if (host.endsWith(".local")) {
            return true
        }
        if (host.startsWith("192.168.") || host.startsWith("10.")) {
            return true
        }
        return Regex("^172\\.(1[6-9]|2\\d|3[0-1])\\.").containsMatchIn(host)
    }
}
