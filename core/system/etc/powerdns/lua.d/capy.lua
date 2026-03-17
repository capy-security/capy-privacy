driver = require "luasql.sqlite3"
env = assert (driver.sqlite3())
local db_path = "/var/capy/database/database.db"

-- ---------------------------------------------------------------------------
-- IPv4 CIDR helpers
-- ---------------------------------------------------------------------------

local function ip_to_int(ip_str)
    local o1, o2, o3, o4 = ip_str:match("^(%d+)%.(%d+)%.(%d+)%.(%d+)")
    if not o1 then return nil end
    return tonumber(o1) * 16777216 + tonumber(o2) * 65536
         + tonumber(o3) * 256     + tonumber(o4)
end

local function parse_cidr(cidr_str)
    local ip_part, prefix = cidr_str:match("^(.+)/(%d+)$")
    if not ip_part then
        ip_part = cidr_str
        prefix  = 32
    else
        prefix = tonumber(prefix)
    end
    local ip_int = ip_to_int(ip_part)
    if not ip_int or prefix < 0 or prefix > 32 then return nil end
    -- mask: e.g. prefix=24 → 0xFFFFFF00
    local mask = prefix == 0 and 0 or (2^32 - 2^(32 - prefix))
    local network = ip_int - (ip_int % (2^(32 - prefix)))
    return { network = network, prefix = prefix, mask = mask }
end

local function ip_matches_cidr(ip_int, cidr)
    local masked = ip_int - (ip_int % (2^(32 - cidr.prefix)))
    return masked == cidr.network
end

-- ---------------------------------------------------------------------------
-- Client cache (reloaded every CACHE_TTL seconds)
-- ---------------------------------------------------------------------------

local CACHE_TTL = 60
local client_cache = {}       -- array of {id, ip_raw, cidr}
local cache_timestamp = 0

local function reload_client_cache()
    if not con then return end
    local now = os.time()
    if now - cache_timestamp < CACHE_TTL then return end

    local rows, err = exec_sql("SELECT id, ip FROM client")
    if type(rows) ~= "table" then return end

    local new_cache = {}
    for _, row in ipairs(rows) do
        local cidr = parse_cidr(row.ip)
        if cidr then
            new_cache[#new_cache + 1] = {
                id     = tonumber(row.id),
                ip_raw = row.ip,
                cidr   = cidr,
            }
        end
    end
    client_cache = new_cache
    cache_timestamp = now
    pdnslog(string.format("Client cache reloaded: %d entries", #client_cache), pdns.loglevels.Info)
end

local function find_best_client(client_ip_str)
    local ip_int = ip_to_int(client_ip_str)
    if not ip_int then return nil end

    local best = nil
    for _, entry in ipairs(client_cache) do
        if ip_matches_cidr(ip_int, entry.cidr) then
            if not best or entry.cidr.prefix > best.cidr.prefix then
                best = entry
            end
        end
    end
    return best
end

-- ---------------------------------------------------------------------------
-- Database connection
-- ---------------------------------------------------------------------------

local function connect_database()
    local con_result, con_error = env:connect(db_path)
    if not con_result then
        local error_msg = con_error or "Unknown error"
        pdnslog(string.format("DB connection failed: %s. Error: %s", db_path, error_msg), pdns.loglevels.Error)
        return nil
    end
    return con_result
end

con = connect_database()

-- ---------------------------------------------------------------------------
-- SQL executor
-- ---------------------------------------------------------------------------

function exec_sql(request)
    local sql_result = {}
    local sql_error = ""

    local result1, result2 = con:execute(request)

    if result1 == nil then
        sql_error = result2 or "Unknown database error"
        pdnslog(string.format("SQL execution error: %s", sql_error), pdns.loglevels.Error)
        return sql_result, sql_error
    end

    if type(result1) == "number" then
        return result1, sql_error
    else
        local row = {}
        while result1:fetch(row, "a") do
            local new_row = {}
            for k, v in pairs(row) do
                new_row[k] = v
            end
            sql_result[#sql_result + 1] = new_row
        end
        result1:close()
        return sql_result, sql_error
    end
end

-- ---------------------------------------------------------------------------
-- preresolve hook
-- ---------------------------------------------------------------------------

function preresolve(dq)
    if not con then
        con = connect_database()
        if not con then
            pdnslog("Database connection not available, skipping lookup", pdns.loglevels.Warning)
            return false
        end
    end

    -- Refresh client cache if stale
    reload_client_cache()

    local domain_with_dot = dq.qname:toString()
    local client_ip = dq.remoteaddr:toString()
    local domain = domain_with_dot:match("^(.*)%.$") or domain_with_dot

    pdnslog(string.format("DOMAIN:%s / IP:%s", domain, client_ip), pdns.loglevels.Debug)

    -- Find the most-specific client entry matching this IP (longest prefix wins)
    local matched = find_best_client(client_ip)
    if not matched then
        pdnslog(string.format("No client match for %s", client_ip), pdns.loglevels.Debug)
        return false
    end
    pdnslog(string.format("Client %s matched entry %s (id=%d)", client_ip, matched.ip_raw, matched.id), pdns.loglevels.Debug)

    local escaped_domain = con:escape(domain)
    local request = string.format(
        [[SELECT domain.name, domain.id, isactive, domain.ip AS domain_ip
          FROM association_clients
          JOIN association_categories ON association_clients.group_id = association_categories.group_id
          JOIN domain ON association_categories.category_id = domain.category_id
          WHERE association_clients.client_id = %d AND domain.name = '%s';]],
        matched.id, escaped_domain)
    pdnslog(request, pdns.loglevels.Debug)

    local result, error = exec_sql(request)
    local next = next
    if next(result) then
        local domain_ip = result[1].domain_ip
        local domain_name = result[1].name
        pdnslog(string.format("domain: %s, redirect ip: %s, client: %s (id=%d)", domain_name, domain_ip, client_ip, matched.id), pdns.loglevels.Debug)
        dq.rcode = 0
        dq:addAnswer(pdns.A, domain_ip)
        return true
    else
        return false
    end
end
