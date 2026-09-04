-- https://gist.github.com/henriquegogo/fa22ffec3eb345540ef2
driver = require "luasql.sqlite3"
env = assert (driver.sqlite3())
local db_path = "/var/capy/database/database.db"
local decision_cache = {}
local decision_cache_ttl_seconds = 60

local function cache_key(client_ip, domain)
    return client_ip .. "|" .. domain
end

local function cache_get(key)
    local entry = decision_cache[key]
    if not entry then
        return nil
    end

    if entry.expires_at <= os.time() then
        decision_cache[key] = nil
        return nil
    end

    return entry
end

local function cache_set(key, blocked, domain_ip)
    decision_cache[key] = {
        blocked = blocked,
        domain_ip = domain_ip,
        expires_at = os.time() + decision_cache_ttl_seconds
    }
end


-- Function to attempt database connection
local function connect_database()
    -- Attempt to connect to the database
    local con_result, con_error = env:connect(db_path)

    if not con_result then
        -- Log the error with more details
        local error_msg = con_error or "Unknown error"
        pdnslog(string.format("DB connection failed: %s. Error: %s", db_path, error_msg), pdns.loglevels.Error)
        return nil
    end

    return con_result
end

-- Initial connection attempt
con = connect_database()


function preresolve(dq)
    -- For now only enforce sinkhole policy on IPv4 A queries.
    -- All other qtypes are forwarded to normal recursion.
    if dq.qtype ~= pdns.A then
        return false
    end

    -- Get the queried domain and client IP
    local domain_with_dot = (dq.qname:toString())
    local client_ip = dq.remoteaddr:toString()
    
    -- Remove trailing dot from domain for database comparison
    -- PowerDNS always returns domains with trailing dot (e.g., "example.com.")
    -- Database stores domains without trailing dot (e.g., "example.com")
    local domain = domain_with_dot:match("^(.*)%.$") or domain_with_dot
    
    pdnslog(string.format("DOMAIN:%s / IP:%s", domain, client_ip), pdns.loglevels.Debug)

    local key = cache_key(client_ip, domain)
    local cached = cache_get(key)
    if cached then
        if cached.blocked and cached.domain_ip then
            pdnslog(string.format("CACHE BLOCKED: %s -> %s (client: %s)", domain, cached.domain_ip, client_ip), pdns.loglevels.Debug)
            dq.rcode=0 -- make it a normal answer
            dq:addAnswer( pdns.A, cached.domain_ip )
            return true
        end

        pdnslog(string.format("CACHE ALLOWED: %s (client: %s)", domain, client_ip), pdns.loglevels.Debug)
        return false
    end

    -- Check if database connection is available, try to reconnect if needed
    if not con then
        -- Attempt to reconnect (in case database was created after script load)
        con = connect_database()
        if not con then
            pdnslog("Database connection not available, skipping lookup", pdns.loglevels.Warning)
            return false
        end
    end

    -- Escape values once for reuse
    local escaped_client_ip = con:escape( client_ip )
    local escaped_domain = con:escape( domain )
    -- Block if the client is explicitly linked to the domain's category via a group,
    -- OR if the client IP doesn't exist in the client table at all (default: block all).
    local request = string.format(
        [[SELECT domain.name, domain.id, domain.isactive, domain.ip AS domain_ip
          FROM domain
          WHERE domain.name = '%s'
            AND domain.isactive = 1
            AND (
              EXISTS (
                SELECT 1 FROM association_categories ac
                JOIN association_clients acl ON ac.group_id = acl.group_id
                JOIN client c ON acl.client_id = c.id
                WHERE ac.category_id = domain.category_id AND c.ip = '%s'
              )
              OR NOT EXISTS (SELECT 1 FROM client WHERE ip = '%s')
            );]]
        , escaped_domain, escaped_client_ip, escaped_client_ip)
    pdnslog(request, pdns.loglevels.Debug)

    -- execute the sql query
    local result, error = exec_sql(request)
    if error ~= "" then
        pdnslog(string.format("SQL lookup failed for domain=%s client=%s: %s", domain, client_ip, error), pdns.loglevels.Error)
        return false
    end
    -- if result is a non empty array of objets
    local next = next
    if next(result) then
        local domain_ip = result[1].domain_ip
        local domain_name = result[1].name
        pdnslog(string.format("BLOCKED: %s -> %s (client: %s)", domain_name, domain_ip, client_ip), pdns.loglevels.Debug)
        cache_set(key, true, domain_ip)
        dq.rcode=0 -- make it a normal answer
        dq:addAnswer( pdns.A, domain_ip )
        -- con:close()
        return true
    else
        cache_set(key, false, nil)
        -- pdnslog("domain not found in blacklist", pdns.loglevels.Info)
        -- con:close()
        return false
    end
end


function exec_sql(request)
    local sql_result = {}
    local sql_error = ""
    
    -- LuaSQL execute() returns: cursor/number, error_message
    -- It doesn't throw exceptions, so we check the return values directly
    local result1, result2 = con:execute(request)
    
    if result1 == nil then
        -- Error case: result1 is nil, result2 is the error message
        sql_error = result2 or "Unknown database error"
        pdnslog(string.format("SQL execution error: %s", sql_error), pdns.loglevels.Error)
        return sql_result, sql_error
    end
    
    -- Success case: result1 is either a cursor (table) or number (rows affected)
    if type(result1) == "number" then
        -- For INSERT/UPDATE/DELETE, returns number of affected rows
        return result1, sql_error
    else
        -- For SELECT, result1 is a cursor object
        local row = {}
        while result1:fetch(row, "a") do
            -- Create a new table for each row to avoid all entries pointing to the same table
            local new_row = {}
            for k, v in pairs(row) do
                new_row[k] = v
            end
            sql_result[#sql_result+1] = new_row
        end
        result1:close()
        return sql_result, sql_error
    end

end
