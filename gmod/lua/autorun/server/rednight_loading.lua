--[[ ------------------------------------------------------------------------
    Red Night | SCP RP — экран загрузки для Garry's Mod
    Устанавливает sv_loadingurl на адрес сайта-загрузчика.

    Куда положить:
      garrysmod/addons/rednight_loading/lua/autorun/server/rednight_loading.lua

    Не забудьте указать свой адрес в REDNIGHT_URL ниже (или задать его
    в server.cfg через rednight_loadingurl).
------------------------------------------------------------------------- ]]

local FALLBACK_URL = "https://red-night-scp-rp.example.com/"

local cv = CreateConVar(
    "rednight_loadingurl",
    FALLBACK_URL,
    FCVAR_ARCHIVE,
    "Адрес экрана загрузки Red Night | SCP RP (без параметров ?map= и ?steamid=)."
)

-- Меняется при каждом запуске сервера, поэтому игрок получит свежий HTML
-- после рестарта. CSS, JS, шрифты и фото версионируются при сборке сайта.
local CACHE_VERSION = tostring(os.time())

local function ApplyLoadingURL()
    local url = cv:GetString()
    if not url or url == "" then return end

    -- Убираем свой прошлый ?v=, чтобы не копить параметры при смене карты.
    url = string.gsub(url, "[&?]v=%d+", "")

    -- Гаррис Мод сам подставит карту и SteamID вместо %m и %s.
    local sep = string.find(url, "?", 1, true) and "&" or "?"
    RunConsoleCommand("sv_loadingurl", url .. sep .. "map=%m&steamid=%s&v=" .. CACHE_VERSION)
end

hook.Add("InitPostEntity", "RedNight.LoadingURL", ApplyLoadingURL)
hook.Add("PostCleanupMap", "RedNight.LoadingURL", ApplyLoadingURL)

-- Полезно видеть в консоли сервера, что экран действительно применён.
cvars.AddChangeCallback("rednight_loadingurl", function(_, _, new)
    if new and new ~= "" then ApplyLoadingURL() end
end, "RedNight.LoadingURL")
