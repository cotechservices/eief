--
-- PostgreSQL database dump
--

\restrict wRmLr9R6GSaHcZhTkVB7M5ELLh6IRneTtDvpKDFdAGErOzKOSsqbIwXZxhoXDf0

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: auth; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA auth;


--
-- Name: extensions; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA extensions;


--
-- Name: graphql; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql;


--
-- Name: graphql_public; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA graphql_public;


--
-- Name: pgbouncer; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA pgbouncer;


--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: realtime; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA realtime;


--
-- Name: storage; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA storage;


--
-- Name: vault; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA vault;


--
-- Name: pg_stat_statements; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pg_stat_statements WITH SCHEMA extensions;


--
-- Name: EXTENSION pg_stat_statements; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pg_stat_statements IS 'track planning and execution statistics of all SQL statements executed';


--
-- Name: pgcrypto; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;


--
-- Name: EXTENSION pgcrypto; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';


--
-- Name: supabase_vault; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS supabase_vault WITH SCHEMA vault;


--
-- Name: EXTENSION supabase_vault; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION supabase_vault IS 'Supabase Vault Extension';


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: aal_level; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.aal_level AS ENUM (
    'aal1',
    'aal2',
    'aal3'
);


--
-- Name: code_challenge_method; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.code_challenge_method AS ENUM (
    's256',
    'plain'
);


--
-- Name: factor_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_status AS ENUM (
    'unverified',
    'verified'
);


--
-- Name: factor_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.factor_type AS ENUM (
    'totp',
    'webauthn',
    'phone',
    'recovery_code'
);


--
-- Name: oauth_authorization_status; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_authorization_status AS ENUM (
    'pending',
    'approved',
    'denied',
    'expired'
);


--
-- Name: oauth_client_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_client_type AS ENUM (
    'public',
    'confidential'
);


--
-- Name: oauth_registration_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_registration_type AS ENUM (
    'dynamic',
    'manual'
);


--
-- Name: oauth_response_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.oauth_response_type AS ENUM (
    'code'
);


--
-- Name: one_time_token_type; Type: TYPE; Schema: auth; Owner: -
--

CREATE TYPE auth.one_time_token_type AS ENUM (
    'confirmation_token',
    'reauthentication_token',
    'recovery_token',
    'email_change_token_new',
    'email_change_token_current',
    'phone_change_token'
);


--
-- Name: Role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Role" AS ENUM (
    'SUPER_ADMIN',
    'DIRECTEUR_GENERAL',
    'DIRECTEUR_ETUDES',
    'COMPTABLE',
    'SECRETARIAT',
    'SURVEILLANT',
    'ENSEIGNANT',
    'PARENT',
    'ELEVE',
    'CHAUFFEUR',
    'CANTINE'
);


--
-- Name: action; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.action AS ENUM (
    'INSERT',
    'UPDATE',
    'DELETE',
    'TRUNCATE',
    'ERROR'
);


--
-- Name: equality_op; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.equality_op AS ENUM (
    'eq',
    'neq',
    'lt',
    'lte',
    'gt',
    'gte',
    'in',
    'like',
    'ilike',
    'is',
    'match',
    'imatch',
    'isdistinct'
);


--
-- Name: user_defined_filter; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.user_defined_filter AS (
	column_name text,
	op realtime.equality_op,
	value text,
	negate boolean
);


--
-- Name: wal_column; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_column AS (
	name text,
	type_name text,
	type_oid oid,
	value jsonb,
	is_pkey boolean,
	is_selectable boolean
);


--
-- Name: wal_rls; Type: TYPE; Schema: realtime; Owner: -
--

CREATE TYPE realtime.wal_rls AS (
	wal jsonb,
	is_rls_enabled boolean,
	subscription_ids uuid[],
	errors text[]
);


--
-- Name: buckettype; Type: TYPE; Schema: storage; Owner: -
--

CREATE TYPE storage.buckettype AS ENUM (
    'STANDARD',
    'ANALYTICS',
    'VECTOR'
);


--
-- Name: email(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.email() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;


--
-- Name: FUNCTION email(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.email() IS 'Deprecated. Use auth.jwt() -> ''email'' instead.';


--
-- Name: jwt(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.jwt() RETURNS jsonb
    LANGUAGE sql STABLE
    AS $$
  select 
    coalesce(
        nullif(current_setting('request.jwt.claim', true), ''),
        nullif(current_setting('request.jwt.claims', true), '')
    )::jsonb
$$;


--
-- Name: role(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.role() RETURNS text
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;


--
-- Name: FUNCTION role(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.role() IS 'Deprecated. Use auth.jwt() -> ''role'' instead.';


--
-- Name: uid(); Type: FUNCTION; Schema: auth; Owner: -
--

CREATE FUNCTION auth.uid() RETURNS uuid
    LANGUAGE sql STABLE
    AS $$
  select 
  coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;


--
-- Name: FUNCTION uid(); Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON FUNCTION auth.uid() IS 'Deprecated. Use auth.jwt() -> ''sub'' instead.';


--
-- Name: grant_pg_cron_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_cron_access() RETURNS event_trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
BEGIN
  IF EXISTS (
    SELECT
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_cron'
  )
  THEN
    grant usage on schema cron to postgres with grant option;

    alter default privileges in schema cron grant all on tables to postgres with grant option;
    alter default privileges in schema cron grant all on functions to postgres with grant option;
    alter default privileges in schema cron grant all on sequences to postgres with grant option;

    alter default privileges for user supabase_admin in schema cron grant all
        on sequences to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on tables to postgres with grant option;
    alter default privileges for user supabase_admin in schema cron grant all
        on functions to postgres with grant option;

    grant all privileges on all tables in schema cron to postgres with grant option;
    revoke all on table cron.job from postgres;
    grant select on table cron.job to postgres with grant option;
    revoke trigger on cron.job_run_details from postgres;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_cron_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_cron_access() IS 'Grants access to pg_cron';


--
-- Name: grant_pg_graphql_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_graphql_access() RETURNS event_trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $_$
begin
    if not exists (
        select 1
        from pg_catalog.pg_event_trigger_ddl_commands() ev
        join pg_catalog.pg_extension e on ev.objid = e.oid
        where e.extname = 'pg_graphql'
    ) then
        return;
    end if;

    drop function if exists graphql_public.graphql;
    create or replace function graphql_public.graphql(
        "operationName" text default null,
        query text default null,
        variables jsonb default null,
        extensions jsonb default null
    )
        returns jsonb
        language sql
    as $$
        select graphql.resolve(
            query := query,
            variables := coalesce(variables, '{}'),
            "operationName" := "operationName",
            extensions := extensions
        );
    $$;

    -- Attach the wrapper to the extension so DROP EXTENSION cascades to it,
    -- which in turn triggers set_graphql_placeholder to reinstall the "not enabled" stub.
    alter extension pg_graphql add function graphql_public.graphql(text, text, jsonb, jsonb);

    grant usage on schema graphql to postgres, anon, authenticated, service_role;
    grant execute on function graphql.resolve to postgres, anon, authenticated, service_role;
    grant usage on schema graphql to postgres with grant option;
    grant usage on schema graphql_public to postgres with grant option;
end;
$_$;


--
-- Name: FUNCTION grant_pg_graphql_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_graphql_access() IS 'Grants access to pg_graphql';


--
-- Name: grant_pg_net_access(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.grant_pg_net_access() RETURNS event_trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_event_trigger_ddl_commands() AS ev
    JOIN pg_extension AS ext
    ON ev.objid = ext.oid
    WHERE ext.extname = 'pg_net'
  )
  THEN
    IF NOT EXISTS (
      SELECT 1
      FROM pg_roles
      WHERE rolname = 'supabase_functions_admin'
    )
    THEN
      CREATE USER supabase_functions_admin NOINHERIT CREATEROLE LOGIN NOREPLICATION;
    END IF;

    GRANT USAGE ON SCHEMA net TO supabase_functions_admin, postgres, anon, authenticated, service_role;

    IF EXISTS (
      SELECT FROM pg_extension
      WHERE extname = 'pg_net'
      -- all versions in use on existing projects as of 2025-02-20
      -- version 0.12.0 onwards don't need these applied
      AND extversion IN ('0.2', '0.6', '0.7', '0.7.1', '0.8.0', '0.10.0', '0.11.0')
    ) THEN
      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SECURITY DEFINER;

      ALTER function net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;
      ALTER function net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) SET search_path = net;

      REVOKE ALL ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;
      REVOKE ALL ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) FROM PUBLIC;

      GRANT EXECUTE ON FUNCTION net.http_get(url text, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
      GRANT EXECUTE ON FUNCTION net.http_post(url text, body jsonb, params jsonb, headers jsonb, timeout_milliseconds integer) TO supabase_functions_admin, postgres, anon, authenticated, service_role;
    END IF;
  END IF;
END;
$$;


--
-- Name: FUNCTION grant_pg_net_access(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.grant_pg_net_access() IS 'Grants access to pg_net';


--
-- Name: pgrst_ddl_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_ddl_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN SELECT * FROM pg_event_trigger_ddl_commands()
  LOOP
    IF cmd.command_tag IN (
      'CREATE SCHEMA', 'ALTER SCHEMA'
    , 'CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO', 'ALTER TABLE'
    , 'CREATE FOREIGN TABLE', 'ALTER FOREIGN TABLE'
    , 'CREATE VIEW', 'ALTER VIEW'
    , 'CREATE MATERIALIZED VIEW', 'ALTER MATERIALIZED VIEW'
    , 'CREATE FUNCTION', 'ALTER FUNCTION'
    , 'CREATE TRIGGER'
    , 'CREATE TYPE', 'ALTER TYPE'
    , 'CREATE RULE'
    , 'COMMENT'
    )
    -- don't notify in case of CREATE TEMP table or other objects created on pg_temp
    AND cmd.schema_name is distinct from 'pg_temp'
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: pgrst_drop_watch(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.pgrst_drop_watch() RETURNS event_trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $$
DECLARE
  obj record;
BEGIN
  FOR obj IN SELECT * FROM pg_event_trigger_dropped_objects()
  LOOP
    IF obj.object_type IN (
      'schema'
    , 'table'
    , 'foreign table'
    , 'view'
    , 'materialized view'
    , 'function'
    , 'trigger'
    , 'type'
    , 'rule'
    )
    AND obj.is_temporary IS false -- no pg_temp objects
    THEN
      NOTIFY pgrst, 'reload schema';
    END IF;
  END LOOP;
END; $$;


--
-- Name: set_graphql_placeholder(); Type: FUNCTION; Schema: extensions; Owner: -
--

CREATE FUNCTION extensions.set_graphql_placeholder() RETURNS event_trigger
    LANGUAGE plpgsql
    SET search_path TO ''
    AS $_$
    DECLARE
    graphql_is_dropped bool;
    BEGIN
    graphql_is_dropped = (
        SELECT ev.schema_name = 'graphql_public'
        FROM pg_event_trigger_dropped_objects() AS ev
        WHERE ev.schema_name = 'graphql_public'
    );

    IF graphql_is_dropped
    THEN
        create or replace function graphql_public.graphql(
            "operationName" text default null,
            query text default null,
            variables jsonb default null,
            extensions jsonb default null
        )
            returns jsonb
            language plpgsql
            set search_path to ''
        as $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;
    END IF;

    END;
$_$;


--
-- Name: FUNCTION set_graphql_placeholder(); Type: COMMENT; Schema: extensions; Owner: -
--

COMMENT ON FUNCTION extensions.set_graphql_placeholder() IS 'Reintroduces placeholder function for graphql_public.graphql';


--
-- Name: graphql(text, text, jsonb, jsonb); Type: FUNCTION; Schema: graphql_public; Owner: -
--

CREATE FUNCTION graphql_public.graphql("operationName" text DEFAULT NULL::text, query text DEFAULT NULL::text, variables jsonb DEFAULT NULL::jsonb, extensions jsonb DEFAULT NULL::jsonb) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
            DECLARE
                server_version float;
            BEGIN
                server_version = (SELECT (SPLIT_PART((select version()), ' ', 2))::float);

                IF server_version >= 14 THEN
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql extension is not enabled.'
                            )
                        )
                    );
                ELSE
                    RETURN jsonb_build_object(
                        'errors', jsonb_build_array(
                            jsonb_build_object(
                                'message', 'pg_graphql is only available on projects running Postgres 14 onwards.'
                            )
                        )
                    );
                END IF;
            END;
        $$;


--
-- Name: get_auth(text); Type: FUNCTION; Schema: pgbouncer; Owner: -
--

CREATE FUNCTION pgbouncer.get_auth(p_usename text) RETURNS TABLE(username text, password text)
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO ''
    AS $_$
  BEGIN
      RAISE DEBUG 'PgBouncer auth request: %', p_usename;

      RETURN QUERY
      SELECT
          rolname::text,
          CASE WHEN rolvaliduntil < now()
              THEN null
              ELSE rolpassword::text
          END
      FROM pg_authid
      WHERE rolname=$1 and rolcanlogin;
  END;
  $_$;


--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
    -- Regclass of the table e.g. public.notes
    entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

    -- I, U, D, T: insert, update ...
    action realtime.action = (
        case wal ->> 'action'
            when 'I' then 'INSERT'
            when 'U' then 'UPDATE'
            when 'D' then 'DELETE'
            else 'ERROR'
        end
    );

    -- Is row level security enabled for the table
    is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

    subscriptions realtime.subscription[] = array_agg(subs)
        from
            realtime.subscription subs
        where
            subs.entity = entity_
            -- Filter by action early - only get subscriptions interested in this action
            -- action_filter column can be: '*' (all), 'INSERT', 'UPDATE', or 'DELETE'
            and (subs.action_filter = '*' or subs.action_filter = action::text);

    -- Subscription vars
    working_role regrole;
    working_selected_columns text[];
    claimed_role regrole;
    claims jsonb;

    subscription_id uuid;
    subscription_has_access bool;
    visible_to_subscription_ids uuid[] = '{}';

    -- structured info for wal's columns
    columns realtime.wal_column[];
    -- previous identity values for update/delete
    old_columns realtime.wal_column[];

    -- the same values as wal2json sent them, which is what filters compare against
    raw_columns realtime.wal_column[] =
        array_agg((x->>'name', x->>'type', x->>'typeoid', x->'value', null, null)::realtime.wal_column)
        from jsonb_array_elements(wal -> 'columns') x;
    raw_old_columns realtime.wal_column[] =
        array_agg((x->>'name', x->>'type', x->>'typeoid', x->'value', null, null)::realtime.wal_column)
        from jsonb_array_elements(wal -> 'identity') x;

    error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

    -- Primary jsonb output for record
    output jsonb;

    -- Loop record for iterating unique roles (outer loop)
    role_record record;
    -- Loop record for iterating unique selected_columns within a role (inner loop)
    cols_record record;
    -- Subscription ids visible at the role level (before fanning out by selected_columns)
    visible_role_sub_ids uuid[] = '{}';

begin
    perform set_config('role', null, true);

    columns =
        array_agg(
            (
                x->>'name',
                x->>'type',
                x->>'typeoid',
                realtime.cast(
                    (x->'value') #>> '{}',
                    coalesce(
                        (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                        (x->>'type')::regtype
                    )
                ),
                (pks ->> 'name') is not null,
                true
            )::realtime.wal_column
        )
        from
            jsonb_array_elements(wal -> 'columns') x
            left join jsonb_array_elements(wal -> 'pk') pks
                on (x ->> 'name') = (pks ->> 'name');

    old_columns =
        array_agg(
            (
                x->>'name',
                x->>'type',
                x->>'typeoid',
                realtime.cast(
                    (x->'value') #>> '{}',
                    coalesce(
                        (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                        (x->>'type')::regtype
                    )
                ),
                (pks ->> 'name') is not null,
                true
            )::realtime.wal_column
        )
        from
            jsonb_array_elements(wal -> 'identity') x
            left join jsonb_array_elements(wal -> 'pk') pks
                on (x ->> 'name') = (pks ->> 'name');

    for role_record in
        select claims_role
        from (select distinct claims_role from unnest(subscriptions)) t
        order by claims_role::text
    loop
        working_role := role_record.claims_role;

        -- Update `is_selectable` for columns and old_columns (once per role)
        columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(columns) c;

        old_columns =
                array_agg(
                    (
                        c.name,
                        c.type_name,
                        c.type_oid,
                        c.value,
                        c.is_pkey,
                        pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                    )::realtime.wal_column
                )
                from
                    unnest(old_columns) c;

        if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
            -- Fan out 400 error per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;
                return next (
                    jsonb_build_object(
                        'schema', wal ->> 'schema',
                        'table', wal ->> 'table',
                        'type', action
                    ),
                    is_rls_enabled,
                    (select array_agg(s.subscription_id) from unnest(subscriptions) as s where s.claims_role = working_role and (s.selected_columns is not distinct from working_selected_columns)),
                    array['Error 400: Bad Request, no primary key']
                )::realtime.wal_rls;
            end loop;

        -- The claims role does not have SELECT permission to the primary key of entity
        elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
            -- Fan out 401 error per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;
                return next (
                    jsonb_build_object(
                        'schema', wal ->> 'schema',
                        'table', wal ->> 'table',
                        'type', action
                    ),
                    is_rls_enabled,
                    (select array_agg(s.subscription_id) from unnest(subscriptions) as s where s.claims_role = working_role and (s.selected_columns is not distinct from working_selected_columns)),
                    array['Error 401: Unauthorized']
                )::realtime.wal_rls;
            end loop;

        else
            -- Create the prepared statement (once per role)
            if is_rls_enabled and action <> 'DELETE' then
                if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                    deallocate walrus_rls_stmt;
                end if;
                execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
            end if;

            -- Collect all visible subscription IDs for this role (filter check + RLS check)
            visible_role_sub_ids = '{}';

            for subscription_id, claims in (
                    select
                        subs.subscription_id,
                        subs.claims
                    from
                        unnest(subscriptions) subs
                    where
                        subs.entity = entity_
                        and subs.claims_role = working_role
                        and (
                            realtime.is_visible_through_filters(raw_columns, subs.filters)
                            or (
                              action = 'DELETE'
                              and realtime.is_visible_through_filters(raw_old_columns, subs.filters)
                            )
                        )
            ) loop

                if not is_rls_enabled or action = 'DELETE' then
                    visible_role_sub_ids = visible_role_sub_ids || subscription_id;
                else
                    -- Check if RLS allows the role to see the record
                    perform
                        -- Trim leading and trailing quotes from working_role because set_config
                        -- doesn't recognize the role as valid if they are included
                        set_config('role', trim(both '"' from working_role::text), true),
                        set_config('request.jwt.claims', claims::text, true);

                    execute 'execute walrus_rls_stmt' into subscription_has_access;

                    -- Reset the role on every FOR..LOOP batch execution.
                    -- The first batch of 10 rows is pre-fetched using the current connection role (PG internal behaviour)
                    -- then we have to reset it again otherwise it would use the role defined in the `set_config` above
                    -- to fetch the remaining rows when rows>10, which could be a user-defined role that lacks execution grants.
                    -- The flow is:
                    --   1. run batch with conn role
                    --   2. set_config working_role
                    --   3. execute walrus
                    --   4. reset role (revert)
                    --   5. repeat
                    perform set_config('role', null, true);

                    if subscription_has_access then
                        visible_role_sub_ids = visible_role_sub_ids || subscription_id;
                    end if;
                end if;
            end loop;

            perform set_config('role', null, true);

            -- Inner loop: per distinct selected_columns for this role
            for cols_record in
                select selected_columns
                from (select distinct selected_columns from unnest(subscriptions) s where s.claims_role = working_role) t
                order by coalesce(array_to_string(selected_columns, ','), '')
            loop
                working_selected_columns := cols_record.selected_columns;

                output = jsonb_build_object(
                    'schema', wal ->> 'schema',
                    'table', wal ->> 'table',
                    'type', action,
                    'commit_timestamp', to_char(
                        ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                        'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
                    ),
                    'columns', (
                        select
                            jsonb_agg(
                                jsonb_build_object(
                                    'name', pa.attname,
                                    'type', pt.typname
                                )
                                order by pa.attnum asc
                            )
                        from
                            pg_attribute pa
                            join pg_type pt
                                on pa.atttypid = pt.oid
                            left join (
                                select unnest(conkey) as pkey_attnum
                                from pg_constraint
                                where conrelid = entity_ and contype = 'p'
                            ) pk on pk.pkey_attnum = pa.attnum
                        where
                            attrelid = entity_
                            and attnum > 0
                            and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
                            and (working_selected_columns is null or pa.attname = any(working_selected_columns) or pk.pkey_attnum is not null)
                    )
                )
                -- Add "record" key for insert and update
                || case
                    when action in ('INSERT', 'UPDATE') then
                        jsonb_build_object(
                            'record',
                            (
                                select
                                    jsonb_object_agg(
                                        -- if unchanged toast, get column name and value from old record
                                        coalesce((c).name, (oc).name),
                                        case
                                            when (c).name is null then (oc).value
                                            else (c).value
                                        end
                                    )
                                from
                                    unnest(columns) c
                                    full outer join unnest(old_columns) oc
                                        on (c).name = (oc).name
                                where
                                    coalesce((c).is_selectable, (oc).is_selectable)
                                    and (working_selected_columns is null or coalesce((c).name, (oc).name) = any(working_selected_columns) or coalesce((c).is_pkey, (oc).is_pkey))
                                    and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            )
                        )
                    else '{}'::jsonb
                end
                -- Add "old_record" key for update and delete
                || case
                    when action = 'UPDATE' then
                        jsonb_build_object(
                                'old_record',
                                (
                                    select jsonb_object_agg((c).name, (c).value)
                                    from unnest(old_columns) c
                                    where
                                        (c).is_selectable
                                        and (working_selected_columns is null or (c).name = any(working_selected_columns) or (c).is_pkey)
                                        and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                                )
                            )
                    when action = 'DELETE' then
                        jsonb_build_object(
                            'old_record',
                            (
                                select jsonb_object_agg((c).name, (c).value)
                                from unnest(old_columns) c
                                where
                                    (c).is_selectable
                                    and (working_selected_columns is null or (c).name = any(working_selected_columns) or (c).is_pkey)
                                    and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                                    and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                            )
                        )
                    else '{}'::jsonb
                end;

                -- Filter visible_role_sub_ids to those matching the current selected_columns group
                visible_to_subscription_ids = coalesce(
                    (
                        select array_agg(s.subscription_id)
                        from unnest(subscriptions) s
                        where s.claims_role = working_role
                          and (s.selected_columns is not distinct from working_selected_columns)
                          and s.subscription_id = any(visible_role_sub_ids)
                    ),
                    '{}'::uuid[]
                );

                return next (
                    output,
                    is_rls_enabled,
                    visible_to_subscription_ids,
                    case
                        when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                        else '{}'
                    end
                )::realtime.wal_rls;
            end loop;

        end if;
    end loop;

    perform set_config('role', null, true);
end;
$$;


--
-- Name: authorize(text, text, text, text, text, text[], text[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.authorize(role_name text, topic_name text, claims text, sub text, headers text, read_extensions text[], write_extensions text[], OUT read_allowed boolean[], OUT write_allowed boolean[]) RETURNS record
    LANGUAGE plpgsql
    AS $$
declare
  probe_ids uuid[];
  probe_inserted_at timestamp := now() at time zone 'utc';
  visible_ids uuid[];
  ext text;
  allowed boolean;
begin
  -- The probe inserts are rolled back, but they still give the transaction an xid, so it ends
  -- in a commit. Nothing durable was written, so skip waiting on the WAL flush and sync standbys.
  -- Set outside the block below, whose rollback would undo it.
  perform set_config('synchronous_commit', 'off', true);

  -- The RAISE at the end of this block rolls back everything in it.
  begin
    probe_ids := array(select gen_random_uuid() from unnest(read_extensions));

    insert into realtime.messages (id, topic, extension, inserted_at, updated_at)
    select p.id, topic_name, p.extension, probe_inserted_at, probe_inserted_at
    from unnest(probe_ids, read_extensions) as p(id, extension);

    perform set_config('role', role_name, true),
            set_config('realtime.topic', topic_name, true),
            set_config('request.jwt.claims', claims, true),
            set_config('request.jwt.claim.sub', sub, true),
            set_config('request.jwt.claim.role', role_name, true),
            set_config('request.headers', headers, true);

    -- One lookup for every probe, by the full primary key.
    visible_ids := array(
      select m.id
      from realtime.messages m
      where m.inserted_at = probe_inserted_at
        and m.id = any(probe_ids));

    read_allowed := array(
      select p.id = any(visible_ids)
      from unnest(probe_ids) with ordinality as p(id, n)
      order by p.n);

    write_allowed := '{}';

    foreach ext in array write_extensions loop
      begin
        insert into realtime.messages (topic, extension, inserted_at, updated_at)
        values (topic_name, ext, now() at time zone 'utc', now() at time zone 'utc');

        allowed := true;
      exception when insufficient_privilege then
        allowed := false;
      end;

      write_allowed := write_allowed || allowed;
    end loop;

    raise sqlstate 'RTA01';
  exception when sqlstate 'RTA01' then
    null;
  end;
end;
$$;


--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
declare
  res jsonb;
begin
  if type_::text = 'bytea' then
    return to_jsonb(val);
  end if;
  execute format('select to_jsonb(%L::'|| type_::text || ')', val) into res;
  return res;
end
$$;


--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
/*
Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
*/
declare
    op_symbol text = (
        case
            when op = 'eq' then '='
            when op = 'neq' then '!='
            when op = 'lt' then '<'
            when op = 'lte' then '<='
            when op = 'gt' then '>'
            when op = 'gte' then '>='
            when op = 'in' then '= any'
            else 'UNKNOWN OP'
        end
    );
    res boolean;
begin
    execute format(
        'select %L::'|| type_::text || ' ' || op_symbol
        || ' ( %L::'
        || (
            case
                when op = 'in' then type_::text || '[]'
                else type_::text end
        )
        || ')', val_1, val_2) into res;
    return res;
end;
$$;


--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text, negate boolean) RETURNS boolean
    LANGUAGE plpgsql STABLE
    AS $$
declare
    op_symbol text;
    res boolean;
begin
    -- IS DISTINCT FROM / IS NOT DISTINCT FROM: infix, both sides typed literals
    if op = 'isdistinct' then
        execute format(
            'select %L::%s %s %L::%s',
            val_1,
            type_::text,
            case when negate then 'IS NOT DISTINCT FROM' else 'IS DISTINCT FROM' end,
            val_2,
            type_::text
        ) into res;
        return res;
    end if;

    -- IS requires a keyword RHS (NULL, TRUE, FALSE, UNKNOWN), not a typed literal
    if op = 'is' then
        if val_2 not in ('null', 'true', 'false', 'unknown') then
            raise exception 'invalid value for is filter: must be null, true, false, or unknown';
        end if;
        execute format(
            'select %L::%s %s %s',
            val_1,
            type_::text,
            case when negate then 'IS NOT' else 'IS' end,
            upper(val_2)
        ) into res;
        return res;
    end if;

    op_symbol = case
        when op = 'eq'    then '='
        when op = 'neq'   then '!='
        when op = 'lt'    then '<'
        when op = 'lte'   then '<='
        when op = 'gt'    then '>'
        when op = 'gte'   then '>='
        when op = 'in'    then '= any'
        when op = 'like'   then 'LIKE'
        when op = 'ilike'  then 'ILIKE'
        when op = 'match'  then '~'
        when op = 'imatch' then '~*'
        else null
    end;

    if op_symbol is null then
        raise exception 'unsupported equality operator: %', op::text;
    end if;

    execute format(
        'select %L::%s %s (%L::%s)',
        val_1,
        type_::text,
        op_symbol,
        val_2,
        case when op = 'in' then type_::text || '[]' else type_::text end
    ) into res;

    return case when negate then not res else res end;
end;
$$;


--
-- Name: filters_hash(realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.filters_hash(filters realtime.user_defined_filter[]) RETURNS bytea
    LANGUAGE sql IMMUTABLE STRICT PARALLEL SAFE
    AS $$
  select pg_catalog.int8send(pg_catalog.hash_array_extended(filters, 0))
      || pg_catalog.int8send(pg_catalog.hash_array_extended(filters, 1))
$$;


--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
    select
        filters is null
        or array_length(filters, 1) is null
        or coalesce(
            count(col.name) = count(1)
            and sum(
                realtime.check_equality_op(
                    op:=f.op,
                    type_:=coalesce(col.type_oid::regtype, col.type_name::regtype),
                    val_1:=col.value #>> '{}',
                    val_2:=f.value,
                    negate:=coalesce(f.negate, false)
                )::int
            ) filter (where col.name is not null) = count(col.name),
            false
        )
    from
        unnest(filters) f
        left join unnest(columns) col
            on f.column_name = col.name;
$$;


--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS TABLE(wal jsonb, is_rls_enabled boolean, subscription_ids uuid[], errors text[], slot_changes_count bigint)
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
  WITH pub AS (
    SELECT
      concat_ws(
        ',',
        CASE WHEN bool_or(pubinsert) THEN 'insert' ELSE NULL END,
        CASE WHEN bool_or(pubupdate) THEN 'update' ELSE NULL END,
        CASE WHEN bool_or(pubdelete) THEN 'delete' ELSE NULL END
      ) AS w2j_actions,
      coalesce(
        string_agg(
          realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
          ','
        ) filter (WHERE ppt.tablename IS NOT NULL),
        ''
      ) AS w2j_add_tables
    FROM pg_publication pp
    LEFT JOIN pg_publication_tables ppt ON pp.pubname = ppt.pubname
    WHERE pp.pubname = publication
    GROUP BY pp.pubname
    LIMIT 1
  ),
  -- MATERIALIZED ensures pg_logical_slot_get_changes is called exactly once
  w2j AS MATERIALIZED (
    SELECT x.*, pub.w2j_add_tables
    FROM pub,
         pg_logical_slot_get_changes(
           slot_name, null, max_changes,
           'include-pk', 'true',
           'include-transaction', 'false',
           'include-timestamp', 'true',
           'include-type-oids', 'true',
           'format-version', '2',
           'actions', pub.w2j_actions,
           'add-tables', pub.w2j_add_tables
         ) x
  ),
  slot_count AS (
    SELECT count(*)::bigint AS cnt
    FROM w2j
    WHERE w2j.w2j_add_tables <> ''
  ),
  rls_filtered AS (
    SELECT xyz.wal, xyz.is_rls_enabled, xyz.subscription_ids, xyz.errors
    FROM w2j,
         realtime.apply_rls(
           wal := w2j.data::jsonb,
           max_record_bytes := max_record_bytes
         ) xyz(wal, is_rls_enabled, subscription_ids, errors)
    WHERE w2j.w2j_add_tables <> ''
      AND xyz.subscription_ids[1] IS NOT NULL
  )
  SELECT rf.wal, rf.is_rls_enabled, rf.subscription_ids, rf.errors, sc.cnt
  FROM rls_filtered rf, slot_count sc

  UNION ALL

  SELECT null, null, null, null, sc.cnt
  FROM slot_count sc
  WHERE NOT EXISTS (SELECT 1 FROM rls_filtered)
$$;


--
-- Name: list_changes_sync(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.list_changes_sync(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS TABLE(wal jsonb, is_rls_enabled boolean, subscription_ids uuid[], errors text[], slot_changes_count bigint)
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
  WITH pub AS (
    SELECT
      concat_ws(
        ',',
        CASE WHEN bool_or(pubinsert) THEN 'insert' ELSE NULL END,
        CASE WHEN bool_or(pubupdate) THEN 'update' ELSE NULL END,
        CASE WHEN bool_or(pubdelete) THEN 'delete' ELSE NULL END
      ) AS w2j_actions,
      coalesce(
        string_agg(
          realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
          ','
        ) filter (WHERE ppt.tablename IS NOT NULL),
        ''
      ) AS w2j_add_tables
    FROM pg_publication pp
    LEFT JOIN pg_publication_tables ppt ON pp.pubname = ppt.pubname
    WHERE pp.pubname = publication
    GROUP BY pp.pubname
    LIMIT 1
  ),
  -- MATERIALIZED ensures the slot is read exactly once.
  consumed AS MATERIALIZED (
    SELECT x.*, pub.w2j_add_tables
    FROM pub,
         realtime.settled_changes(
           slot_name, max_changes,
           'include-pk', 'true',
           'include-transaction', 'false',
           'include-timestamp', 'true',
           'include-type-oids', 'true',
           'format-version', '2',
           'actions', pub.w2j_actions,
           'add-tables', pub.w2j_add_tables
         ) x
  ),
  slot_count AS (
    SELECT count(*)::bigint AS cnt
    FROM consumed
    WHERE consumed.w2j_add_tables <> ''
  ),
  rls_filtered AS (
    SELECT xyz.wal, xyz.is_rls_enabled, xyz.subscription_ids, xyz.errors
    FROM consumed,
         realtime.apply_rls(
           wal := consumed.data::jsonb,
           max_record_bytes := max_record_bytes
         ) xyz(wal, is_rls_enabled, subscription_ids, errors)
    WHERE consumed.w2j_add_tables <> ''
      AND xyz.subscription_ids[1] IS NOT NULL
  )
  SELECT rf.wal, rf.is_rls_enabled, rf.subscription_ids, rf.errors, sc.cnt
  FROM rls_filtered rf, slot_count sc

  UNION ALL

  SELECT null, null, null, null, sc.cnt
  FROM slot_count sc
  WHERE NOT EXISTS (SELECT 1 FROM rls_filtered)
$$;


--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
  SELECT
    realtime.wal2json_escape_identifier(nsp.nspname::text)
    || '.'
    || realtime.wal2json_escape_identifier(pc.relname::text)
  FROM pg_class pc
  JOIN pg_namespace nsp ON pc.relnamespace = nsp.oid
  WHERE pc.oid = entity
$$;


--
-- Name: send(jsonb, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send(payload jsonb, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
  final_payload jsonb;
BEGIN
  BEGIN
    generated_id := gen_random_uuid();

    -- Check if payload has an 'id' key, if not, add the generated UUID
    IF payload ? 'id' THEN
      final_payload := payload;
    ELSE
      final_payload := jsonb_set(payload, '{id}', to_jsonb(generated_id));
    END IF;

    -- Set the topic configuration
    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    INSERT INTO realtime.messages (id, payload, event, topic, private, extension)
    VALUES (generated_id, final_payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'WarnSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


--
-- Name: send_binary(bytea, text, text, boolean); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.send_binary(payload bytea, event text, topic text, private boolean DEFAULT true) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
  generated_id uuid;
BEGIN
  BEGIN
    generated_id := gen_random_uuid();

    EXECUTE format('SET LOCAL realtime.topic TO %L', topic);

    INSERT INTO realtime.messages (id, binary_payload, event, topic, private, extension)
    VALUES (generated_id, payload, event, topic, private, 'broadcast');
  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'WarnSendingBroadcastMessage: %', SQLERRM;
  END;
END;
$$;


--
-- Name: settled_changes(name, integer, text[]); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.settled_changes(slot_name name, max_changes integer, VARIADIC opts text[]) RETURNS TABLE(lsn pg_lsn, xid xid, data text)
    LANGUAGE plpgsql
    AS $$
declare
  upto pg_lsn;
  total bigint;
  xids xid[];
  starts bigint[];
  snapshot pg_snapshot;
  running_xids xid[];
  xmax_age int;
  cut bigint;
begin
  -- Each statement in a volatile function takes its own snapshot, which is what lets the
  -- check below see a writer that was still in flight when the peek ran. Under REPEATABLE
  -- READ the snapshot never advances, so a deferred change would never be released.
  if current_setting('transaction_isolation') <> 'read committed' then
    raise exception 'realtime.settled_changes requires READ COMMITTED';
  end if;

  -- The peek and the read below cover the same WAL, so the read cannot reach a commit the
  -- check never saw.
  upto := pg_current_wal_flush_lsn();

  -- One entry per transaction, in commit order: its xid and the position of its first
  -- change. The peek uses the caller's own options, so max_changes counts exactly what the
  -- read counts. A non-transactional logical message is emitted as soon as it is decoded,
  -- tagged with the xid of whatever transaction wrote it, so it does not mark where that
  -- transaction starts.
  select coalesce(sum(g.n), 0),
         array_agg(g.x order by g.first) filter (where g.first is not null),
         array_agg(g.first order by g.first) filter (where g.first is not null)
    into total, xids, starts
    from (
      select p.xid as x, count(*) as n,
             min(p.ord) filter (where not case
               when starts_with(p.data, '{"action":"M"') then (p.data::jsonb->>'transactional')::boolean is false
               else false
             end) as first
      from pg_logical_slot_peek_changes(slot_name, upto, max_changes, variadic opts)
           with ordinality as p(lsn, xid, data, ord)
      group by p.xid
    ) g;

  -- Nothing for the caller, but the slot still has to move past what the peek covered.
  if total = 0 then
    perform pg_replication_slot_advance(slot_name, upto);
    return;
  end if;

  if xids is not null then
    -- Taken after the peek is materialized, so a writer that was still in flight during
    -- decoding is guaranteed to show up here.
    snapshot := pg_current_snapshot();

    -- A commit record reaches the WAL before the writer leaves the proc array, so a change
    -- can be decoded while its row is invisible. apply_rls would resolve a policy against a
    -- row it cannot see and authorize it for nobody, while the read consumed it regardless.
    --
    -- xip lists transactions running when the snapshot was taken. It does not cover a writer
    -- whose xid sits at or beyond xmax, which never appears there, so the horizon is checked
    -- too. age() counts backwards from the current xid and so compares correctly across
    -- wraparound.
    select coalesce(array_agg(running.x::xid), array[]::xid[])
      into running_xids
      from pg_snapshot_xip(snapshot) running(x);
    xmax_age := age(pg_snapshot_xmax(snapshot)::xid);

    select min(u.s) into cut
      from unnest(xids, starts) as u(x, s)
      where u.x = any(running_xids) or age(u.x) <= xmax_age;
  end if;

  -- The read stops right after the commit that brings its count to upto_nchanges, so the
  -- count of changes in front of the first unsettled transaction stops it just before that
  -- transaction.
  if cut is null then
    return query
      select p.* from pg_logical_slot_get_changes(slot_name, upto, max_changes, variadic opts) p;
  elsif cut > 1 then
    return query
      select p.* from pg_logical_slot_get_changes(slot_name, upto, (cut - 1)::int, variadic opts) p;
  end if;
end;
$$;


--
-- Name: subscription_check_filters(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.subscription_check_filters() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
declare
    col_names text[] = coalesce(
            array_agg(a.attname order by a.attnum),
            '{}'::text[]
        )
        from
            pg_catalog.pg_attribute a
        where
            a.attrelid = new.entity
            and a.attnum > 0
            and not a.attisdropped
            and pg_catalog.has_column_privilege(
                (new.claims ->> 'role'),
                a.attrelid,
                a.attnum,
                'SELECT'
            );
    filter realtime.user_defined_filter;
    col_type regtype;
    in_val jsonb;
    selected_col text;
begin
    for filter in select * from unnest(new.filters) loop
        if not filter.column_name = any(col_names) then
            raise exception 'invalid column for filter %', filter.column_name;
        end if;

        col_type = (
            select atttypid::regtype
            from pg_catalog.pg_attribute
            where attrelid = new.entity
                  and attname = filter.column_name
        );
        if col_type is null then
            raise exception 'failed to lookup type for column %', filter.column_name;
        end if;

        if filter.op = 'in'::realtime.equality_op then
            in_val = realtime.cast(filter.value, (col_type::text || '[]')::regtype);
            if coalesce(jsonb_array_length(in_val), 0) > 100 then
                raise exception 'too many values for `in` filter. Maximum 100';
            end if;
        elsif filter.op = 'is'::realtime.equality_op then
            -- `is` requires a keyword RHS rather than a typed literal
            if filter.value not in ('null', 'true', 'false', 'unknown') then
                raise exception 'invalid value for is filter: must be null, true, false, or unknown';
            end if;
            -- IS NULL works for any type, but IS TRUE/FALSE/UNKNOWN require a boolean
            -- operand. Reject the non-null keywords on non-boolean columns here so they
            -- don't abort apply_rls at WAL time.
            if filter.value <> 'null' and col_type <> 'boolean'::regtype then
                raise exception 'is % filter requires a boolean column, got %', filter.value, col_type::text;
            end if;
        elsif filter.op in ('like'::realtime.equality_op, 'ilike'::realtime.equality_op) then
            -- like/ilike apply the text pattern operator (~~); reject column types that
            -- have no such operator instead of failing at WAL time
            if not exists (
                select 1 from pg_catalog.pg_operator
                where oprname = '~~' and oprleft = col_type
            ) then
                raise exception 'operator % requires a text-compatible column type, got %', filter.op::text, col_type::text;
            end if;
        elsif filter.op in ('match'::realtime.equality_op, 'imatch'::realtime.equality_op) then
            -- match/imatch apply the regex operators ~ / ~*; reject column types that have
            -- no such operator (e.g. integer) instead of failing at WAL time, mirroring the
            -- like/ilike guard above.
            if not exists (
                select 1 from pg_catalog.pg_operator
                where oprname = case when filter.op = 'imatch'::realtime.equality_op then '~*' else '~' end
                  and oprleft = col_type
                  and oprright = col_type
                  and oprresult = 'boolean'::regtype
            ) then
                raise exception 'operator % requires a text-compatible column type, got %', filter.op::text, col_type::text;
            end if;
            -- validate the regex eagerly so a bad pattern is rejected here, not inside
            -- apply_rls where it would abort the WAL stream for the entity
            begin
                perform '' ~ filter.value;
            exception when others then
                raise exception 'invalid regular expression for % filter: %', filter.op::text, sqlerrm;
            end;
        else
            -- eq/neq/lt/lte/gt/gte: value must be coercable to the type
            perform realtime.cast(filter.value, col_type);
        end if;
    end loop;

    if new.selected_columns is not null then
        for selected_col in select * from unnest(new.selected_columns) loop
            if not selected_col = any(col_names) then
                raise exception 'invalid column for select %', selected_col;
            end if;
        end loop;
    end if;

    -- Apply consistent order to filters so the unique constraint can't be tricked by a
    -- different filter order. negate is part of the sort key.
    new.filters = coalesce(
        array_agg(f order by f.column_name, f.op, f.value, f.negate),
        '{}'
    ) from unnest(new.filters) f;

    -- Normalize selected_columns order so ARRAY['a','b'] and ARRAY['b','a'] are treated
    -- as the same subscription group in apply_rls. Preserve an empty array as '{}'
    -- ("primary keys only") so it stays distinct from NULL ("all columns"); array_agg
    -- over an empty set would otherwise collapse '{}' back to NULL.
    if new.selected_columns is not null then
        new.selected_columns = coalesce(
            (
                select array_agg(c order by c)
                from unnest(new.selected_columns) c
            ),
            '{}'::text[]
        );
    end if;

    return new;
end;
$$;


--
-- Name: to_regrole(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.to_regrole(role_name text) RETURNS regrole
    LANGUAGE sql IMMUTABLE
    AS $$ select role_name::regrole $$;


--
-- Name: topic(); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.topic() RETURNS text
    LANGUAGE sql STABLE
    AS $$
select nullif(current_setting('realtime.topic', true), '')::text;
$$;


--
-- Name: wal2json_escape_identifier(text); Type: FUNCTION; Schema: realtime; Owner: -
--

CREATE FUNCTION realtime.wal2json_escape_identifier(name text) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
  -- Prefix `\`, `,`, `.`, and any whitespace with `\`
  SELECT regexp_replace(name, '([\\,.[:space:]])', '\\\1', 'g')
$$;


--
-- Name: allow_any_operation(text[]); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.allow_any_operation(expected_operations text[]) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT CASE
      WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
      ELSE raw_operation
    END AS current_operation
    FROM current_operation
  )
  SELECT EXISTS (
    SELECT 1
    FROM normalized n
    CROSS JOIN LATERAL unnest(expected_operations) AS expected_operation
    WHERE expected_operation IS NOT NULL
      AND expected_operation <> ''
      AND n.current_operation = CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END
  );
$$;


--
-- Name: allow_only_operation(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.allow_only_operation(expected_operation text) RETURNS boolean
    LANGUAGE sql STABLE
    AS $$
  WITH current_operation AS (
    SELECT storage.operation() AS raw_operation
  ),
  normalized AS (
    SELECT
      CASE
        WHEN raw_operation LIKE 'storage.%' THEN substr(raw_operation, 9)
        ELSE raw_operation
      END AS current_operation,
      CASE
        WHEN expected_operation LIKE 'storage.%' THEN substr(expected_operation, 9)
        ELSE expected_operation
      END AS requested_operation
    FROM current_operation
  )
  SELECT CASE
    WHEN requested_operation IS NULL OR requested_operation = '' THEN FALSE
    ELSE COALESCE(current_operation = requested_operation, FALSE)
  END
  FROM normalized;
$$;


--
-- Name: can_insert_object(text, text, uuid, jsonb); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.can_insert_object(bucketid text, name text, owner uuid, metadata jsonb) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  INSERT INTO "storage"."objects" ("bucket_id", "name", "owner", "metadata") VALUES (bucketid, name, owner, metadata);
  -- hack to rollback the successful insert
  RAISE sqlstate 'PT200' using
  message = 'ROLLBACK',
  detail = 'rollback successful insert';
END
$$;


--
-- Name: delete_lifecycle_objects(uuid[]); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.delete_lifecycle_objects(object_ids uuid[]) RETURNS TABLE(id uuid, is_delete_marker boolean, metadata jsonb)
    LANGUAGE plpgsql
    AS $$
DECLARE
    object_id uuid;
    deleted_row storage.objects%ROWTYPE;
    deleted_ids uuid[];
    deleted_markers boolean[];
    deleted_metadata jsonb[];
    bulk_deleted boolean := false;
BEGIN
    -- Surface pre-existing deferred violations instead of treating them as blocked rows.
    SET CONSTRAINTS ALL IMMEDIATE;
    PERFORM set_config('storage.allow_delete_query', 'true', true);

    -- One subxact keeps the subxid cache from overflowing; rows return only once it commits.
    BEGIN
        WITH deleted AS (
            DELETE FROM storage.objects AS object_row
              WHERE object_row.id = ANY(object_ids) AND object_row.archived_at IS NOT NULL
              RETURNING object_row.id, object_row.is_delete_marker, object_row.metadata
        )
        SELECT array_agg(deleted.id), array_agg(deleted.is_delete_marker), array_agg(deleted.metadata)
          INTO deleted_ids, deleted_markers, deleted_metadata
          FROM deleted;
        bulk_deleted := true;
    EXCEPTION
        WHEN OTHERS THEN
            -- User triggers may use insufficient_privilege to block a row.
            IF SQLSTATE <> '42501' AND left(SQLSTATE, 2) IN ('08', '40', '42', '53', '55', '57', '58', 'XX') THEN
                RAISE;
            END IF;
    END;
    IF bulk_deleted THEN
        RETURN QUERY SELECT * FROM unnest(deleted_ids, deleted_markers, deleted_metadata);
        RETURN;
    END IF;

    FOREACH object_id IN ARRAY object_ids LOOP
        BEGIN
            DELETE FROM storage.objects AS object_row
              WHERE object_row.id = object_id AND object_row.archived_at IS NOT NULL
              RETURNING object_row.* INTO deleted_row;
            IF FOUND THEN
                id := deleted_row.id;
                is_delete_marker := deleted_row.is_delete_marker;
                metadata := deleted_row.metadata;
                RETURN NEXT;
            END IF;
        EXCEPTION
            WHEN OTHERS THEN
                IF SQLSTATE <> '42501' AND left(SQLSTATE, 2) IN ('08', '40', '42', '53', '55', '57', '58', 'XX') THEN
                    RAISE;
                END IF;
        END;
    END LOOP;
END;
$$;


--
-- Name: enforce_bucket_lifecycle_service_role(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.enforce_bucket_lifecycle_service_role() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'pg_catalog'
    AS $$
BEGIN
  IF current_user::text IS DISTINCT FROM TG_ARGV[0] THEN
    -- Keep this check AFTER caller RLS accepts the proposed row. The API
    -- recognizes this exact signal after rolling back its permission probe.
    RAISE EXCEPTION 'bucket control columns may only be changed by the configured storage service role'
      USING ERRCODE = 'PST01',
            SCHEMA = TG_TABLE_SCHEMA,
            TABLE = TG_TABLE_NAME,
            CONSTRAINT = TG_NAME;
  END IF;

  RETURN NULL;
END;
$$;


--
-- Name: enforce_bucket_name_length(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.enforce_bucket_name_length() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
    if length(new.name) > 100 then
        raise exception 'bucket name "%" is too long (% characters). Max is 100.', new.name, length(new.name);
    end if;
    return new;
end;
$$;


--
-- Name: enforce_versioning_status_transition(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.enforce_versioning_status_transition() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.versioning_status = OLD.versioning_status THEN
        RETURN NEW;
    END IF;

    IF NEW.versioning_status = 'DISABLED' OR
       (OLD.versioning_status = 'DISABLED' AND NEW.versioning_status = 'SUSPENDED') THEN
        RAISE EXCEPTION 'Cannot transition bucket versioning status from % to %',
            OLD.versioning_status, NEW.versioning_status;
    END IF;

    RETURN NEW;
END;
$$;


--
-- Name: extension(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.extension(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
    _filename text;
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Get the last path segment (the actual filename)
    SELECT _parts[array_length(_parts, 1)] INTO _filename;
    -- Extract extension: reverse, split on '.', then reverse again
    RETURN reverse(split_part(reverse(_filename), '.', 1));
END
$$;


--
-- Name: filename(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.filename(name text) RETURNS text
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    SELECT string_to_array(name, '/') INTO _parts;
    RETURN _parts[array_length(_parts, 1)];
END
$$;


--
-- Name: foldername(text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.foldername(name text) RETURNS text[]
    LANGUAGE plpgsql IMMUTABLE
    AS $$
DECLARE
    _parts text[];
BEGIN
    -- Split on "/" to get path segments
    SELECT string_to_array(name, '/') INTO _parts;
    -- Return everything except the last segment
    RETURN _parts[1 : array_length(_parts,1) - 1];
END
$$;


--
-- Name: get_common_prefix(text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_common_prefix(p_key text, p_prefix text, p_delimiter text) RETURNS text
    LANGUAGE sql IMMUTABLE
    AS $$
SELECT CASE
    WHEN p_delimiter <> ''
         AND position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1)) > 0
    THEN left(
        p_key,
        length(p_prefix)
            + position(p_delimiter IN substring(p_key FROM length(p_prefix) + 1))
            + length(p_delimiter) - 1
    )
    ELSE NULL
END;
$$;


--
-- Name: get_size_by_bucket(text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.get_size_by_bucket(noncurrent_versions text DEFAULT 'include'::text, delete_markers text DEFAULT 'include'::text) RETURNS TABLE(size bigint, bucket_id text)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    -- COALESCE first: NULL NOT IN (...) evaluates to NULL (not TRUE), so a
    -- bare NOT IN check silently leaves an explicit NULL argument unreset.
    noncurrent_versions := COALESCE(noncurrent_versions, 'include');
    delete_markers := COALESCE(delete_markers, 'include');
    IF noncurrent_versions NOT IN ('exclude', 'only', 'include') THEN
        noncurrent_versions := 'include';
    END IF;
    IF delete_markers NOT IN ('exclude', 'only', 'include') THEN
        delete_markers := 'include';
    END IF;

    return query
        select sum((metadata->>'size')::bigint)::bigint as size, obj.bucket_id
        from "storage".objects as obj
        where (noncurrent_versions != 'exclude' OR obj.archived_at IS NULL)
          and (noncurrent_versions != 'only' OR obj.archived_at IS NOT NULL)
          and (delete_markers != 'exclude' OR NOT obj.is_delete_marker)
          and (delete_markers != 'only' OR obj.is_delete_marker)
        group by obj.bucket_id;
END
$$;


--
-- Name: list_multipart_uploads_with_delimiter(text, text, text, integer, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_multipart_uploads_with_delimiter(bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, next_key_token text DEFAULT ''::text, next_upload_token text DEFAULT ''::text, raw_prefix_param text DEFAULT NULL::text) RETURNS TABLE(key text, id text, created_at timestamp with time zone)
    LANGUAGE sql STABLE
    AS $_$
WITH candidates AS (
    SELECT
        upload.key AS object_key,
        CASE
            WHEN position($3 IN substring(upload.key FROM length(coalesce($7, $2)) + 1)) > 0
            THEN left(
                upload.key,
                length(coalesce($7, $2))
                    + position($3 IN substring(upload.key FROM length(coalesce($7, $2)) + 1))
                    + length($3) - 1
            )
            ELSE upload.key
        END AS result_key,
        upload.id,
        upload.created_at,
        position($3 IN substring(upload.key FROM length(coalesce($7, $2)) + 1)) > 0 AS is_common_prefix
    FROM storage.s3_multipart_uploads AS upload
    WHERE upload.bucket_id = $1
      AND upload.key COLLATE "C" LIKE $2 || '%'
), filtered AS (
    SELECT candidate.*
    FROM candidates AS candidate
    WHERE $5 = ''
       OR candidate.result_key COLLATE "C" > $5
       OR (
           candidate.result_key COLLATE "C" = $5
           AND NOT candidate.is_common_prefix
           AND $6 <> ''
           -- A completed or aborted marker repeats the remaining same-key uploads.
           AND COALESCE(
               (candidate.created_at, candidate.id COLLATE "C") > (
                   SELECT marker.created_at, marker.id COLLATE "C"
                   FROM storage.s3_multipart_uploads AS marker
                   WHERE marker.bucket_id = $1
                     AND marker.key COLLATE "C" = $5
                     AND marker.id = $6
               ),
               TRUE
           )
       )
), ranked AS (
    SELECT
        filtered.*,
        row_number() OVER (
            PARTITION BY filtered.result_key COLLATE "C"
            ORDER BY filtered.created_at, filtered.id COLLATE "C"
        ) AS prefix_rank
    FROM filtered
)
SELECT ranked.result_key, ranked.id, ranked.created_at
FROM ranked
WHERE NOT ranked.is_common_prefix OR ranked.prefix_rank = 1
ORDER BY ranked.result_key COLLATE "C", ranked.created_at, ranked.id COLLATE "C"
LIMIT $4;
$_$;


--
-- Name: list_objects_with_delimiter(text, text, text, integer, text, text, text, text, text, timestamp with time zone, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.list_objects_with_delimiter(_bucket_id text, prefix_param text, delimiter_param text, max_keys integer DEFAULT 100, start_after text DEFAULT ''::text, next_token text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, noncurrent_versions text DEFAULT 'exclude'::text, delete_markers text DEFAULT 'exclude'::text, next_token_archived_at timestamp with time zone DEFAULT NULL::timestamp with time zone, next_token_version text DEFAULT ''::text) RETURNS TABLE(name text, id uuid, metadata jsonb, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, version text, archived_at timestamp with time zone, is_delete_marker boolean, is_versioned boolean)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;

    -- Configuration
    v_is_asc BOOLEAN;
    v_prefix TEXT;
    v_start TEXT;
    v_start_relative TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;
    v_version_filter TEXT;

    -- true when noncurrent_versions can return >1 row per name; keeps them
    -- ordered most-recent-first and lets pagination resume mid-key
    v_multi_row BOOLEAN;
    v_name_order TEXT;
    v_exact_range_predicate TEXT;
    v_strict_range_predicate TEXT;
    v_inclusive_range_predicate TEXT;

    -- Seek state for the current name. archived_at is normalized to JavaScript's
    -- millisecond precision and version breaks ties within the same millisecond.
    -- Current rows use 'infinity'; NULL means no tiebreak has been established.
    v_next_seek TEXT;
    v_next_seek_at TIMESTAMPTZ;
    v_next_seek_version TEXT;
    v_next_seek_strict BOOLEAN := false;
    v_cursor_is_folder BOOLEAN;
    v_count INT := 0;
    v_previous_seek TEXT;
    v_previous_seek_at TIMESTAMPTZ;
    v_previous_seek_version TEXT;
    v_previous_count INT;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;
    v_batch_query_strict TEXT;
    v_delete_marker_peek_query TEXT;
    v_delete_marker_peek_query_strict TEXT;

BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_is_asc := lower(coalesce(sort_order, 'asc')) = 'asc';
    v_prefix := coalesce(prefix_param, '');
    v_start := CASE WHEN coalesce(next_token, '') <> '' THEN next_token ELSE coalesce(start_after, '') END;
    v_file_batch_size := LEAST(GREATEST(max_keys * 2, 100), 1000);
    v_next_seek_at := NULL;
    v_next_seek_version := '';

    -- COALESCE first: NULL NOT IN (...) evaluates to NULL (not TRUE), so a
    -- bare NOT IN check silently leaves an explicit NULL argument unreset.
    noncurrent_versions := COALESCE(noncurrent_versions, 'exclude');
    delete_markers := COALESCE(delete_markers, 'exclude');
    IF noncurrent_versions NOT IN ('exclude', 'only', 'include') THEN
        noncurrent_versions := 'exclude';
    END IF;
    IF delete_markers NOT IN ('exclude', 'only', 'include') THEN
        delete_markers := 'exclude';
    END IF;

    v_multi_row := noncurrent_versions IN ('only', 'include');
    v_name_order := CASE WHEN v_is_asc THEN 'ASC' ELSE 'DESC' END;

    v_version_filter := '';
    IF noncurrent_versions = 'exclude' THEN
        v_version_filter := v_version_filter || ' AND o.archived_at IS NULL';
    ELSIF noncurrent_versions = 'only' THEN
        v_version_filter := v_version_filter || ' AND o.archived_at IS NOT NULL';
    END IF;
    IF delete_markers = 'exclude' THEN
        v_version_filter := v_version_filter || ' AND NOT o.is_delete_marker';
    ELSIF delete_markers = 'only' THEN
        v_version_filter := v_version_filter || ' AND o.is_delete_marker';
    END IF;

    -- Calculate upper bound for prefix filtering (bytewise, using COLLATE "C")
    IF v_prefix = '' THEN
        v_upper_bound := NULL;
    ELSE
        v_upper_bound := left(v_prefix, -1) || chr(ascii(right(v_prefix, 1)) + 1);
    END IF;

    -- Keep caller-provided cursors inside the requested prefix range.
    IF v_start <> '' AND v_upper_bound IS NOT NULL THEN
        IF v_is_asc THEN
            IF v_start COLLATE "C" < v_prefix COLLATE "C" THEN
                v_start := '';
            ELSIF v_start COLLATE "C" >= v_upper_bound COLLATE "C" THEN
                RETURN;
            END IF;
        ELSE
            IF v_start COLLATE "C" < v_prefix COLLATE "C" THEN
                RETURN;
            ELSIF v_start COLLATE "C" >= v_upper_bound COLLATE "C" THEN
                v_start := '';
            END IF;
        END IF;
    END IF;

    v_start_relative := substring(v_start FROM length(v_prefix) + 1);

    -- Direction affects only the indexed name range and its ordering. Cursor
    -- state transitions and within-key version ordering stay shared.
    IF v_is_asc THEN
        v_exact_range_predicate := 'TRUE';
        v_strict_range_predicate := 'o.name COLLATE "C" > $2';
        v_inclusive_range_predicate := 'o.name COLLATE "C" >= $2';
        IF v_upper_bound IS NOT NULL THEN
            v_exact_range_predicate := 'o.name COLLATE "C" < $3';
            v_strict_range_predicate := v_strict_range_predicate || ' AND o.name COLLATE "C" < $3';
            v_inclusive_range_predicate := v_inclusive_range_predicate || ' AND o.name COLLATE "C" < $3';
        END IF;
    ELSE
        v_exact_range_predicate := 'TRUE';
        v_strict_range_predicate := 'o.name COLLATE "C" < $2';
        v_inclusive_range_predicate := 'o.name COLLATE "C" < $2';
        IF v_prefix <> '' THEN
            v_exact_range_predicate := 'o.name COLLATE "C" >= $3';
            v_strict_range_predicate := v_strict_range_predicate || ' AND o.name COLLATE "C" >= $3';
            v_inclusive_range_predicate := v_inclusive_range_predicate || ' AND o.name COLLATE "C" >= $3';
        END IF;
    END IF;

    -- Build batch query (dynamic SQL - called infrequently, amortized over many rows)
    -- The multi-row order matches the externally serialized cursor exactly:
    -- archived_at at millisecond precision, then version as the final tiebreak.
    --
    -- When v_multi_row, the seek is a keyset tuple comparison ("name > $2 OR
    -- (name = $2 AND tiebreak)") - Postgres won't split that OR into indexable
    -- form (confirmed even with fully literal values), so as one WHERE clause
    -- it forces a full bucket scan filtered row-by-row. Splitting it into two
    -- independently-indexable branches (exact name match with the tiebreak
    -- filter, vs. strictly-past names) combined with UNION ALL lets each
    -- branch keep name as a real index condition; the outer ORDER BY/LIMIT
    -- re-merges them into the same page the single query used to produce.
    IF v_multi_row THEN
        v_batch_query := format(
            $sql$
            SELECT *
            FROM (
                (
                    SELECT o.name, o.id, o.updated_at, o.created_at,
                           o.last_accessed_at, o.metadata, o.version,
                           o.archived_at, o.is_delete_marker, o.is_versioned
                    FROM storage.objects o
                    WHERE o.bucket_id = $1
                      AND o.name COLLATE "C" = $2
                      AND %s
                      AND NOT $7::boolean
                      AND (
                          $5::timestamptz IS NULL
                          OR COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) < $5
                          OR (
                              COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) = $5
                              AND COALESCE(o.version, '') > $6
                          )
                      )
                      %s
                    ORDER BY
                        COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) DESC,
                        COALESCE(o.version, '') ASC
                    LIMIT $4
                )
                UNION ALL
                (
                    SELECT o.name, o.id, o.updated_at, o.created_at,
                           o.last_accessed_at, o.metadata, o.version,
                           o.archived_at, o.is_delete_marker, o.is_versioned
                    FROM storage.objects o
                    WHERE o.bucket_id = $1
                      AND %s
                      %s
                    ORDER BY
                        o.name COLLATE "C" %s,
                        COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) DESC,
                        COALESCE(o.version, '') ASC
                    LIMIT $4
                )
            ) sub
            ORDER BY
                sub.name COLLATE "C" %s,
                COALESCE(date_trunc('milliseconds', sub.archived_at), 'infinity'::timestamptz) DESC,
                COALESCE(sub.version, '') ASC
            LIMIT $4
            $sql$,
            v_exact_range_predicate,
            v_version_filter,
            v_strict_range_predicate,
            v_version_filter,
            v_name_order,
            v_name_order
        );
    ELSE
        v_batch_query := format(
            $sql$
            SELECT o.name, o.id, o.updated_at, o.created_at,
                   o.last_accessed_at, o.metadata, o.version,
                   o.archived_at, o.is_delete_marker, o.is_versioned
            FROM storage.objects o
            WHERE o.bucket_id = $1
              AND %s
              %s
            ORDER BY o.name COLLATE "C" %s, o.archived_at DESC
            LIMIT $4
            $sql$,
            v_inclusive_range_predicate,
            v_version_filter,
            v_name_order
        );

        -- Strict counterpart of the query above: used once the single-row
        -- ASC batch advance (below) has left v_next_seek pointing at the
        -- last row already emitted, so an inclusive predicate would
        -- re-match it forever. Only single-row mode ever sets strict mode,
        -- so this variant is never needed when v_multi_row.
        v_batch_query_strict := format(
            $sql$
            SELECT o.name, o.id, o.updated_at, o.created_at,
                   o.last_accessed_at, o.metadata, o.version,
                   o.archived_at, o.is_delete_marker, o.is_versioned
            FROM storage.objects o
            WHERE o.bucket_id = $1
              AND %s
              %s
            ORDER BY o.name COLLATE "C" %s, o.archived_at DESC
            LIMIT $4
            $sql$,
            v_strict_range_predicate,
            v_version_filter,
            v_name_order
        );
    END IF;

    -- The static peek predicates cannot use the partial delete-marker index
    -- once PL/pgSQL switches to a generic plan because whether
    -- is_delete_marker is required remains parameter-dependent. Reuse the
    -- already-specialized batch query with a one-row limit for this sparse
    -- filter so the plan sees a literal `o.is_delete_marker` predicate.
    IF delete_markers = 'only' THEN
        v_delete_marker_peek_query :=
            'SELECT marker_page.name FROM (' || v_batch_query || ') marker_page LIMIT 1';
        IF NOT v_multi_row THEN
            v_delete_marker_peek_query_strict :=
                'SELECT marker_page.name FROM (' || v_batch_query_strict || ') marker_page LIMIT 1';
        END IF;
    END IF;

    -- ========================================================================
    -- SEEK INITIALIZATION: Determine starting position
    -- ========================================================================
    IF v_start = '' THEN
        IF v_is_asc THEN
            v_next_seek := v_prefix;
        ELSE
            -- DESC without cursor performs one specialized initial seek so
            -- partial current-version and delete-marker indexes remain available.
            EXECUTE format(
                'SELECT o.name FROM storage.objects o WHERE o.bucket_id = $1%s%s ORDER BY o.name COLLATE "C" DESC LIMIT 1',
                CASE WHEN v_upper_bound IS NOT NULL
                    THEN ' AND o.name COLLATE "C" >= $2 AND o.name COLLATE "C" < $3'
                    ELSE ''
                END,
                v_version_filter
            )
            INTO v_next_seek
            USING _bucket_id, v_prefix, v_upper_bound;

            IF v_next_seek IS NOT NULL THEN
                v_next_seek := v_next_seek || delimiter_param;
            ELSE
                RETURN;
            END IF;
        END IF;
    ELSE
        -- Folder continuation tokens retain their trailing delimiter. A
        -- delimiter-less startAfter is always a literal key boundary.
        v_cursor_is_folder := delimiter_param <> ''
            AND v_start_relative <> ''
            AND right(v_start_relative, length(delimiter_param)) = delimiter_param;

        IF v_cursor_is_folder THEN
            v_next_seek := CASE
                WHEN right(v_start, length(delimiter_param)) = delimiter_param
                    THEN v_start
                ELSE v_start || delimiter_param
            END;
            IF v_is_asc THEN
                v_next_seek := left(v_next_seek, -1)
                    || chr(ascii(right(v_next_seek, 1)) + 1);
            END IF;
            v_next_seek_strict := NOT v_is_asc;
        ELSE
            -- leaf object: when v_multi_row, stay on v_start with the
            -- caller-supplied tiebreak so a page boundary mid-key resumes
            -- that key's remaining rows instead of skipping them. Truncate
            -- to milliseconds like every other v_next_seek_at assignment -
            -- harmless today since object.ts's cursor always round-trips
            -- through JS Date first, but this shouldn't rely on that.
            IF v_multi_row THEN
                v_next_seek := v_start;
                v_next_seek_at := date_trunc('milliseconds', next_token_archived_at);
                v_next_seek_version := coalesce(next_token_version, '');
                v_next_seek_strict := coalesce(next_token, '') = '';
            ELSIF v_is_asc THEN
                v_next_seek := v_start;
                v_next_seek_strict := true;
            ELSE
                v_next_seek := v_start;
            END IF;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= max_keys;

        v_previous_seek := v_next_seek;
        v_previous_seek_at := v_next_seek_at;
        v_previous_seek_version := v_next_seek_version;
        v_previous_count := v_count;

        -- STEP 1: PEEK using STATIC SQL (plan cached, very fast)
        -- v_multi_row is branched here (rather than folded into the WHERE
        -- clause as a bound parameter) so each concrete query keeps an
        -- unconditional seek predicate - once PL/pgSQL switches to its
        -- cached generic plan (after 5 calls), a parameter-gated
        -- "(NOT v_multi_row AND name >= $x) OR (v_multi_row AND ...)"
        -- predicate stops the planner from using name as an index
        -- condition at all, degrading every subsequent peek to a full
        -- index scan filtered row-by-row instead of a bounded range scan.
        -- v_multi_row's seek predicate is a keyset tuple comparison
        -- ("name > x OR (name = x AND tiebreak)") - Postgres does not
        -- split this OR into indexable form even with fully literal
        -- values, so it falls back to a full scan filtered row-by-row.
        -- Splitting it into two independently-indexable branches (exact
        -- name match with the tiebreak filter, vs. strictly-past name)
        -- combined with UNION ALL lets each branch keep name as a real
        -- index condition; the outer ORDER BY/LIMIT picks whichever of
        -- the (at most 2) rows sorts first.
        IF delete_markers = 'only' THEN
            EXECUTE CASE WHEN v_next_seek_strict AND NOT v_multi_row
                THEN v_delete_marker_peek_query_strict
                ELSE v_delete_marker_peek_query
            END
                INTO v_peek_name
                USING _bucket_id, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END,
                    1, v_next_seek_at, v_next_seek_version, v_next_seek_strict;
        ELSIF v_multi_row THEN
            IF v_is_asc THEN
                IF v_upper_bound IS NOT NULL THEN
                    SELECT sub.name INTO v_peek_name FROM (
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" = v_next_seek
                           AND o.name COLLATE "C" < v_upper_bound
                           AND NOT v_next_seek_strict
                           AND (v_next_seek_at IS NULL
                                OR COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) < v_next_seek_at
                                OR (COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) = v_next_seek_at
                                    AND COALESCE(o.version, '') > v_next_seek_version))
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) DESC, COALESCE(o.version, '') ASC LIMIT 1)
                        UNION ALL
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" > v_next_seek AND o.name COLLATE "C" < v_upper_bound
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY o.name COLLATE "C" ASC LIMIT 1)
                    ) sub ORDER BY sub.name COLLATE "C" ASC LIMIT 1;
                ELSE
                    SELECT sub.name INTO v_peek_name FROM (
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" = v_next_seek
                           AND NOT v_next_seek_strict
                           AND (v_next_seek_at IS NULL
                                OR COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) < v_next_seek_at
                                OR (COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) = v_next_seek_at
                                    AND COALESCE(o.version, '') > v_next_seek_version))
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) DESC, COALESCE(o.version, '') ASC LIMIT 1)
                        UNION ALL
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" > v_next_seek
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY o.name COLLATE "C" ASC LIMIT 1)
                    ) sub ORDER BY sub.name COLLATE "C" ASC LIMIT 1;
                END IF;
            ELSE
                IF v_upper_bound IS NOT NULL THEN
                    SELECT sub.name INTO v_peek_name FROM (
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" = v_next_seek
                           AND o.name COLLATE "C" >= v_prefix
                           AND NOT v_next_seek_strict
                           AND (v_next_seek_at IS NULL
                                OR COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) < v_next_seek_at
                                OR (COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) = v_next_seek_at
                                    AND COALESCE(o.version, '') > v_next_seek_version))
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) DESC, COALESCE(o.version, '') ASC LIMIT 1)
                        UNION ALL
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek AND o.name COLLATE "C" >= v_prefix
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY o.name COLLATE "C" DESC LIMIT 1)
                    ) sub ORDER BY sub.name COLLATE "C" DESC LIMIT 1;
                ELSE
                    SELECT sub.name INTO v_peek_name FROM (
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" = v_next_seek
                           AND NOT v_next_seek_strict
                           AND (v_next_seek_at IS NULL
                                OR COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) < v_next_seek_at
                                OR (COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) = v_next_seek_at
                                    AND COALESCE(o.version, '') > v_next_seek_version))
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY COALESCE(date_trunc('milliseconds', o.archived_at), 'infinity'::timestamptz) DESC, COALESCE(o.version, '') ASC LIMIT 1)
                        UNION ALL
                        (SELECT o.name FROM storage.objects o
                         WHERE o.bucket_id = _bucket_id AND o.name COLLATE "C" < v_next_seek
                           AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                           AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                           AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                           AND (delete_markers != 'only' OR o.is_delete_marker)
                         ORDER BY o.name COLLATE "C" DESC LIMIT 1)
                    ) sub ORDER BY sub.name COLLATE "C" DESC LIMIT 1;
                END IF;
            END IF;
        ELSE
            -- Single-row mode is always noncurrent_versions='exclude'. Keep
            -- this predicate literal so generic plans use the current index.
            IF v_is_asc THEN
                IF v_next_seek_strict AND v_upper_bound IS NOT NULL THEN
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = _bucket_id
                      AND o.name COLLATE "C" > v_next_seek
                      AND o.name COLLATE "C" < v_upper_bound
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                      AND (delete_markers != 'only' OR o.is_delete_marker)
                    ORDER BY o.name COLLATE "C" ASC LIMIT 1;
                ELSIF v_next_seek_strict THEN
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = _bucket_id
                      AND o.name COLLATE "C" > v_next_seek
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                      AND (delete_markers != 'only' OR o.is_delete_marker)
                    ORDER BY o.name COLLATE "C" ASC LIMIT 1;
                ELSIF v_upper_bound IS NOT NULL THEN
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = _bucket_id
                      AND o.name COLLATE "C" >= v_next_seek
                      AND o.name COLLATE "C" < v_upper_bound
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                      AND (delete_markers != 'only' OR o.is_delete_marker)
                    ORDER BY o.name COLLATE "C" ASC LIMIT 1;
                ELSE
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = _bucket_id
                      AND o.name COLLATE "C" >= v_next_seek
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                      AND (delete_markers != 'only' OR o.is_delete_marker)
                    ORDER BY o.name COLLATE "C" ASC LIMIT 1;
                END IF;
            ELSE
                IF v_upper_bound IS NOT NULL THEN
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = _bucket_id
                      AND o.name COLLATE "C" < v_next_seek
                      AND o.name COLLATE "C" >= v_prefix
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                      AND (delete_markers != 'only' OR o.is_delete_marker)
                    ORDER BY o.name COLLATE "C" DESC LIMIT 1;
                ELSE
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = _bucket_id
                      AND o.name COLLATE "C" < v_next_seek
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                      AND (delete_markers != 'only' OR o.is_delete_marker)
                    ORDER BY o.name COLLATE "C" DESC LIMIT 1;
                END IF;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(v_peek_name, v_prefix, delimiter_param);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Emit and skip to next folder (no heap access needed)
            name := v_common_prefix;
            id := NULL;
            updated_at := NULL;
            created_at := NULL;
            last_accessed_at := NULL;
            metadata := NULL;
            version := NULL;
            archived_at := NULL;
            is_delete_marker := NULL;
            is_versioned := NULL;
            RETURN NEXT;
            v_count := v_count + 1;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := left(v_common_prefix, -1)
                    || chr(ascii(right(v_common_prefix, 1)) + 1);
            ELSE
                v_next_seek := v_common_prefix;
            END IF;
            v_next_seek_at := NULL;
            v_next_seek_version := '';
            v_next_seek_strict := NOT v_is_asc;
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE CASE WHEN v_next_seek_strict AND NOT v_multi_row THEN v_batch_query_strict ELSE v_batch_query END
                USING _bucket_id, v_next_seek,
                CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix) ELSE v_prefix END, v_file_batch_size, v_next_seek_at, v_next_seek_version,
                v_next_seek_strict
            LOOP
                v_common_prefix := storage.get_common_prefix(v_current.name, v_prefix, delimiter_param);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it. Reset
                    -- strict mode too it may have been set by an earlier
                    -- row in this same batch (see the single-row ASC advance
                    -- below), and v_next_seek here is the folder-triggering
                    -- row's own name, which the next peek must find inclusively.
                    v_next_seek := CASE
                        WHEN v_is_asc THEN v_current.name
                        ELSE v_current.name || delimiter_param
                    END;
                    v_next_seek_at := NULL;
                    v_next_seek_version := '';
                    v_next_seek_strict := false;
                    EXIT;
                END IF;

                -- Emit file
                name := v_current.name;
                id := v_current.id;
                updated_at := v_current.updated_at;
                created_at := v_current.created_at;
                last_accessed_at := v_current.last_accessed_at;
                metadata := v_current.metadata;
                version := v_current.version;
                archived_at := v_current.archived_at;
                is_delete_marker := v_current.is_delete_marker;
                is_versioned := v_current.is_versioned;
                RETURN NEXT;
                v_count := v_count + 1;

                -- when v_multi_row, stay on this name and record its
                -- archived_at as the new tiebreak so remaining rows for the
                -- same key are picked up before moving to the next name
                IF v_multi_row THEN
                    v_next_seek := v_current.name;
                    v_next_seek_at := COALESCE(date_trunc('milliseconds', v_current.archived_at), 'infinity'::timestamptz);
                    v_next_seek_version := COALESCE(v_current.version, '');
                    v_next_seek_strict := false;
                ELSIF v_is_asc THEN
                    -- Appending the delimiter as a fake lexical successor
                    -- would skip a real key like `name || '!'` (or any
                    -- character sorting below the delimiter), which sorts
                    -- between `name` and `name || delimiter`. Track the real
                    -- name and mark the next comparison strict instead.
                    v_next_seek := v_current.name;
                    v_next_seek_strict := true;
                ELSE
                    v_next_seek := v_current.name;
                END IF;

                EXIT WHEN v_count >= max_keys;
            END LOOP;
        END IF;

        IF v_count = v_previous_count
           AND v_next_seek IS NOT DISTINCT FROM v_previous_seek
           AND v_next_seek_at IS NOT DISTINCT FROM v_previous_seek_at
           AND v_next_seek_version IS NOT DISTINCT FROM v_previous_seek_version THEN
            RAISE EXCEPTION 'storage.list_objects_with_delimiter made no progress at seek (%, %, %)',
                v_next_seek, v_next_seek_at, v_next_seek_version;
        END IF;
    END LOOP;
END;
$_$;


--
-- Name: operation(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.operation() RETURNS text
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN current_setting('storage.operation', true);
END;
$$;


--
-- Name: protect_active_lifecycle_states(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.protect_active_lifecycle_states() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM storage.bucket_lifecycle_states
        WHERE bucket_id = OLD.id
          AND NOT (
              continuation IS NULL
              OR (continuation @> '{"continuationVersion": 1}' AND continuation #> '{batch,inFlight}' IS NULL)
          )
    ) THEN
        RAISE EXCEPTION 'update or delete on table "buckets" violates foreign key constraint "bucket_lifecycle_states_bucket_id_fkey" on table "bucket_lifecycle_states"'
            USING ERRCODE = 'foreign_key_violation',
                  DETAIL = format('Key (id)=(%s) is still referenced from table "bucket_lifecycle_states".', OLD.id),
                  SCHEMA = 'storage',
                  TABLE = 'bucket_lifecycle_states',
                  CONSTRAINT = 'bucket_lifecycle_states_bucket_id_fkey';
    END IF;
    RETURN OLD;
END;
$$;


--
-- Name: protect_bucket_control_columns(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.protect_bucket_control_columns() RETURNS trigger
    LANGUAGE plpgsql
    SET search_path TO 'pg_catalog'
    AS $$
DECLARE
  configuration_changed boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.lifecycle_configuration IS NOT NULL
       OR NEW.lifecycle_configuration_generation IS NOT NULL THEN
      IF NOT pg_has_role(current_user, TG_ARGV[0], 'MEMBER') THEN
        RAISE EXCEPTION 'only members of the configured storage service role may insert lifecycle policy state'
          USING ERRCODE = '42501',
                HINT = format(
                  'Insert with both lifecycle columns NULL and configure lifecycle through the Storage API afterward, or insert as a member of %I.',
                  TG_ARGV[0]
                );
      END IF;
    END IF;

    RETURN NEW;
  END IF;

  configuration_changed =
    OLD.lifecycle_configuration IS DISTINCT FROM NEW.lifecycle_configuration
    OR OLD.lifecycle_configuration_generation IS DISTINCT FROM NEW.lifecycle_configuration_generation;

  IF NOT configuration_changed THEN
    RETURN NEW;
  END IF;

  IF NEW.type IS DISTINCT FROM 'STANDARD' THEN
    RAISE EXCEPTION 'bucket versioning and lifecycle controls require a Standard bucket'
      USING ERRCODE = '0A000';
  END IF;

  IF NEW.lifecycle_configuration IS NULL
     AND NEW.lifecycle_configuration_generation IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.lifecycle_configuration IS NULL
     OR NEW.lifecycle_configuration_generation IS NULL
     OR OLD.lifecycle_configuration IS NOT DISTINCT FROM NEW.lifecycle_configuration
     OR OLD.lifecycle_configuration_generation IS NOT DISTINCT FROM NEW.lifecycle_configuration_generation THEN
    RAISE EXCEPTION 'a changed lifecycle policy requires a new non-null generation'
      USING ERRCODE = '22023';
  END IF;

  RETURN NEW;
END;
$$;


--
-- Name: protect_delete(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.protect_delete() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Check if storage.allow_delete_query is set to 'true'
    IF COALESCE(current_setting('storage.allow_delete_query', true), 'false') != 'true' THEN
        RAISE EXCEPTION 'Direct deletion from storage tables is not allowed. Use the Storage API instead.'
            USING HINT = 'This prevents accidental data loss from orphaned objects.',
                  ERRCODE = '42501';
    END IF;
    RETURN NULL;
END;
$$;


--
-- Name: reconcile_lifecycle_state(text, boolean); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.reconcile_lifecycle_state(target_bucket_id text, policy_changed boolean) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
DECLARE
    bucket storage.buckets%ROWTYPE;
    active boolean;
    idle boolean;
    state_generation uuid;
BEGIN
    SELECT * INTO bucket FROM storage.buckets WHERE id = target_bucket_id FOR NO KEY UPDATE;
    IF NOT FOUND THEN
        RETURN;
    END IF;

    SELECT continuation IS NULL OR (
               continuation @> '{"continuationVersion": 1}'
               AND continuation #> '{batch,inFlight}' IS NULL
           ), generation
    INTO idle, state_generation
    FROM storage.bucket_lifecycle_states
    WHERE bucket_id = target_bucket_id
    FOR UPDATE;

    IF bucket.lifecycle_configuration IS NULL THEN
        DELETE FROM storage.bucket_lifecycle_states
        WHERE bucket_id = target_bucket_id
          AND idle IS TRUE;

        UPDATE storage.bucket_lifecycle_states
        SET next_run_at = clock_timestamp(), updated_at = clock_timestamp()
        WHERE bucket_id = target_bucket_id
          AND idle IS NOT TRUE;
        RETURN;
    END IF;

    active := bucket.versioning_status <> 'DISABLED'
        AND bucket.lifecycle_configuration @> '{"rules":[{"status":"Enabled"}]}'::jsonb;

    -- The state row records the generation it was reconciled with so callers need not detect
    -- policy changes. Rows without a recorded generation keep their work.
    policy_changed := policy_changed OR (
        state_generation IS NOT NULL AND state_generation <> bucket.lifecycle_configuration_generation
    );

    INSERT INTO storage.bucket_lifecycle_states AS state (bucket_id, generation, next_run_at)
    VALUES (bucket.id, bucket.lifecycle_configuration_generation, CASE WHEN active THEN clock_timestamp() END)
    ON CONFLICT (bucket_id) DO UPDATE
    SET next_run_at = CASE
            WHEN policy_changed THEN
                CASE WHEN active OR idle IS NOT TRUE THEN clock_timestamp() END
            ELSE EXCLUDED.next_run_at
        END,
        generation = EXCLUDED.generation,
        claim_id = CASE WHEN policy_changed AND idle IS TRUE
                        THEN NULL ELSE state.claim_id END,
        claim_until = CASE WHEN policy_changed AND idle IS TRUE
                           THEN NULL ELSE state.claim_until END,
        continuation = CASE WHEN policy_changed AND idle IS TRUE
                            THEN NULL ELSE state.continuation END,
        failure_count = CASE WHEN policy_changed AND idle IS TRUE
                             THEN 0 ELSE state.failure_count END,
        last_error = CASE WHEN policy_changed AND idle IS TRUE
                          THEN NULL ELSE state.last_error END,
        updated_at = clock_timestamp()
    WHERE policy_changed OR (state.next_run_at IS NULL AND EXCLUDED.next_run_at IS NOT NULL);
END;
$$;


--
-- Name: search(text, text, integer, integer, integer, text, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search(prefix text, bucketname text, limits integer DEFAULT 100, levels integer DEFAULT 1, offsets integer DEFAULT 0, search text DEFAULT ''::text, sortcolumn text DEFAULT 'name'::text, sortorder text DEFAULT 'asc'::text, noncurrent_versions text DEFAULT 'exclude'::text, delete_markers text DEFAULT 'exclude'::text) RETURNS TABLE(name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb, version text, archived_at timestamp with time zone, is_delete_marker boolean, is_versioned boolean)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_peek_name TEXT;
    v_current RECORD;
    v_common_prefix TEXT;
    v_delimiter CONSTANT TEXT := '/';

    -- Configuration
    v_limit INT;
    v_prefix TEXT;
    v_prefix_lower TEXT;
    v_prefix_len INT;
    v_prefix_start INT;
    v_combined_levels INT;
    v_is_asc BOOLEAN;
    v_order_by TEXT;
    v_sort_order TEXT;
    v_upper_bound TEXT;
    v_file_batch_size INT;
    v_version_filter TEXT;
    v_multi_row BOOLEAN;

    -- Dynamic SQL for batch query only
    v_batch_query TEXT;
    v_delete_marker_peek_query TEXT;
    v_delete_marker_peek_query_strict TEXT;

    -- Seek state
    v_next_seek TEXT;
    v_next_seek_at TIMESTAMPTZ;
    v_next_seek_version TEXT;
    v_next_seek_strict BOOLEAN := false;
    v_count INT := 0;
    v_skipped INT := 0;
    v_previous_seek TEXT;
    v_previous_seek_at TIMESTAMPTZ;
    v_previous_seek_version TEXT;
    v_previous_count INT;
    v_previous_skipped INT;
BEGIN
    -- ========================================================================
    -- INITIALIZATION
    -- ========================================================================
    v_limit := LEAST(coalesce(limits, 100), 1500);
    v_prefix := coalesce(prefix, '') || coalesce(search, '');
    v_prefix_lower := lower(v_prefix);
    v_prefix_len := length(coalesce(prefix, ''));
    v_prefix_start := coalesce(array_length(string_to_array(coalesce(prefix, ''), v_delimiter), 1), 1);
    v_combined_levels := coalesce(array_length(string_to_array(v_prefix, v_delimiter), 1), 1);
    v_is_asc := lower(coalesce(sortorder, 'asc')) = 'asc';
    v_file_batch_size := LEAST(GREATEST(v_limit * 2, 100), 1000);
    v_next_seek_at := NULL;
    v_next_seek_version := '';

    -- COALESCE first: NULL NOT IN (...) evaluates to NULL (not TRUE), so a
    -- bare NOT IN check silently leaves an explicit NULL argument unreset.
    noncurrent_versions := COALESCE(noncurrent_versions, 'exclude');
    delete_markers := COALESCE(delete_markers, 'exclude');
    IF noncurrent_versions NOT IN ('exclude', 'only', 'include') THEN
        noncurrent_versions := 'exclude';
    END IF;
    IF delete_markers NOT IN ('exclude', 'only', 'include') THEN
        delete_markers := 'exclude';
    END IF;

    v_multi_row := noncurrent_versions IN ('only', 'include');

    v_version_filter := '';
    IF noncurrent_versions = 'exclude' THEN
        v_version_filter := v_version_filter || ' AND o.archived_at IS NULL';
    ELSIF noncurrent_versions = 'only' THEN
        v_version_filter := v_version_filter || ' AND o.archived_at IS NOT NULL';
    END IF;
    IF delete_markers = 'exclude' THEN
        v_version_filter := v_version_filter || ' AND NOT o.is_delete_marker';
    ELSIF delete_markers = 'only' THEN
        v_version_filter := v_version_filter || ' AND o.is_delete_marker';
    END IF;

    -- Validate sort column
    CASE lower(coalesce(sortcolumn, 'name'))
        WHEN 'name' THEN v_order_by := 'name';
        WHEN 'updated_at' THEN v_order_by := 'updated_at';
        WHEN 'created_at' THEN v_order_by := 'created_at';
        WHEN 'last_accessed_at' THEN v_order_by := 'last_accessed_at';
        ELSE v_order_by := 'name';
    END CASE;

    v_sort_order := CASE WHEN v_is_asc THEN 'asc' ELSE 'desc' END;

    -- ========================================================================
    -- NON-NAME SORTING: Use path_tokens approach
    -- ========================================================================
    IF v_order_by != 'name' THEN
        RETURN QUERY EXECUTE format(
            $sql$
            WITH folders AS (
                SELECT array_to_string(path_tokens[$1:$2], '/') AS folder
                FROM storage.objects
                WHERE objects.name ILIKE $3 || '%%'
                  AND bucket_id = $4
                  AND array_length(objects.path_tokens, 1) <> $2
                  AND ($7 != 'exclude' OR objects.archived_at IS NULL)
                  AND ($7 != 'only' OR objects.archived_at IS NOT NULL)
                  AND ($8 != 'exclude' OR NOT objects.is_delete_marker)
                  AND ($8 != 'only' OR objects.is_delete_marker)
                GROUP BY folder
                ORDER BY folder %s
            )
            (SELECT folder AS "name",
                   NULL::uuid AS id,
                   NULL::timestamptz AS updated_at,
                   NULL::timestamptz AS created_at,
                   NULL::timestamptz AS last_accessed_at,
                   NULL::jsonb AS metadata,
                   NULL::text AS version,
                   NULL::timestamptz AS archived_at,
                   NULL::boolean AS is_delete_marker,
                   NULL::boolean AS is_versioned FROM folders)
            UNION ALL
            (SELECT array_to_string(path_tokens[$1:$2], '/') AS "name",
                   id, updated_at, created_at, last_accessed_at, metadata,
                   version, archived_at, is_delete_marker, is_versioned
             FROM storage.objects
             WHERE objects.name ILIKE $3 || '%%'
               AND bucket_id = $4
               AND array_length(objects.path_tokens, 1) = $2
               AND ($7 != 'exclude' OR objects.archived_at IS NULL)
               AND ($7 != 'only' OR objects.archived_at IS NOT NULL)
               AND ($8 != 'exclude' OR NOT objects.is_delete_marker)
               AND ($8 != 'only' OR objects.is_delete_marker)
             -- name, then version, as tiebreaks so two versions of the same
             -- key tying on the sort column still sort deterministically
             ORDER BY %I %s, name COLLATE "C" %s, COALESCE(version, '') %s)
            LIMIT $5 OFFSET $6
            $sql$, v_sort_order, v_order_by, v_sort_order, v_sort_order, v_sort_order
        ) USING v_prefix_start, v_combined_levels, v_prefix, bucketname, v_limit, offsets, noncurrent_versions, delete_markers;
        RETURN;
    END IF;

    -- ========================================================================
    -- NAME SORTING: Hybrid skip-scan with batch optimization
    -- ========================================================================

    -- Calculate upper bound for prefix filtering
    IF v_prefix_lower = '' THEN
        v_upper_bound := NULL;
    ELSIF right(v_prefix_lower, 1) = v_delimiter THEN
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(v_delimiter) + 1);
    ELSE
        v_upper_bound := left(v_prefix_lower, -1) || chr(ascii(right(v_prefix_lower, 1)) + 1);
    END IF;

    -- Build a resume-safe batch query. The exact-name branch returns remaining
    -- versions after the current (archived_at, version) boundary; the strict
    -- name branch returns subsequent keys. UNION ALL keeps both predicates
    -- independently indexable.
    IF v_is_asc THEN
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT * FROM (' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" = $2 AND ($5::timestamptz IS NULL OR COALESCE(o.archived_at, ''infinity''::timestamptz) < $5 OR (COALESCE(o.archived_at, ''infinity''::timestamptz) = $5 AND COALESCE(o.version, '''') > $6))' ||
                v_version_filter || ' ORDER BY COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4) UNION ALL ' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" > $2 AND lower(o.name) COLLATE "C" < $3' || v_version_filter ||
                ' ORDER BY lower(o.name) COLLATE "C" ASC, COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4)' ||
                ') sub ORDER BY lower(sub.name) COLLATE "C" ASC, COALESCE(sub.archived_at, ''infinity''::timestamptz) DESC, COALESCE(sub.version, '''') ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT * FROM (' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" = $2 AND ($5::timestamptz IS NULL OR COALESCE(o.archived_at, ''infinity''::timestamptz) < $5 OR (COALESCE(o.archived_at, ''infinity''::timestamptz) = $5 AND COALESCE(o.version, '''') > $6))' ||
                v_version_filter || ' ORDER BY COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4) UNION ALL ' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" > $2' || v_version_filter ||
                ' ORDER BY lower(o.name) COLLATE "C" ASC, COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4)' ||
                ') sub ORDER BY lower(sub.name) COLLATE "C" ASC, COALESCE(sub.archived_at, ''infinity''::timestamptz) DESC, COALESCE(sub.version, '''') ASC LIMIT $4';
        END IF;
    ELSE
        IF v_upper_bound IS NOT NULL THEN
            v_batch_query := 'SELECT * FROM (' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" = $2 AND ($5::timestamptz IS NULL OR COALESCE(o.archived_at, ''infinity''::timestamptz) < $5 OR (COALESCE(o.archived_at, ''infinity''::timestamptz) = $5 AND COALESCE(o.version, '''') > $6))' ||
                v_version_filter || ' ORDER BY COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4) UNION ALL ' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2 AND lower(o.name) COLLATE "C" >= $3' || v_version_filter ||
                ' ORDER BY lower(o.name) COLLATE "C" DESC, COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4)' ||
                ') sub ORDER BY lower(sub.name) COLLATE "C" DESC, COALESCE(sub.archived_at, ''infinity''::timestamptz) DESC, COALESCE(sub.version, '''') ASC LIMIT $4';
        ELSE
            v_batch_query := 'SELECT * FROM (' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" = $2 AND ($5::timestamptz IS NULL OR COALESCE(o.archived_at, ''infinity''::timestamptz) < $5 OR (COALESCE(o.archived_at, ''infinity''::timestamptz) = $5 AND COALESCE(o.version, '''') > $6))' ||
                v_version_filter || ' ORDER BY COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4) UNION ALL ' ||
                '(SELECT o.name, o.id, o.updated_at, o.created_at, o.last_accessed_at, o.metadata, o.version, o.archived_at, o.is_delete_marker, o.is_versioned FROM storage.objects o ' ||
                'WHERE o.bucket_id = $1 AND lower(o.name) COLLATE "C" < $2' || v_version_filter ||
                ' ORDER BY lower(o.name) COLLATE "C" DESC, COALESCE(o.archived_at, ''infinity''::timestamptz) DESC, COALESCE(o.version, '''') ASC LIMIT $4)' ||
                ') sub ORDER BY lower(sub.name) COLLATE "C" DESC, COALESCE(sub.archived_at, ''infinity''::timestamptz) DESC, COALESCE(sub.version, '''') ASC LIMIT $4';
        END IF;
    END IF;

    -- Keep the delete-marker predicate literal so the cached generic
    -- plan can use idx_objects_delete_markers during the main-loop peek.
    IF delete_markers = 'only' THEN
        IF v_multi_row THEN
            v_delete_marker_peek_query :=
                'SELECT marker_page.name FROM (' || v_batch_query || ') marker_page LIMIT 1';
        ELSIF v_is_asc THEN
            -- Two separate literal query strings, not one gated by a bound
            -- boolean: folding "$n AND op1 OR NOT $n AND op2" into a single
            -- query defeats the generic plan's ability to push either
            -- comparison into the index. Branching in PL/pgSQL control flow
            -- instead keeps each query's index condition intact.
            v_delete_marker_peek_query :=
                'SELECT o.name FROM storage.objects o WHERE o.bucket_id = $1 ' ||
                'AND lower(o.name) COLLATE "C" >= $2' ||
                CASE WHEN v_upper_bound IS NOT NULL
                    THEN ' AND lower(o.name) COLLATE "C" < $3'
                    ELSE ''
                END ||
                v_version_filter ||
                ' ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1';
            -- Strict variant: used once the single-row ASC batch advance
            -- (below) has left v_next_seek pointing at the last row already
            -- emitted, so a plain >= would re-match it forever.
            v_delete_marker_peek_query_strict :=
                'SELECT o.name FROM storage.objects o WHERE o.bucket_id = $1 ' ||
                'AND lower(o.name) COLLATE "C" > $2' ||
                CASE WHEN v_upper_bound IS NOT NULL
                    THEN ' AND lower(o.name) COLLATE "C" < $3'
                    ELSE ''
                END ||
                v_version_filter ||
                ' ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1';
        ELSE
            v_delete_marker_peek_query :=
                'SELECT o.name FROM storage.objects o WHERE o.bucket_id = $1 ' ||
                'AND lower(o.name) COLLATE "C" < $2' ||
                CASE WHEN v_upper_bound IS NOT NULL
                    THEN ' AND lower(o.name) COLLATE "C" >= $3'
                    ELSE ''
                END ||
                v_version_filter ||
                ' ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1';
        END IF;
    END IF;

    -- Initialize seek position
    IF v_is_asc THEN
        v_next_seek := v_prefix_lower;
    ELSE
        -- DESC performs one specialized initial seek so partial current-version
        -- and delete-marker indexes remain available.
        EXECUTE format(
            'SELECT o.name FROM storage.objects o WHERE o.bucket_id = $1%s%s ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1',
            CASE WHEN v_upper_bound IS NOT NULL
                THEN ' AND lower(o.name) COLLATE "C" >= $2 AND lower(o.name) COLLATE "C" < $3'
                ELSE ''
            END,
            v_version_filter
        )
        INTO v_peek_name
        USING bucketname, v_prefix_lower, v_upper_bound;

        IF v_peek_name IS NOT NULL THEN
            v_next_seek := lower(v_peek_name) || v_delimiter;
        ELSE
            RETURN;
        END IF;
    END IF;

    -- ========================================================================
    -- MAIN LOOP: Hybrid peek-then-batch algorithm
    -- Uses STATIC SQL for peek (hot path) and DYNAMIC SQL for batch and
    -- the delete-marker-only path
    -- ========================================================================
    LOOP
        EXIT WHEN v_count >= v_limit;

        v_previous_seek := v_next_seek;
        v_previous_seek_at := v_next_seek_at;
        v_previous_seek_version := v_next_seek_version;
        v_previous_count := v_count;
        v_previous_skipped := v_skipped;

        -- STEP 1: PEEK
        v_peek_name := NULL;
        IF delete_markers = 'only' THEN
            EXECUTE CASE WHEN v_next_seek_strict
                THEN v_delete_marker_peek_query_strict
                ELSE v_delete_marker_peek_query
            END
                INTO v_peek_name
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END,
                    1, v_next_seek_at, v_next_seek_version;
        ELSIF v_multi_row AND v_next_seek_at IS NOT NULL THEN
            SELECT o.name INTO v_peek_name
            FROM storage.objects o
            WHERE o.bucket_id = bucketname
              AND lower(o.name) COLLATE "C" = v_next_seek
              AND (COALESCE(o.archived_at, 'infinity'::timestamptz) < v_next_seek_at
                   OR (COALESCE(o.archived_at, 'infinity'::timestamptz) = v_next_seek_at
                       AND COALESCE(o.version, '') > v_next_seek_version))
              AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
              AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
              AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
              AND (delete_markers != 'only' OR o.is_delete_marker)
            ORDER BY COALESCE(o.archived_at, 'infinity'::timestamptz) DESC,
                     COALESCE(o.version, '') ASC
            LIMIT 1;

            -- The current key is exhausted. Clear its version boundary and
            -- make the following ASC name peek strict. Appending '/' is not a
            -- valid lexical successor because keys ending in characters such
            -- as '!' sort between the exhausted name and name || '/'.
            IF v_peek_name IS NULL THEN
                IF v_is_asc THEN
                    v_next_seek_strict := true;
                END IF;
                v_next_seek_at := NULL;
                v_next_seek_version := '';
            END IF;
        END IF;

        -- Single-row mode is always noncurrent_versions='exclude'. Keep the
        -- current-row predicate literal so generic plans use the current index.
        IF delete_markers != 'only' AND v_peek_name IS NULL AND NOT v_multi_row THEN
            IF v_is_asc THEN
                IF v_next_seek_strict AND v_upper_bound IS NOT NULL THEN
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" > v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                    ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
                ELSIF v_next_seek_strict THEN
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" > v_next_seek
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                    ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
                ELSIF v_upper_bound IS NOT NULL THEN
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                    ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
                ELSE
                    SELECT o.name INTO v_peek_name FROM storage.objects o
                    WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                      AND o.archived_at IS NULL
                      AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                    ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
                END IF;
            ELSIF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                  AND o.archived_at IS NULL
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                  AND o.archived_at IS NULL
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        ELSIF delete_markers != 'only' AND v_peek_name IS NULL AND v_is_asc THEN
            IF v_next_seek_strict AND v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" > v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                  AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                  AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                  AND (delete_markers != 'only' OR o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSIF v_next_seek_strict THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" > v_next_seek
                  AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                  AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                  AND (delete_markers != 'only' OR o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSIF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek AND lower(o.name) COLLATE "C" < v_upper_bound
                  AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                  AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                  AND (delete_markers != 'only' OR o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" >= v_next_seek
                  AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                  AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                  AND (delete_markers != 'only' OR o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" ASC LIMIT 1;
            END IF;
        ELSIF delete_markers != 'only' AND v_peek_name IS NULL THEN
            IF v_upper_bound IS NOT NULL THEN
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek AND lower(o.name) COLLATE "C" >= v_prefix_lower
                  AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                  AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                  AND (delete_markers != 'only' OR o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            ELSE
                SELECT o.name INTO v_peek_name FROM storage.objects o
                WHERE o.bucket_id = bucketname AND lower(o.name) COLLATE "C" < v_next_seek
                  AND (noncurrent_versions != 'exclude' OR o.archived_at IS NULL)
                  AND (noncurrent_versions != 'only' OR o.archived_at IS NOT NULL)
                  AND (delete_markers != 'exclude' OR NOT o.is_delete_marker)
                  AND (delete_markers != 'only' OR o.is_delete_marker)
                ORDER BY lower(o.name) COLLATE "C" DESC LIMIT 1;
            END IF;
        END IF;

        EXIT WHEN v_peek_name IS NULL;

        -- If the peek landed on a different key than we were tracking, any
        -- version boundary belongs to the OLD key and must not leak into the
        -- new one - e.g. the deleteMarkers='only' peek doesn't know or care
        -- whether it's continuing the same key or jumping to a new one, so
        -- it never clears these itself.
        IF lower(v_peek_name) IS DISTINCT FROM v_next_seek THEN
            v_next_seek_at := NULL;
            v_next_seek_version := '';
        END IF;

        -- The peek is authoritative for the next key to process. This is
        -- especially important after exhausting a multi-version key: the
        -- version boundary has been cleared, so executing the batch against
        -- a stale v_next_seek would replay every version of that old key.
        v_next_seek := lower(v_peek_name);
        v_next_seek_strict := false;

        -- STEP 2: Check if this is a FOLDER or FILE
        v_common_prefix := storage.get_common_prefix(lower(v_peek_name), v_prefix_lower, v_delimiter);

        IF v_common_prefix IS NOT NULL THEN
            -- FOLDER: Handle offset, emit if needed, skip to next folder
            IF v_skipped < offsets THEN
                v_skipped := v_skipped + 1;
            ELSE
                name := substring(rtrim(storage.get_common_prefix(v_peek_name, v_prefix, v_delimiter), v_delimiter) from v_prefix_len + 1);
                id := NULL;
                updated_at := NULL;
                created_at := NULL;
                last_accessed_at := NULL;
                metadata := NULL;
                version := NULL;
                archived_at := NULL;
                is_delete_marker := NULL;
                is_versioned := NULL;
                RETURN NEXT;
                v_count := v_count + 1;
            END IF;

            -- Advance seek past the folder range
            IF v_is_asc THEN
                v_next_seek := lower(left(v_common_prefix, -1)) || chr(ascii(v_delimiter) + 1);
            ELSE
                v_next_seek := lower(v_common_prefix);
            END IF;
            v_next_seek_at := NULL;
            v_next_seek_version := '';
        ELSE
            -- FILE: Batch fetch using DYNAMIC SQL (overhead amortized over many rows)
            -- For ASC: upper_bound is the exclusive upper limit (< condition)
            -- For DESC: prefix_lower is the inclusive lower limit (>= condition)
            FOR v_current IN EXECUTE v_batch_query
                USING bucketname, v_next_seek,
                    CASE WHEN v_is_asc THEN COALESCE(v_upper_bound, v_prefix_lower) ELSE v_prefix_lower END, v_file_batch_size,
                    v_next_seek_at, v_next_seek_version
            LOOP
                v_common_prefix := storage.get_common_prefix(lower(v_current.name), v_prefix_lower, v_delimiter);

                IF v_common_prefix IS NOT NULL THEN
                    -- Hit a folder: exit batch, let peek handle it. Reset
                    -- strict mode too - it may have been set by an earlier
                    -- row in this same batch (see the single-row ASC advance
                    -- below), and v_next_seek here is the folder-triggering
                    -- row's own name, which the next peek must find inclusively.
                    v_next_seek := CASE
                        WHEN v_is_asc THEN lower(v_current.name)
                        ELSE lower(v_current.name) || v_delimiter
                    END;
                    v_next_seek_at := NULL;
                    v_next_seek_version := '';
                    v_next_seek_strict := false;
                    EXIT;
                END IF;

                -- Handle offset skipping
                IF v_skipped < offsets THEN
                    v_skipped := v_skipped + 1;
                ELSE
                    -- Emit file
                    name := substring(v_current.name from v_prefix_len + 1);
                    id := v_current.id;
                    updated_at := v_current.updated_at;
                    created_at := v_current.created_at;
                    last_accessed_at := v_current.last_accessed_at;
                    metadata := v_current.metadata;
                    version := v_current.version;
                    archived_at := v_current.archived_at;
                    is_delete_marker := v_current.is_delete_marker;
                    is_versioned := v_current.is_versioned;
                    RETURN NEXT;
                    v_count := v_count + 1;
                END IF;

                -- Multi-row mode must remain on this key until all of its
                -- versions have crossed the internal batch boundary.
                IF v_multi_row THEN
                    v_next_seek := lower(v_current.name);
                    v_next_seek_at := COALESCE(v_current.archived_at, 'infinity'::timestamptz);
                    v_next_seek_version := COALESCE(v_current.version, '');
                ELSIF v_is_asc THEN
                    -- Appending the delimiter as a fake lexical successor would
                    -- skip a real key like `name || '!'` (or any character
                    -- sorting below the delimiter), which sorts between `name`
                    -- and `name || delimiter`. Track the real name and mark the
                    -- next comparison strict instead - same fix as the
                    -- exhausted-key case above.
                    v_next_seek := lower(v_current.name);
                    v_next_seek_strict := true;
                ELSE
                    v_next_seek := lower(v_current.name);
                END IF;

                EXIT WHEN v_count >= v_limit;
            END LOOP;
        END IF;

        IF v_count = v_previous_count
           AND v_skipped = v_previous_skipped
           AND v_next_seek IS NOT DISTINCT FROM v_previous_seek
           AND v_next_seek_at IS NOT DISTINCT FROM v_previous_seek_at
           AND v_next_seek_version IS NOT DISTINCT FROM v_previous_seek_version THEN
            RAISE EXCEPTION 'storage.search made no progress at seek (%, %, %)',
                v_next_seek, v_next_seek_at, v_next_seek_version;
        END IF;
    END LOOP;
END;
$_$;


--
-- Name: search_by_timestamp(text, text, integer, integer, text, text, text, text, text, text, text); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_by_timestamp(p_prefix text, p_bucket_id text, p_limit integer, p_level integer, p_start_after text, p_sort_order text, p_sort_column text, p_sort_column_after text, noncurrent_versions text DEFAULT 'exclude'::text, delete_markers text DEFAULT 'exclude'::text, p_start_after_version text DEFAULT ''::text) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb, version text, archived_at timestamp with time zone, is_delete_marker boolean, is_versioned boolean)
    LANGUAGE plpgsql STABLE
    AS $_$
DECLARE
    v_cursor_op text;
    v_query text;
    v_prefix text;
    v_prefix_pattern text;
    v_sort_order text;
    v_sort_column text;
    v_version_tiebreak text;
BEGIN
    v_prefix := coalesce(p_prefix, '');
    -- Keep the raw prefix for common-prefix calculations and escape only LIKE metacharacters.
    v_prefix_pattern := replace(v_prefix, chr(92), chr(92) || chr(92));
    v_prefix_pattern := replace(v_prefix_pattern, '%', chr(92) || '%');
    v_prefix_pattern := replace(v_prefix_pattern, '_', chr(92) || '_');

    -- COALESCE first: NULL NOT IN (...) evaluates to NULL (not TRUE), so a
    -- bare NOT IN check silently leaves an explicit NULL argument unreset.
    noncurrent_versions := COALESCE(noncurrent_versions, 'exclude');
    delete_markers := COALESCE(delete_markers, 'exclude');
    IF noncurrent_versions NOT IN ('exclude', 'only', 'include') THEN
        noncurrent_versions := 'exclude';
    END IF;
    IF delete_markers NOT IN ('exclude', 'only', 'include') THEN
        delete_markers := 'exclude';
    END IF;

    -- $9 is only populated in multi-row mode; it's always '' otherwise, so
    -- only use each row's real version as a tiebreak in multi-row mode.
    v_version_tiebreak := CASE WHEN noncurrent_versions IN ('only', 'include') THEN 'COALESCE(version, '''')' ELSE '''''' END;

    -- Defense-in-depth: this function is independently reachable and must
    -- not trust p_sort_order/p_sort_column to already be validated by a
    -- caller. Normalize to the same strict allow-list storage.search_v2
    -- uses before interpolating anything into dynamic SQL below.
    v_sort_order := lower(coalesce(p_sort_order, 'asc'));
    IF v_sort_order NOT IN ('asc', 'desc') THEN
        v_sort_order := 'asc';
    END IF;

    v_sort_column := lower(coalesce(p_sort_column, 'updated_at'));
    IF v_sort_column NOT IN ('updated_at', 'created_at') THEN
        v_sort_column := 'updated_at';
    END IF;

    IF v_sort_order = 'asc' THEN
        v_cursor_op := '>';
    ELSE
        v_cursor_op := '<';
    END IF;

    v_query := format($sql$
        WITH raw_objects AS (
            SELECT
                o.name AS obj_name,
                o.id AS obj_id,
                o.updated_at AS obj_updated_at,
                o.created_at AS obj_created_at,
                o.last_accessed_at AS obj_last_accessed_at,
                o.metadata AS obj_metadata,
                o.version AS obj_version,
                o.archived_at AS obj_archived_at,
                o.is_delete_marker AS obj_is_delete_marker,
                o.is_versioned AS obj_is_versioned,
                storage.get_common_prefix(o.name, $1, '/') AS common_prefix
            FROM storage.objects o
            WHERE o.bucket_id = $2
              AND o.name COLLATE "C" LIKE $10 || '%%'
              AND ($7 != 'exclude' OR o.archived_at IS NULL)
              AND ($7 != 'only' OR o.archived_at IS NOT NULL)
              AND ($8 != 'exclude' OR NOT o.is_delete_marker)
              AND ($8 != 'only' OR o.is_delete_marker)
        ),
        -- Aggregate common prefixes (folders)
        -- Both created_at and updated_at use MIN(obj_created_at) to match the old prefixes table behavior
        aggregated_prefixes AS (
            SELECT
                common_prefix AS name,
                NULL::uuid AS id,
                MIN(obj_created_at) AS updated_at,
                MIN(obj_created_at) AS created_at,
                NULL::timestamptz AS last_accessed_at,
                NULL::jsonb AS metadata,
                NULL::text AS version,
                NULL::timestamptz AS archived_at,
                NULL::boolean AS is_delete_marker,
                NULL::boolean AS is_versioned,
                TRUE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NOT NULL
            GROUP BY common_prefix
        ),
        leaf_objects AS (
            SELECT
                obj_name AS name,
                obj_id AS id,
                obj_updated_at AS updated_at,
                obj_created_at AS created_at,
                obj_last_accessed_at AS last_accessed_at,
                obj_metadata AS metadata,
                obj_version AS version,
                obj_archived_at AS archived_at,
                obj_is_delete_marker AS is_delete_marker,
                obj_is_versioned AS is_versioned,
                FALSE AS is_prefix
            FROM raw_objects
            WHERE common_prefix IS NULL
        ),
        combined AS (
            SELECT * FROM aggregated_prefixes
            UNION ALL
            SELECT * FROM leaf_objects
        ),
        filtered AS (
            SELECT *
            FROM combined
            WHERE (
                $5 = ''
                OR ROW(
                    COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz),
                    name COLLATE "C",
                    %s
                ) %s ROW(
                    -- truncated the same way as the stored value above
                    date_trunc('milliseconds', COALESCE(NULLIF($6, '')::timestamptz, 'epoch'::timestamptz)),
                    $5,
                    $9
                )
            )
        )
        SELECT
            split_part(name, '/', $3) AS key,
            name,
            id,
            updated_at,
            created_at,
            last_accessed_at,
            metadata,
            version,
            archived_at,
            is_delete_marker,
            is_versioned
        FROM filtered
        ORDER BY
            COALESCE(date_trunc('milliseconds', %I), 'epoch'::timestamptz) %s,
            name COLLATE "C" %s,
            COALESCE(version, '') %s
        LIMIT $4
    $sql$,
        v_sort_column,
        v_version_tiebreak,
        v_cursor_op,
        v_sort_column,
        v_sort_order,
        v_sort_order,
        v_sort_order
    );

    -- version is the third tiebreak component for two versions of the same
    -- key tying on both timestamp and name (see filtered CTE / ORDER BY above)
    RETURN QUERY EXECUTE v_query
    USING v_prefix, p_bucket_id, p_level, p_limit, p_start_after, p_sort_column_after, noncurrent_versions, delete_markers, coalesce(p_start_after_version, ''), v_prefix_pattern;
END;
$_$;


--
-- Name: search_v2(text, text, integer, integer, text, text, text, text, text, text, timestamp with time zone, text, boolean); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.search_v2(prefix text, bucket_name text, limits integer DEFAULT 100, levels integer DEFAULT 1, start_after text DEFAULT ''::text, sort_order text DEFAULT 'asc'::text, sort_column text DEFAULT 'name'::text, sort_column_after text DEFAULT ''::text, noncurrent_versions text DEFAULT 'exclude'::text, delete_markers text DEFAULT 'exclude'::text, start_after_archived_at timestamp with time zone DEFAULT NULL::timestamp with time zone, start_after_version text DEFAULT ''::text, start_after_is_continuation boolean DEFAULT false) RETURNS TABLE(key text, name text, id uuid, updated_at timestamp with time zone, created_at timestamp with time zone, last_accessed_at timestamp with time zone, metadata jsonb, version text, archived_at timestamp with time zone, is_delete_marker boolean, is_versioned boolean)
    LANGUAGE plpgsql STABLE
    AS $$
DECLARE
    v_sort_col text;
    v_sort_ord text;
    v_limit int;
BEGIN
    -- Cap limit to maximum of 1500 records
    v_limit := LEAST(coalesce(limits, 100), 1500);

    -- Validate and normalize sort_order
    v_sort_ord := lower(coalesce(sort_order, 'asc'));
    IF v_sort_ord NOT IN ('asc', 'desc') THEN
        v_sort_ord := 'asc';
    END IF;

    -- Validate and normalize sort_column
    v_sort_col := lower(coalesce(sort_column, 'name'));
    IF v_sort_col NOT IN ('name', 'updated_at', 'created_at') THEN
        v_sort_col := 'name';
    END IF;

    -- Route to appropriate implementation
    IF v_sort_col = 'name' THEN
        -- Use list_objects_with_delimiter for name sorting (most efficient: O(k * log n))
        RETURN QUERY
        SELECT
            split_part(l.name, '/', levels) AS key,
            l.name AS name,
            l.id,
            l.updated_at,
            l.created_at,
            l.last_accessed_at,
            l.metadata,
            l.version,
            l.archived_at,
            l.is_delete_marker,
            l.is_versioned
        FROM storage.list_objects_with_delimiter(
            bucket_name,
            coalesce(prefix, ''),
            '/',
            v_limit,
            CASE WHEN start_after_is_continuation THEN '' ELSE start_after END,
            CASE WHEN start_after_is_continuation THEN start_after ELSE '' END,
            v_sort_ord,
            noncurrent_versions,
            delete_markers,
            start_after_archived_at,
            start_after_version
        ) l;
    ELSE
        -- Use aggregation approach for timestamp sorting
        -- Not efficient for large datasets but supports correct pagination
        RETURN QUERY SELECT * FROM storage.search_by_timestamp(
            prefix, bucket_name, v_limit, levels, start_after,
            v_sort_ord, v_sort_col, sort_column_after,
            noncurrent_versions, delete_markers, start_after_version
        );
    END IF;
END;
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW; 
END;
$$;


--
-- Name: wake_lifecycle_state(); Type: FUNCTION; Schema: storage; Owner: -
--

CREATE FUNCTION storage.wake_lifecycle_state() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.lifecycle_configuration IS NULL THEN
        RETURN NEW;
    END IF;

    PERFORM storage.reconcile_lifecycle_state(NEW.id, false);
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: audit_log_entries; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.audit_log_entries (
    instance_id uuid,
    id uuid NOT NULL,
    payload json,
    created_at timestamp with time zone,
    ip_address character varying(64) DEFAULT ''::character varying NOT NULL
);


--
-- Name: TABLE audit_log_entries; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.audit_log_entries IS 'Auth: Audit trail for user actions.';


--
-- Name: custom_oauth_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.custom_oauth_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_type text NOT NULL,
    identifier text NOT NULL,
    name text NOT NULL,
    client_id text NOT NULL,
    client_secret text NOT NULL,
    acceptable_client_ids text[] DEFAULT '{}'::text[] NOT NULL,
    scopes text[] DEFAULT '{}'::text[] NOT NULL,
    pkce_enabled boolean DEFAULT true NOT NULL,
    attribute_mapping jsonb DEFAULT '{}'::jsonb NOT NULL,
    authorization_params jsonb DEFAULT '{}'::jsonb NOT NULL,
    enabled boolean DEFAULT true NOT NULL,
    email_optional boolean DEFAULT false NOT NULL,
    issuer text,
    discovery_url text,
    skip_nonce_check boolean DEFAULT false NOT NULL,
    cached_discovery jsonb,
    discovery_cached_at timestamp with time zone,
    authorization_url text,
    token_url text,
    userinfo_url text,
    jwks_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    custom_claims_allowlist text[] DEFAULT '{}'::text[] NOT NULL,
    CONSTRAINT custom_oauth_providers_authorization_url_https CHECK (((authorization_url IS NULL) OR (authorization_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_authorization_url_length CHECK (((authorization_url IS NULL) OR (char_length(authorization_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_client_id_length CHECK (((char_length(client_id) >= 1) AND (char_length(client_id) <= 512))),
    CONSTRAINT custom_oauth_providers_discovery_url_length CHECK (((discovery_url IS NULL) OR (char_length(discovery_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_identifier_format CHECK ((identifier ~ '^[a-z0-9][a-z0-9:-]{0,48}[a-z0-9]$'::text)),
    CONSTRAINT custom_oauth_providers_issuer_length CHECK (((issuer IS NULL) OR ((char_length(issuer) >= 1) AND (char_length(issuer) <= 2048)))),
    CONSTRAINT custom_oauth_providers_jwks_uri_https CHECK (((jwks_uri IS NULL) OR (jwks_uri ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_jwks_uri_length CHECK (((jwks_uri IS NULL) OR (char_length(jwks_uri) <= 2048))),
    CONSTRAINT custom_oauth_providers_name_length CHECK (((char_length(name) >= 1) AND (char_length(name) <= 100))),
    CONSTRAINT custom_oauth_providers_oauth2_requires_endpoints CHECK (((provider_type <> 'oauth2'::text) OR ((authorization_url IS NOT NULL) AND (token_url IS NOT NULL) AND (userinfo_url IS NOT NULL)))),
    CONSTRAINT custom_oauth_providers_oidc_discovery_url_https CHECK (((provider_type <> 'oidc'::text) OR (discovery_url IS NULL) OR (discovery_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_issuer_https CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NULL) OR (issuer ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_oidc_requires_issuer CHECK (((provider_type <> 'oidc'::text) OR (issuer IS NOT NULL))),
    CONSTRAINT custom_oauth_providers_provider_type_check CHECK ((provider_type = ANY (ARRAY['oauth2'::text, 'oidc'::text]))),
    CONSTRAINT custom_oauth_providers_token_url_https CHECK (((token_url IS NULL) OR (token_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_token_url_length CHECK (((token_url IS NULL) OR (char_length(token_url) <= 2048))),
    CONSTRAINT custom_oauth_providers_userinfo_url_https CHECK (((userinfo_url IS NULL) OR (userinfo_url ~~ 'https://%'::text))),
    CONSTRAINT custom_oauth_providers_userinfo_url_length CHECK (((userinfo_url IS NULL) OR (char_length(userinfo_url) <= 2048)))
);


--
-- Name: flow_state; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.flow_state (
    id uuid NOT NULL,
    user_id uuid,
    auth_code text,
    code_challenge_method auth.code_challenge_method,
    code_challenge text,
    provider_type text NOT NULL,
    provider_access_token text,
    provider_refresh_token text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    authentication_method text NOT NULL,
    auth_code_issued_at timestamp with time zone,
    invite_token text,
    referrer text,
    oauth_client_state_id uuid,
    linking_target_id uuid,
    email_optional boolean DEFAULT false NOT NULL
);


--
-- Name: TABLE flow_state; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.flow_state IS 'Stores metadata for all OAuth/SSO login flows';


--
-- Name: identities; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.identities (
    provider_id text NOT NULL,
    user_id uuid NOT NULL,
    identity_data jsonb NOT NULL,
    provider text NOT NULL,
    last_sign_in_at timestamp with time zone,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    email text GENERATED ALWAYS AS (lower((identity_data ->> 'email'::text))) STORED,
    id uuid DEFAULT gen_random_uuid() NOT NULL
);


--
-- Name: TABLE identities; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.identities IS 'Auth: Stores identities associated to a user.';


--
-- Name: COLUMN identities.email; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.identities.email IS 'Auth: Email is a generated column that references the optional email property in the identity_data';


--
-- Name: instances; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.instances (
    id uuid NOT NULL,
    uuid uuid,
    raw_base_config text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
);


--
-- Name: TABLE instances; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.instances IS 'Auth: Manages users across multiple sites.';


--
-- Name: mfa_amr_claims; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_amr_claims (
    session_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    authentication_method text NOT NULL,
    id uuid NOT NULL
);


--
-- Name: TABLE mfa_amr_claims; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_amr_claims IS 'auth: stores authenticator method reference claims for multi factor authentication';


--
-- Name: mfa_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_challenges (
    id uuid NOT NULL,
    factor_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL,
    verified_at timestamp with time zone,
    ip_address inet NOT NULL,
    otp_code text,
    web_authn_session_data jsonb
);


--
-- Name: TABLE mfa_challenges; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_challenges IS 'auth: stores metadata about challenge requests made';


--
-- Name: mfa_factors; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_factors (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    friendly_name text,
    factor_type auth.factor_type NOT NULL,
    status auth.factor_status NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    secret text,
    phone text,
    last_challenged_at timestamp with time zone,
    web_authn_credential jsonb,
    web_authn_aaguid uuid,
    last_webauthn_challenge_data jsonb
);


--
-- Name: TABLE mfa_factors; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.mfa_factors IS 'auth: stores metadata about factors';


--
-- Name: COLUMN mfa_factors.last_webauthn_challenge_data; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.mfa_factors.last_webauthn_challenge_data IS 'Stores the latest WebAuthn challenge data including attestation/assertion for customer verification';


--
-- Name: mfa_recovery_code_sets; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_recovery_code_sets (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    mfa_factor_id uuid NOT NULL,
    failed_verification_count integer DEFAULT 0 NOT NULL,
    verification_locked_until timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT mfa_recovery_code_sets_failed_verification_count_check CHECK ((failed_verification_count >= 0))
);


--
-- Name: mfa_recovery_codes; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.mfa_recovery_codes (
    id uuid NOT NULL,
    mfa_recovery_code_set_id uuid NOT NULL,
    code_hash text NOT NULL,
    consumed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: oauth_authorizations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_authorizations (
    id uuid NOT NULL,
    authorization_id text NOT NULL,
    client_id uuid NOT NULL,
    user_id uuid,
    redirect_uri text NOT NULL,
    scope text NOT NULL,
    state text,
    resource text,
    code_challenge text,
    code_challenge_method auth.code_challenge_method,
    response_type auth.oauth_response_type DEFAULT 'code'::auth.oauth_response_type NOT NULL,
    status auth.oauth_authorization_status DEFAULT 'pending'::auth.oauth_authorization_status NOT NULL,
    authorization_code text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone DEFAULT (now() + '00:03:00'::interval) NOT NULL,
    approved_at timestamp with time zone,
    nonce text,
    CONSTRAINT oauth_authorizations_authorization_code_length CHECK ((char_length(authorization_code) <= 255)),
    CONSTRAINT oauth_authorizations_code_challenge_length CHECK ((char_length(code_challenge) <= 128)),
    CONSTRAINT oauth_authorizations_expires_at_future CHECK ((expires_at > created_at)),
    CONSTRAINT oauth_authorizations_nonce_length CHECK ((char_length(nonce) <= 255)),
    CONSTRAINT oauth_authorizations_redirect_uri_length CHECK ((char_length(redirect_uri) <= 2048)),
    CONSTRAINT oauth_authorizations_resource_length CHECK ((char_length(resource) <= 2048)),
    CONSTRAINT oauth_authorizations_scope_length CHECK ((char_length(scope) <= 4096)),
    CONSTRAINT oauth_authorizations_state_length CHECK ((char_length(state) <= 4096))
);


--
-- Name: oauth_client_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_client_states (
    id uuid NOT NULL,
    provider_type text NOT NULL,
    code_verifier text,
    created_at timestamp with time zone NOT NULL
);


--
-- Name: TABLE oauth_client_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.oauth_client_states IS 'Stores OAuth states for third-party provider authentication flows where Supabase acts as the OAuth client.';


--
-- Name: oauth_clients; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_clients (
    id uuid NOT NULL,
    client_secret_hash text,
    registration_type auth.oauth_registration_type NOT NULL,
    redirect_uris text NOT NULL,
    grant_types text NOT NULL,
    client_name text,
    client_uri text,
    logo_uri text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone,
    client_type auth.oauth_client_type DEFAULT 'confidential'::auth.oauth_client_type NOT NULL,
    token_endpoint_auth_method text NOT NULL,
    CONSTRAINT oauth_clients_client_name_length CHECK ((char_length(client_name) <= 1024)),
    CONSTRAINT oauth_clients_client_uri_length CHECK ((char_length(client_uri) <= 2048)),
    CONSTRAINT oauth_clients_logo_uri_length CHECK ((char_length(logo_uri) <= 2048)),
    CONSTRAINT oauth_clients_token_endpoint_auth_method_check CHECK ((token_endpoint_auth_method = ANY (ARRAY['client_secret_basic'::text, 'client_secret_post'::text, 'none'::text])))
);


--
-- Name: oauth_consents; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.oauth_consents (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    client_id uuid NOT NULL,
    scopes text NOT NULL,
    granted_at timestamp with time zone DEFAULT now() NOT NULL,
    revoked_at timestamp with time zone,
    CONSTRAINT oauth_consents_revoked_after_granted CHECK (((revoked_at IS NULL) OR (revoked_at >= granted_at))),
    CONSTRAINT oauth_consents_scopes_length CHECK ((char_length(scopes) <= 2048)),
    CONSTRAINT oauth_consents_scopes_not_empty CHECK ((char_length(TRIM(BOTH FROM scopes)) > 0))
);


--
-- Name: one_time_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.one_time_tokens (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    token_type auth.one_time_token_type NOT NULL,
    token_hash text NOT NULL,
    relates_to text NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL,
    updated_at timestamp without time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    link_token_hash text,
    CONSTRAINT one_time_tokens_token_hash_check CHECK ((char_length(token_hash) > 0))
);


--
-- Name: refresh_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.refresh_tokens (
    instance_id uuid,
    id bigint NOT NULL,
    token character varying(255),
    user_id character varying(255),
    revoked boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    parent character varying(255),
    session_id uuid
);


--
-- Name: TABLE refresh_tokens; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.refresh_tokens IS 'Auth: Store of tokens used to refresh JWT tokens once they expire.';


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE; Schema: auth; Owner: -
--

CREATE SEQUENCE auth.refresh_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: auth; Owner: -
--

ALTER SEQUENCE auth.refresh_tokens_id_seq OWNED BY auth.refresh_tokens.id;


--
-- Name: saml_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_providers (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    entity_id text NOT NULL,
    metadata_xml text NOT NULL,
    metadata_url text,
    attribute_mapping jsonb,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    name_id_format text,
    dedicated_scope boolean,
    CONSTRAINT "entity_id not empty" CHECK ((char_length(entity_id) > 0)),
    CONSTRAINT "metadata_url not empty" CHECK (((metadata_url = NULL::text) OR (char_length(metadata_url) > 0))),
    CONSTRAINT "metadata_xml not empty" CHECK ((char_length(metadata_xml) > 0))
);


--
-- Name: TABLE saml_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_providers IS 'Auth: Manages SAML Identity Provider connections.';


--
-- Name: saml_relay_states; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.saml_relay_states (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    request_id text NOT NULL,
    for_email text,
    redirect_to text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    flow_state_id uuid,
    CONSTRAINT "request_id not empty" CHECK ((char_length(request_id) > 0))
);


--
-- Name: TABLE saml_relay_states; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.saml_relay_states IS 'Auth: Contains SAML Relay State information for each Service Provider initiated login.';


--
-- Name: schema_migrations; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: TABLE schema_migrations; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.schema_migrations IS 'Auth: Manages updates to the auth system.';


--
-- Name: scim_tokens; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.scim_tokens (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    token_hash text NOT NULL,
    prefix text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone,
    revoked_at timestamp with time zone,
    last_used_at timestamp with time zone,
    CONSTRAINT scim_tokens_expires_at_future CHECK (((expires_at IS NULL) OR (expires_at > created_at))),
    CONSTRAINT scim_tokens_revoked_after_created CHECK (((revoked_at IS NULL) OR (revoked_at >= created_at))),
    CONSTRAINT scim_tokens_token_hash_check CHECK ((token_hash ~ '^[0-9a-f]{64}$'::text))
);


--
-- Name: scim_users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.scim_users (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    user_id uuid,
    resource jsonb NOT NULL,
    user_name text GENERATED ALWAYS AS (lower((resource ->> 'userName'::text))) STORED NOT NULL,
    external_id text GENERATED ALWAYS AS ((resource ->> 'externalId'::text)) STORED,
    active boolean GENERATED ALWAYS AS (COALESCE(((resource ->> 'active'::text))::boolean, true)) STORED NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: sessions; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sessions (
    id uuid NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    factor_id uuid,
    aal auth.aal_level,
    not_after timestamp with time zone,
    refreshed_at timestamp without time zone,
    user_agent text,
    ip inet,
    tag text,
    oauth_client_id uuid,
    refresh_token_hmac_key text,
    refresh_token_counter bigint,
    scopes text,
    CONSTRAINT sessions_scopes_length CHECK ((char_length(scopes) <= 4096))
);


--
-- Name: TABLE sessions; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sessions IS 'Auth: Stores session data associated to a user.';


--
-- Name: COLUMN sessions.not_after; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.not_after IS 'Auth: Not after is a nullable column that contains a timestamp after which the session should be regarded as expired.';


--
-- Name: COLUMN sessions.refresh_token_hmac_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_hmac_key IS 'Holds a HMAC-SHA256 key used to sign refresh tokens for this session.';


--
-- Name: COLUMN sessions.refresh_token_counter; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sessions.refresh_token_counter IS 'Holds the ID (counter) of the last issued refresh token.';


--
-- Name: sso_domains; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_domains (
    id uuid NOT NULL,
    sso_provider_id uuid NOT NULL,
    domain text NOT NULL,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    CONSTRAINT "domain not empty" CHECK ((char_length(domain) > 0))
);


--
-- Name: TABLE sso_domains; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_domains IS 'Auth: Manages SSO email address domain mapping to an SSO Identity Provider.';


--
-- Name: sso_providers; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.sso_providers (
    id uuid NOT NULL,
    resource_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    disabled boolean,
    CONSTRAINT "resource_id not empty" CHECK (((resource_id = NULL::text) OR (char_length(resource_id) > 0)))
);


--
-- Name: TABLE sso_providers; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.sso_providers IS 'Auth: Manages SSO identity provider information; see saml_providers for SAML.';


--
-- Name: COLUMN sso_providers.resource_id; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.sso_providers.resource_id IS 'Auth: Uniquely identifies a SSO provider according to a user-chosen resource ID (case insensitive), useful in infrastructure as code.';


--
-- Name: users; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.users (
    instance_id uuid,
    id uuid NOT NULL,
    aud character varying(255),
    role character varying(255),
    email character varying(255),
    encrypted_password character varying(255),
    email_confirmed_at timestamp with time zone,
    invited_at timestamp with time zone,
    confirmation_token character varying(255),
    confirmation_sent_at timestamp with time zone,
    recovery_token character varying(255),
    recovery_sent_at timestamp with time zone,
    email_change_token_new character varying(255),
    email_change character varying(255),
    email_change_sent_at timestamp with time zone,
    last_sign_in_at timestamp with time zone,
    raw_app_meta_data jsonb,
    raw_user_meta_data jsonb,
    is_super_admin boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    phone text DEFAULT NULL::character varying,
    phone_confirmed_at timestamp with time zone,
    phone_change text DEFAULT ''::character varying,
    phone_change_token character varying(255) DEFAULT ''::character varying,
    phone_change_sent_at timestamp with time zone,
    confirmed_at timestamp with time zone GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current character varying(255) DEFAULT ''::character varying,
    email_change_confirm_status smallint DEFAULT 0,
    banned_until timestamp with time zone,
    reauthentication_token character varying(255) DEFAULT ''::character varying,
    reauthentication_sent_at timestamp with time zone,
    is_sso_user boolean DEFAULT false NOT NULL,
    deleted_at timestamp with time zone,
    is_anonymous boolean DEFAULT false NOT NULL,
    CONSTRAINT users_email_change_confirm_status_check CHECK (((email_change_confirm_status >= 0) AND (email_change_confirm_status <= 2)))
);


--
-- Name: TABLE users; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON TABLE auth.users IS 'Auth: Stores user login data within a secure schema.';


--
-- Name: COLUMN users.is_sso_user; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON COLUMN auth.users.is_sso_user IS 'Auth: Set this column to true when the account comes from SSO. These accounts can have duplicate emails.';


--
-- Name: webauthn_challenges; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.webauthn_challenges (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    challenge_type text NOT NULL,
    session_data jsonb NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    CONSTRAINT webauthn_challenges_challenge_type_check CHECK ((challenge_type = ANY (ARRAY['signup'::text, 'registration'::text, 'authentication'::text])))
);


--
-- Name: webauthn_credentials; Type: TABLE; Schema: auth; Owner: -
--

CREATE TABLE auth.webauthn_credentials (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    credential_id bytea NOT NULL,
    public_key bytea NOT NULL,
    attestation_type text DEFAULT ''::text NOT NULL,
    aaguid uuid,
    sign_count bigint DEFAULT 0 NOT NULL,
    transports jsonb DEFAULT '[]'::jsonb NOT NULL,
    backup_eligible boolean DEFAULT false NOT NULL,
    backed_up boolean DEFAULT false NOT NULL,
    friendly_name text DEFAULT ''::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    last_used_at timestamp with time zone
);


--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


--
-- Name: annees_scolaires; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.annees_scolaires (
    id integer NOT NULL,
    libelle character varying(20) NOT NULL,
    date_debut date NOT NULL,
    date_fin date NOT NULL,
    est_active boolean DEFAULT false,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: annees_scolaires_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.annees_scolaires_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: annees_scolaires_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.annees_scolaires_id_seq OWNED BY public.annees_scolaires.id;


--
-- Name: annonces; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.annonces (
    id integer NOT NULL,
    titre character varying(255) NOT NULL,
    contenu text NOT NULL,
    cible character varying(50) DEFAULT 'tous'::character varying,
    type character varying(50) DEFAULT 'information'::character varying,
    classe_id integer,
    image_url text,
    date_publication timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    date_modification timestamp(6) without time zone,
    date_programmee timestamp(6) without time zone,
    publie_par integer
);


--
-- Name: annonces_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.annonces_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: annonces_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.annonces_id_seq OWNED BY public.annonces.id;


--
-- Name: articles_librairie; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.articles_librairie (
    id integer NOT NULL,
    nom character varying(255) NOT NULL,
    description text,
    prix_unitaire integer NOT NULL,
    quantite_stock integer DEFAULT 0,
    categorie character varying(100) DEFAULT 'fourniture'::character varying,
    image_url text,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    niveaux_cibles text[]
);


--
-- Name: articles_librairie_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.articles_librairie_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: articles_librairie_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.articles_librairie_id_seq OWNED BY public.articles_librairie.id;


--
-- Name: avances_salaires; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.avances_salaires (
    id integer NOT NULL,
    personnel_id integer NOT NULL,
    montant integer NOT NULL,
    motif text,
    date_avance timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    mois_deduction integer NOT NULL,
    annee_deduction integer NOT NULL,
    statut character varying(20) DEFAULT 'accorde'::character varying,
    accorde_par integer,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: avances_salaires_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.avances_salaires_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: avances_salaires_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.avances_salaires_id_seq OWNED BY public.avances_salaires.id;


--
-- Name: budget_previsionnel; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.budget_previsionnel (
    id integer NOT NULL,
    annee integer NOT NULL,
    categorie_code character varying(20) NOT NULL,
    montant_prevu integer DEFAULT 0 NOT NULL,
    notes text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: budget_previsionnel_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.budget_previsionnel_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: budget_previsionnel_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.budget_previsionnel_id_seq OWNED BY public.budget_previsionnel.id;


--
-- Name: bus; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bus (
    id integer NOT NULL,
    immatriculation character varying(50) NOT NULL,
    capacite integer,
    chauffeur_nom character varying(100),
    chauffeur_tel character varying(20)
);


--
-- Name: bus_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bus_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bus_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bus_id_seq OWNED BY public.bus.id;


--
-- Name: cantine_menus; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cantine_menus (
    id integer NOT NULL,
    date date NOT NULL,
    plat character varying(255),
    accompagnement character varying(255),
    dessert character varying(255),
    regime_special boolean DEFAULT false,
    prix integer,
    prix_annuel integer
);


--
-- Name: cantine_menus_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.cantine_menus_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: cantine_menus_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.cantine_menus_id_seq OWNED BY public.cantine_menus.id;


--
-- Name: categories_depenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories_depenses (
    id integer NOT NULL,
    code character varying(20) NOT NULL,
    libelle character varying(100) NOT NULL,
    type character varying(10) DEFAULT 'sortie'::character varying NOT NULL,
    description text,
    is_active boolean DEFAULT true,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: categories_depenses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_depenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categories_depenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categories_depenses_id_seq OWNED BY public.categories_depenses.id;


--
-- Name: categories_quiz; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.categories_quiz (
    id integer NOT NULL,
    nom character varying(100) NOT NULL,
    description text,
    couleur character varying(7) DEFAULT '#6B46C1'::character varying,
    icon character varying(50) DEFAULT 'BookOpen'::character varying,
    est_active boolean DEFAULT true,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: categories_quiz_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.categories_quiz_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: categories_quiz_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.categories_quiz_id_seq OWNED BY public.categories_quiz.id;


--
-- Name: classes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.classes (
    id integer NOT NULL,
    nom character varying(50) NOT NULL,
    niveau character varying(50) NOT NULL,
    salle character varying(50),
    capacite_max integer DEFAULT 30,
    titulaire_id integer,
    code_acces character varying(20),
    frais_inscription integer DEFAULT 0,
    annee_scolaire_id integer,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    premier_versement integer DEFAULT 0,
    deuxieme_versement integer DEFAULT 0,
    troisieme_versement integer DEFAULT 0,
    total_versement integer DEFAULT 0,
    reinscription_premier_versement integer DEFAULT 0,
    reinscription_deuxieme_versement integer DEFAULT 0,
    reinscription_troisieme_versement integer DEFAULT 0,
    reinscription_total_versement integer DEFAULT 0
);


--
-- Name: classes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.classes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: classes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.classes_id_seq OWNED BY public.classes.id;


--
-- Name: commandes_fournitures; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.commandes_fournitures (
    id integer NOT NULL,
    preinscription_id integer,
    article_id integer,
    quantite integer DEFAULT 1 NOT NULL,
    prix_unitaire integer NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: commandes_fournitures_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.commandes_fournitures_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: commandes_fournitures_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.commandes_fournitures_id_seq OWNED BY public.commandes_fournitures.id;


--
-- Name: commandes_librairie; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.commandes_librairie (
    id integer NOT NULL,
    parent_id integer,
    numero_commande character varying(50) NOT NULL,
    date_commande timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    statut character varying(20) DEFAULT 'en_attente'::character varying,
    total integer NOT NULL,
    observations text,
    date_traitement timestamp(6) without time zone,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    mode_paiement character varying(50) DEFAULT 'especes'::character varying,
    reference_paiement character varying(100)
);


--
-- Name: commandes_librairie_articles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.commandes_librairie_articles (
    id integer NOT NULL,
    commande_id integer,
    article_id integer,
    quantite integer NOT NULL,
    prix_unitaire integer NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: commandes_librairie_articles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.commandes_librairie_articles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: commandes_librairie_articles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.commandes_librairie_articles_id_seq OWNED BY public.commandes_librairie_articles.id;


--
-- Name: commandes_librairie_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.commandes_librairie_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: commandes_librairie_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.commandes_librairie_id_seq OWNED BY public.commandes_librairie.id;


--
-- Name: conges_personnel; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.conges_personnel (
    id integer NOT NULL,
    personnel_id integer NOT NULL,
    type_conge character varying(50) DEFAULT 'annuel'::character varying NOT NULL,
    date_debut date NOT NULL,
    date_fin date NOT NULL,
    nombre_jours integer,
    motif text,
    statut character varying(20) DEFAULT 'en_attente'::character varying,
    approuve_par integer,
    date_approbation timestamp(6) with time zone,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: conges_personnel_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.conges_personnel_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: conges_personnel_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.conges_personnel_id_seq OWNED BY public.conges_personnel.id;


--
-- Name: contrats_personnel; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.contrats_personnel (
    id integer NOT NULL,
    personnel_id integer NOT NULL,
    type_contrat character varying(50) DEFAULT 'CDI'::character varying NOT NULL,
    date_debut date NOT NULL,
    date_fin date,
    salaire_brut integer NOT NULL,
    salaire_net integer NOT NULL,
    heures_semaine numeric(5,2) DEFAULT 40,
    conges_annuels integer DEFAULT 25,
    observations text,
    is_actif boolean DEFAULT true,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: contrats_personnel_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.contrats_personnel_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: contrats_personnel_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.contrats_personnel_id_seq OWNED BY public.contrats_personnel.id;


--
-- Name: depenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.depenses (
    id integer NOT NULL,
    categorie character varying(100) NOT NULL,
    montant integer NOT NULL,
    description text,
    date_depense timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    sous_categorie character varying(100),
    reference character varying(100),
    fournisseur character varying(200),
    numero_recu character varying(100),
    saisi_par integer,
    valide_par integer,
    statut character varying(20) DEFAULT 'valide'::character varying,
    exercice_annee integer DEFAULT EXTRACT(year FROM now()),
    exercice_mois integer DEFAULT EXTRACT(month FROM now()),
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: depenses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.depenses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: depenses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.depenses_id_seq OWNED BY public.depenses.id;


--
-- Name: devoirs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.devoirs (
    id integer NOT NULL,
    enseignement_id integer,
    titre character varying(255) NOT NULL,
    description text,
    fichier_url text,
    date_limite date NOT NULL,
    date_publication date DEFAULT CURRENT_DATE
);


--
-- Name: devoirs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.devoirs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: devoirs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.devoirs_id_seq OWNED BY public.devoirs.id;


--
-- Name: echeances_paiement; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.echeances_paiement (
    id integer NOT NULL,
    preinscription_id integer,
    type character varying(50) NOT NULL,
    echeance character varying(50) NOT NULL,
    montant integer NOT NULL,
    date_echeance date,
    statut character varying(20) DEFAULT 'en_attente'::character varying,
    date_paiement date,
    reference_transaction character varying(100),
    mode_paiement character varying(50),
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    reinscription_id integer
);


--
-- Name: echeances_paiement_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.echeances_paiement_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: echeances_paiement_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.echeances_paiement_id_seq OWNED BY public.echeances_paiement.id;


--
-- Name: eleves; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.eleves (
    id integer NOT NULL,
    utilisateur_id integer,
    matricule character varying(50) NOT NULL,
    date_naissance date NOT NULL,
    lieu_naissance character varying(100),
    sexe character varying(1),
    nationalite character varying(50) DEFAULT 'Guinéenne'::character varying,
    classe_id integer,
    date_inscription date DEFAULT CURRENT_DATE,
    est_inscrit boolean DEFAULT true,
    carte_scolaire_url text,
    photo_url text,
    deleted_at timestamp without time zone
);


--
-- Name: eleves_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.eleves_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: eleves_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.eleves_id_seq OWNED BY public.eleves.id;


--
-- Name: emprunts_bibliotheque; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.emprunts_bibliotheque (
    id integer NOT NULL,
    livre_id integer,
    eleve_id integer,
    date_emprunt timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    date_retour_prevue timestamp(6) without time zone NOT NULL,
    date_retour_reelle timestamp(6) without time zone,
    statut character varying(20) DEFAULT 'en_cours'::character varying
);


--
-- Name: emprunts_bibliotheque_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.emprunts_bibliotheque_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: emprunts_bibliotheque_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.emprunts_bibliotheque_id_seq OWNED BY public.emprunts_bibliotheque.id;


--
-- Name: enseignements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.enseignements (
    id integer NOT NULL,
    enseignant_id integer,
    classe_id integer,
    matiere_id integer,
    heures_semaine numeric(5,2),
    heures_mois numeric(5,2),
    heures_an numeric(5,2),
    annee_scolaire_id integer
);


--
-- Name: enseignements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.enseignements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: enseignements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.enseignements_id_seq OWNED BY public.enseignements.id;


--
-- Name: examens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.examens (
    id integer NOT NULL,
    enseignement_id integer,
    titre character varying(255) NOT NULL,
    duree_minutes integer,
    date_debut timestamp(6) without time zone,
    date_fin timestamp(6) without time zone,
    est_actif boolean DEFAULT true,
    fichier_url text
);


--
-- Name: examens_eleves; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.examens_eleves (
    id integer NOT NULL,
    examen_id integer NOT NULL,
    eleve_id integer NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: examens_eleves_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.examens_eleves_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: examens_eleves_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.examens_eleves_id_seq OWNED BY public.examens_eleves.id;


--
-- Name: examens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.examens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: examens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.examens_id_seq OWNED BY public.examens.id;


--
-- Name: frais_scolaires; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.frais_scolaires (
    id integer NOT NULL,
    nom character varying(100),
    type_frais character varying(50) NOT NULL,
    montant integer NOT NULL,
    obligatoire boolean DEFAULT true,
    frequence character varying(50) DEFAULT 'mensuel'::character varying,
    niveau character varying(50),
    annee_scolaire_id integer,
    description text
);


--
-- Name: frais_scolaires_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.frais_scolaires_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: frais_scolaires_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.frais_scolaires_id_seq OWNED BY public.frais_scolaires.id;


--
-- Name: inscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inscriptions (
    id integer NOT NULL,
    preinscription_id integer,
    eleve_id integer,
    parent_id integer,
    numero_matricule character varying(50) NOT NULL,
    date_inscription date DEFAULT CURRENT_DATE,
    annee_scolaire_id integer,
    statut character varying(50) DEFAULT 'active'::character varying,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: inscriptions_cantine; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inscriptions_cantine (
    id integer NOT NULL,
    eleve_id integer,
    est_actif boolean DEFAULT true,
    solde numeric(12,2) DEFAULT 0,
    preferences_alimentaires text,
    allergies text,
    date_inscription date DEFAULT CURRENT_DATE,
    mois_total integer DEFAULT 9,
    mois_restants integer DEFAULT 9,
    montant_mensuel integer DEFAULT 400000,
    montant_total integer DEFAULT 3600000
);


--
-- Name: inscriptions_cantine_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inscriptions_cantine_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inscriptions_cantine_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inscriptions_cantine_id_seq OWNED BY public.inscriptions_cantine.id;


--
-- Name: inscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inscriptions_id_seq OWNED BY public.inscriptions.id;


--
-- Name: inscriptions_transport; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inscriptions_transport (
    id integer NOT NULL,
    eleve_id integer,
    ligne_id integer,
    date_debut date,
    date_fin date,
    est_actif boolean DEFAULT true,
    mois_total integer DEFAULT 9,
    mois_restants integer DEFAULT 9,
    montant_mensuel integer DEFAULT 0,
    montant_total integer DEFAULT 0,
    solde integer DEFAULT 0,
    date_inscription timestamp without time zone DEFAULT now()
);


--
-- Name: inscriptions_transport_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.inscriptions_transport_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: inscriptions_transport_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.inscriptions_transport_id_seq OWNED BY public.inscriptions_transport.id;


--
-- Name: lecons; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lecons (
    id integer NOT NULL,
    enseignement_id integer,
    titre character varying(255) NOT NULL,
    description text,
    contenu text,
    fichier_url text,
    video_url text,
    date_publication date DEFAULT CURRENT_DATE,
    matiere_personnalisee character varying(100)
);


--
-- Name: lecons_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lecons_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lecons_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lecons_id_seq OWNED BY public.lecons.id;


--
-- Name: lien_parent_eleve; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lien_parent_eleve (
    parent_id integer NOT NULL,
    eleve_id integer NOT NULL,
    lien character varying(50) DEFAULT 'parent'::character varying
);


--
-- Name: lignes_transport; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.lignes_transport (
    id integer NOT NULL,
    nom character varying(100),
    bus_id integer,
    horaire_matin time(6) without time zone,
    horaire_soir time(6) without time zone,
    prix_abonnement integer
);


--
-- Name: lignes_transport_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.lignes_transport_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: lignes_transport_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.lignes_transport_id_seq OWNED BY public.lignes_transport.id;


--
-- Name: livres_bibliotheque; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.livres_bibliotheque (
    id integer NOT NULL,
    titre character varying(255) NOT NULL,
    auteur character varying(255),
    isbn character varying(50),
    quantite integer DEFAULT 1,
    disponible integer DEFAULT 1,
    emplacement character varying(50),
    categorie character varying(100),
    image_url text
);


--
-- Name: livres_bibliotheque_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.livres_bibliotheque_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: livres_bibliotheque_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.livres_bibliotheque_id_seq OWNED BY public.livres_bibliotheque.id;


--
-- Name: logs_activites; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.logs_activites (
    id integer NOT NULL,
    utilisateur_id integer,
    action character varying(255),
    details text,
    ip_address character varying(45),
    date_action timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: logs_activites_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.logs_activites_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: logs_activites_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.logs_activites_id_seq OWNED BY public.logs_activites.id;


--
-- Name: matieres; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.matieres (
    id integer NOT NULL,
    nom character varying(100) NOT NULL,
    coefficient integer DEFAULT 1,
    description text
);


--
-- Name: matieres_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.matieres_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: matieres_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.matieres_id_seq OWNED BY public.matieres.id;


--
-- Name: menus_cantine; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.menus_cantine (
    id integer NOT NULL,
    date date NOT NULL,
    plat character varying(255),
    accompagnement character varying(255),
    dessert character varying(255),
    prix numeric(10,2) DEFAULT 5000,
    allergenes text,
    calories integer,
    regime_special boolean DEFAULT false
);


--
-- Name: menus_cantine_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.menus_cantine_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: menus_cantine_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.menus_cantine_id_seq OWNED BY public.menus_cantine.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    expediteur_id integer,
    destinataire_id integer,
    sujet character varying(255),
    contenu text,
    est_lu boolean DEFAULT false,
    date_envoi timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: mouvements_caisse; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mouvements_caisse (
    id integer NOT NULL,
    type character varying(10) NOT NULL,
    montant integer NOT NULL,
    categorie character varying(100) NOT NULL,
    sous_categorie character varying(100),
    description text,
    reference character varying(100),
    date_mouvement timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    exercice_annee integer DEFAULT EXTRACT(year FROM now()) NOT NULL,
    exercice_mois integer DEFAULT EXTRACT(month FROM now()) NOT NULL,
    saisi_par integer,
    valide_par integer,
    statut character varying(20) DEFAULT 'valide'::character varying,
    recu_url text,
    created_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: mouvements_caisse_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.mouvements_caisse_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: mouvements_caisse_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.mouvements_caisse_id_seq OWNED BY public.mouvements_caisse.id;


--
-- Name: notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notes (
    id integer NOT NULL,
    eleve_id integer,
    enseignement_id integer,
    type_note character varying(50),
    valeur numeric(5,2) NOT NULL,
    coefficient integer DEFAULT 1,
    date_saisie date DEFAULT CURRENT_DATE,
    commentaire text,
    enseignant_id integer,
    note_sur integer DEFAULT 20
);


--
-- Name: notes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.notes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.notes_id_seq OWNED BY public.notes.id;


--
-- Name: options_qcm; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.options_qcm (
    id integer NOT NULL,
    question_id integer,
    option_texte text NOT NULL,
    est_correcte boolean DEFAULT false
);


--
-- Name: options_qcm_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.options_qcm_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: options_qcm_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.options_qcm_id_seq OWNED BY public.options_qcm.id;


--
-- Name: options_quiz; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.options_quiz (
    id integer NOT NULL,
    question_id integer,
    option_texte text NOT NULL,
    est_correcte boolean DEFAULT false,
    ordre integer
);


--
-- Name: options_quiz_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.options_quiz_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: options_quiz_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.options_quiz_id_seq OWNED BY public.options_quiz.id;


--
-- Name: paiements; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.paiements (
    id integer NOT NULL,
    eleve_id integer,
    montant integer NOT NULL,
    type_frais character varying(50),
    mois integer,
    annee integer,
    mode_paiement character varying(50),
    reference_transaction character varying(100),
    statut character varying(20) DEFAULT 'valide'::character varying,
    date_paiement date DEFAULT CURRENT_DATE,
    "reçu_url" text,
    saisie_par integer,
    preinscription_id integer,
    reinscription_id integer
);


--
-- Name: paiements_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.paiements_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: paiements_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.paiements_id_seq OWNED BY public.paiements.id;


--
-- Name: paiements_salaires; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.paiements_salaires (
    id integer NOT NULL,
    personnel_id integer,
    montant integer NOT NULL,
    mois integer NOT NULL,
    annee integer NOT NULL,
    mode_paiement character varying(50),
    reference_transaction character varying(100),
    saisie_par integer,
    statut character varying(20) DEFAULT 'paye'::character varying,
    date_paiement timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    note text,
    salaire_base integer DEFAULT 0,
    prime_mensuelle integer DEFAULT 0,
    prime_responsabilite integer DEFAULT 0,
    prime_craie integer DEFAULT 0,
    retenue_sanction integer DEFAULT 0,
    autres_retenues integer DEFAULT 0,
    details_lignes jsonb DEFAULT '[]'::jsonb,
    total_brut integer DEFAULT 0,
    total_deductions integer DEFAULT 0
);


--
-- Name: paiements_salaires_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.paiements_salaires_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: paiements_salaires_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.paiements_salaires_id_seq OWNED BY public.paiements_salaires.id;


--
-- Name: parents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.parents (
    id integer NOT NULL,
    utilisateur_id integer,
    profession character varying(255),
    situation_matrimoniale character varying(225)
);


--
-- Name: parents_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.parents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: parents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.parents_id_seq OWNED BY public.parents.id;


--
-- Name: participations_quiz; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.participations_quiz (
    id integer NOT NULL,
    quiz_id integer,
    eleve_id integer,
    date_debut timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    date_fin timestamp(6) without time zone,
    score_total integer DEFAULT 0,
    points_obtenus integer DEFAULT 0,
    reponses_correctes integer DEFAULT 0,
    reponses_totales integer DEFAULT 0,
    pourcentage numeric(5,2) DEFAULT 0,
    est_termine boolean DEFAULT false
);


--
-- Name: participations_quiz_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.participations_quiz_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participations_quiz_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.participations_quiz_id_seq OWNED BY public.participations_quiz.id;


--
-- Name: personnels; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personnels (
    id integer NOT NULL,
    utilisateur_id integer,
    matricule_personnel character varying(50) NOT NULL,
    type character varying(50),
    date_embauche date DEFAULT CURRENT_DATE,
    salaire_base integer,
    carte_personnel_url text,
    statut character varying(20) DEFAULT 'actif'::character varying,
    departement character varying(100),
    prime_mensuelle integer DEFAULT 0,
    mode_paiement_salaire character varying(50) DEFAULT 'virement'::character varying,
    carte_id_url text,
    cv_url text,
    certificat_residence_url text
);


--
-- Name: personnels_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.personnels_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: personnels_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.personnels_id_seq OWNED BY public.personnels.id;


--
-- Name: preinscription_cantine; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.preinscription_cantine (
    id integer NOT NULL,
    preinscription_id integer,
    menu_id integer,
    prix integer DEFAULT 0 NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: preinscription_cantine_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.preinscription_cantine_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: preinscription_cantine_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.preinscription_cantine_id_seq OWNED BY public.preinscription_cantine.id;


--
-- Name: preinscription_transport; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.preinscription_transport (
    id integer NOT NULL,
    preinscription_id integer,
    ligne_id integer,
    prix integer DEFAULT 0 NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: preinscription_transport_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.preinscription_transport_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: preinscription_transport_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.preinscription_transport_id_seq OWNED BY public.preinscription_transport.id;


--
-- Name: preinscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.preinscriptions (
    id integer NOT NULL,
    parent_id integer,
    enfant_nom character varying(100) NOT NULL,
    enfant_prenom character varying(100) NOT NULL,
    date_naissance date NOT NULL,
    lieu_naissance character varying(100),
    sexe character varying(10) NOT NULL,
    niveau character varying(50) NOT NULL,
    classe character varying(50) NOT NULL,
    acte_naissance_url text,
    photo_url text,
    bulletin_url text,
    statut character varying(50) DEFAULT 'en_attente'::character varying,
    numero_dossier character varying(50),
    date_preinscription timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    observations text,
    traite_par integer,
    date_traitement timestamp(6) without time zone,
    frais_montant integer DEFAULT 0,
    frais_statut character varying(20) DEFAULT 'non_paye'::character varying,
    frais_mode_paiement character varying(50),
    frais_reference character varying(100),
    frais_date_paiement timestamp(6) without time zone,
    plan_paiement_id integer,
    montant_total_plan integer DEFAULT 0,
    montant_restant_plan integer DEFAULT 0,
    type_inscription character varying(50) DEFAULT 'inscription'::character varying,
    est_reinscription boolean DEFAULT false,
    updated_at timestamp with time zone DEFAULT now()
);


--
-- Name: preinscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.preinscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: preinscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.preinscriptions_id_seq OWNED BY public.preinscriptions.id;


--
-- Name: presences; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.presences (
    id integer NOT NULL,
    eleve_id integer,
    classe_id integer,
    date date NOT NULL,
    statut character varying(20),
    heure_arrivee time(6) without time zone,
    justificatif_url text,
    enseignant_id integer
);


--
-- Name: presences_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.presences_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: presences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.presences_id_seq OWNED BY public.presences.id;


--
-- Name: presences_transport; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.presences_transport (
    id integer NOT NULL,
    eleve_id integer NOT NULL,
    date date NOT NULL,
    statut character varying(20) NOT NULL,
    heure_arrivee time(6) without time zone,
    commentaire text,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: presences_transport_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.presences_transport_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: presences_transport_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.presences_transport_id_seq OWNED BY public.presences_transport.id;


--
-- Name: questions_qcm; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.questions_qcm (
    id integer NOT NULL,
    examen_id integer,
    question text NOT NULL,
    points integer DEFAULT 1,
    ordre integer
);


--
-- Name: questions_qcm_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.questions_qcm_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: questions_qcm_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.questions_qcm_id_seq OWNED BY public.questions_qcm.id;


--
-- Name: questions_quiz; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.questions_quiz (
    id integer NOT NULL,
    categorie_id integer,
    enseignement_id integer,
    question text NOT NULL,
    explication text,
    difficulte character varying(20) DEFAULT 'facile'::character varying,
    points integer DEFAULT 1,
    temps_secondes integer DEFAULT 30,
    est_active boolean DEFAULT true,
    ordre integer,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    created_by integer
);


--
-- Name: questions_quiz_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.questions_quiz_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: questions_quiz_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.questions_quiz_id_seq OWNED BY public.questions_quiz.id;


--
-- Name: quiz; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz (
    id integer NOT NULL,
    enseignement_id integer,
    titre character varying(255) NOT NULL,
    description text,
    type character varying(50) DEFAULT 'qcm'::character varying,
    duree_minutes integer DEFAULT 10,
    est_actif boolean DEFAULT true,
    date_debut timestamp(6) without time zone,
    date_fin timestamp(6) without time zone,
    est_aleatoire boolean DEFAULT false,
    afficher_resultats boolean DEFAULT true,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    fichier_url text
);


--
-- Name: quiz_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.quiz_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: quiz_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.quiz_id_seq OWNED BY public.quiz.id;


--
-- Name: quiz_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.quiz_questions (
    id integer NOT NULL,
    quiz_id integer,
    question_id integer,
    ordre integer,
    points_personnalises integer
);


--
-- Name: quiz_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.quiz_questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: quiz_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.quiz_questions_id_seq OWNED BY public.quiz_questions.id;


--
-- Name: recus; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.recus (
    id integer NOT NULL,
    numero_recu character varying(50) NOT NULL,
    paiement_id integer,
    eleve_id integer,
    preinscription_id integer,
    reinscription_id integer,
    enfant_nom character varying(200),
    parent_nom character varying(200),
    montant integer NOT NULL,
    type_frais character varying(50),
    mode_paiement character varying(50),
    date_paiement timestamp without time zone DEFAULT now(),
    reference character varying(100),
    source character varying(50),
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    montant_total integer DEFAULT 0,
    reste_a_payer integer DEFAULT 0,
    classe_nom character varying(100)
);


--
-- Name: recus_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.recus_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: recus_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.recus_id_seq OWNED BY public.recus.id;


--
-- Name: reinscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reinscriptions (
    id integer NOT NULL,
    inscription_id integer,
    eleve_id integer,
    parent_id integer,
    annee_scolaire_id integer,
    classe_id integer,
    montant_frais integer DEFAULT 500000,
    frais_statut character varying(50) DEFAULT 'non_paye'::character varying,
    frais_mode_paiement character varying(50),
    frais_reference character varying(100),
    frais_date_paiement timestamp(6) without time zone,
    statut character varying(50) DEFAULT 'en_attente'::character varying,
    date_reinscription timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    observations text,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    acte_naissance_url text,
    photo_url text,
    bulletin_url text,
    date_traitement timestamp(6) without time zone,
    numero_dossier character varying(50),
    enfant_nom character varying(100),
    enfant_prenom character varying(100),
    date_naissance date,
    lieu_naissance character varying(200),
    sexe character varying(10),
    niveau character varying(50),
    classe_nom character varying(50),
    parent_nom character varying(100),
    parent_prenom character varying(100),
    parent_email character varying(100),
    parent_telephone character varying(20),
    montant_total_plan integer DEFAULT 0,
    montant_restant_plan integer DEFAULT 0
);


--
-- Name: reinscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reinscriptions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reinscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reinscriptions_id_seq OWNED BY public.reinscriptions.id;


--
-- Name: remises_familles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.remises_familles (
    id integer NOT NULL,
    parent_id integer NOT NULL,
    montant numeric(12,2) NOT NULL,
    motif text,
    saisie_par integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: remises_familles_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.remises_familles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: remises_familles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.remises_familles_id_seq OWNED BY public.remises_familles.id;


--
-- Name: reponses_eleves_qcm; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reponses_eleves_qcm (
    id integer NOT NULL,
    examen_id integer,
    eleve_id integer,
    question_id integer,
    option_id integer,
    date_reponse timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: reponses_eleves_qcm_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reponses_eleves_qcm_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reponses_eleves_qcm_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reponses_eleves_qcm_id_seq OWNED BY public.reponses_eleves_qcm.id;


--
-- Name: reponses_quiz; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reponses_quiz (
    id integer NOT NULL,
    participation_id integer,
    question_id integer,
    option_id integer,
    est_correcte boolean DEFAULT false,
    temps_reponse_ms integer,
    date_reponse timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: reponses_quiz_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reponses_quiz_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reponses_quiz_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reponses_quiz_id_seq OWNED BY public.reponses_quiz.id;


--
-- Name: reservations_cantine; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reservations_cantine (
    id integer NOT NULL,
    eleve_id integer,
    menu_id integer,
    date date NOT NULL,
    statut character varying(20) DEFAULT 'confirmee'::character varying,
    paye boolean DEFAULT false,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: reservations_cantine_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reservations_cantine_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reservations_cantine_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reservations_cantine_id_seq OWNED BY public.reservations_cantine.id;


--
-- Name: reserves_cantine; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reserves_cantine (
    id integer NOT NULL,
    eleve_id integer,
    date date NOT NULL,
    est_present boolean DEFAULT false,
    date_reservation date DEFAULT CURRENT_DATE
);


--
-- Name: reserves_cantine_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reserves_cantine_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reserves_cantine_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reserves_cantine_id_seq OWNED BY public.reserves_cantine.id;


--
-- Name: reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reset_tokens (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    expires_at timestamp(6) without time zone NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    used boolean DEFAULT false
);


--
-- Name: reset_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reset_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reset_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reset_tokens_id_seq OWNED BY public.reset_tokens.id;


--
-- Name: services_annexes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.services_annexes (
    id integer NOT NULL,
    nom character varying(100) NOT NULL,
    montant_mensuel integer NOT NULL,
    type character varying(50) DEFAULT 'optionnel'::character varying,
    description text,
    actif boolean DEFAULT true,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: services_annexes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.services_annexes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: services_annexes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.services_annexes_id_seq OWNED BY public.services_annexes.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    id integer NOT NULL,
    utilisateur_id integer,
    token character varying(255) NOT NULL,
    expire_le timestamp(6) without time zone NOT NULL,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.sessions_id_seq OWNED BY public.sessions.id;


--
-- Name: soumissions_devoirs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.soumissions_devoirs (
    id integer NOT NULL,
    devoir_id integer,
    eleve_id integer,
    fichier_url text,
    date_soumission timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    note numeric(5,2),
    commentaire text,
    est_retard boolean DEFAULT false
);


--
-- Name: soumissions_devoirs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.soumissions_devoirs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: soumissions_devoirs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.soumissions_devoirs_id_seq OWNED BY public.soumissions_devoirs.id;


--
-- Name: transactions_cantine; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.transactions_cantine (
    id integer NOT NULL,
    eleve_id integer,
    montant numeric(12,2) NOT NULL,
    type character varying(20),
    description text,
    date timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: transactions_cantine_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.transactions_cantine_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: transactions_cantine_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.transactions_cantine_id_seq OWNED BY public.transactions_cantine.id;


--
-- Name: utilisateurs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.utilisateurs (
    id integer NOT NULL,
    email character varying(255) NOT NULL,
    password character varying(255) NOT NULL,
    prenom character varying(100) NOT NULL,
    nom character varying(100) NOT NULL,
    telephone character varying(20),
    adresse text,
    photo_url text,
    role character varying(50) NOT NULL,
    est_actif boolean DEFAULT true,
    derniere_connexion timestamp(6) without time zone,
    created_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    deleted_at timestamp without time zone
);


--
-- Name: utilisateurs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.utilisateurs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: utilisateurs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.utilisateurs_id_seq OWNED BY public.utilisateurs.id;


--
-- Name: ventes_librairie; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ventes_librairie (
    id integer NOT NULL,
    article_id integer,
    eleve_id integer,
    quantite integer DEFAULT 1 NOT NULL,
    montant_total integer NOT NULL,
    date_vente timestamp(6) without time zone DEFAULT CURRENT_TIMESTAMP,
    vendu_par integer
);


--
-- Name: ventes_librairie_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ventes_librairie_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ventes_librairie_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ventes_librairie_id_seq OWNED BY public.ventes_librairie.id;


--
-- Name: messages; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.messages (
    topic text NOT NULL,
    extension text NOT NULL,
    payload jsonb,
    event text,
    private boolean DEFAULT false,
    updated_at timestamp without time zone DEFAULT timezone('utc'::text, clock_timestamp()) NOT NULL,
    inserted_at timestamp without time zone DEFAULT timezone('utc'::text, clock_timestamp()) NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    binary_payload bytea,
    skip_broadcast boolean DEFAULT false NOT NULL,
    expires_at timestamp without time zone
)
PARTITION BY RANGE (inserted_at);


--
-- Name: schema_migrations; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.schema_migrations (
    version bigint NOT NULL,
    inserted_at timestamp(0) without time zone
);


--
-- Name: subscription; Type: TABLE; Schema: realtime; Owner: -
--

CREATE TABLE realtime.subscription (
    id bigint NOT NULL,
    subscription_id uuid NOT NULL,
    entity regclass NOT NULL,
    filters realtime.user_defined_filter[] DEFAULT '{}'::realtime.user_defined_filter[] NOT NULL,
    claims jsonb NOT NULL,
    claims_role regrole GENERATED ALWAYS AS (realtime.to_regrole((claims ->> 'role'::text))) STORED NOT NULL,
    created_at timestamp without time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    action_filter text DEFAULT '*'::text,
    selected_columns text[],
    CONSTRAINT subscription_action_filter_check CHECK ((action_filter = ANY (ARRAY['*'::text, 'INSERT'::text, 'UPDATE'::text, 'DELETE'::text])))
);


--
-- Name: subscription_id_seq; Type: SEQUENCE; Schema: realtime; Owner: -
--

ALTER TABLE realtime.subscription ALTER COLUMN id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME realtime.subscription_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: bucket_lifecycle_states; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.bucket_lifecycle_states (
    bucket_id text NOT NULL,
    generation uuid,
    next_run_at timestamp with time zone,
    claim_id uuid,
    claim_until timestamp with time zone,
    continuation jsonb,
    last_started_at timestamp with time zone,
    last_completed_at timestamp with time zone,
    last_success_at timestamp with time zone,
    last_result jsonb,
    failure_count integer DEFAULT 0 NOT NULL,
    last_error jsonb,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT bucket_lifecycle_continuation_object_check CHECK (((continuation IS NULL) OR (jsonb_typeof(continuation) = 'object'::text))),
    CONSTRAINT bucket_lifecycle_failure_count_check CHECK ((failure_count >= 0)),
    CONSTRAINT bucket_lifecycle_last_result_object_check CHECK (((last_result IS NULL) OR (jsonb_typeof(last_result) = 'object'::text))),
    CONSTRAINT bucket_lifecycle_recovery_due_check CHECK (((next_run_at IS NOT NULL) OR (NOT jsonb_path_exists(COALESCE(continuation, '{}'::jsonb), '$."batch"."inFlight"'::jsonpath))))
);


--
-- Name: buckets; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets (
    id text NOT NULL,
    name text NOT NULL,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    public boolean DEFAULT false,
    avif_autodetection boolean DEFAULT false,
    file_size_limit bigint,
    allowed_mime_types text[],
    owner_id text,
    type storage.buckettype DEFAULT 'STANDARD'::storage.buckettype NOT NULL,
    versioning_status text DEFAULT 'DISABLED'::text NOT NULL,
    lifecycle_configuration jsonb,
    lifecycle_configuration_generation uuid,
    CONSTRAINT buckets_lifecycle_configuration_pair_check CHECK (((lifecycle_configuration IS NULL) = (lifecycle_configuration_generation IS NULL))),
    CONSTRAINT buckets_lifecycle_configuration_shape_check CHECK (((lifecycle_configuration IS NULL) OR ((jsonb_typeof(lifecycle_configuration) = 'object'::text) AND (lifecycle_configuration ? 'rules'::text) AND
CASE
    WHEN (jsonb_typeof((lifecycle_configuration -> 'rules'::text)) = 'array'::text) THEN ((jsonb_array_length((lifecycle_configuration -> 'rules'::text)) >= 1) AND (jsonb_array_length((lifecycle_configuration -> 'rules'::text)) <= 1000))
    ELSE false
END))),
    CONSTRAINT buckets_lifecycle_configuration_standard_only_check CHECK (((type = 'STANDARD'::storage.buckettype) OR ((lifecycle_configuration IS NULL) AND (lifecycle_configuration_generation IS NULL)))),
    CONSTRAINT buckets_versioning_standard_only_check CHECK (((type = 'STANDARD'::storage.buckettype) OR (versioning_status = 'DISABLED'::text))),
    CONSTRAINT buckets_versioning_status_check CHECK ((versioning_status = ANY (ARRAY['DISABLED'::text, 'ENABLED'::text, 'SUSPENDED'::text])))
);


--
-- Name: COLUMN buckets.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.buckets.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: buckets_analytics; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_analytics (
    name text NOT NULL,
    type storage.buckettype DEFAULT 'ANALYTICS'::storage.buckettype NOT NULL,
    format text DEFAULT 'ICEBERG'::text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    deleted_at timestamp with time zone
);


--
-- Name: buckets_vectors; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.buckets_vectors (
    id text NOT NULL,
    type storage.buckettype DEFAULT 'VECTOR'::storage.buckettype NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: lifecycle_abandoned_artifacts; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.lifecycle_abandoned_artifacts (
    bucket_id text NOT NULL,
    key text NOT NULL,
    name text NOT NULL,
    version text,
    attempted_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: migrations; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.migrations (
    id integer NOT NULL,
    name character varying(100) NOT NULL,
    hash character varying(40) NOT NULL,
    executed_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: objects; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.objects (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    bucket_id text,
    name text,
    owner uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    last_accessed_at timestamp with time zone DEFAULT now(),
    metadata jsonb,
    path_tokens text[] GENERATED ALWAYS AS (string_to_array(name, '/'::text)) STORED,
    version text,
    owner_id text,
    user_metadata jsonb,
    archived_at timestamp with time zone,
    is_delete_marker boolean DEFAULT false NOT NULL,
    is_versioned boolean DEFAULT false NOT NULL
);


--
-- Name: COLUMN objects.owner; Type: COMMENT; Schema: storage; Owner: -
--

COMMENT ON COLUMN storage.objects.owner IS 'Field is deprecated, use owner_id instead';


--
-- Name: s3_multipart_uploads; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads (
    id text NOT NULL,
    in_progress_size bigint DEFAULT 0 NOT NULL,
    upload_signature text NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    version text NOT NULL,
    owner_id text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    user_metadata jsonb,
    metadata jsonb
);


--
-- Name: s3_multipart_uploads_parts; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.s3_multipart_uploads_parts (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    upload_id text NOT NULL,
    size bigint DEFAULT 0 NOT NULL,
    part_number integer NOT NULL,
    bucket_id text NOT NULL,
    key text NOT NULL COLLATE pg_catalog."C",
    etag text NOT NULL,
    owner_id text,
    version text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: vector_indexes; Type: TABLE; Schema: storage; Owner: -
--

CREATE TABLE storage.vector_indexes (
    id text DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL COLLATE pg_catalog."C",
    bucket_id text NOT NULL,
    data_type text NOT NULL,
    dimension integer NOT NULL,
    distance_metric text NOT NULL,
    metadata_configuration jsonb,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: refresh_tokens id; Type: DEFAULT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens ALTER COLUMN id SET DEFAULT nextval('auth.refresh_tokens_id_seq'::regclass);


--
-- Name: annees_scolaires id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annees_scolaires ALTER COLUMN id SET DEFAULT nextval('public.annees_scolaires_id_seq'::regclass);


--
-- Name: annonces id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annonces ALTER COLUMN id SET DEFAULT nextval('public.annonces_id_seq'::regclass);


--
-- Name: articles_librairie id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles_librairie ALTER COLUMN id SET DEFAULT nextval('public.articles_librairie_id_seq'::regclass);


--
-- Name: avances_salaires id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avances_salaires ALTER COLUMN id SET DEFAULT nextval('public.avances_salaires_id_seq'::regclass);


--
-- Name: budget_previsionnel id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budget_previsionnel ALTER COLUMN id SET DEFAULT nextval('public.budget_previsionnel_id_seq'::regclass);


--
-- Name: bus id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bus ALTER COLUMN id SET DEFAULT nextval('public.bus_id_seq'::regclass);


--
-- Name: cantine_menus id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cantine_menus ALTER COLUMN id SET DEFAULT nextval('public.cantine_menus_id_seq'::regclass);


--
-- Name: categories_depenses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories_depenses ALTER COLUMN id SET DEFAULT nextval('public.categories_depenses_id_seq'::regclass);


--
-- Name: categories_quiz id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories_quiz ALTER COLUMN id SET DEFAULT nextval('public.categories_quiz_id_seq'::regclass);


--
-- Name: classes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes ALTER COLUMN id SET DEFAULT nextval('public.classes_id_seq'::regclass);


--
-- Name: commandes_fournitures id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commandes_fournitures ALTER COLUMN id SET DEFAULT nextval('public.commandes_fournitures_id_seq'::regclass);


--
-- Name: commandes_librairie id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commandes_librairie ALTER COLUMN id SET DEFAULT nextval('public.commandes_librairie_id_seq'::regclass);


--
-- Name: commandes_librairie_articles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commandes_librairie_articles ALTER COLUMN id SET DEFAULT nextval('public.commandes_librairie_articles_id_seq'::regclass);


--
-- Name: conges_personnel id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conges_personnel ALTER COLUMN id SET DEFAULT nextval('public.conges_personnel_id_seq'::regclass);


--
-- Name: contrats_personnel id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contrats_personnel ALTER COLUMN id SET DEFAULT nextval('public.contrats_personnel_id_seq'::regclass);


--
-- Name: depenses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.depenses ALTER COLUMN id SET DEFAULT nextval('public.depenses_id_seq'::regclass);


--
-- Name: devoirs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.devoirs ALTER COLUMN id SET DEFAULT nextval('public.devoirs_id_seq'::regclass);


--
-- Name: echeances_paiement id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echeances_paiement ALTER COLUMN id SET DEFAULT nextval('public.echeances_paiement_id_seq'::regclass);


--
-- Name: eleves id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eleves ALTER COLUMN id SET DEFAULT nextval('public.eleves_id_seq'::regclass);


--
-- Name: emprunts_bibliotheque id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emprunts_bibliotheque ALTER COLUMN id SET DEFAULT nextval('public.emprunts_bibliotheque_id_seq'::regclass);


--
-- Name: enseignements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enseignements ALTER COLUMN id SET DEFAULT nextval('public.enseignements_id_seq'::regclass);


--
-- Name: examens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examens ALTER COLUMN id SET DEFAULT nextval('public.examens_id_seq'::regclass);


--
-- Name: examens_eleves id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examens_eleves ALTER COLUMN id SET DEFAULT nextval('public.examens_eleves_id_seq'::regclass);


--
-- Name: frais_scolaires id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frais_scolaires ALTER COLUMN id SET DEFAULT nextval('public.frais_scolaires_id_seq'::regclass);


--
-- Name: inscriptions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions ALTER COLUMN id SET DEFAULT nextval('public.inscriptions_id_seq'::regclass);


--
-- Name: inscriptions_cantine id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions_cantine ALTER COLUMN id SET DEFAULT nextval('public.inscriptions_cantine_id_seq'::regclass);


--
-- Name: inscriptions_transport id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions_transport ALTER COLUMN id SET DEFAULT nextval('public.inscriptions_transport_id_seq'::regclass);


--
-- Name: lecons id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lecons ALTER COLUMN id SET DEFAULT nextval('public.lecons_id_seq'::regclass);


--
-- Name: lignes_transport id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lignes_transport ALTER COLUMN id SET DEFAULT nextval('public.lignes_transport_id_seq'::regclass);


--
-- Name: livres_bibliotheque id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.livres_bibliotheque ALTER COLUMN id SET DEFAULT nextval('public.livres_bibliotheque_id_seq'::regclass);


--
-- Name: logs_activites id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.logs_activites ALTER COLUMN id SET DEFAULT nextval('public.logs_activites_id_seq'::regclass);


--
-- Name: matieres id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matieres ALTER COLUMN id SET DEFAULT nextval('public.matieres_id_seq'::regclass);


--
-- Name: menus_cantine id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menus_cantine ALTER COLUMN id SET DEFAULT nextval('public.menus_cantine_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: mouvements_caisse id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mouvements_caisse ALTER COLUMN id SET DEFAULT nextval('public.mouvements_caisse_id_seq'::regclass);


--
-- Name: notes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes ALTER COLUMN id SET DEFAULT nextval('public.notes_id_seq'::regclass);


--
-- Name: options_qcm id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.options_qcm ALTER COLUMN id SET DEFAULT nextval('public.options_qcm_id_seq'::regclass);


--
-- Name: options_quiz id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.options_quiz ALTER COLUMN id SET DEFAULT nextval('public.options_quiz_id_seq'::regclass);


--
-- Name: paiements id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paiements ALTER COLUMN id SET DEFAULT nextval('public.paiements_id_seq'::regclass);


--
-- Name: paiements_salaires id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paiements_salaires ALTER COLUMN id SET DEFAULT nextval('public.paiements_salaires_id_seq'::regclass);


--
-- Name: parents id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parents ALTER COLUMN id SET DEFAULT nextval('public.parents_id_seq'::regclass);


--
-- Name: participations_quiz id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participations_quiz ALTER COLUMN id SET DEFAULT nextval('public.participations_quiz_id_seq'::regclass);


--
-- Name: personnels id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personnels ALTER COLUMN id SET DEFAULT nextval('public.personnels_id_seq'::regclass);


--
-- Name: preinscription_cantine id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preinscription_cantine ALTER COLUMN id SET DEFAULT nextval('public.preinscription_cantine_id_seq'::regclass);


--
-- Name: preinscription_transport id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preinscription_transport ALTER COLUMN id SET DEFAULT nextval('public.preinscription_transport_id_seq'::regclass);


--
-- Name: preinscriptions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preinscriptions ALTER COLUMN id SET DEFAULT nextval('public.preinscriptions_id_seq'::regclass);


--
-- Name: presences id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presences ALTER COLUMN id SET DEFAULT nextval('public.presences_id_seq'::regclass);


--
-- Name: presences_transport id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presences_transport ALTER COLUMN id SET DEFAULT nextval('public.presences_transport_id_seq'::regclass);


--
-- Name: questions_qcm id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions_qcm ALTER COLUMN id SET DEFAULT nextval('public.questions_qcm_id_seq'::regclass);


--
-- Name: questions_quiz id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions_quiz ALTER COLUMN id SET DEFAULT nextval('public.questions_quiz_id_seq'::regclass);


--
-- Name: quiz id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz ALTER COLUMN id SET DEFAULT nextval('public.quiz_id_seq'::regclass);


--
-- Name: quiz_questions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_questions ALTER COLUMN id SET DEFAULT nextval('public.quiz_questions_id_seq'::regclass);


--
-- Name: recus id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recus ALTER COLUMN id SET DEFAULT nextval('public.recus_id_seq'::regclass);


--
-- Name: reinscriptions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reinscriptions ALTER COLUMN id SET DEFAULT nextval('public.reinscriptions_id_seq'::regclass);


--
-- Name: remises_familles id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remises_familles ALTER COLUMN id SET DEFAULT nextval('public.remises_familles_id_seq'::regclass);


--
-- Name: reponses_eleves_qcm id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reponses_eleves_qcm ALTER COLUMN id SET DEFAULT nextval('public.reponses_eleves_qcm_id_seq'::regclass);


--
-- Name: reponses_quiz id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reponses_quiz ALTER COLUMN id SET DEFAULT nextval('public.reponses_quiz_id_seq'::regclass);


--
-- Name: reservations_cantine id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservations_cantine ALTER COLUMN id SET DEFAULT nextval('public.reservations_cantine_id_seq'::regclass);


--
-- Name: reserves_cantine id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reserves_cantine ALTER COLUMN id SET DEFAULT nextval('public.reserves_cantine_id_seq'::regclass);


--
-- Name: reset_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reset_tokens ALTER COLUMN id SET DEFAULT nextval('public.reset_tokens_id_seq'::regclass);


--
-- Name: services_annexes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services_annexes ALTER COLUMN id SET DEFAULT nextval('public.services_annexes_id_seq'::regclass);


--
-- Name: sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions ALTER COLUMN id SET DEFAULT nextval('public.sessions_id_seq'::regclass);


--
-- Name: soumissions_devoirs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.soumissions_devoirs ALTER COLUMN id SET DEFAULT nextval('public.soumissions_devoirs_id_seq'::regclass);


--
-- Name: transactions_cantine id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_cantine ALTER COLUMN id SET DEFAULT nextval('public.transactions_cantine_id_seq'::regclass);


--
-- Name: utilisateurs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateurs ALTER COLUMN id SET DEFAULT nextval('public.utilisateurs_id_seq'::regclass);


--
-- Name: ventes_librairie id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ventes_librairie ALTER COLUMN id SET DEFAULT nextval('public.ventes_librairie_id_seq'::regclass);


--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.audit_log_entries (instance_id, id, payload, created_at, ip_address) FROM stdin;
\.


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.custom_oauth_providers (id, provider_type, identifier, name, client_id, client_secret, acceptable_client_ids, scopes, pkce_enabled, attribute_mapping, authorization_params, enabled, email_optional, issuer, discovery_url, skip_nonce_check, cached_discovery, discovery_cached_at, authorization_url, token_url, userinfo_url, jwks_uri, created_at, updated_at, custom_claims_allowlist) FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.flow_state (id, user_id, auth_code, code_challenge_method, code_challenge, provider_type, provider_access_token, provider_refresh_token, created_at, updated_at, authentication_method, auth_code_issued_at, invite_token, referrer, oauth_client_state_id, linking_target_id, email_optional) FROM stdin;
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at, id) FROM stdin;
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.instances (id, uuid, raw_base_config, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_amr_claims (session_id, created_at, updated_at, authentication_method, id) FROM stdin;
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_challenges (id, factor_id, created_at, verified_at, ip_address, otp_code, web_authn_session_data) FROM stdin;
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_factors (id, user_id, friendly_name, factor_type, status, created_at, updated_at, secret, phone, last_challenged_at, web_authn_credential, web_authn_aaguid, last_webauthn_challenge_data) FROM stdin;
\.


--
-- Data for Name: mfa_recovery_code_sets; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_recovery_code_sets (id, user_id, mfa_factor_id, failed_verification_count, verification_locked_until, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: mfa_recovery_codes; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.mfa_recovery_codes (id, mfa_recovery_code_set_id, code_hash, consumed_at, created_at) FROM stdin;
\.


--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_authorizations (id, authorization_id, client_id, user_id, redirect_uri, scope, state, resource, code_challenge, code_challenge_method, response_type, status, authorization_code, created_at, expires_at, approved_at, nonce) FROM stdin;
\.


--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_client_states (id, provider_type, code_verifier, created_at) FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_clients (id, client_secret_hash, registration_type, redirect_uris, grant_types, client_name, client_uri, logo_uri, created_at, updated_at, deleted_at, client_type, token_endpoint_auth_method) FROM stdin;
\.


--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.oauth_consents (id, user_id, client_id, scopes, granted_at, revoked_at) FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.one_time_tokens (id, user_id, token_type, token_hash, relates_to, created_at, updated_at, expires_at, link_token_hash) FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.refresh_tokens (instance_id, id, token, user_id, revoked, created_at, updated_at, parent, session_id) FROM stdin;
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.saml_providers (id, sso_provider_id, entity_id, metadata_xml, metadata_url, attribute_mapping, created_at, updated_at, name_id_format, dedicated_scope) FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.saml_relay_states (id, sso_provider_id, request_id, for_email, redirect_to, created_at, updated_at, flow_state_id) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.schema_migrations (version) FROM stdin;
20171026211738
20171026211808
20171026211834
20180103212743
20180108183307
20180119214651
20180125194653
00
20210710035447
20210722035447
20210730183235
20210909172000
20210927181326
20211122151130
20211124214934
20211202183645
20220114185221
20220114185340
20220224000811
20220323170000
20220429102000
20220531120530
20220614074223
20220811173540
20221003041349
20221003041400
20221011041400
20221020193600
20221021073300
20221021082433
20221027105023
20221114143122
20221114143410
20221125140132
20221208132122
20221215195500
20221215195800
20221215195900
20230116124310
20230116124412
20230131181311
20230322519590
20230402418590
20230411005111
20230508135423
20230523124323
20230818113222
20230914180801
20231027141322
20231114161723
20231117164230
20240115144230
20240214120130
20240306115329
20240314092811
20240427152123
20240612123726
20240729123726
20240802193726
20240806073726
20241009103726
20250717082212
20250731150234
20250804100000
20250901200500
20250903112500
20250904133000
20250925093508
20251007112900
20251104100000
20251111201300
20251201000000
20260115000000
20260121000000
20260219120000
20260302000000
20260625000000
20260821000000
20260821010000
20260824000000
20260824000001
20260831180000
20260911120000
20261030120000
\.


--
-- Data for Name: scim_tokens; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.scim_tokens (id, sso_provider_id, token_hash, prefix, created_at, expires_at, revoked_at, last_used_at) FROM stdin;
\.


--
-- Data for Name: scim_users; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.scim_users (id, sso_provider_id, user_id, resource, created_at, updated_at, deleted_at) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sessions (id, user_id, created_at, updated_at, factor_id, aal, not_after, refreshed_at, user_agent, ip, tag, oauth_client_id, refresh_token_hmac_key, refresh_token_counter, scopes) FROM stdin;
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sso_domains (id, sso_provider_id, domain, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.sso_providers (id, resource_id, created_at, updated_at, disabled) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at, email_change_token_new, email_change, email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, is_super_admin, created_at, updated_at, phone, phone_confirmed_at, phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, email_change_confirm_status, banned_until, reauthentication_token, reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous) FROM stdin;
\.


--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.webauthn_challenges (id, user_id, challenge_type, session_data, created_at, expires_at) FROM stdin;
\.


--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: -
--

COPY auth.webauthn_credentials (id, user_id, credential_id, public_key, attestation_type, aaguid, sign_count, transports, backup_eligible, backed_up, friendly_name, created_at, updated_at, last_used_at) FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
7b2f10da-163a-4be5-8745-2421b8cd44e5	6a9ce3a02e16f62e3cf2c04c8e46848607aa51c65eef6a45f622eb90701088e7	2026-07-10 01:42:04.173749+00	20260519205632_init	\N	\N	2026-07-10 01:42:03.157229+00	1
08aca0b2-69ac-4778-ace9-5ca701faa5a7	064b4e8a45d4e630c1c9bb2ba8720d8b965528886ef013f2f25ac6fc305a49e6	2026-07-10 01:42:45.144099+00	20260710014242_init	\N	\N	2026-07-10 01:42:43.736261+00	1
\.


--
-- Data for Name: annees_scolaires; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.annees_scolaires (id, libelle, date_debut, date_fin, est_active, created_at) FROM stdin;
1	2025-2026	2025-09-01	2026-06-30	t	2026-07-18 00:20:41.256555
2	2025-2026	2025-09-01	2026-06-30	f	2026-07-18 19:48:50.980978
3	2025-2026	2025-09-01	2026-06-30	f	2026-07-19 20:58:51.648536
\.


--
-- Data for Name: annonces; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.annonces (id, titre, contenu, cible, type, classe_id, image_url, date_publication, date_modification, date_programmee, publie_par) FROM stdin;
\.


--
-- Data for Name: articles_librairie; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.articles_librairie (id, nom, description, prix_unitaire, quantite_stock, categorie, image_url, created_at, niveaux_cibles) FROM stdin;
2	TENUE SCOLAIRE SECONDAIRE	Tenue Secondaire	225000	1000	uniforme	\N	2026-08-23 14:47:15.090108	\N
3	TENUE DE SPORT	MAILLOT	100000	1000	uniforme	\N	2026-08-23 14:49:18.034987	\N
4	TENUE SCOUT	Tenue Scout	250000	500	uniforme	\N	2026-08-23 14:50:05.12742	\N
5	LACOSTE PRIMAIRE/MATERNELLE	Lacoste Primaire/Maternelle	50000	500	uniforme	\N	2026-08-23 14:51:02.441769	\N
6	LACOSTE SECONDAIRE	Lacoste Secondaire	60000	700	uniforme	\N	2026-08-23 14:51:50.555013	\N
7	FOURNITURE GLOBALE CRECHE	Toutes les fournitures de la crèche	644000	100	fourniture	\N	2026-08-24 18:55:50.767452	\N
9	FOURNITURE GLOBALE PS	Toutes les fournitures de la Petite Section	732750	100	fourniture	\N	2026-08-24 19:05:22.571847	\N
10	FOURNITURE GLOBALE MS	Toutes les fournitures de la Moyenne Section	679650	100	fourniture	\N	2026-08-24 19:06:55.512901	\N
11	FOURNITURE GLOBALE GS-CP1	Toutes les fournitures de la grande section Section CP1	814200	100	fourniture	\N	2026-08-24 19:10:22.736436	\N
12	FOURNITURE GLOBALE CP2	Toutes les fourniture de la 2ème Année (CP2)	817650	100	fourniture	\N	2026-08-24 19:12:22.323865	\N
13	FOURNITURES GLOBALE CE1	Toutes les fournitures de la 3eme Année (CE1)	1063750	100	fourniture	\N	2026-08-24 19:15:00.970518	\N
14	FOURNITURE GLOBALE CE2	Toutes les fournitures de la 4e Année (CE2)	1104000	100	fourniture	\N	2026-08-24 19:31:25.729438	\N
15	FOURNITURE GLOBALE CM1	Toutes les fournitures de la 5e Année (CM1)	1166000	100	fourniture	\N	2026-08-24 19:32:46.770386	\N
16	FOURNITURES GLOBALE CM2	Toutes les fournitures de la 6e Année (CM2)	1166100	100	fourniture	\N	2026-08-24 19:34:18.617461	\N
17	FOURNITURE GLOBALE 7e ANNEE	Toutes les fournitures de la 7e Année	1966500	100	fourniture	\N	2026-08-24 19:36:03.455523	\N
18	FOURNITURE GLOBALE 8e ANNEE	Toutes les fournitures de la 8e Année	1966500	100	fourniture	\N	2026-08-24 19:37:17.064188	\N
19	FOURNITURE GLOBALE 9e ANNEE	Toutes les fournitures de la 9e Année	2029750	100	fourniture	\N	2026-08-24 19:38:31.841514	\N
20	FOURNITURE GLOBALE 10e ANNEE	Toutes les fournitures de la 10e Année	2156250	100	fourniture	\N	2026-08-24 19:40:16.394591	\N
21	FOURNITURE GLOBALE 11e SS	Toutes les fournitures de la 11e Année Sciences Sociales	1788250	50	fourniture	\N	2026-08-24 19:54:01.686334	\N
22	FOURNITURE GLOBALE 11e SE/SM	Toutes les fournitures de la 11e Année Scientifique	1765250	50	fourniture	\N	2026-08-24 20:38:32.451571	\N
23	FOURNITURE GLOBALE 12e SS	Toutes les fournitures de la 12e Année Sciences Sociales	1817000	50	fourniture	\N	2026-08-24 20:40:36.496471	\N
24	FOURNITURE GLOBALE 12e SE/SM	Toutes les fournitures de la 12e Scientifique	1684750	50	fourniture	\N	2026-08-24 20:43:01.631863	\N
25	FOURNITURE GLOBALE TSS	Toutes les fournitures de la Terminale Sciences Sociales	1914750	50	fourniture	\N	2026-08-24 20:44:50.020686	\N
26	FOURNITURE GLOBALE TSE	Toutes les fournitures de la Terminale Sciences Expérimentales	1799750	50	fourniture	\N	2026-08-24 20:47:39.007793	\N
27	FOURNITURE GLOBALE TSM	Toutes les fournitures de la Terminale Sciences Mathématiques	1857250	50	fourniture	\N	2026-08-24 20:49:42.022747	\N
8	FOURNITURE GLOBALE TPS	Toutes les fournitures de la Toute Petite Section	564000	100	fourniture	\N	2026-08-24 19:03:04.212647	\N
28	Tenue scolaire Maternelle/Primaire	Tenue complète pour Maternelle et Primaire	175000	1000	uniforme	\N	2026-08-25 16:48:39.825776	{Maternelle,Primaire}
29	Tenue scolaire Collège/Lycée	Tenue complète pour Collège et Lycée	225000	1000	uniforme	\N	2026-08-25 16:48:39.825776	{Collège,Lycée}
30	Tenue de sport	Tenue d’éducation physique	100000	1000	uniforme	\N	2026-08-25 16:48:39.825776	{Maternelle,Primaire,Collège,Lycée}
31	Lacoste Maternelle/Primaire	Lacoste pour Maternelle et Primaire	50000	500	uniforme	\N	2026-08-25 16:48:39.825776	{Maternelle,Primaire}
33	Marqueur	Marqueur de texte ou tableau	60000	500	fourniture	\N	2026-08-25 16:48:39.825776	{Maternelle,Primaire,Collège,Lycée}
34	Ramette de papier	Ramette 500 feuilles	50000	500	fourniture	\N	2026-08-25 16:48:39.825776	{Maternelle,Primaire,Collège,Lycée}
1	TENUE SCOLAIRE MATERNELLE/PRIMAIRE	Tenue primaire/Maternelle	175000	1000	uniforme	https://zwdpyhpbcrcccqgsthnc.supabase.co/storage/v1/object/public/preinscriptions/librairie/librairie_1783776236197_6015.jpg	2026-07-11 13:23:58.014423	\N
32	Lacoste Collège/Lycée	Lacoste pour Collège et Lycée	60000	500	uniforme	\N	2026-08-25 16:48:39.825776	{Collège,Lycée}
\.


--
-- Data for Name: avances_salaires; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.avances_salaires (id, personnel_id, montant, motif, date_avance, mois_deduction, annee_deduction, statut, accorde_par, created_at) FROM stdin;
\.


--
-- Data for Name: budget_previsionnel; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.budget_previsionnel (id, annee, categorie_code, montant_prevu, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: bus; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.bus (id, immatriculation, capacite, chauffeur_nom, chauffeur_tel) FROM stdin;
7	25	60	ABDOUL KARIM SYLLA	625400031
6	AZ 2089 05	60	BALDE MOHAMED	611990536
10	27	33	IBRAHIMA SORY SOUMAH	620494250
5	AI 5221 02	60	MORY CONDE	622769669
15	2AI 5221 02	30	MORY CONDE	622769669
16	2AZ 2089 05	30	BALDE MOHAMED	611990536
18	26	30	ABDOUL KARIM SYLLA	625400031
19	28	30	IBRAHIMA SORY SOUMAH	620494250
20	UN TRAJET	30	TOUS	625549579
\.


--
-- Data for Name: cantine_menus; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cantine_menus (id, date, plat, accompagnement, dessert, regime_special, prix, prix_annuel) FROM stdin;
3	2026-08-23	CANTINE ANNUELLE			f	\N	3600000
\.


--
-- Data for Name: categories_depenses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories_depenses (id, code, libelle, type, description, is_active, created_at) FROM stdin;
\.


--
-- Data for Name: categories_quiz; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.categories_quiz (id, nom, description, couleur, icon, est_active, created_at) FROM stdin;
\.


--
-- Data for Name: classes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.classes (id, nom, niveau, salle, capacite_max, titulaire_id, code_acces, frais_inscription, annee_scolaire_id, created_at, premier_versement, deuxieme_versement, troisieme_versement, total_versement, reinscription_premier_versement, reinscription_deuxieme_versement, reinscription_troisieme_versement, reinscription_total_versement) FROM stdin;
1	Crèche	Maternelle	\N	30	\N	\N	5900000	\N	2026-07-11 12:22:47.647619	2800000	2100000	1000000	5900000	2600000	2100000	1000000	5700000
3	CP2	Primaire	\N	30	\N	\N	6400000	1	2026-07-29 18:54:55.983625	2800000	2100000	1500000	6400000	2600000	2100000	1500000	6200000
5	PS-A	Maternelle	\N	30	\N	\N	5900000	1	2026-08-22 16:22:20.384516	2800000	2100000	1000000	5900000	2600000	2100000	1000000	5700000
7	PS-B	Maternelle	\N	30	\N	\N	5900000	1	2026-08-22 16:27:51.669401	2800000	2100000	1000000	5900000	2600000	2100000	1000000	5700000
9	MS-A	Maternelle	\N	30	\N	\N	5900000	1	2026-08-22 16:29:53.745336	2800000	2100000	1000000	5900000	2600000	2100000	1000000	5700000
6	7e A-A	Collège	\N	30	\N	\N	7900000	1	2026-08-22 16:25:05.646853	3800000	2100000	2000000	7900000	3600000	2100000	2000000	7700000
10	MS-B	Maternelle	\N	30	\N	\N	5900000	1	2026-08-22 16:32:15.373657	2800000	2100000	1000000	5900000	2600000	2100000	1000000	5700000
2	GS/CP - A	Primaire	\N	30	\N	\N	6400000	\N	2026-07-11 13:09:20.866519	2800000	2100000	1500000	6400000	2600000	2100000	1500000	6200000
12	7e A-B	Collège	\N	30	\N	\N	7900000	1	2026-08-22 16:33:39.993477	3800000	2100000	2000000	7900000	3600000	2100000	2000000	7700000
13	7e A-C	Collège	\N	30	\N	\N	7900000	1	2026-08-22 16:35:10.777173	3800000	2100000	2000000	7900000	3600000	2100000	2000000	7700000
14	GS/CP - B	Primaire	\N	30	\N	\N	6400000	1	2026-08-22 16:36:03.447149	2800000	2100000	1500000	6400000	2600000	2100000	1500000	6200000
15	8e A-B	Collège	\N	30	\N	\N	7900000	1	2026-08-22 16:37:43.260874	3800000	2100000	2000000	7900000	3600000	2100000	2000000	7700000
11	8e A-C	Collège	\N	30	\N	\N	7900000	1	2026-08-22 16:33:39.521494	3800000	2100000	2000000	7900000	3600000	2100000	2000000	7700000
8	8e A-A	Collège	\N	30	\N	\N	7900000	1	2026-08-22 16:28:56.358159	3800000	2100000	2000000	7900000	3600000	2100000	2000000	7700000
16	9e A-A	Collège	\N	30	\N	\N	7900000	1	2026-08-22 16:39:47.073432	3800000	2100000	2000000	7900000	3600000	2100000	2000000	7700000
17	GS/CP - C	Primaire	\N	30	\N	\N	6400000	1	2026-08-22 16:39:48.693803	2800000	2100000	1500000	6400000	2600000	2100000	1500000	6200000
19	9e A-B 	Collège	\N	30	\N	\N	7900000	1	2026-08-22 16:41:32.153676	3800000	2100000	2000000	7900000	3600000	2100000	2000000	7700000
18	9e A-C	Collège	\N	30	\N	\N	7900000	1	2026-08-22 16:41:31.02803	3800000	2100000	2000000	7900000	3600000	2100000	2000000	7700000
20	CP2 - A	Primaire	\N	30	\N	\N	6400000	1	2026-08-22 16:44:06.592643	2800000	2100000	1500000	6400000	2600000	2100000	1500000	6200000
21	10e A-A	Collège	\N	30	\N	\N	9900000	1	2026-08-22 16:45:07.208946	5300000	2500000	2100000	9900000	4100000	2500000	2100000	8700000
22	CP2 - B	Primaire	\N	30	\N	\N	6400000	1	2026-08-22 16:45:33.625457	2800000	2100000	1500000	6400000	2600000	2100000	1500000	6200000
23	CP2 - C	Primaire	\N	30	\N	\N	6400000	1	2026-08-22 16:46:21.943588	2800000	2100000	1500000	6400000	2600000	2100000	1500000	6200000
24	10e A-B	Collège	\N	30	\N	\N	9900000	1	2026-08-22 16:46:28.590692	5300000	2500000	2100000	9900000	4100000	2500000	2100000	8700000
27	CE1 - B	Primaire	\N	30	\N	\N	6400000	1	2026-08-22 16:50:36.857442	2800000	2100000	1500000	6400000	2600000	2100000	1500000	6200000
29	11e Sc	Lycée	\N	30	\N	\N	8400000	1	2026-08-22 16:51:48.437989	3800000	2600000	2000000	8400000	3600000	2600000	2000000	8200000
31	CE2 - A	Primaire	\N	30	\N	\N	6400000	1	2026-08-22 16:52:58.361294	2800000	2100000	1500000	6400000	2600000	2100000	1500000	6200000
32	12e SL	Lycée	\N	30	\N	\N	8400000	1	2026-08-22 16:53:33.219632	3800000	2600000	2000000	8400000	3600000	2600000	2000000	8200000
34	CE2 - B	Primaire	\N	30	\N	\N	6400000	1	2026-08-22 16:53:49.608793	2800000	2100000	1500000	6400000	2600000	2100000	1500000	6200000
33	12e SM	Lycée	\N	30	\N	\N	8400000	1	2026-08-22 16:53:33.60225	3800000	2600000	2000000	8400000	3600000	2600000	2000000	8200000
35	CE2 - C	Primaire	\N	30	\N	\N	6400000	1	2026-08-22 16:54:33.579031	2800000	2100000	1500000	6400000	2600000	2100000	1500000	6200000
36	CM1 - A	Primaire	\N	30	\N	\N	6400000	1	2026-08-22 16:55:20.068641	2800000	2100000	1500000	6400000	2600000	2100000	1500000	6200000
37	CM1 - B	Primaire	\N	30	\N	\N	6400000	1	2026-08-22 16:56:31.399502	2800000	2100000	1500000	6400000	2600000	2100000	1500000	6200000
38	TSM	Lycée	\N	30	\N	\N	10400000	1	2026-08-22 16:56:37.018029	5300000	2500000	2600000	10400000	4100000	2500000	2600000	9200000
39	TSL	Lycée	\N	30	\N	\N	10400000	1	2026-08-22 16:57:48.271738	5300000	2500000	2600000	10400000	4100000	2500000	2600000	9200000
40	TSc	Lycée	\N	30	\N	\N	10400000	1	2026-08-22 16:59:32.859322	5300000	2500000	2600000	10400000	4100000	2500000	2600000	9200000
41	CM1 - C	Primaire	\N	30	\N	\N	6400000	1	2026-08-22 16:59:36.794849	2800000	2100000	1500000	6400000	2600000	2100000	1500000	6200000
26	11e SL	Lycée	\N	30	\N	\N	8400000	1	2026-08-22 16:50:32.946722	3800000	2600000	2000000	8400000	3600000	2600000	2000000	8200000
42	CM2 - A	Primaire	\N	30	\N	\N	8400000	1	2026-08-22 17:01:39.621277	4300000	2100000	2000000	8400000	3100000	2100000	2000000	7200000
43	CM2 - B	Primaire	\N	30	\N	\N	8400000	1	2026-08-22 17:02:59.404602	4300000	2100000	2000000	8400000	3100000	2100000	2000000	7200000
44	CM2 - B	Primaire	\N	30	\N	\N	8400000	1	2026-08-22 17:02:59.470621	4300000	2100000	2000000	8400000	3100000	2100000	2000000	7200000
45	CM2 - B	Primaire	\N	30	\N	\N	8400000	1	2026-08-22 17:02:59.966523	4300000	2100000	2000000	8400000	3100000	2100000	2000000	7200000
46	CM2 - C	Primaire	\N	30	\N	\N	8400000	1	2026-08-22 17:04:16.057598	4300000	2100000	2000000	8400000	3100000	2100000	2000000	7200000
47	CM2 - C	Primaire	\N	30	\N	\N	8400000	1	2026-08-22 17:04:21.682252	4300000	2100000	2000000	8400000	3100000	2100000	2000000	7200000
28	CE2 - D	Primaire	\N	30	\N	\N	6400000	1	2026-08-22 16:51:31.834018	2800000	2100000	1500000	6400000	2600000	2100000	1500000	6200000
4	CE1 - C	Primaire	\N	30	\N	\N	6400000	1	2026-07-29 18:57:24.939628	2800000	2100000	1500000	6400000	2600000	2100000	1500000	6200000
25	CE1 - A	Primaire	\N	30	\N	\N	6400000	1	2026-08-22 16:49:29.7692	2800000	2100000	1500000	6400000	2600000	2100000	1500000	6200000
\.


--
-- Data for Name: commandes_fournitures; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.commandes_fournitures (id, preinscription_id, article_id, quantite, prix_unitaire, created_at) FROM stdin;
158	50	31	1	50000	2026-11-18 00:53:19.463424
159	50	33	1	60000	2026-11-18 00:53:19.743361
160	50	34	2	50000	2026-11-18 00:53:19.934933
161	50	30	1	100000	2026-11-18 00:53:20.126407
162	50	28	2	175000	2026-11-18 00:53:20.366894
\.


--
-- Data for Name: commandes_librairie; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.commandes_librairie (id, parent_id, numero_commande, date_commande, statut, total, observations, date_traitement, created_at, updated_at, mode_paiement, reference_paiement) FROM stdin;
\.


--
-- Data for Name: commandes_librairie_articles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.commandes_librairie_articles (id, commande_id, article_id, quantite, prix_unitaire, created_at) FROM stdin;
\.


--
-- Data for Name: conges_personnel; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.conges_personnel (id, personnel_id, type_conge, date_debut, date_fin, nombre_jours, motif, statut, approuve_par, date_approbation, created_at) FROM stdin;
\.


--
-- Data for Name: contrats_personnel; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.contrats_personnel (id, personnel_id, type_contrat, date_debut, date_fin, salaire_brut, salaire_net, heures_semaine, conges_annuels, observations, is_actif, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: depenses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.depenses (id, categorie, montant, description, date_depense, sous_categorie, reference, fournisseur, numero_recu, saisi_par, valide_par, statut, exercice_annee, exercice_mois, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: devoirs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.devoirs (id, enseignement_id, titre, description, fichier_url, date_limite, date_publication) FROM stdin;
1	9	FORUM DE COMPTANCE NUMERIQUE	ZDFGHJ	https://zwdpyhpbcrcccqgsthnc.supabase.co/storage/v1/object/public/preinscriptions/devoir/devoir_devoir_1787409326108.jpg	2026-08-23	2026-08-22
\.


--
-- Data for Name: echeances_paiement; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.echeances_paiement (id, preinscription_id, type, echeance, montant, date_echeance, statut, date_paiement, reference_transaction, mode_paiement, created_at, updated_at, reinscription_id) FROM stdin;
328	50	inscription	2eme_versement	2100000	2027-01-18	en_attente	\N	\N	\N	2026-11-18 00:53:21.223486	2026-11-18 00:53:21.223486	\N
329	50	inscription	3eme_versement	1000000	2027-03-18	en_attente	\N	\N	\N	2026-11-18 00:53:21.43821	2026-11-18 00:53:21.43821	\N
330	50	fournitures	fournitures	660000	2026-11-18	en_attente	\N	\N	\N	2026-11-18 00:53:21.823448	2026-11-18 00:53:21.823448	\N
327	50	inscription	1er_versement	240000	2026-11-18	partiel	\N	\N	\N	2026-11-18 00:53:20.990127	2026-11-18 01:59:48.956984	\N
\.


--
-- Data for Name: eleves; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.eleves (id, utilisateur_id, matricule, date_naissance, lieu_naissance, sexe, nationalite, classe_id, date_inscription, est_inscrit, carte_scolaire_url, photo_url, deleted_at) FROM stdin;
\.


--
-- Data for Name: emprunts_bibliotheque; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.emprunts_bibliotheque (id, livre_id, eleve_id, date_emprunt, date_retour_prevue, date_retour_reelle, statut) FROM stdin;
\.


--
-- Data for Name: enseignements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.enseignements (id, enseignant_id, classe_id, matiere_id, heures_semaine, heures_mois, heures_an, annee_scolaire_id) FROM stdin;
10	\N	2	\N	\N	\N	\N	1
8	\N	2	\N	\N	\N	\N	1
12	\N	2	1	\N	\N	\N	1
13	\N	1	1	\N	\N	\N	1
17	\N	4	1	\N	\N	\N	1
9	\N	1	\N	\N	\N	\N	1
11	\N	2	\N	\N	\N	\N	1
21	\N	1	1	\N	\N	\N	1
22	7	42	\N	\N	\N	\N	1
\.


--
-- Data for Name: examens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.examens (id, enseignement_id, titre, duree_minutes, date_debut, date_fin, est_actif, fichier_url) FROM stdin;
1	9	AZERTY	10	2026-08-22 14:50:00	2026-08-22 15:00:00	t	https://zwdpyhpbcrcccqgsthnc.supabase.co/storage/v1/object/public/preinscriptions/examens/examen_1787409967967_0c9b3a.jpg
2	21	SDFGH	10	2026-08-22 14:50:00	2026-08-22 15:00:00	t	https://zwdpyhpbcrcccqgsthnc.supabase.co/storage/v1/object/public/preinscriptions/examens/examen_1787410059845_eoc3kg.jpg
\.


--
-- Data for Name: examens_eleves; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.examens_eleves (id, examen_id, eleve_id, created_at) FROM stdin;
\.


--
-- Data for Name: frais_scolaires; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.frais_scolaires (id, nom, type_frais, montant, obligatoire, frequence, niveau, annee_scolaire_id, description) FROM stdin;
\.


--
-- Data for Name: inscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inscriptions (id, preinscription_id, eleve_id, parent_id, numero_matricule, date_inscription, annee_scolaire_id, statut, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: inscriptions_cantine; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inscriptions_cantine (id, eleve_id, est_actif, solde, preferences_alimentaires, allergies, date_inscription, mois_total, mois_restants, montant_mensuel, montant_total) FROM stdin;
\.


--
-- Data for Name: inscriptions_transport; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.inscriptions_transport (id, eleve_id, ligne_id, date_debut, date_fin, est_actif, mois_total, mois_restants, montant_mensuel, montant_total, solde, date_inscription) FROM stdin;
\.


--
-- Data for Name: lecons; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lecons (id, enseignement_id, titre, description, contenu, fichier_url, video_url, date_publication, matiere_personnalisee) FROM stdin;
1	9	Français grammaire	Français grammaire	\N	/uploads/lecons/1785506329340-CACHET_COTECH_SERVICES.png	\N	2026-07-31	\N
2	11	FF	SDFGHJ	\N	/uploads/lecons/1786140402009-LOGO_COTECH_SERVICES.png	\N	2026-08-07	TT
\.


--
-- Data for Name: lien_parent_eleve; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lien_parent_eleve (parent_id, eleve_id, lien) FROM stdin;
\.


--
-- Data for Name: lignes_transport; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.lignes_transport (id, nom, bus_id, horaire_matin, horaire_soir, prix_abonnement) FROM stdin;
4	SANOYAH-KAGBELEN-DUBREKA	7	06:30:00	16:30:00	350000
3	SANOYAH-KAGBELEN-CIMENTERIE-SONFONIA	6	06:30:00	16:30:00	350000
5	SANOYAH-KOUNTIA-TOMBOLIA-ENTAG	10	06:30:00	16:30:00	350000
2	SANOYAH-KASONYAH -COYAH	5	06:30:00	16:30:00	350000
6	SANOYAH-GOMBOYA-BENTOURAYAH	15	06:30:00	16:30:00	300000
7	CIMENTERIE-SONFONIA	16	06:30:00	16:30:00	300000
8	KAGBELEN-GRAND MOULIN	18	06:30:00	16:30:00	300000
9	KM36-KOUNTIA-LANSANAYA BARRAGE	19	06:30:00	16:30:00	300000
10	TOUS LES TRAJETS	20	06:30:00	16:30:00	200000
\.


--
-- Data for Name: livres_bibliotheque; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.livres_bibliotheque (id, titre, auteur, isbn, quantite, disponible, emplacement, categorie, image_url) FROM stdin;
\.


--
-- Data for Name: logs_activites; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.logs_activites (id, utilisateur_id, action, details, ip_address, date_action) FROM stdin;
\.


--
-- Data for Name: matieres; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.matieres (id, nom, coefficient, description) FROM stdin;
1	TT	1	\N
\.


--
-- Data for Name: menus_cantine; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.menus_cantine (id, date, plat, accompagnement, dessert, prix, allergenes, calories, regime_special) FROM stdin;
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.messages (id, expediteur_id, destinataire_id, sujet, contenu, est_lu, date_envoi) FROM stdin;
\.


--
-- Data for Name: mouvements_caisse; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mouvements_caisse (id, type, montant, categorie, sous_categorie, description, reference, date_mouvement, exercice_annee, exercice_mois, saisi_par, valide_par, statut, recu_url, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: notes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notes (id, eleve_id, enseignement_id, type_note, valeur, coefficient, date_saisie, commentaire, enseignant_id, note_sur) FROM stdin;
\.


--
-- Data for Name: options_qcm; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.options_qcm (id, question_id, option_texte, est_correcte) FROM stdin;
1	1	AZERTY	t
2	1	SDFGH	f
3	1	DFGH	f
4	2	Z	t
5	2	E	f
\.


--
-- Data for Name: options_quiz; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.options_quiz (id, question_id, option_texte, est_correcte, ordre) FROM stdin;
\.


--
-- Data for Name: paiements; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.paiements (id, eleve_id, montant, type_frais, mois, annee, mode_paiement, reference_transaction, statut, date_paiement, "reçu_url", saisie_par, preinscription_id, reinscription_id) FROM stdin;
90	\N	2560000	inscription	11	2026	especes	GLB-ECH-327	valide	2026-11-18	\N	1	50	\N
\.


--
-- Data for Name: paiements_salaires; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.paiements_salaires (id, personnel_id, montant, mois, annee, mode_paiement, reference_transaction, saisie_par, statut, date_paiement, note, salaire_base, prime_mensuelle, prime_responsabilite, prime_craie, retenue_sanction, autres_retenues, details_lignes, total_brut, total_deductions) FROM stdin;
\.


--
-- Data for Name: parents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.parents (id, utilisateur_id, profession, situation_matrimoniale) FROM stdin;
5	135	Developpeur IT	{"mereNom":"Iffono","merePrenom":"Massa","merePhone":"623368081","mereProfession":"Sage Femme"}
\.


--
-- Data for Name: participations_quiz; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.participations_quiz (id, quiz_id, eleve_id, date_debut, date_fin, score_total, points_obtenus, reponses_correctes, reponses_totales, pourcentage, est_termine) FROM stdin;
\.


--
-- Data for Name: personnels; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.personnels (id, utilisateur_id, matricule_personnel, type, date_embauche, salaire_base, carte_personnel_url, statut, departement, prime_mensuelle, mode_paiement_salaire, carte_id_url, cv_url, certificat_residence_url) FROM stdin;
7	37	PER-2026-037	ENSEIGNANT	2021-09-01	3500000	\N	actif	Pédagogie	0	virement	\N	\N	\N
8	38	PER-2026-038	COMPTABLE	2022-09-01	4000000	\N	actif	Finances	0	virement	\N	\N	\N
9	99	PER-2026-099	ENSEIGNANT	2019-09-01	4000000	\N	actif	Pédagogie	0	virement	\N	\N	\N
10	100	PER-2026-100	ENSEIGNANT	2025-09-01	2600000	\N	actif	Pédagogie	0	virement	\N	\N	\N
11	101	PER-2026-101	ENSEIGNANT	2023-09-01	2700000	\N	actif	Pédagogie	0	virement	\N	\N	\N
12	102	PER-2026-102	ENSEIGNANT	2023-09-01	2700000	\N	actif	Pédagogie	0	virement	\N	\N	\N
13	103	PER-2026-103	ENSEIGNANT	2025-09-01	2700000	\N	actif	Pédagogie	0	virement	\N	\N	\N
14	104	PER-2026-104	ENSEIGNANT	2023-09-01	3000000	\N	actif	Pédagogie	0	virement	\N	\N	\N
15	105	PER-2026-105	ENSEIGNANT	2023-09-01	2700000	\N	actif	Pédagogie	0	virement	\N	\N	\N
16	106	PER-2026-106	ENSEIGNANT	2022-09-01	2700000	\N	actif	Pédagogie	0	virement	\N	\N	\N
17	107	PER-2026-107	ENSEIGNANT	2025-09-01	2600000	\N	actif	Pédagogie	0	virement	\N	\N	\N
18	108	PER-2026-108	ENSEIGNANT	2023-09-01	2700000	\N	actif	Pédagogie	0	virement	\N	\N	\N
19	109	PER-2026-109	ENSEIGNANT	2023-09-01	2900000	\N	actif	Pédagogie	0	virement	\N	\N	\N
\.


--
-- Data for Name: preinscription_cantine; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.preinscription_cantine (id, preinscription_id, menu_id, prix, created_at) FROM stdin;
\.


--
-- Data for Name: preinscription_transport; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.preinscription_transport (id, preinscription_id, ligne_id, prix, created_at) FROM stdin;
\.


--
-- Data for Name: preinscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.preinscriptions (id, parent_id, enfant_nom, enfant_prenom, date_naissance, lieu_naissance, sexe, niveau, classe, acte_naissance_url, photo_url, bulletin_url, statut, numero_dossier, date_preinscription, observations, traite_par, date_traitement, frais_montant, frais_statut, frais_mode_paiement, frais_reference, frais_date_paiement, plan_paiement_id, montant_total_plan, montant_restant_plan, type_inscription, est_reinscription, updated_at) FROM stdin;
50	5	Camara	Fanta	2025-09-09	Conakry	F	Maternelle	MS-A	\N	\N	\N	en_attente	PRE-26-198766-4733	2026-11-18 00:53:19.150259	\N	\N	\N	5900000	partiel	\N	\N	\N	\N	3340000	780000	inscription	f	2026-11-18 01:59:48.956984+00
\.


--
-- Data for Name: presences; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.presences (id, eleve_id, classe_id, date, statut, heure_arrivee, justificatif_url, enseignant_id) FROM stdin;
\.


--
-- Data for Name: presences_transport; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.presences_transport (id, eleve_id, date, statut, heure_arrivee, commentaire, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: questions_qcm; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.questions_qcm (id, examen_id, question, points, ordre) FROM stdin;
1	1	ZERTY	1	1
2	2	Z	10	1
\.


--
-- Data for Name: questions_quiz; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.questions_quiz (id, categorie_id, enseignement_id, question, explication, difficulte, points, temps_secondes, est_active, ordre, created_at, created_by) FROM stdin;
\.


--
-- Data for Name: quiz; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quiz (id, enseignement_id, titre, description, type, duree_minutes, est_actif, date_debut, date_fin, est_aleatoire, afficher_resultats, created_at, fichier_url) FROM stdin;
\.


--
-- Data for Name: quiz_questions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.quiz_questions (id, quiz_id, question_id, ordre, points_personnalises) FROM stdin;
\.


--
-- Data for Name: recus; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.recus (id, numero_recu, paiement_id, eleve_id, preinscription_id, reinscription_id, enfant_nom, parent_nom, montant, type_frais, mode_paiement, date_paiement, reference, source, created_at, updated_at, montant_total, reste_a_payer, classe_nom) FROM stdin;
\.


--
-- Data for Name: reinscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reinscriptions (id, inscription_id, eleve_id, parent_id, annee_scolaire_id, classe_id, montant_frais, frais_statut, frais_mode_paiement, frais_reference, frais_date_paiement, statut, date_reinscription, observations, created_at, updated_at, acte_naissance_url, photo_url, bulletin_url, date_traitement, numero_dossier, enfant_nom, enfant_prenom, date_naissance, lieu_naissance, sexe, niveau, classe_nom, parent_nom, parent_prenom, parent_email, parent_telephone, montant_total_plan, montant_restant_plan) FROM stdin;
\.


--
-- Data for Name: remises_familles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.remises_familles (id, parent_id, montant, motif, saisie_par, created_at) FROM stdin;
\.


--
-- Data for Name: reponses_eleves_qcm; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reponses_eleves_qcm (id, examen_id, eleve_id, question_id, option_id, date_reponse) FROM stdin;
\.


--
-- Data for Name: reponses_quiz; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reponses_quiz (id, participation_id, question_id, option_id, est_correcte, temps_reponse_ms, date_reponse) FROM stdin;
\.


--
-- Data for Name: reservations_cantine; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reservations_cantine (id, eleve_id, menu_id, date, statut, paye, created_at) FROM stdin;
\.


--
-- Data for Name: reserves_cantine; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reserves_cantine (id, eleve_id, date, est_present, date_reservation) FROM stdin;
\.


--
-- Data for Name: reset_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reset_tokens (id, email, token, expires_at, created_at, used) FROM stdin;
\.


--
-- Data for Name: services_annexes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.services_annexes (id, nom, montant_mensuel, type, description, actif, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (id, utilisateur_id, token, expire_le, created_at) FROM stdin;
\.


--
-- Data for Name: soumissions_devoirs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.soumissions_devoirs (id, devoir_id, eleve_id, fichier_url, date_soumission, note, commentaire, est_retard) FROM stdin;
\.


--
-- Data for Name: transactions_cantine; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.transactions_cantine (id, eleve_id, montant, type, description, date) FROM stdin;
\.


--
-- Data for Name: utilisateurs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.utilisateurs (id, email, password, prenom, nom, telephone, adresse, photo_url, role, est_actif, derniere_connexion, created_at, updated_at, deleted_at) FROM stdin;
3	directeur@eief.com	$2b$10$Cl.LbpccIdc1.rBfxmuvGuhrvsgOasr/kus9dyvifHCojG8ZiPR72	Paul	Directeur	\N	\N	\N	DIRECTEUR_GENERAL	t	\N	2026-07-11 12:07:11.175285	2026-07-11 12:07:11.175285	\N
4	cantine@eief.com	$2b$10$Cl.LbpccIdc1.rBfxmuvGuhrvsgOasr/kus9dyvifHCojG8ZiPR72	Aissatou	Kane	\N	\N	\N	ADMIN_CANTINE	t	\N	2026-07-11 12:07:11.175285	2026-07-11 12:07:11.175285	\N
5	librairie@eief.com	$2b$10$Cl.LbpccIdc1.rBfxmuvGuhrvsgOasr/kus9dyvifHCojG8ZiPR72	Fatou	Diop	\N	\N	\N	ADMIN_LIBRAIRIE	t	\N	2026-07-11 12:07:11.175285	2026-07-11 12:07:11.175285	\N
6	bibliotheque@eief.com	$2b$10$Cl.LbpccIdc1.rBfxmuvGuhrvsgOasr/kus9dyvifHCojG8ZiPR72	Mamadou	Diallo	\N	\N	\N	ADMIN_BIBLIOTHEQUE	t	\N	2026-07-11 12:07:11.175285	2026-07-11 12:07:11.175285	\N
7	transport@eief.com	$2b$10$Cl.LbpccIdc1.rBfxmuvGuhrvsgOasr/kus9dyvifHCojG8ZiPR72	Amadou	Camara	\N	\N	\N	ADMIN_TRANSPORT	t	\N	2026-07-11 12:07:11.175285	2026-07-11 12:07:11.175285	\N
37	tambakamanoetienne@gmail.com	$2b$10$n4XblBKh.zf0pCaOYWnkbeql2fhNb6wNtAe6h..nJr8uunRamIQWu	TAMBA ETIENNE	KAMANO	623258371	SANOYAH	\N	ENSEIGNANT	t	\N	2026-08-24 18:11:55.616121	2026-08-24 18:11:55.616121	\N
38	koundounof6@gmail.com	$2b$10$xvzFuarETOPjvHeac8xda.OLYDdnS4g9PIk3DZHfYVmDszxvi/7LG	FANTA	KOUNDOUNO	628527357	GOMBOYAH	\N	COMPTABLE	t	\N	2026-08-24 18:17:26.82236	2026-08-24 18:17:26.82236	\N
48	eleve_1787658212172@temp.com	$2b$10$Op7bJ5ItvNjmeC5o3uZeuOopM.yYXYHUtM6cZGCASntxPWySXrIky	Henry Sosthene 	Loua 	\N	\N	\N	ELEVE	t	\N	2026-08-25 11:43:32.207707	2026-08-25 11:43:32.207707	\N
49	eleve_1787658409276@temp.com	$2b$10$L4o8gcfpM4.817S75mu1bugHD9avuyW90GnZXZewWVDUcwtrynKei	Henry Sosthene 	Loua 	\N	\N	\N	ELEVE	t	\N	2026-08-25 11:46:49.312649	2026-08-25 11:46:49.312649	\N
52	eleve_1787659559740@temp.com	$2b$10$gJ3jk3QHYAwi8LM.HJDhf.JVvZwywEiv1co0MsQzcbsua6l7BP.T6	yyy	rrr	\N	\N	\N	ELEVE	t	\N	2026-08-25 12:05:59.77554	2026-08-25 12:05:59.77554	\N
53	eleve_1787660826448@temp.com	$2b$10$OijQJ0JD09nufT14eDx0Rea5waYdQI7u.uHKTs5ANSWwgr5dxo6sa	Henry Sosthene 	Loua 	\N	\N	\N	ELEVE	t	\N	2026-08-25 12:27:06.48325	2026-08-25 12:27:06.48325	\N
55	eleve_1787661338795@temp.com	$2b$10$Sk26fT49YWTpjmFrfHB4Ru.GSLhrnVtbowQKX02a3n83lMTDOLjKS	yyy	rrr	\N	\N	\N	ELEVE	t	\N	2026-08-25 12:35:38.830293	2026-08-25 12:35:38.830293	\N
56	eleve_1787662122973@temp.com	$2b$10$T9/bIYOdtjjiZhKaYT3YReHR1Oo3c3A8P7./.yLzVpsKspEh4qpCW	A	A	\N	\N	\N	ELEVE	t	\N	2026-08-25 12:48:43.008784	2026-08-25 12:48:43.008784	\N
57	eleve_1787662160215@temp.com	$2b$10$RTyW7fw5aoo47fbfyODZGu2AEFigfoLkoUjbAuY4duGnLJ1cV6AGu	A	A	\N	\N	\N	ELEVE	t	\N	2026-08-25 12:49:20.250376	2026-08-25 12:49:20.250376	\N
60	eleve_1787662549625@temp.com	$2b$10$SLJC7UX1sI4nmwnZBlVqvuro.VqXDEW.rYI26.pd807D8Hm1oQ.Da	A	A	\N	\N	\N	ELEVE	t	\N	2026-08-25 12:55:49.659915	2026-08-25 12:55:49.659915	\N
61	eleve_1787662987342@temp.com	$2b$10$DupcUkYlG2ugTlhUjzyaBuYmTNRFXtLt91u53t7TdNhxkiYoIME1G	A	A	\N	\N	\N	ELEVE	t	\N	2026-08-25 13:03:07.376854	2026-08-25 13:03:07.376854	\N
62	eleve_1787663334840@temp.com	$2b$10$Cpg6535V9w1EaRP.6oaosOjZhFdAiBuRPobosGYBTUxaBlG1z86ru	A	A	\N	\N	\N	ELEVE	t	\N	2026-08-25 13:08:54.874851	2026-08-25 13:08:54.874851	\N
1	admin@eief.com	$2b$10$Cl.LbpccIdc1.rBfxmuvGuhrvsgOasr/kus9dyvifHCojG8ZiPR72	Basile Fara	OUENDENO	\N	\N	\N	SUPER_ADMIN	t	\N	2026-07-11 12:07:11.175285	2026-07-11 12:07:11.175285	\N
2	comptable@eief.com	$2b$10$Cl.LbpccIdc1.rBfxmuvGuhrvsgOasr/kus9dyvifHCojG8ZiPR72	Fanta	KOUNDOUNO	\N	\N	\N	COMPTABLE	t	\N	2026-07-11 12:07:11.175285	2026-07-11 12:07:11.175285	\N
99	tewasita@eief.org	$2b$10$ktStvUKfTHjLklA83gEmTOVLmU496lOwQJVArmGBeqMWgWeBRwBLG	TEWA SITTA	OUENDENO	625738160	SANOYAH	\N	ENSEIGNANT	t	\N	2026-08-28 14:24:06.232974	2026-08-28 14:24:06.232974	\N
100	bionkamano@eief.org	$2b$10$NKXfEBLcnVG2qOdx5B033uvPM0vrMJzYOcHo3fNY4tX1O5j.TX77K	BION	KAMANO	627406736	SANOYAH	\N	ENSEIGNANT	t	\N	2026-08-28 14:29:06.925143	2026-08-28 14:29:06.925143	\N
101	ousmanefofana@eief.org	$2b$10$PbQ.XrPejeKM4FUz5f47.u88WM5VXfdPHy6uOoOf.C.oc9Bj50hP.	OUSMANE	FOFANA	629370741	SANOYAH	\N	ENSEIGNANT	t	\N	2026-08-28 14:31:03.194914	2026-08-28 14:31:03.194914	\N
102	ibrahimabiaye@eief.org	$2b$10$eDBh5EOnPxQXtNPTwuAju.wjRILOwtAZe4DMd0BZqKia2dSS09zfe	IBRAHIMA	BIAYE	624338964	SANOYAH	\N	ENSEIGNANT	t	\N	2026-08-28 14:32:44.489303	2026-08-28 14:32:44.489303	\N
103	theresemara@eief.org	$2b$10$3MkcmEPMG38UJp7XlsLk3ujDCGMBxi3WC1I555Rc4MfNr32uAGTVm	THERESE	MARA	613106944	KASSONYA	\N	ENSEIGNANT	t	\N	2026-08-28 14:34:31.391784	2026-08-28 14:34:31.391784	\N
104	pascaltonguino@eief.org	$2b$10$7N8Rvr9/UIW1tnZUcjwkv.Vjj9pLsAAXO8GbSolQW6VMUTcXTdkY2	PASCAL	TONGUINO 	620480272	SANOYAH	\N	ENSEIGNANT	t	\N	2026-08-28 14:36:35.807401	2026-08-28 14:36:35.807401	\N
105	juliennemathias@eief.org	$2b$10$j96PqTT0I8E//Xzof4pHdupufkVQ3VHgHJkogvb6OUBPhQBUighBC	JULIENNE	MATHIAS 	624764759	SANOYAH	\N	ENSEIGNANT	t	\N	2026-08-28 14:39:03.196438	2026-08-28 14:39:03.196438	\N
106	mariannelamah@eief.org	$2b$10$AfMWVVuIbvgAXmQyXz3TleWgnVaC2SCB9Mo7QukScPivxB1CCHTLO	MARIANNE NOWAIE	LAMAH	623306757	KASSONYAH	\N	ENSEIGNANT	t	\N	2026-08-29 11:58:29.855064	2026-08-29 11:58:29.855064	\N
107	mariamasow@eief.org	$2b$10$7Kr9X3WfjfkDEk7KqxyZYuSJ1RMqlbREfUHdDlwh7/y22i7R6h8SK	MARIAMA	SOW 	621690898	SANOYAH	\N	ENSEIGNANT	t	\N	2026-08-29 12:03:16.948164	2026-08-29 12:03:16.948164	\N
108	maimounabah@eief.org	$2b$10$e5Q65Ogm5JFAA7K1/cyTkO6/1ERRXjtQJ45.bczrmYr6/VTatMIi2	MAIMOUNA	BAH	622405934	SANOYAH	\N	ENSEIGNANT	t	\N	2026-08-29 12:12:11.079554	2026-08-29 12:12:11.079554	\N
109	fatoumatakoumba@eief.org	$2b$10$gaihdXydOWRJES10q8wH7u7o.HIhCN5IKOYeSMvqMkhf39XN1m83m	FATOUMATA KOUMBA	BALDE	623012964	CIMENTERIE	\N	ENSEIGNANT	t	\N	2026-08-29 12:15:02.908924	2026-08-29 12:15:02.908924	\N
135	mohamedkc237@gmail.com	$2b$10$EwMAi2nMyfDDd8wdN0uV5uX9CyrdMvf5YWMrsIdsb1nnuVYDcDgd.	Mohamed Kolomba	Camara	+224627421722	Conakry	\N	PARENT	t	\N	2026-11-18 00:53:18.110357	2026-11-18 00:53:18.110357	\N
\.


--
-- Data for Name: ventes_librairie; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.ventes_librairie (id, article_id, eleve_id, quantite, montant_total, date_vente, vendu_par) FROM stdin;
\.


--
-- Data for Name: schema_migrations; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.schema_migrations (version, inserted_at) FROM stdin;
20211116024918	2026-05-21 14:27:13
20211116045059	2026-05-21 14:27:13
20211116050929	2026-05-21 14:27:13
20211116051442	2026-05-21 14:27:13
20211116212300	2026-05-21 14:27:13
20211116213355	2026-05-21 14:27:13
20211116213934	2026-05-21 14:27:13
20211116214523	2026-05-21 14:27:13
20211122062447	2026-05-21 14:27:13
20211124070109	2026-05-21 14:27:13
20211202204204	2026-05-21 14:27:13
20211202204605	2026-05-21 14:27:13
20211210212804	2026-05-21 14:27:13
20211228014915	2026-05-21 14:27:14
20220107221237	2026-05-21 14:27:14
20220228202821	2026-05-21 14:27:14
20220312004840	2026-05-21 14:27:14
20220603231003	2026-05-21 14:27:14
20220603232444	2026-05-21 14:27:14
20220615214548	2026-05-21 14:27:14
20220712093339	2026-05-21 14:27:14
20220908172859	2026-05-21 14:27:14
20220916233421	2026-05-21 14:27:14
20230119133233	2026-05-21 14:27:14
20230128025114	2026-05-21 14:27:14
20230128025212	2026-05-21 14:27:14
20230227211149	2026-05-21 14:27:14
20230228184745	2026-05-21 14:27:14
20230308225145	2026-05-21 14:27:14
20230328144023	2026-05-21 14:27:14
20231018144023	2026-05-21 14:27:14
20231204144023	2026-05-21 14:27:14
20231204144024	2026-05-21 14:27:14
20231204144025	2026-05-21 14:27:14
20240108234812	2026-05-21 14:27:14
20240109165339	2026-05-21 14:27:14
20240227174441	2026-05-21 14:27:14
20240311171622	2026-05-21 14:27:14
20240321100241	2026-05-21 14:27:14
20240401105812	2026-05-21 14:27:14
20240418121054	2026-05-21 14:27:14
20240523004032	2026-05-21 14:27:14
20240618124746	2026-05-21 14:27:14
20240801235015	2026-05-21 14:27:14
20240805133720	2026-05-21 14:27:14
20240827160934	2026-05-21 14:27:14
20240919163303	2026-05-21 14:27:14
20240919163305	2026-05-21 14:27:14
20241019105805	2026-05-21 14:27:14
20241030150047	2026-05-21 14:27:14
20241108114728	2026-05-21 14:27:14
20241121104152	2026-05-21 14:27:14
20241130184212	2026-05-21 14:27:14
20241220035512	2026-05-21 14:27:14
20241220123912	2026-05-21 14:27:14
20241224161212	2026-05-21 14:27:14
20250107150512	2026-05-21 14:27:14
20250110162412	2026-05-21 14:27:14
20250123174212	2026-05-21 14:27:14
20250128220012	2026-05-21 14:27:14
20250506224012	2026-05-21 14:27:14
20250523164012	2026-05-21 14:27:14
20250714121412	2026-05-21 14:27:14
20250905041441	2026-05-21 14:27:14
20251103001201	2026-05-21 14:27:14
20251120212548	2026-05-21 14:27:14
20251120215549	2026-05-21 14:27:14
20260218120000	2026-05-21 14:27:14
20260326120000	2026-05-21 14:27:14
20260514120000	2026-06-06 17:29:11
20260527120000	2026-06-06 17:29:11
20260528120000	2026-06-06 17:29:11
20260603120000	2026-06-06 17:29:11
20260605120000	2026-06-28 00:22:40
20260606110000	2026-06-28 00:22:40
20260616120000	2026-06-28 00:22:40
20260624120000	2026-06-28 00:22:40
20260626120000	2026-07-06 13:19:22
20260706120000	2026-07-10 00:26:52
20260707120000	2026-08-21 21:14:25
20260709120000	2026-08-21 21:14:25
20260714120000	2026-09-07 10:04:35
20260827120000	2026-10-16 20:02:35
20260914120000	2026-10-16 20:02:36
20260916120000	2026-10-16 20:02:36
20260922120000	2026-10-16 20:02:36
20260925120000	2026-10-16 20:02:36
20260928120000	2026-10-16 20:02:36
20261002120000	2026-10-16 20:02:36
20261007120000	2026-11-14 10:47:32
20261008120000	2026-11-14 10:47:32
20261009120000	2026-11-14 10:47:32
20261022120000	2026-11-14 10:47:32
20261027120000	2026-11-14 10:47:32
20261029120000	2026-11-14 10:47:33
20261103130000	2026-11-14 10:47:33
\.


--
-- Data for Name: subscription; Type: TABLE DATA; Schema: realtime; Owner: -
--

COPY realtime.subscription (id, subscription_id, entity, filters, claims, created_at, action_filter, selected_columns) FROM stdin;
\.


--
-- Data for Name: bucket_lifecycle_states; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.bucket_lifecycle_states (bucket_id, generation, next_run_at, claim_id, claim_until, continuation, last_started_at, last_completed_at, last_success_at, last_result, failure_count, last_error, updated_at) FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets (id, name, owner, created_at, updated_at, public, avif_autodetection, file_size_limit, allowed_mime_types, owner_id, type, versioning_status, lifecycle_configuration, lifecycle_configuration_generation) FROM stdin;
preinscriptions	preinscriptions	\N	2026-05-29 12:10:22.355129+00	2026-05-29 12:10:22.355129+00	t	f	\N	\N	\N	STANDARD	DISABLED	\N	\N
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets_analytics (name, type, format, created_at, updated_at, id, deleted_at) FROM stdin;
\.


--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.buckets_vectors (id, type, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: lifecycle_abandoned_artifacts; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.lifecycle_abandoned_artifacts (bucket_id, key, name, version, attempted_at) FROM stdin;
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.migrations (id, name, hash, executed_at) FROM stdin;
0	create-migrations-table	e18db593bcde2aca2a408c4d1100f6abba2195df	2026-05-21 14:27:18.187293
1	initialmigration	6ab16121fbaa08bbd11b712d05f358f9b555d777	2026-05-21 14:27:18.213618
3	pathtoken-column	2cb1b0004b817b29d5b0a971af16bafeede4b70d	2026-05-21 14:27:18.24122
4	add-migrations-rls	427c5b63fe1c5937495d9c635c263ee7a5905058	2026-05-21 14:27:18.249583
5	add-size-functions	79e081a1455b63666c1294a440f8ad4b1e6a7f84	2026-05-21 14:27:18.252887
6	change-column-name-in-get-size	ded78e2f1b5d7e616117897e6443a925965b30d2	2026-05-21 14:27:18.256278
7	add-rls-to-buckets	e7e7f86adbc51049f341dfe8d30256c1abca17aa	2026-05-21 14:27:18.260593
8	add-public-to-buckets	fd670db39ed65f9d08b01db09d6202503ca2bab3	2026-05-21 14:27:18.26334
9	fix-search-function	af597a1b590c70519b464a4ab3be54490712796b	2026-05-21 14:27:18.265925
10	search-files-search-function	b595f05e92f7e91211af1bbfe9c6a13bb3391e16	2026-05-21 14:27:18.268615
11	add-trigger-to-auto-update-updated_at-column	7425bdb14366d1739fa8a18c83100636d74dcaa2	2026-05-21 14:27:18.27218
12	add-automatic-avif-detection-flag	8e92e1266eb29518b6a4c5313ab8f29dd0d08df9	2026-05-21 14:27:18.275914
13	add-bucket-custom-limits	cce962054138135cd9a8c4bcd531598684b25e7d	2026-05-21 14:27:18.278525
14	use-bytes-for-max-size	941c41b346f9802b411f06f30e972ad4744dad27	2026-05-21 14:27:18.281959
15	add-can-insert-object-function	934146bc38ead475f4ef4b555c524ee5d66799e5	2026-05-21 14:27:18.314406
16	add-version	76debf38d3fd07dcfc747ca49096457d95b1221b	2026-05-21 14:27:18.317731
17	drop-owner-foreign-key	f1cbb288f1b7a4c1eb8c38504b80ae2a0153d101	2026-05-21 14:27:18.320382
18	add_owner_id_column_deprecate_owner	e7a511b379110b08e2f214be852c35414749fe66	2026-05-21 14:27:18.324167
19	alter-default-value-objects-id	02e5e22a78626187e00d173dc45f58fa66a4f043	2026-05-21 14:27:18.330729
20	list-objects-with-delimiter	cd694ae708e51ba82bf012bba00caf4f3b6393b7	2026-05-21 14:27:18.333972
21	s3-multipart-uploads	8c804d4a566c40cd1e4cc5b3725a664a9303657f	2026-05-21 14:27:18.338121
22	s3-multipart-uploads-big-ints	9737dc258d2397953c9953d9b86920b8be0cdb73	2026-05-21 14:27:18.348252
23	optimize-search-function	9d7e604cddc4b56a5422dc68c9313f4a1b6f132c	2026-05-21 14:27:18.359267
24	operation-function	8312e37c2bf9e76bbe841aa5fda889206d2bf8aa	2026-05-21 14:27:18.362099
25	custom-metadata	d974c6057c3db1c1f847afa0e291e6165693b990	2026-05-21 14:27:18.364671
26	objects-prefixes	215cabcb7f78121892a5a2037a09fedf9a1ae322	2026-05-21 14:27:18.367269
27	search-v2	859ba38092ac96eb3964d83bf53ccc0b141663a6	2026-05-21 14:27:18.369445
28	object-bucket-name-sorting	c73a2b5b5d4041e39705814fd3a1b95502d38ce4	2026-05-21 14:27:18.371591
29	create-prefixes	ad2c1207f76703d11a9f9007f821620017a66c21	2026-05-21 14:27:18.373752
30	update-object-levels	2be814ff05c8252fdfdc7cfb4b7f5c7e17f0bed6	2026-05-21 14:27:18.37583
31	objects-level-index	b40367c14c3440ec75f19bbce2d71e914ddd3da0	2026-05-21 14:27:18.377938
32	backward-compatible-index-on-objects	e0c37182b0f7aee3efd823298fb3c76f1042c0f7	2026-05-21 14:27:18.380001
33	backward-compatible-index-on-prefixes	b480e99ed951e0900f033ec4eb34b5bdcb4e3d49	2026-05-21 14:27:18.382156
34	optimize-search-function-v1	ca80a3dc7bfef894df17108785ce29a7fc8ee456	2026-05-21 14:27:18.384187
35	add-insert-trigger-prefixes	458fe0ffd07ec53f5e3ce9df51bfdf4861929ccc	2026-05-21 14:27:18.386362
36	optimise-existing-functions	6ae5fca6af5c55abe95369cd4f93985d1814ca8f	2026-05-21 14:27:18.388451
37	add-bucket-name-length-trigger	3944135b4e3e8b22d6d4cbb568fe3b0b51df15c1	2026-05-21 14:27:18.390761
38	iceberg-catalog-flag-on-buckets	02716b81ceec9705aed84aa1501657095b32e5c5	2026-05-21 14:27:18.393804
39	add-search-v2-sort-support	6706c5f2928846abee18461279799ad12b279b78	2026-05-21 14:27:18.400246
40	fix-prefix-race-conditions-optimized	7ad69982ae2d372b21f48fc4829ae9752c518f6b	2026-05-21 14:27:18.402461
41	add-object-level-update-trigger	07fcf1a22165849b7a029deed059ffcde08d1ae0	2026-05-21 14:27:18.404763
42	rollback-prefix-triggers	771479077764adc09e2ea2043eb627503c034cd4	2026-05-21 14:27:18.406982
43	fix-object-level	84b35d6caca9d937478ad8a797491f38b8c2979f	2026-05-21 14:27:18.409995
44	vector-bucket-type	99c20c0ffd52bb1ff1f32fb992f3b351e3ef8fb3	2026-05-21 14:27:18.41206
45	vector-buckets	049e27196d77a7cb76497a85afae669d8b230953	2026-05-21 14:27:18.41511
46	buckets-objects-grants	fedeb96d60fefd8e02ab3ded9fbde05632f84aed	2026-05-21 14:27:18.426362
47	iceberg-table-metadata	649df56855c24d8b36dd4cc1aeb8251aa9ad42c2	2026-05-21 14:27:18.429736
48	iceberg-catalog-ids	e0e8b460c609b9999ccd0df9ad14294613eed939	2026-05-21 14:27:18.432537
49	buckets-objects-grants-postgres	072b1195d0d5a2f888af6b2302a1938dd94b8b3d	2026-05-21 14:27:18.451845
50	search-v2-optimised	6323ac4f850aa14e7387eb32102869578b5bd478	2026-05-21 14:27:18.454672
51	index-backward-compatible-search	2ee395d433f76e38bcd3856debaf6e0e5b674011	2026-05-21 14:27:19.785991
52	drop-not-used-indexes-and-functions	5cc44c8696749ac11dd0dc37f2a3802075f3a171	2026-05-21 14:27:19.789035
53	drop-index-lower-name	d0cb18777d9e2a98ebe0bc5cc7a42e57ebe41854	2026-05-21 14:27:19.812334
54	drop-index-object-level	6289e048b1472da17c31a7eba1ded625a6457e67	2026-05-21 14:27:19.815541
55	prevent-direct-deletes	262a4798d5e0f2e7c8970232e03ce8be695d5819	2026-05-21 14:27:19.816881
56	fix-optimized-search-function	b823ed1e418101032fa01374edc9a436e54e3ed4	2026-05-21 14:27:19.825467
57	s3-multipart-uploads-metadata	f127886e00d1b374fadbc7c6b31e09336aad5287	2026-05-21 14:27:19.833403
58	operation-ergonomics	00ca5d483b3fe0d522133d9002ccc5df98365120	2026-05-21 14:27:19.837095
59	drop-unused-functions	38456f13e39691c2bbb4b5151d0d1cdbabd4a8c4	2026-05-21 14:27:19.842456
60	optimize-existing-functions-again	db35e1c91a9201e59f4fef8d972c2f277d68b157	2026-05-21 14:27:19.846009
61	mark-filename-immutable	fe0096517ae9d60aaec1d110172ba9036dc66bb7	2026-08-12 10:47:00.946958
63	fix-search-name-relative-to-prefix	c7485e417624f795ce8bb2da21927f48e088904d	2026-08-23 00:33:16.131247
64	fix-search-by-timestamp-sqli	0af424ecd388a39bb1645184b222185a12149675	2026-08-23 00:33:16.184889
66	objects-current-version-index	191466c93aa2c46a00e36505577c5fcab8d7cb4b	2026-09-09 04:00:36.587107
67	objects-null-version-index	15bfe8c35b66642b6c78ba60060fa8793bd2207a	2026-09-09 04:00:36.600463
65	objects-key-version-index	da319c4b89ba800ce795d1b699f3a70675138058	2026-09-09 04:00:36.570132
68	bucket-lifecycle-configuration	3c08f6f889922f399519722a932b51007c11bebc	2026-10-05 19:21:04.237422
69	validate-bucket-lifecycle-constraints	4febacaaaa0e61e2b783bef081fe03a287e65eb3	2026-10-05 19:21:04.297311
70	list-objects-with-versions	5c17c3777616cd8d7b18b82835525fa3205af57b	2026-10-05 19:21:04.301891
71	objects-delete-marker-index	6d14858e66c66f8d6accf8a2630aefd1527fddba	2026-10-05 19:21:04.686348
2	storage-schema	cdc19a79b298ce37cc730487821a1a7b06b98105	2026-05-21 14:27:18.216794
62	object-versioning-core	c6567e688f8c4a76887e7c1b117b2d58f4feccba	2026-08-20 10:58:44.795861
72	drop-bucketid-objname-index	302beb09e1b469d7d4db19566f2389d280b64aa3	2026-10-05 19:21:04.853458
73	revoke-grants-to-unused-operations	ba9244051be09f22f714fc0170a2539f8b5f0e68	2026-10-16 20:02:41.398784
74	unlock-object-versioning	dacb58ecb37678de855505b3e1c5aec0d5df7894	2026-11-14 10:47:38.313693
75	enforce-bucket-lifecycle-update-role	8454a556116c985db857d3b99de94a31a68ad273	2026-11-14 10:47:38.332696
76	noncurrent-lifecycle	052cbe11956fd14b85861fc19537c0303b73010e	2026-11-14 10:47:38.337554
77	noncurrent-lifecycle-archived-order-index	d68b03438a987aa1324a0fca68f7078cb2ffb849	2026-11-14 10:47:39.649765
78	noncurrent-lifecycle-archived-due-index	c82ba0e577ec5c3496b1077ff385ce4645497698	2026-11-14 10:47:39.657783
79	lifecycle-writer-coordination	3b38458424d2099e6b2e3cb4233590060f527fe1	2026-11-14 10:47:39.659531
80	revoke-extra-lifecycle-postgres-grants	18cfbf5c5b356469e1e95f3aa1b59ba111d82a06	2026-11-14 10:47:39.682471
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.objects (id, bucket_id, name, owner, created_at, updated_at, last_accessed_at, metadata, version, owner_id, user_metadata, archived_at, is_delete_marker, is_versioned) FROM stdin;
d1f1749b-d9e9-49bb-8eac-5b441832ce3b	preinscriptions	77467488-aec6-4090-a587-a570534e6dad/77467488-aec6-4090-a587-a570534e6dad_acte_1780057789617.pdf	\N	2026-05-29 12:29:52.639413+00	2026-05-29 12:29:52.639413+00	2026-05-29 12:29:52.639413+00	{"eTag": "\\"793b027b0dc3249cdc1faa44083e6397\\"", "size": 1419276, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-05-29T12:29:53.000Z", "contentLength": 1419276, "httpStatusCode": 200}	beebc24f-4e56-4a87-895f-b5eb7572682a	\N	{}	\N	f	f
1249b0bc-7aba-4581-87f4-0390cf1b8fd0	preinscriptions	bibliotheque/bibliotheque_1780769938405_6340.jpg	\N	2026-06-06 18:19:00.302115+00	2026-06-06 18:19:00.302115+00	2026-06-06 18:19:00.302115+00	{"eTag": "\\"4a2aebf7e802f88e20b4bf7a16a3f78e\\"", "size": 110734, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-06T18:19:01.000Z", "contentLength": 110734, "httpStatusCode": 200}	49ee6006-83a3-482c-8162-93d05821acd5	\N	{}	\N	f	f
5bcf6ba9-b1e9-4a10-bd4d-947bb7f8e072	preinscriptions	77467488-aec6-4090-a587-a570534e6dad/77467488-aec6-4090-a587-a570534e6dad_photo_1780057794856.jpeg	\N	2026-05-29 12:29:55.252916+00	2026-05-29 12:29:55.252916+00	2026-05-29 12:29:55.252916+00	{"eTag": "\\"5899d5dc86c2406937cc9c3a2cffc41d\\"", "size": 75203, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-29T12:29:56.000Z", "contentLength": 75203, "httpStatusCode": 200}	89150b2c-15d6-4b40-ba7a-d5486601c2c6	\N	{}	\N	f	f
0eb23cdf-cb31-4b53-af6d-6e489d2a1b5d	preinscriptions	0d0bb341-4692-4f38-b5b5-0006a8975917/0d0bb341-4692-4f38-b5b5-0006a8975917_acte_1780076558194.jpeg	\N	2026-05-29 17:42:39.67829+00	2026-05-29 17:42:39.67829+00	2026-05-29 17:42:39.67829+00	{"eTag": "\\"afc3ada8c5164210a2e31d3729733085\\"", "size": 104345, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-29T17:42:40.000Z", "contentLength": 104345, "httpStatusCode": 200}	45a77998-117e-40f3-a72f-86e74e97f5f8	\N	{}	\N	f	f
9ccbaa2f-ae48-4c74-8655-51561b48a27d	preinscriptions	bibliotheque/bibliotheque_1780770267072_7870.jpg	\N	2026-06-06 18:24:29.04354+00	2026-06-06 18:24:29.04354+00	2026-06-06 18:24:29.04354+00	{"eTag": "\\"4a2aebf7e802f88e20b4bf7a16a3f78e\\"", "size": 110734, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-06T18:24:30.000Z", "contentLength": 110734, "httpStatusCode": 200}	06021074-876e-44c9-aacb-0477fe6a0268	\N	{}	\N	f	f
0e40b89c-341e-4fdd-a768-77c2ec6a6db1	preinscriptions	0d0bb341-4692-4f38-b5b5-0006a8975917/0d0bb341-4692-4f38-b5b5-0006a8975917_photo_1780076559607.jpeg	\N	2026-05-29 17:42:40.339789+00	2026-05-29 17:42:40.339789+00	2026-05-29 17:42:40.339789+00	{"eTag": "\\"5f308c66f1cef64551e7715c17bf36f1\\"", "size": 15372, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-29T17:42:41.000Z", "contentLength": 15372, "httpStatusCode": 200}	00a9726c-8721-49ee-9322-579a6b0d5092	\N	{}	\N	f	f
ffc4181a-c0cf-4897-81c0-f43769ed074e	preinscriptions	fd390b52-7071-409d-bc07-eb99166d1920/fd390b52-7071-409d-bc07-eb99166d1920_photo_1781468682727.png	\N	2026-06-14 20:24:45.614711+00	2026-06-14 20:24:45.614711+00	2026-06-14 20:24:45.614711+00	{"eTag": "\\"5979bba171dc84e3edbefae7a6a86b36\\"", "size": 22191, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-14T20:24:46.000Z", "contentLength": 22191, "httpStatusCode": 200}	105522cb-ff22-4901-b201-3e241c6187e4	\N	{}	\N	f	f
28417325-bcf4-43bf-8891-5d3cffe731d4	preinscriptions	0348031c-65fa-44fd-b0e8-b97bf7b17031/0348031c-65fa-44fd-b0e8-b97bf7b17031_acte_1780097752499.jpeg	\N	2026-05-29 23:35:54.389595+00	2026-05-29 23:35:54.389595+00	2026-05-29 23:35:54.389595+00	{"eTag": "\\"afc3ada8c5164210a2e31d3729733085\\"", "size": 104345, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-29T23:35:55.000Z", "contentLength": 104345, "httpStatusCode": 200}	031d29f2-f46a-474c-a6dd-ea366cdcc075	\N	{}	\N	f	f
39eaeea6-126c-4b16-8067-c623be4a7c5d	preinscriptions	0348031c-65fa-44fd-b0e8-b97bf7b17031/0348031c-65fa-44fd-b0e8-b97bf7b17031_photo_1780097753982.jpg	\N	2026-05-29 23:35:55.132373+00	2026-05-29 23:35:55.132373+00	2026-05-29 23:35:55.132373+00	{"eTag": "\\"f96f3121eb77dd728e89048d95b2e638\\"", "size": 53754, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-29T23:35:56.000Z", "contentLength": 53754, "httpStatusCode": 200}	3595cbdf-bb91-4d90-ba3f-bf25d96fe718	\N	{}	\N	f	f
283a9033-68fb-4773-aef8-9ce8a870a0b4	preinscriptions	fd390b52-7071-409d-bc07-eb99166d1920/fd390b52-7071-409d-bc07-eb99166d1920_acte_1781468948460.png	\N	2026-06-14 20:29:11.029032+00	2026-06-14 20:29:11.029032+00	2026-06-14 20:29:11.029032+00	{"eTag": "\\"5979bba171dc84e3edbefae7a6a86b36\\"", "size": 22191, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-14T20:29:11.000Z", "contentLength": 22191, "httpStatusCode": 200}	963b5334-4fa0-4bb8-bd6d-d85e1bc769bf	\N	{}	\N	f	f
5350ffd9-aa27-46dc-9570-bd3668defc0a	preinscriptions	4f690c53-ede0-4333-8dc5-e2366f95a7d5/4f690c53-ede0-4333-8dc5-e2366f95a7d5_acte_1780098696565.jpeg	\N	2026-05-29 23:51:38.425182+00	2026-05-29 23:51:38.425182+00	2026-05-29 23:51:38.425182+00	{"eTag": "\\"afc3ada8c5164210a2e31d3729733085\\"", "size": 104345, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-29T23:51:39.000Z", "contentLength": 104345, "httpStatusCode": 200}	3e5b336c-cca6-434c-857c-4db8cf4bea6a	\N	{}	\N	f	f
441e40fc-6327-40ef-9d37-94cc0cce6148	preinscriptions	4f690c53-ede0-4333-8dc5-e2366f95a7d5/4f690c53-ede0-4333-8dc5-e2366f95a7d5_photo_1780098698023.jpeg	\N	2026-05-29 23:51:39.167581+00	2026-05-29 23:51:39.167581+00	2026-05-29 23:51:39.167581+00	{"eTag": "\\"5899d5dc86c2406937cc9c3a2cffc41d\\"", "size": 75203, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-29T23:51:40.000Z", "contentLength": 75203, "httpStatusCode": 200}	76e2b12f-d518-4b0a-8f33-037f40e6c09c	\N	{}	\N	f	f
321ccbaa-7832-4ab6-93dd-040530149540	preinscriptions	0f9d3efb-7f4d-4cff-9d4e-cb39cba045e0/0f9d3efb-7f4d-4cff-9d4e-cb39cba045e0_acte_1782224726937.jpg	\N	2026-06-23 14:25:30.480346+00	2026-06-23 14:25:30.480346+00	2026-06-23 14:25:30.480346+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-23T14:25:31.000Z", "contentLength": 414566, "httpStatusCode": 200}	aa736033-6c85-4e69-97fa-93135b8ddd46	\N	{}	\N	f	f
f2ee4b7a-7976-429e-ad1b-7fdf790d3ab8	preinscriptions	9b56a428-522b-4c19-9eaa-4eeae09d999c/9b56a428-522b-4c19-9eaa-4eeae09d999c_acte_1780100432065.jpeg	\N	2026-05-30 00:20:34.110024+00	2026-05-30 00:20:34.110024+00	2026-05-30 00:20:34.110024+00	{"eTag": "\\"afc3ada8c5164210a2e31d3729733085\\"", "size": 104345, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-30T00:20:35.000Z", "contentLength": 104345, "httpStatusCode": 200}	fffbd994-9b7c-4d32-9476-d54c25b9763f	\N	{}	\N	f	f
a201d454-c7bc-45e9-9098-a6eb2ee488dc	preinscriptions	annonces/annonce_1781398235663_3668.avif	\N	2026-06-14 00:50:36.407837+00	2026-06-14 00:50:36.407837+00	2026-06-14 00:50:36.407837+00	{"eTag": "\\"89f02098f020c37983bb368778f01d39\\"", "size": 68040, "mimetype": "image/avif", "cacheControl": "max-age=3600", "lastModified": "2026-06-14T00:50:37.000Z", "contentLength": 68040, "httpStatusCode": 200}	88288c38-c52a-4aff-9aff-182c79123ab6	\N	{}	\N	f	f
d940fd9b-7335-4cf0-8dd1-2080aa5e909b	preinscriptions	9b56a428-522b-4c19-9eaa-4eeae09d999c/9b56a428-522b-4c19-9eaa-4eeae09d999c_photo_1780100433824.png	\N	2026-05-30 00:20:35.850868+00	2026-05-30 00:20:35.850868+00	2026-05-30 00:20:35.850868+00	{"eTag": "\\"3cd619e6c77ff745e61ab1f2c5898b98\\"", "size": 1861522, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-05-30T00:20:36.000Z", "contentLength": 1861522, "httpStatusCode": 200}	404fef2b-5935-4dae-9f0f-2c5945dab764	\N	{}	\N	f	f
1f8274ce-a8f5-4478-b2fe-82836ebe85f8	preinscriptions	8e13c467-dadb-443f-a51a-0a18fd2bc3e2/8e13c467-dadb-443f-a51a-0a18fd2bc3e2_acte_1782655518234.png	\N	2026-06-28 14:05:21.576707+00	2026-06-28 14:05:21.576707+00	2026-06-28 14:05:21.576707+00	{"eTag": "\\"19fc0acb0ef5b22de10152dccde68b0f\\"", "size": 1818598, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T14:05:22.000Z", "contentLength": 1818598, "httpStatusCode": 200}	65090c17-2e4e-4ceb-a014-b7d34a915adb	\N	{}	\N	f	f
19eb68dc-0eee-49a5-a518-5fb8a97ab828	preinscriptions	9b56a428-522b-4c19-9eaa-4eeae09d999c/9b56a428-522b-4c19-9eaa-4eeae09d999c_acte_1780101842067.jpeg	\N	2026-05-30 00:44:03.823675+00	2026-05-30 00:44:03.823675+00	2026-05-30 00:44:03.823675+00	{"eTag": "\\"afc3ada8c5164210a2e31d3729733085\\"", "size": 104345, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-30T00:44:04.000Z", "contentLength": 104345, "httpStatusCode": 200}	10d6b013-ce43-418e-bfb7-08f9a2fcb52d	\N	{}	\N	f	f
70791bf6-28f0-4e6e-80f4-4e959816fb97	preinscriptions	fd390b52-7071-409d-bc07-eb99166d1920/fd390b52-7071-409d-bc07-eb99166d1920_photo_1781468949560.png	\N	2026-06-14 20:29:11.454773+00	2026-06-14 20:29:11.454773+00	2026-06-14 20:29:11.454773+00	{"eTag": "\\"5979bba171dc84e3edbefae7a6a86b36\\"", "size": 22191, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-14T20:29:12.000Z", "contentLength": 22191, "httpStatusCode": 200}	e75ddaab-bb00-496a-92c5-2ec255dfac2d	\N	{}	\N	f	f
2a7e09d9-0d9c-4c19-9f5c-a979e958aa25	preinscriptions	9b56a428-522b-4c19-9eaa-4eeae09d999c/9b56a428-522b-4c19-9eaa-4eeae09d999c_photo_1780101843422.png	\N	2026-05-30 00:44:05.951407+00	2026-05-30 00:44:05.951407+00	2026-05-30 00:44:05.951407+00	{"eTag": "\\"3cd619e6c77ff745e61ab1f2c5898b98\\"", "size": 1861522, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-05-30T00:44:06.000Z", "contentLength": 1861522, "httpStatusCode": 200}	137f039b-e510-48d6-b4cc-4a2b397d56de	\N	{}	\N	f	f
aaa63dc0-99cb-461a-83ee-b5863e8bb9d0	preinscriptions	1c097548-9a23-4ccf-9a00-4840cb1851b4/1c097548-9a23-4ccf-9a00-4840cb1851b4_acte_1780140734550.jpeg	\N	2026-05-30 11:32:17.247547+00	2026-05-30 11:32:17.247547+00	2026-05-30 11:32:17.247547+00	{"eTag": "\\"afc3ada8c5164210a2e31d3729733085\\"", "size": 104345, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-30T11:32:18.000Z", "contentLength": 104345, "httpStatusCode": 200}	087177b8-0c3e-4534-be53-be8e8ebb532a	\N	{}	\N	f	f
23531287-017b-4099-a3f8-f9efc17b24c2	preinscriptions	fd390b52-7071-409d-bc07-eb99166d1920/fd390b52-7071-409d-bc07-eb99166d1920_acte_1781469006865.png	\N	2026-06-14 20:30:09.407013+00	2026-06-14 20:30:09.407013+00	2026-06-14 20:30:09.407013+00	{"eTag": "\\"5979bba171dc84e3edbefae7a6a86b36\\"", "size": 22191, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-14T20:30:10.000Z", "contentLength": 22191, "httpStatusCode": 200}	2f0bf1d8-0240-4596-8f19-4df2e3c414c4	\N	{}	\N	f	f
fceee672-d2f9-4c08-899d-b0c0ede179e8	preinscriptions	1c097548-9a23-4ccf-9a00-4840cb1851b4/1c097548-9a23-4ccf-9a00-4840cb1851b4_photo_1780140736287.png	\N	2026-05-30 11:32:18.007398+00	2026-05-30 11:32:18.007398+00	2026-05-30 11:32:18.007398+00	{"eTag": "\\"4f190178f9025efedbe9f5c2c51b8070\\"", "size": 10582, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-05-30T11:32:18.000Z", "contentLength": 10582, "httpStatusCode": 200}	fd63bf23-457a-4f40-8444-3cd431b80538	\N	{}	\N	f	f
9d3a7254-d0fd-4d93-a0f9-c7b0c389039e	preinscriptions	e113e90b-db10-46ff-a902-1713e0165775/e113e90b-db10-46ff-a902-1713e0165775_acte_1780141550598.jpeg	\N	2026-05-30 11:45:53.348044+00	2026-05-30 11:45:53.348044+00	2026-05-30 11:45:53.348044+00	{"eTag": "\\"afc3ada8c5164210a2e31d3729733085\\"", "size": 104345, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-30T11:45:54.000Z", "contentLength": 104345, "httpStatusCode": 200}	78a6ec72-1ed3-4af0-b833-7fca4d101899	\N	{}	\N	f	f
eb92f73b-799c-4e08-b226-56d112dcb241	preinscriptions	e113e90b-db10-46ff-a902-1713e0165775/e113e90b-db10-46ff-a902-1713e0165775_photo_1780141552305.jpeg	\N	2026-05-30 11:45:54.108176+00	2026-05-30 11:45:54.108176+00	2026-05-30 11:45:54.108176+00	{"eTag": "\\"5f308c66f1cef64551e7715c17bf36f1\\"", "size": 15372, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-30T11:45:55.000Z", "contentLength": 15372, "httpStatusCode": 200}	728d3184-91bd-49d4-b37f-a7005b9dbebe	\N	{}	\N	f	f
3f6569c6-2590-4baf-a7db-586a4979f6e4	preinscriptions	0f9d3efb-7f4d-4cff-9d4e-cb39cba045e0/0f9d3efb-7f4d-4cff-9d4e-cb39cba045e0_photo_1782224729527.jpg	\N	2026-06-23 14:25:32.236792+00	2026-06-23 14:25:32.236792+00	2026-06-23 14:25:32.236792+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-23T14:25:33.000Z", "contentLength": 414566, "httpStatusCode": 200}	97910130-3a4f-4215-9ff0-6b7dc479253f	\N	{}	\N	f	f
a708f113-cfae-47cf-bf18-409bed10312d	preinscriptions	be26b959-4fcb-40a2-980a-9343810c1361/be26b959-4fcb-40a2-980a-9343810c1361_acte_1780156303993.jpg	\N	2026-05-30 15:51:45.453214+00	2026-05-30 15:51:45.453214+00	2026-05-30 15:51:45.453214+00	{"eTag": "\\"13299ae9490e2b31157e3d2b9f798997\\"", "size": 497598, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-30T15:51:46.000Z", "contentLength": 497598, "httpStatusCode": 200}	8cfdbab1-0d16-469e-9a48-af67dbded832	\N	{}	\N	f	f
e9f8528d-61ae-4b5e-9394-80427976663b	preinscriptions	annonces/annonce_1781401573097_4391.png	\N	2026-06-14 01:46:16.275835+00	2026-06-14 01:46:16.275835+00	2026-06-14 01:46:16.275835+00	{"eTag": "\\"d82f6538298e0cfefab8d523f45a0033\\"", "size": 2460642, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-14T01:46:17.000Z", "contentLength": 2460642, "httpStatusCode": 200}	0451a312-ac1a-4bcc-a686-71c530830269	\N	{}	\N	f	f
5ad5b005-ba48-4571-b9c7-8625fe4c686e	preinscriptions	be26b959-4fcb-40a2-980a-9343810c1361/be26b959-4fcb-40a2-980a-9343810c1361_photo_1780156306837.jpg	\N	2026-05-30 15:51:47.328482+00	2026-05-30 15:51:47.328482+00	2026-05-30 15:51:47.328482+00	{"eTag": "\\"87d99e7f1c0f6068b7ef93abb5f3e5f0\\"", "size": 68850, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-30T15:51:48.000Z", "contentLength": 68850, "httpStatusCode": 200}	f1b7fd66-ec45-4768-bc2c-b6feeb039112	\N	{}	\N	f	f
abd57236-57a4-4d25-bd5b-d12b7fff576a	preinscriptions	fd390b52-7071-409d-bc07-eb99166d1920/fd390b52-7071-409d-bc07-eb99166d1920_photo_1781469007889.png	\N	2026-06-14 20:30:09.750134+00	2026-06-14 20:30:09.750134+00	2026-06-14 20:30:09.750134+00	{"eTag": "\\"5979bba171dc84e3edbefae7a6a86b36\\"", "size": 22191, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-14T20:30:10.000Z", "contentLength": 22191, "httpStatusCode": 200}	2c9bee60-0d36-4c73-8d50-2073008dc48a	\N	{}	\N	f	f
869f0120-e8e2-481c-a0d0-b43ba37864d9	preinscriptions	e2c75930-596f-4e97-98c8-8794c10c0b26/e2c75930-596f-4e97-98c8-8794c10c0b26_acte_1780257967353.png	\N	2026-05-31 20:06:08.536268+00	2026-05-31 20:06:08.536268+00	2026-05-31 20:06:08.536268+00	{"eTag": "\\"0d23b211dc54c9768d136c7bc1257424\\"", "size": 134622, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-05-31T20:06:09.000Z", "contentLength": 134622, "httpStatusCode": 200}	bafa235b-edb2-4aa1-a996-87120dd6019c	\N	{}	\N	f	f
adf875fb-e028-437b-a8ef-f2a4c2b35508	preinscriptions	a8c7c1f8-5df1-4882-87c2-7d749c11ec1b/a8c7c1f8-5df1-4882-87c2-7d749c11ec1b_acte_1782403111956.jpeg	\N	2026-06-25 15:58:37.880646+00	2026-06-25 15:58:37.880646+00	2026-06-25 15:58:37.880646+00	{"eTag": "\\"afc3ada8c5164210a2e31d3729733085\\"", "size": 104345, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T15:58:38.000Z", "contentLength": 104345, "httpStatusCode": 200}	b767edf1-0bb1-4d94-9dbd-769a937f496d	\N	{}	\N	f	f
e423184d-8025-4536-934f-d0150da6154f	preinscriptions	e2c75930-596f-4e97-98c8-8794c10c0b26/e2c75930-596f-4e97-98c8-8794c10c0b26_photo_1780257968720.jpg	\N	2026-05-31 20:06:09.136345+00	2026-05-31 20:06:09.136345+00	2026-05-31 20:06:09.136345+00	{"eTag": "\\"c665d76a20d8503c435abd96d5433792\\"", "size": 44432, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-31T20:06:10.000Z", "contentLength": 44432, "httpStatusCode": 200}	257ad492-b274-46b9-af84-1ff113d23dc4	\N	{}	\N	f	f
bdf53644-195c-43fe-8412-969ac5cc462a	preinscriptions	fd390b52-7071-409d-bc07-eb99166d1920/fd390b52-7071-409d-bc07-eb99166d1920_acte_1781469056802.png	\N	2026-06-14 20:30:59.198928+00	2026-06-14 20:30:59.198928+00	2026-06-14 20:30:59.198928+00	{"eTag": "\\"5979bba171dc84e3edbefae7a6a86b36\\"", "size": 22191, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-14T20:31:00.000Z", "contentLength": 22191, "httpStatusCode": 200}	e033a028-dc15-41bc-9b6e-83da9d8c9424	\N	{}	\N	f	f
c99b468d-adee-49c3-9783-c9bf6a53324e	preinscriptions	bdfc464f-b675-42a4-bc31-9eca90252099/bdfc464f-b675-42a4-bc31-9eca90252099_acte_1780258274643.png	\N	2026-05-31 20:11:15.927573+00	2026-05-31 20:11:15.927573+00	2026-05-31 20:11:15.927573+00	{"eTag": "\\"0d23b211dc54c9768d136c7bc1257424\\"", "size": 134622, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-05-31T20:11:16.000Z", "contentLength": 134622, "httpStatusCode": 200}	022fc343-965d-4510-8c9a-b881d537c892	\N	{}	\N	f	f
c2b4babf-c1f5-41e0-a843-d5a0c5f78765	preinscriptions	bdfc464f-b675-42a4-bc31-9eca90252099/bdfc464f-b675-42a4-bc31-9eca90252099_photo_1780258276167.jpg	\N	2026-05-31 20:11:16.483476+00	2026-05-31 20:11:16.483476+00	2026-05-31 20:11:16.483476+00	{"eTag": "\\"c665d76a20d8503c435abd96d5433792\\"", "size": 44432, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-31T20:11:17.000Z", "contentLength": 44432, "httpStatusCode": 200}	649e7b38-77f1-4e89-9f03-1fece660e70d	\N	{}	\N	f	f
ac0cfc05-eed9-476e-ac62-f500073c558b	preinscriptions	4387e22b-78f7-4387-a240-e2e60cbeeae9/4387e22b-78f7-4387-a240-e2e60cbeeae9_acte_1780259090572.png	\N	2026-05-31 20:24:51.651952+00	2026-05-31 20:24:51.651952+00	2026-05-31 20:24:51.651952+00	{"eTag": "\\"0d23b211dc54c9768d136c7bc1257424\\"", "size": 134622, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-05-31T20:24:52.000Z", "contentLength": 134622, "httpStatusCode": 200}	c7a761dd-598b-4281-a96c-2397b796120b	\N	{}	\N	f	f
8ffe1e7c-e5e8-427d-a0a5-925440539f86	preinscriptions	4387e22b-78f7-4387-a240-e2e60cbeeae9/4387e22b-78f7-4387-a240-e2e60cbeeae9_photo_1780259091861.jpg	\N	2026-05-31 20:24:52.188859+00	2026-05-31 20:24:52.188859+00	2026-05-31 20:24:52.188859+00	{"eTag": "\\"c665d76a20d8503c435abd96d5433792\\"", "size": 44432, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-31T20:24:53.000Z", "contentLength": 44432, "httpStatusCode": 200}	af4fbc5e-7f44-42fa-bc84-20f5246316c6	\N	{}	\N	f	f
4d08aa6e-865c-4d1f-81b0-1b023e054c90	preinscriptions	130e1b66-3408-4d23-911b-251957c45090/130e1b66-3408-4d23-911b-251957c45090_acte_1780264297295.png	\N	2026-05-31 21:51:37.506137+00	2026-05-31 21:51:37.506137+00	2026-05-31 21:51:37.506137+00	{"eTag": "\\"0d23b211dc54c9768d136c7bc1257424\\"", "size": 134622, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-05-31T21:51:38.000Z", "contentLength": 134622, "httpStatusCode": 200}	0c11076b-51f5-4b00-bb80-016da64cbf23	\N	{}	\N	f	f
19dc7c88-7208-43ad-b48d-506a78e8a69f	preinscriptions	95a441bd-33ec-4f72-95c5-0cf23f57b00b/95a441bd-33ec-4f72-95c5-0cf23f57b00b_acte_1781466792412.png	\N	2026-06-14 19:53:15.145078+00	2026-06-14 19:53:15.145078+00	2026-06-14 19:53:15.145078+00	{"eTag": "\\"5979bba171dc84e3edbefae7a6a86b36\\"", "size": 22191, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-14T19:53:16.000Z", "contentLength": 22191, "httpStatusCode": 200}	b7f6b904-3524-4194-a8d0-43099f44f8e4	\N	{}	\N	f	f
cdf31928-4ec5-4f6c-a78f-60f23e5888f7	preinscriptions	130e1b66-3408-4d23-911b-251957c45090/130e1b66-3408-4d23-911b-251957c45090_photo_1780264298306.jpg	\N	2026-05-31 21:51:38.10317+00	2026-05-31 21:51:38.10317+00	2026-05-31 21:51:38.10317+00	{"eTag": "\\"c665d76a20d8503c435abd96d5433792\\"", "size": 44432, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-31T21:51:39.000Z", "contentLength": 44432, "httpStatusCode": 200}	01890c75-ed18-4555-ba7c-a260975515eb	\N	{}	\N	f	f
e1eacfdf-8c3d-4a5c-a83b-3e3aa8d2f102	preinscriptions	e628d56a-cece-494b-8abd-65f019fd23bf/e628d56a-cece-494b-8abd-65f019fd23bf_acte_1782225530967.jpg	\N	2026-06-23 14:38:56.17055+00	2026-06-23 14:38:56.17055+00	2026-06-23 14:38:56.17055+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-23T14:38:57.000Z", "contentLength": 414566, "httpStatusCode": 200}	2c084cad-f7a4-4cf8-947f-c838fc6f9a5f	\N	{}	\N	f	f
4f222da9-81e5-4ee2-b5a5-d918bda6d8a6	preinscriptions	130e1b66-3408-4d23-911b-251957c45090/130e1b66-3408-4d23-911b-251957c45090_bulletin_1780264298922.pdf	\N	2026-05-31 21:51:39.249834+00	2026-05-31 21:51:39.249834+00	2026-05-31 21:51:39.249834+00	{"eTag": "\\"75fe075acde650dabdf28eb76427c436\\"", "size": 520716, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-05-31T21:51:40.000Z", "contentLength": 520716, "httpStatusCode": 200}	39920f5a-1167-4e2d-a5ad-59ae8af7446a	\N	{}	\N	f	f
22e167c7-ced5-4c1c-ab6e-89e0b9472986	preinscriptions	5adda9b3-1e1c-437e-810a-3aec15c18e49/5adda9b3-1e1c-437e-810a-3aec15c18e49_photo_1781466794086.png	\N	2026-06-14 19:53:15.92455+00	2026-06-14 19:53:15.92455+00	2026-06-14 19:53:15.92455+00	{"eTag": "\\"5979bba171dc84e3edbefae7a6a86b36\\"", "size": 22191, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-14T19:53:16.000Z", "contentLength": 22191, "httpStatusCode": 200}	898bc2cb-1d3d-4bbd-8af3-d0c04c476cf4	\N	{}	\N	f	f
4230048e-e64e-43d5-a2bc-812004f670e5	preinscriptions	fd390b52-7071-409d-bc07-eb99166d1920/fd390b52-7071-409d-bc07-eb99166d1920_photo_1781469057714.png	\N	2026-06-14 20:30:59.561523+00	2026-06-14 20:30:59.561523+00	2026-06-14 20:30:59.561523+00	{"eTag": "\\"5979bba171dc84e3edbefae7a6a86b36\\"", "size": 22191, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-14T20:31:00.000Z", "contentLength": 22191, "httpStatusCode": 200}	0ca4dcf7-e02b-482f-a1d5-b81caef565d5	\N	{}	\N	f	f
eb4f0899-3165-4ed3-9f18-4c0309961126	preinscriptions	3e0806b9-b24a-4aba-8a77-3cffef84db2b/3e0806b9-b24a-4aba-8a77-3cffef84db2b_acte_1780265576527.png	\N	2026-05-31 22:12:57.452806+00	2026-05-31 22:12:57.452806+00	2026-05-31 22:12:57.452806+00	{"eTag": "\\"0d23b211dc54c9768d136c7bc1257424\\"", "size": 134622, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-05-31T22:12:58.000Z", "contentLength": 134622, "httpStatusCode": 200}	077353ff-23f1-445d-a437-67e09e55d5b3	\N	{}	\N	f	f
11013fbf-854b-4c96-9861-84cb7926a582	preinscriptions	450f18fe-bc9b-49d1-b2ea-8adb7f1722f3/450f18fe-bc9b-49d1-b2ea-8adb7f1722f3_acte_1780265576464.png	\N	2026-05-31 22:12:57.49079+00	2026-05-31 22:12:57.49079+00	2026-05-31 22:12:57.49079+00	{"eTag": "\\"0d23b211dc54c9768d136c7bc1257424\\"", "size": 134622, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-05-31T22:12:58.000Z", "contentLength": 134622, "httpStatusCode": 200}	738d1adc-2428-45b1-a6e9-c4e4d5b6a188	\N	{}	\N	f	f
56c6d8f1-d4ec-4a01-ab54-8baf47cb4b13	preinscriptions	663719f0-8abc-4706-9f7a-01a843b2dc7b/663719f0-8abc-4706-9f7a-01a843b2dc7b_acte_1780265576740.pdf	\N	2026-05-31 22:12:57.784821+00	2026-05-31 22:12:57.784821+00	2026-05-31 22:12:57.784821+00	{"eTag": "\\"75fe075acde650dabdf28eb76427c436\\"", "size": 520716, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-05-31T22:12:58.000Z", "contentLength": 520716, "httpStatusCode": 200}	11b2eb96-5846-44ff-967a-71054e833aa8	\N	{}	\N	f	f
83a0aff4-fa89-431d-9b97-bdae8c7ba877	preinscriptions	3e0806b9-b24a-4aba-8a77-3cffef84db2b/3e0806b9-b24a-4aba-8a77-3cffef84db2b_photo_1780265578633.jpg	\N	2026-05-31 22:12:58.313795+00	2026-05-31 22:12:58.313795+00	2026-05-31 22:12:58.313795+00	{"eTag": "\\"c665d76a20d8503c435abd96d5433792\\"", "size": 44432, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-31T22:12:59.000Z", "contentLength": 44432, "httpStatusCode": 200}	de1cfd76-7f39-4cba-9c62-22103a6afec2	\N	{}	\N	f	f
f0d56425-97ce-486a-a40d-ef5af5847cda	preinscriptions	450f18fe-bc9b-49d1-b2ea-8adb7f1722f3/450f18fe-bc9b-49d1-b2ea-8adb7f1722f3_photo_1780265578715.jpg	\N	2026-05-31 22:12:58.511388+00	2026-05-31 22:12:58.511388+00	2026-05-31 22:12:58.511388+00	{"eTag": "\\"c665d76a20d8503c435abd96d5433792\\"", "size": 44432, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-31T22:12:59.000Z", "contentLength": 44432, "httpStatusCode": 200}	f703291f-4738-40f0-aaaf-6a54948b1675	\N	{}	\N	f	f
d608d915-781e-4d08-9636-38296ae22f8a	preinscriptions	e628d56a-cece-494b-8abd-65f019fd23bf/e628d56a-cece-494b-8abd-65f019fd23bf_photo_1782225535188.jpg	\N	2026-06-23 14:39:00.319599+00	2026-06-23 14:39:00.319599+00	2026-06-23 14:39:00.319599+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-23T14:39:01.000Z", "contentLength": 414566, "httpStatusCode": 200}	c8603d0c-f7c3-4330-a4f4-6b13e9d2a272	\N	{}	\N	f	f
017d27d0-af4c-4640-b0e4-d4f2cfc00532	preinscriptions	663719f0-8abc-4706-9f7a-01a843b2dc7b/663719f0-8abc-4706-9f7a-01a843b2dc7b_photo_1780265578864.jpg	\N	2026-05-31 22:12:58.690649+00	2026-05-31 22:12:58.690649+00	2026-05-31 22:12:58.690649+00	{"eTag": "\\"c665d76a20d8503c435abd96d5433792\\"", "size": 44432, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-05-31T22:12:59.000Z", "contentLength": 44432, "httpStatusCode": 200}	400b3180-566f-4ed1-b748-c9f35a7da406	\N	{}	\N	f	f
ed2ee5da-246d-42e8-a17d-bce54f231cbf	preinscriptions	5adda9b3-1e1c-437e-810a-3aec15c18e49/5adda9b3-1e1c-437e-810a-3aec15c18e49_acte_1781466792353.png	\N	2026-06-14 19:53:15.130088+00	2026-06-14 19:53:15.130088+00	2026-06-14 19:53:15.130088+00	{"eTag": "\\"5979bba171dc84e3edbefae7a6a86b36\\"", "size": 22191, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-14T19:53:16.000Z", "contentLength": 22191, "httpStatusCode": 200}	07dbdcf7-fb43-4de3-90d7-b45155b237d8	\N	{}	\N	f	f
3d735ff1-1779-40bd-afaa-e5dba658563d	preinscriptions	663719f0-8abc-4706-9f7a-01a843b2dc7b/663719f0-8abc-4706-9f7a-01a843b2dc7b_bulletin_1780265579790.pdf	\N	2026-05-31 22:12:59.871277+00	2026-05-31 22:12:59.871277+00	2026-05-31 22:12:59.871277+00	{"eTag": "\\"75fe075acde650dabdf28eb76427c436\\"", "size": 520716, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-05-31T22:13:00.000Z", "contentLength": 520716, "httpStatusCode": 200}	b7b47e4c-064c-4f3f-94c9-1d94e1cb72c6	\N	{}	\N	f	f
c14a57b2-bb03-4bab-b0d3-0e182fae4628	preinscriptions	95a441bd-33ec-4f72-95c5-0cf23f57b00b/95a441bd-33ec-4f72-95c5-0cf23f57b00b_photo_1781466794108.png	\N	2026-06-14 19:53:15.935604+00	2026-06-14 19:53:15.935604+00	2026-06-14 19:53:15.935604+00	{"eTag": "\\"5979bba171dc84e3edbefae7a6a86b36\\"", "size": 22191, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-14T19:53:16.000Z", "contentLength": 22191, "httpStatusCode": 200}	9f8ba58b-7c39-46ca-8a61-a678f064c885	\N	{}	\N	f	f
3bea04d2-b696-4eb5-9fe2-e15b0074d504	preinscriptions	annonces/annonce_1780587876749_8818.png	\N	2026-06-04 15:44:39.982643+00	2026-06-04 15:44:39.982643+00	2026-06-04 15:44:39.982643+00	{"eTag": "\\"6dfee3e16c6ceadfc32045c4ca5af8c6\\"", "size": 161109, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-04T15:44:40.000Z", "contentLength": 161109, "httpStatusCode": 200}	a519a820-8ee5-486e-a504-8e2f7c0c3dce	\N	{}	\N	f	f
1d03c715-81bd-4852-b9d7-6dcef416318f	preinscriptions	annonces/annonce_1780587879150_512.png	\N	2026-06-04 15:44:41.49772+00	2026-06-04 15:44:41.49772+00	2026-06-04 15:44:41.49772+00	{"eTag": "\\"71af0a615b37d46bf09215c159d6a39f\\"", "size": 352774, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-04T15:44:42.000Z", "contentLength": 352774, "httpStatusCode": 200}	ee21f4ed-8619-46cb-af8f-2dab540d3453	\N	{}	\N	f	f
021c6fe0-a264-4499-88ec-3c98674b99f3	preinscriptions	706bfd6b-bdf1-45c6-84d7-10cc63380d37/706bfd6b-bdf1-45c6-84d7-10cc63380d37_acte_1781522185546.png	\N	2026-06-15 11:16:32.394489+00	2026-06-15 11:16:32.394489+00	2026-06-15 11:16:32.394489+00	{"eTag": "\\"5979bba171dc84e3edbefae7a6a86b36\\"", "size": 22191, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T11:16:33.000Z", "contentLength": 22191, "httpStatusCode": 200}	aa3cb4b5-929b-4b95-b356-bc4f10b1e81a	\N	{}	\N	f	f
3fb871a1-d6a3-41d5-88e9-ccf5e2947970	preinscriptions	annonces/annonce_1780589992729_8569.png	\N	2026-06-04 16:19:54.742717+00	2026-06-04 16:19:54.742717+00	2026-06-04 16:19:54.742717+00	{"eTag": "\\"252163da5936c3818d4b82a972c8a7eb\\"", "size": 31984, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-04T16:19:55.000Z", "contentLength": 31984, "httpStatusCode": 200}	a139cd13-a5ff-448c-bb0b-b540d63f89ce	\N	{}	\N	f	f
387c6cd1-5fae-42a5-8541-78c252c68d27	preinscriptions	annonces/annonce_1780590643232_910.png	\N	2026-06-04 16:30:45.289407+00	2026-06-04 16:30:45.289407+00	2026-06-04 16:30:45.289407+00	{"eTag": "\\"80305fbb97e7579815fab93ce971704f\\"", "size": 32055, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-04T16:30:46.000Z", "contentLength": 32055, "httpStatusCode": 200}	9eeb57b6-484c-4b85-b817-36d3147f32ca	\N	{}	\N	f	f
04f138e7-dbf9-4e31-8f8d-1fd2fd20b8d8	preinscriptions	annonces/annonce_1780590662610_5815.png	\N	2026-06-04 16:31:05.256108+00	2026-06-04 16:31:05.256108+00	2026-06-04 16:31:05.256108+00	{"eTag": "\\"71af0a615b37d46bf09215c159d6a39f\\"", "size": 352774, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-04T16:31:06.000Z", "contentLength": 352774, "httpStatusCode": 200}	86edf253-04ac-477b-a2fd-91e0e536048a	\N	{}	\N	f	f
ce9f4df8-54f7-40c6-905b-253cd19220a4	preinscriptions	annonces/annonce_1780590675071_9918.png	\N	2026-06-04 16:31:18.028639+00	2026-06-04 16:31:18.028639+00	2026-06-04 16:31:18.028639+00	{"eTag": "\\"71af0a615b37d46bf09215c159d6a39f\\"", "size": 352774, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-04T16:31:18.000Z", "contentLength": 352774, "httpStatusCode": 200}	a3d838ce-c985-48b4-8c85-d173ed3b66ce	\N	{}	\N	f	f
c55287bf-4ddb-4cbe-9f7f-85f51ed439eb	preinscriptions	annonces/annonce_1780590878427_4435.png	\N	2026-06-04 16:34:41.707316+00	2026-06-04 16:34:41.707316+00	2026-06-04 16:34:41.707316+00	{"eTag": "\\"71af0a615b37d46bf09215c159d6a39f\\"", "size": 352774, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-04T16:34:42.000Z", "contentLength": 352774, "httpStatusCode": 200}	5eb4151e-7fa3-4224-92d7-fe3babbe5f44	\N	{}	\N	f	f
78a74ac3-f8f0-409a-9c11-0106875da5eb	preinscriptions	annonces/annonce_1780590918971_76.png	\N	2026-06-04 16:35:20.937866+00	2026-06-04 16:35:20.937866+00	2026-06-04 16:35:20.937866+00	{"eTag": "\\"80305fbb97e7579815fab93ce971704f\\"", "size": 32055, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-04T16:35:21.000Z", "contentLength": 32055, "httpStatusCode": 200}	68ff3dbf-95ae-4b30-bace-e4f2429fdd91	\N	{}	\N	f	f
48789a47-fac0-40a1-b169-7d80283ecb88	preinscriptions	8e13c467-dadb-443f-a51a-0a18fd2bc3e2/8e13c467-dadb-443f-a51a-0a18fd2bc3e2_photo_1782655520308.jpeg	\N	2026-06-28 14:05:21.940766+00	2026-06-28 14:05:21.940766+00	2026-06-28 14:05:21.940766+00	{"eTag": "\\"3b7ba4e67b45ac22b5cc687cda2ff39c\\"", "size": 104543, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T14:05:22.000Z", "contentLength": 104543, "httpStatusCode": 200}	7c55a32e-1167-4992-be3d-049ff0494892	\N	{}	\N	f	f
3725021e-064b-4107-ab7f-e8fe575e73bb	preinscriptions	annonces/annonce_1780591038877_825.png	\N	2026-06-04 16:37:20.803931+00	2026-06-04 16:37:20.803931+00	2026-06-04 16:37:20.803931+00	{"eTag": "\\"80305fbb97e7579815fab93ce971704f\\"", "size": 32055, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-04T16:37:21.000Z", "contentLength": 32055, "httpStatusCode": 200}	1aa372c8-3edf-495b-a199-a3049139c173	\N	{}	\N	f	f
f6f564ce-27ae-4dbb-9a69-fcca4a49fb24	preinscriptions	fd390b52-7071-409d-bc07-eb99166d1920/fd390b52-7071-409d-bc07-eb99166d1920_acte_1781468652444.png	\N	2026-06-14 20:24:18.332903+00	2026-06-14 20:24:18.332903+00	2026-06-14 20:24:18.332903+00	{"eTag": "\\"5979bba171dc84e3edbefae7a6a86b36\\"", "size": 22191, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-14T20:24:19.000Z", "contentLength": 22191, "httpStatusCode": 200}	1d97501b-fa93-45aa-8d4b-303201a28032	\N	{}	\N	f	f
57f70ca3-c854-4fcf-8f72-6a030a97139c	preinscriptions	annonces/annonce_1780591140149_1715.png	\N	2026-06-04 16:39:01.925224+00	2026-06-04 16:39:01.925224+00	2026-06-04 16:39:01.925224+00	{"eTag": "\\"80305fbb97e7579815fab93ce971704f\\"", "size": 32055, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-04T16:39:02.000Z", "contentLength": 32055, "httpStatusCode": 200}	012d71dc-e835-42fb-b569-a7dd733249cf	\N	{}	\N	f	f
67630395-f430-46be-852d-094ea0c81f66	preinscriptions	fceda17b-4f70-4916-b426-1c100d062da5/fceda17b-4f70-4916-b426-1c100d062da5_acte_1782229162399.jpg	\N	2026-06-23 15:39:26.040855+00	2026-06-23 15:39:26.040855+00	2026-06-23 15:39:26.040855+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-23T15:39:26.000Z", "contentLength": 414566, "httpStatusCode": 200}	90918445-e679-4683-86f8-127ce8c12d7e	\N	{}	\N	f	f
7db95a5e-d6d1-4861-9c3b-063a92165888	preinscriptions	annonces/annonce_1780591162180_2133.png	\N	2026-06-04 16:39:24.925629+00	2026-06-04 16:39:24.925629+00	2026-06-04 16:39:24.925629+00	{"eTag": "\\"71af0a615b37d46bf09215c159d6a39f\\"", "size": 352774, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-04T16:39:25.000Z", "contentLength": 352774, "httpStatusCode": 200}	3d104eca-a41a-45a3-9b57-3eb693feaf32	\N	{}	\N	f	f
feb19e20-a3bc-401e-9ba4-6e553819523e	preinscriptions	fd390b52-7071-409d-bc07-eb99166d1920/fd390b52-7071-409d-bc07-eb99166d1920_photo_1781468656794.png	\N	2026-06-14 20:24:18.631127+00	2026-06-14 20:24:18.631127+00	2026-06-14 20:24:18.631127+00	{"eTag": "\\"5979bba171dc84e3edbefae7a6a86b36\\"", "size": 22191, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-14T20:24:19.000Z", "contentLength": 22191, "httpStatusCode": 200}	d1c0b22d-42ba-4544-9f43-18b384328ff0	\N	{}	\N	f	f
5c0fd8c8-835d-4683-bda3-8050f99a1f7f	preinscriptions	annonces/annonce_1780591184030_9878.png	\N	2026-06-04 16:39:46.863332+00	2026-06-04 16:39:46.863332+00	2026-06-04 16:39:46.863332+00	{"eTag": "\\"71af0a615b37d46bf09215c159d6a39f\\"", "size": 352774, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-04T16:39:47.000Z", "contentLength": 352774, "httpStatusCode": 200}	2a91b268-a44f-4d5a-9c42-7e80a84608e3	\N	{}	\N	f	f
2628a24e-629d-40d5-b615-2fa51d864da4	preinscriptions	b2c40a87-59a8-4e1e-ba51-3a1bde41a8cd/b2c40a87-59a8-4e1e-ba51-3a1bde41a8cd_photo_1783773202977.png	\N	2026-07-11 12:33:23.525986+00	2026-07-11 12:33:23.525986+00	2026-07-11 12:33:23.525986+00	{"eTag": "\\"6fc087cd79ef40992f2c2abcf8e4075b\\"", "size": 828452, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-07-11T12:33:24.000Z", "contentLength": 828452, "httpStatusCode": 200}	007002e3-b274-44b6-816b-09fd75be150e	\N	{}	\N	f	f
45ce23b5-5c91-4cff-84c6-8631a9764e88	preinscriptions	annonces/annonce_1780591237545_7525.png	\N	2026-06-04 16:40:40.487898+00	2026-06-04 16:40:40.487898+00	2026-06-04 16:40:40.487898+00	{"eTag": "\\"71af0a615b37d46bf09215c159d6a39f\\"", "size": 352774, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-04T16:40:41.000Z", "contentLength": 352774, "httpStatusCode": 200}	b57f2e0a-aa42-4765-a9c1-be1acb277046	\N	{}	\N	f	f
d9566cf6-3123-49fc-a52a-3b510ae1b159	preinscriptions	fd390b52-7071-409d-bc07-eb99166d1920/fd390b52-7071-409d-bc07-eb99166d1920_acte_1781468681723.png	\N	2026-06-14 20:24:44.212644+00	2026-06-14 20:24:44.212644+00	2026-06-14 20:24:44.212644+00	{"eTag": "\\"5979bba171dc84e3edbefae7a6a86b36\\"", "size": 22191, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-14T20:24:45.000Z", "contentLength": 22191, "httpStatusCode": 200}	29bc4c0f-7439-4040-8532-ee167461b5f7	\N	{}	\N	f	f
6c864629-8a3d-44c2-b6a5-17d44b1ef1fd	preinscriptions	annonces/annonce_1780591287537_9548.png	\N	2026-06-04 16:41:30.268165+00	2026-06-04 16:41:30.268165+00	2026-06-04 16:41:30.268165+00	{"eTag": "\\"71af0a615b37d46bf09215c159d6a39f\\"", "size": 352774, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-04T16:41:31.000Z", "contentLength": 352774, "httpStatusCode": 200}	744a8ec5-0e18-4de0-bd75-be76ba6c6442	\N	{}	\N	f	f
7f802505-8a63-42a2-8093-c6ca54208951	preinscriptions	annonces/annonce_1780591324124_2622.png	\N	2026-06-04 16:42:07.003283+00	2026-06-04 16:42:07.003283+00	2026-06-04 16:42:07.003283+00	{"eTag": "\\"71af0a615b37d46bf09215c159d6a39f\\"", "size": 352774, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-04T16:42:07.000Z", "contentLength": 352774, "httpStatusCode": 200}	f29ff335-7da1-4ca2-bf77-176678759052	\N	{}	\N	f	f
b0acd722-9d04-4a8e-89d2-29e47d84d673	preinscriptions	annonces/annonce_1780603591813_7530.png	\N	2026-06-04 20:06:52.292364+00	2026-06-04 20:06:52.292364+00	2026-06-04 20:06:52.292364+00	{"eTag": "\\"104974a4df2a76afd9cb4b268eda6a30\\"", "size": 517265, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-04T20:06:53.000Z", "contentLength": 517265, "httpStatusCode": 200}	455091ca-8a07-4b24-923f-81fd0b7fc5db	\N	{}	\N	f	f
43890de9-ff54-4e4a-b223-cf9688d9562b	preinscriptions	librairie/librairie_1780768791207_776.jpg	\N	2026-06-06 17:59:53.352083+00	2026-06-06 17:59:53.352083+00	2026-06-06 17:59:53.352083+00	{"eTag": "\\"4a2aebf7e802f88e20b4bf7a16a3f78e\\"", "size": 110734, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-06T17:59:54.000Z", "contentLength": 110734, "httpStatusCode": 200}	d976730e-8ece-40d3-978d-e2e86a3b387e	\N	{}	\N	f	f
619efa56-b08f-4cfe-9e5b-bd50bd690f2b	preinscriptions	706bfd6b-bdf1-45c6-84d7-10cc63380d37/706bfd6b-bdf1-45c6-84d7-10cc63380d37_photo_1781522194523.png	\N	2026-06-15 11:16:34.854573+00	2026-06-15 11:16:34.854573+00	2026-06-15 11:16:34.854573+00	{"eTag": "\\"5979bba171dc84e3edbefae7a6a86b36\\"", "size": 22191, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T11:16:35.000Z", "contentLength": 22191, "httpStatusCode": 200}	d835646f-d659-4ccc-8555-ab3c71d82a3a	\N	{}	\N	f	f
563e70f9-18fc-4a7b-9dcd-085afd45c040	preinscriptions	fceda17b-4f70-4916-b426-1c100d062da5/fceda17b-4f70-4916-b426-1c100d062da5_photo_1782229165084.jpg	\N	2026-06-23 15:39:27.912442+00	2026-06-23 15:39:27.912442+00	2026-06-23 15:39:27.912442+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-23T15:39:28.000Z", "contentLength": 414566, "httpStatusCode": 200}	19af8fde-bba3-44df-a94d-1fe3c64af76e	\N	{}	\N	f	f
696bd284-1ef8-429a-b6ca-93945414db20	preinscriptions	706bfd6b-bdf1-45c6-84d7-10cc63380d37/706bfd6b-bdf1-45c6-84d7-10cc63380d37_acte_1781522638137.png	\N	2026-06-15 11:24:00.722674+00	2026-06-15 11:24:00.722674+00	2026-06-15 11:24:00.722674+00	{"eTag": "\\"5979bba171dc84e3edbefae7a6a86b36\\"", "size": 22191, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T11:24:01.000Z", "contentLength": 22191, "httpStatusCode": 200}	c56bab5a-d333-4609-8936-813cbd0011fc	\N	{}	\N	f	f
5f260272-5b87-4018-9baa-e4db6248af3a	preinscriptions	1f20be6d-6446-4396-a097-c0c2d8b3272a/1f20be6d-6446-4396-a097-c0c2d8b3272a_acte_1787492725337.jpg	\N	2026-08-23 13:45:25.662757+00	2026-08-23 13:45:25.662757+00	2026-08-23 13:45:25.662757+00	{"eTag": "\\"51a2f5941b67393ad2aa1f7727f4598d\\"", "size": 21249, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-08-23T13:45:26.000Z", "contentLength": 21249, "httpStatusCode": 200}	3097448d-562e-4d47-b0e3-dfd1ab351799	\N	{}	\N	f	f
852045c4-9973-48aa-981e-5beb08d6f75a	preinscriptions	706bfd6b-bdf1-45c6-84d7-10cc63380d37/706bfd6b-bdf1-45c6-84d7-10cc63380d37_photo_1781522640991.png	\N	2026-06-15 11:24:01.356536+00	2026-06-15 11:24:01.356536+00	2026-06-15 11:24:01.356536+00	{"eTag": "\\"5979bba171dc84e3edbefae7a6a86b36\\"", "size": 22191, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T11:24:02.000Z", "contentLength": 22191, "httpStatusCode": 200}	d2eefed8-93d2-46bf-a31c-99341000bcea	\N	{}	\N	f	f
94204433-2394-429e-9287-d890178ddece	preinscriptions	5e2d6a1a-ecb2-4cf3-a08e-e658b3cda044/5e2d6a1a-ecb2-4cf3-a08e-e658b3cda044_acte_1782229505349.jpg	\N	2026-06-23 15:45:09.042338+00	2026-06-23 15:45:09.042338+00	2026-06-23 15:45:09.042338+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-23T15:45:09.000Z", "contentLength": 414566, "httpStatusCode": 200}	0e3b2a7b-33c7-43fe-933b-2d5facebe424	\N	{}	\N	f	f
e856f17d-642d-40ab-a193-d31a2b8e9f36	preinscriptions	706bfd6b-bdf1-45c6-84d7-10cc63380d37/706bfd6b-bdf1-45c6-84d7-10cc63380d37_acte_1781522845395.png	\N	2026-06-15 11:27:28.701899+00	2026-06-15 11:27:28.701899+00	2026-06-15 11:27:28.701899+00	{"eTag": "\\"5979bba171dc84e3edbefae7a6a86b36\\"", "size": 22191, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T11:27:29.000Z", "contentLength": 22191, "httpStatusCode": 200}	363d3404-012a-4c21-8c59-17614d7548ec	\N	{}	\N	f	f
98fd63b1-8dd7-4d0f-a962-2cd7912f88ce	preinscriptions	706bfd6b-bdf1-45c6-84d7-10cc63380d37/706bfd6b-bdf1-45c6-84d7-10cc63380d37_photo_1781522849179.png	\N	2026-06-15 11:27:29.593006+00	2026-06-15 11:27:29.593006+00	2026-06-15 11:27:29.593006+00	{"eTag": "\\"5979bba171dc84e3edbefae7a6a86b36\\"", "size": 22191, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T11:27:30.000Z", "contentLength": 22191, "httpStatusCode": 200}	25eef7a6-b32e-421f-907f-3c19f0d9dbac	\N	{}	\N	f	f
e8890cc5-733c-48d6-a2d0-fa3644c48a33	preinscriptions	5e2d6a1a-ecb2-4cf3-a08e-e658b3cda044/5e2d6a1a-ecb2-4cf3-a08e-e658b3cda044_photo_1782229508071.jpg	\N	2026-06-23 15:45:10.790887+00	2026-06-23 15:45:10.790887+00	2026-06-23 15:45:10.790887+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-23T15:45:11.000Z", "contentLength": 414566, "httpStatusCode": 200}	9eec9ec9-3d8b-40e9-8d18-12b4b453f7e8	\N	{}	\N	f	f
61107b7d-13f9-4370-87fd-06972a1a0489	preinscriptions	a8c7c1f8-5df1-4882-87c2-7d749c11ec1b/a8c7c1f8-5df1-4882-87c2-7d749c11ec1b_photo_1782403116878.png	\N	2026-06-25 15:58:38.701229+00	2026-06-25 15:58:38.701229+00	2026-06-25 15:58:38.701229+00	{"eTag": "\\"29e79bebdbde8427f74e8ff50d9cbe64\\"", "size": 216570, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T15:58:39.000Z", "contentLength": 216570, "httpStatusCode": 200}	e81e6a46-2d8f-4e68-aa78-5c6ad98c8375	\N	{}	\N	f	f
2e6edd45-5d07-4c82-834d-d3df9e132637	preinscriptions	1a2eab3f-4ad9-4aa0-88ff-e4fb20120580/1a2eab3f-4ad9-4aa0-88ff-e4fb20120580_acte_1781525522834.png	\N	2026-06-15 12:12:04.310251+00	2026-06-15 12:12:04.310251+00	2026-06-15 12:12:04.310251+00	{"eTag": "\\"5979bba171dc84e3edbefae7a6a86b36\\"", "size": 22191, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T12:12:05.000Z", "contentLength": 22191, "httpStatusCode": 200}	ba72ff71-ae98-4dfb-bfd7-3c82bc9daabf	\N	{}	\N	f	f
a1e8c6ab-a07c-4072-9f00-1e1900a92f96	preinscriptions	9ec434f1-a5c2-4c6c-a128-3fbc128af0a0/9ec434f1-a5c2-4c6c-a128-3fbc128af0a0_acte_1781525523082.png	\N	2026-06-15 12:12:04.310843+00	2026-06-15 12:12:04.310843+00	2026-06-15 12:12:04.310843+00	{"eTag": "\\"5979bba171dc84e3edbefae7a6a86b36\\"", "size": 22191, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T12:12:05.000Z", "contentLength": 22191, "httpStatusCode": 200}	de524177-6a70-4c13-ac9d-0d1216ad32b9	\N	{}	\N	f	f
d22c0d01-4651-4f19-bcc6-2b643f11ec5c	preinscriptions	9ec434f1-a5c2-4c6c-a128-3fbc128af0a0/9ec434f1-a5c2-4c6c-a128-3fbc128af0a0_photo_1781525524512.png	\N	2026-06-15 12:12:04.943673+00	2026-06-15 12:12:04.943673+00	2026-06-15 12:12:04.943673+00	{"eTag": "\\"5979bba171dc84e3edbefae7a6a86b36\\"", "size": 22191, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T12:12:05.000Z", "contentLength": 22191, "httpStatusCode": 200}	242db353-4271-4006-904c-9d8ee4c6e177	\N	{}	\N	f	f
2a4dc4d6-22e7-44c7-8278-5bd7fd235196	preinscriptions	1a2eab3f-4ad9-4aa0-88ff-e4fb20120580/1a2eab3f-4ad9-4aa0-88ff-e4fb20120580_photo_1781525524452.png	\N	2026-06-15 12:12:05.118852+00	2026-06-15 12:12:05.118852+00	2026-06-15 12:12:05.118852+00	{"eTag": "\\"5979bba171dc84e3edbefae7a6a86b36\\"", "size": 22191, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-15T12:12:06.000Z", "contentLength": 22191, "httpStatusCode": 200}	f34198c9-7211-4e04-9017-b5b56e3974f3	\N	{}	\N	f	f
e5006284-90eb-4a98-856b-9074b9501420	preinscriptions	2514538d-a33d-46b8-a4f4-349895d17790/2514538d-a33d-46b8-a4f4-349895d17790_acte_1782657999713.png	\N	2026-06-28 14:46:43.542815+00	2026-06-28 14:46:43.542815+00	2026-06-28 14:46:43.542815+00	{"eTag": "\\"35c3e1a93f218a1840573d668ac974c7\\"", "size": 2178348, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T14:46:44.000Z", "contentLength": 2178348, "httpStatusCode": 200}	12d68bbf-beef-4e25-a3b1-0f4385aa5188	\N	{}	\N	f	f
44f2d47b-58c4-4dc5-af59-60535a64f569	preinscriptions	037beef6-24ac-4409-9cf2-8c50f71a4942/037beef6-24ac-4409-9cf2-8c50f71a4942_acte_1782391657228.jpeg	\N	2026-06-25 12:47:40.213681+00	2026-06-25 12:47:40.213681+00	2026-06-25 12:47:40.213681+00	{"eTag": "\\"afc3ada8c5164210a2e31d3729733085\\"", "size": 104345, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T12:47:41.000Z", "contentLength": 104345, "httpStatusCode": 200}	23c8f294-bce5-47fd-9c4e-8f0e04fc43de	\N	{}	\N	f	f
a905cee8-bbda-4034-934e-910b3cc514d2	preinscriptions	342f5796-8656-464d-a3d4-b75819b57639/342f5796-8656-464d-a3d4-b75819b57639_acte_1787492725075.png	\N	2026-08-23 13:45:25.667954+00	2026-08-23 13:45:25.667954+00	2026-08-23 13:45:25.667954+00	{"eTag": "\\"5284b4bb449e83f6fb6e31b681f76671\\"", "size": 13274, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-08-23T13:45:26.000Z", "contentLength": 13274, "httpStatusCode": 200}	2a4e84ad-b96d-4311-a43a-590ee50eba4e	\N	{}	\N	f	f
e6b7bf94-8dfb-4d8d-8ee2-e4b8d53ac747	preinscriptions	037beef6-24ac-4409-9cf2-8c50f71a4942/037beef6-24ac-4409-9cf2-8c50f71a4942_photo_1782391659467.png	\N	2026-06-25 12:47:41.863069+00	2026-06-25 12:47:41.863069+00	2026-06-25 12:47:41.863069+00	{"eTag": "\\"f0b8df8a2a802f6674803b5a0633778e\\"", "size": 509674, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T12:47:42.000Z", "contentLength": 509674, "httpStatusCode": 200}	0e7ebf33-f0e6-4b7a-8101-b12a8c99c26b	\N	{}	\N	f	f
c9476bcf-2486-4871-922f-858fc7b4e4c4	preinscriptions	2514538d-a33d-46b8-a4f4-349895d17790/2514538d-a33d-46b8-a4f4-349895d17790_photo_1782658002221.jpeg	\N	2026-06-28 14:46:43.882895+00	2026-06-28 14:46:43.882895+00	2026-06-28 14:46:43.882895+00	{"eTag": "\\"3b7ba4e67b45ac22b5cc687cda2ff39c\\"", "size": 104543, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T14:46:44.000Z", "contentLength": 104543, "httpStatusCode": 200}	97dfb218-73df-4b3a-9f60-a6073425cdaf	\N	{}	\N	f	f
c57ab4fd-5592-4087-82d6-26f5fb8cc03b	preinscriptions	037beef6-24ac-4409-9cf2-8c50f71a4942/037beef6-24ac-4409-9cf2-8c50f71a4942_bulletin_1782391661018.pdf	\N	2026-06-25 12:47:49.281376+00	2026-06-25 12:47:49.281376+00	2026-06-25 12:47:49.281376+00	{"eTag": "\\"793b027b0dc3249cdc1faa44083e6397\\"", "size": 1419276, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T12:47:50.000Z", "contentLength": 1419276, "httpStatusCode": 200}	b14515b4-005d-44ba-bb1c-602312897e55	\N	{}	\N	f	f
a41f72bd-467e-4c33-89a3-2fcd62f07b58	preinscriptions	b2c40a87-59a8-4e1e-ba51-3a1bde41a8cd/b2c40a87-59a8-4e1e-ba51-3a1bde41a8cd_acte_1783773231744.png	\N	2026-07-11 12:33:52.374002+00	2026-07-11 12:33:52.374002+00	2026-07-11 12:33:52.374002+00	{"eTag": "\\"0175edf869ac80cff7b9775dbf3fb44f\\"", "size": 880465, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-07-11T12:33:53.000Z", "contentLength": 880465, "httpStatusCode": 200}	1f04a323-e130-4d97-ac57-fc07fc76b8d8	\N	{}	\N	f	f
41dcecd7-2bb9-4bd1-bf25-b2e7fa5910c9	preinscriptions	d27d2704-13fe-4305-85de-a5314d84390e/d27d2704-13fe-4305-85de-a5314d84390e_acte_1782403322660.jpg	\N	2026-06-25 16:02:05.838977+00	2026-06-25 16:02:05.838977+00	2026-06-25 16:02:05.838977+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T16:02:06.000Z", "contentLength": 414566, "httpStatusCode": 200}	5afa6241-80e7-44d3-8e66-e44763ba0332	\N	{}	\N	f	f
38973290-6001-446c-b512-47b1a6c18896	preinscriptions	869bbe00-5fb1-43a6-827e-d8197b37175e/869bbe00-5fb1-43a6-827e-d8197b37175e_acte_1787492725538.jpg	\N	2026-08-23 13:45:25.687212+00	2026-08-23 13:45:25.687212+00	2026-08-23 13:45:25.687212+00	{"eTag": "\\"51a2f5941b67393ad2aa1f7727f4598d\\"", "size": 21249, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-08-23T13:45:26.000Z", "contentLength": 21249, "httpStatusCode": 200}	d282f9d7-59a3-4f0f-a35d-a7d1f5462f60	\N	{}	\N	f	f
124f7107-1786-48eb-b01c-a0dcb54c82e3	preinscriptions	d27d2704-13fe-4305-85de-a5314d84390e/d27d2704-13fe-4305-85de-a5314d84390e_photo_1782403324971.png	\N	2026-06-25 16:02:54.304192+00	2026-06-25 16:02:54.304192+00	2026-06-25 16:02:54.304192+00	{"eTag": "\\"2841115b6e774e7e0b71437b6528151b\\"", "size": 9394265, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T16:02:55.000Z", "contentLength": 9394265, "httpStatusCode": 200}	71542902-412e-4869-b879-9f7671c570ea	\N	{}	\N	f	f
97f0f1c9-7fe2-4a9c-8ae1-1dd69141231d	preinscriptions	d27d2704-13fe-4305-85de-a5314d84390e/d27d2704-13fe-4305-85de-a5314d84390e_bulletin_1782403373386.pdf	\N	2026-06-25 16:03:00.54926+00	2026-06-25 16:03:00.54926+00	2026-06-25 16:03:00.54926+00	{"eTag": "\\"793b027b0dc3249cdc1faa44083e6397\\"", "size": 1419276, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T16:03:01.000Z", "contentLength": 1419276, "httpStatusCode": 200}	4db09dbf-fb2c-45ad-85d8-e056d1146f56	\N	{}	\N	f	f
a9b2daaa-de9a-4cb1-b847-46bb72c86265	preinscriptions	1701a441-8a8c-4b38-8a89-2eb53e43af23/1701a441-8a8c-4b38-8a89-2eb53e43af23_acte_1782403600518.jpg	\N	2026-06-25 16:06:47.450873+00	2026-06-25 16:06:47.450873+00	2026-06-25 16:06:47.450873+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T16:06:48.000Z", "contentLength": 414566, "httpStatusCode": 200}	5db35963-9137-4ef7-8160-7e85fabb9c68	\N	{}	\N	f	f
cd2744b5-99cd-4618-9099-f8a95adbe759	preinscriptions	librairie/librairie_1781609500399_3280.avif	\N	2026-06-16 11:31:41.787553+00	2026-06-16 11:31:41.787553+00	2026-06-16 11:31:41.787553+00	{"eTag": "\\"89f02098f020c37983bb368778f01d39\\"", "size": 68040, "mimetype": "image/avif", "cacheControl": "max-age=3600", "lastModified": "2026-06-16T11:31:42.000Z", "contentLength": 68040, "httpStatusCode": 200}	9088987d-77e0-430a-b571-7b4c5c594783	\N	{}	\N	f	f
d4a443b5-5c7c-49bb-b5cf-091af8dc3965	preinscriptions	17c0acfd-6fb6-4fb4-86fd-e1e17656bc10/17c0acfd-6fb6-4fb4-86fd-e1e17656bc10_acte_1787492725444.jpg	\N	2026-08-23 13:45:25.677706+00	2026-08-23 13:45:25.677706+00	2026-08-23 13:45:25.677706+00	{"eTag": "\\"51a2f5941b67393ad2aa1f7727f4598d\\"", "size": 21249, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-08-23T13:45:26.000Z", "contentLength": 21249, "httpStatusCode": 200}	13072d30-4a5e-46cd-8f86-68b4b43af53a	\N	{}	\N	f	f
19c2c042-6338-4128-ace3-271458fa9e80	preinscriptions	b4553905-6182-49cd-b68b-f1041c66e1a6/b4553905-6182-49cd-b68b-f1041c66e1a6_acte_1782392047911.jpeg	\N	2026-06-25 12:54:11.2042+00	2026-06-25 12:54:11.2042+00	2026-06-25 12:54:11.2042+00	{"eTag": "\\"afc3ada8c5164210a2e31d3729733085\\"", "size": 104345, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T12:54:12.000Z", "contentLength": 104345, "httpStatusCode": 200}	673344a7-cbd8-44d6-943c-622d00a76856	\N	{}	\N	f	f
8843fe80-6208-4c40-bf10-5e0f339cf819	preinscriptions	a9105c75-d157-4e55-a7f2-fcae30a819ba/a9105c75-d157-4e55-a7f2-fcae30a819ba_acte_1782658099012.jpeg	\N	2026-06-28 14:48:21.339106+00	2026-06-28 14:48:21.339106+00	2026-06-28 14:48:21.339106+00	{"eTag": "\\"3b7ba4e67b45ac22b5cc687cda2ff39c\\"", "size": 104543, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T14:48:22.000Z", "contentLength": 104543, "httpStatusCode": 200}	9d4615a7-24c3-4512-bcf9-db0ceb5adf72	\N	{}	\N	f	f
7e80430b-f3ca-4e97-80b1-b37f82407b3a	preinscriptions	b4553905-6182-49cd-b68b-f1041c66e1a6/b4553905-6182-49cd-b68b-f1041c66e1a6_photo_1782392050386.jpeg	\N	2026-06-25 12:54:11.855218+00	2026-06-25 12:54:11.855218+00	2026-06-25 12:54:11.855218+00	{"eTag": "\\"5899d5dc86c2406937cc9c3a2cffc41d\\"", "size": 75203, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T12:54:12.000Z", "contentLength": 75203, "httpStatusCode": 200}	da9db39f-685a-4052-8338-a7569b025e5a	\N	{}	\N	f	f
61f27a64-a6f0-4b1e-b684-8e192ad7bf01	preinscriptions	b4553905-6182-49cd-b68b-f1041c66e1a6/b4553905-6182-49cd-b68b-f1041c66e1a6_bulletin_1782392051086.pdf	\N	2026-06-25 12:54:20.682835+00	2026-06-25 12:54:20.682835+00	2026-06-25 12:54:20.682835+00	{"eTag": "\\"793b027b0dc3249cdc1faa44083e6397\\"", "size": 1419276, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T12:54:21.000Z", "contentLength": 1419276, "httpStatusCode": 200}	f9701950-4768-4c0a-9f71-33a2d98a294d	\N	{}	\N	f	f
c992a326-895d-4f6d-bf05-f1bf9a73f93e	preinscriptions	1701a441-8a8c-4b38-8a89-2eb53e43af23/1701a441-8a8c-4b38-8a89-2eb53e43af23_photo_1782403606418.jpg	\N	2026-06-25 16:06:50.0508+00	2026-06-25 16:06:50.0508+00	2026-06-25 16:06:50.0508+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T16:06:50.000Z", "contentLength": 414566, "httpStatusCode": 200}	f72bb072-ad9a-4cb0-b570-568ab9d0189d	\N	{}	\N	f	f
ba7bb9c9-0fe2-4a1d-bdd7-3fa6d73e339f	preinscriptions	a9105c75-d157-4e55-a7f2-fcae30a819ba/a9105c75-d157-4e55-a7f2-fcae30a819ba_photo_1782658100100.png	\N	2026-06-28 14:48:22.916926+00	2026-06-28 14:48:22.916926+00	2026-06-28 14:48:22.916926+00	{"eTag": "\\"6a410410e797829599d9e30b2540b171\\"", "size": 2662850, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T14:48:23.000Z", "contentLength": 2662850, "httpStatusCode": 200}	5ad501da-d0fd-4702-b015-84236a3fed33	\N	{}	\N	f	f
5d812491-a7a1-4275-8426-fc278a559980	preinscriptions	1701a441-8a8c-4b38-8a89-2eb53e43af23/1701a441-8a8c-4b38-8a89-2eb53e43af23_bulletin_1782403609206.pdf	\N	2026-06-25 16:06:58.35728+00	2026-06-25 16:06:58.35728+00	2026-06-25 16:06:58.35728+00	{"eTag": "\\"793b027b0dc3249cdc1faa44083e6397\\"", "size": 1419276, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T16:06:59.000Z", "contentLength": 1419276, "httpStatusCode": 200}	051ee5f9-3b27-4469-8083-91b22bdb391d	\N	{}	\N	f	f
5f04be8f-fe4d-4632-ae1c-869f876522bd	preinscriptions	b2c40a87-59a8-4e1e-ba51-3a1bde41a8cd/b2c40a87-59a8-4e1e-ba51-3a1bde41a8cd_photo_1783773238595.png	\N	2026-07-11 12:33:59.148919+00	2026-07-11 12:33:59.148919+00	2026-07-11 12:33:59.148919+00	{"eTag": "\\"6fc087cd79ef40992f2c2abcf8e4075b\\"", "size": 828452, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-07-11T12:34:00.000Z", "contentLength": 828452, "httpStatusCode": 200}	4869e9aa-ea45-4f82-8d95-af33a0759f79	\N	{}	\N	f	f
8fe8542c-6e8f-4790-95d1-588a90504ea2	preinscriptions	e582ead7-8f15-4999-b5b0-191f175229d8/e582ead7-8f15-4999-b5b0-191f175229d8_acte_1782404173474.jpeg	\N	2026-06-25 16:16:16.287545+00	2026-06-25 16:16:16.287545+00	2026-06-25 16:16:16.287545+00	{"eTag": "\\"773ab5027a6992ada0cd85f75b1f1130\\"", "size": 96065, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T16:16:17.000Z", "contentLength": 96065, "httpStatusCode": 200}	74aaa908-6b8a-4fdf-aec6-dd9783421b73	\N	{}	\N	f	f
96be4843-10f3-445b-9ce6-62a6fa1077d3	preinscriptions	e582ead7-8f15-4999-b5b0-191f175229d8/e582ead7-8f15-4999-b5b0-191f175229d8_photo_1782404175332.jpeg	\N	2026-06-25 16:16:16.98524+00	2026-06-25 16:16:16.98524+00	2026-06-25 16:16:16.98524+00	{"eTag": "\\"afc3ada8c5164210a2e31d3729733085\\"", "size": 104345, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T16:16:17.000Z", "contentLength": 104345, "httpStatusCode": 200}	a87083fb-839f-4ea7-9a22-2815114e2c42	\N	{}	\N	f	f
a3c147d7-304c-46b0-a816-4868bca15bf2	preinscriptions	9d0c09d9-36f5-4feb-bb5a-1af511b84c39/9d0c09d9-36f5-4feb-bb5a-1af511b84c39_acte_1782405688672.jpg	\N	2026-06-25 16:41:32.224413+00	2026-06-25 16:41:32.224413+00	2026-06-25 16:41:32.224413+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T16:41:33.000Z", "contentLength": 414566, "httpStatusCode": 200}	aa9d8e5c-8a2d-4d7c-8676-53c2aae09219	\N	{}	\N	f	f
dab7d8b8-caec-4ba1-84b3-faa5d6ff5ab6	preinscriptions	librairie/librairie_1781614337443_1212.avif	\N	2026-06-16 12:52:18.96335+00	2026-06-16 12:52:18.96335+00	2026-06-16 12:52:18.96335+00	{"eTag": "\\"89f02098f020c37983bb368778f01d39\\"", "size": 68040, "mimetype": "image/avif", "cacheControl": "max-age=3600", "lastModified": "2026-06-16T12:52:19.000Z", "contentLength": 68040, "httpStatusCode": 200}	32fd4b29-def5-4513-abd5-0508e5c2fb05	\N	{}	\N	f	f
a4240810-50ec-4670-ac4c-b3a98a825e2c	preinscriptions	678dc949-fc5c-4f99-9603-09b0a7f5ca36/678dc949-fc5c-4f99-9603-09b0a7f5ca36_acte_1781617540691.png	\N	2026-06-16 13:45:42.413291+00	2026-06-16 13:45:42.413291+00	2026-06-16 13:45:42.413291+00	{"eTag": "\\"5979bba171dc84e3edbefae7a6a86b36\\"", "size": 22191, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-16T13:45:43.000Z", "contentLength": 22191, "httpStatusCode": 200}	3b3c7664-b40c-457f-82ee-1b2c4b347a6a	\N	{}	\N	f	f
d3787674-ccad-4856-9a04-918a917209f7	preinscriptions	7abbed53-70a0-46f0-a623-17d1b539f62c/7abbed53-70a0-46f0-a623-17d1b539f62c_acte_1782399244595.jpeg	\N	2026-06-25 14:54:08.240027+00	2026-06-25 14:54:08.240027+00	2026-06-25 14:54:08.240027+00	{"eTag": "\\"afc3ada8c5164210a2e31d3729733085\\"", "size": 104345, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T14:54:09.000Z", "contentLength": 104345, "httpStatusCode": 200}	31818130-9d30-46fc-a6f4-4dca6aa6f22b	\N	{}	\N	f	f
3ddc6aa3-645a-477c-9158-876a159545db	preinscriptions	678dc949-fc5c-4f99-9603-09b0a7f5ca36/678dc949-fc5c-4f99-9603-09b0a7f5ca36_photo_1781617546284.png	\N	2026-06-16 13:45:46.475701+00	2026-06-16 13:45:46.475701+00	2026-06-16 13:45:46.475701+00	{"eTag": "\\"5979bba171dc84e3edbefae7a6a86b36\\"", "size": 22191, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-16T13:45:47.000Z", "contentLength": 22191, "httpStatusCode": 200}	cd917f50-8e9f-4157-9a52-04ead346cb56	\N	{}	\N	f	f
49587afc-e4c9-4328-8a23-c41792bda667	preinscriptions	31dc10c6-fa26-4ab1-8a4f-9f0aa0aaec5a/31dc10c6-fa26-4ab1-8a4f-9f0aa0aaec5a_acte_1782659586064.jpeg	\N	2026-06-28 15:13:08.482883+00	2026-06-28 15:13:08.482883+00	2026-06-28 15:13:08.482883+00	{"eTag": "\\"3b7ba4e67b45ac22b5cc687cda2ff39c\\"", "size": 104543, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T15:13:09.000Z", "contentLength": 104543, "httpStatusCode": 200}	57b90cba-01be-4d61-97df-b8f007b01bc0	\N	{}	\N	f	f
7e2c480c-6fb9-49f2-a425-959a038e5dd1	preinscriptions	8a4ba33b-9ef5-4cc7-9205-8a4dde09e30e/8a4ba33b-9ef5-4cc7-9205-8a4dde09e30e_acte_1781711035673.png	\N	2026-06-17 15:43:57.101476+00	2026-06-17 15:43:57.101476+00	2026-06-17 15:43:57.101476+00	{"eTag": "\\"5979bba171dc84e3edbefae7a6a86b36\\"", "size": 22191, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-17T15:43:58.000Z", "contentLength": 22191, "httpStatusCode": 200}	6275eaa4-355c-42ec-bf98-9c3ef87a7da3	\N	{}	\N	f	f
a057ac1c-db8a-4549-bedf-f366bfaeb0eb	preinscriptions	7abbed53-70a0-46f0-a623-17d1b539f62c/7abbed53-70a0-46f0-a623-17d1b539f62c_photo_1782399247616.jpeg	\N	2026-06-25 14:54:09.162737+00	2026-06-25 14:54:09.162737+00	2026-06-25 14:54:09.162737+00	{"eTag": "\\"5899d5dc86c2406937cc9c3a2cffc41d\\"", "size": 75203, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T14:54:10.000Z", "contentLength": 75203, "httpStatusCode": 200}	2f52cd7a-bc31-402c-a1b1-9bc9234e7a2c	\N	{}	\N	f	f
b2bbbfc4-134e-4cf7-bdc1-262ad8e14d7a	preinscriptions	8a4ba33b-9ef5-4cc7-9205-8a4dde09e30e/8a4ba33b-9ef5-4cc7-9205-8a4dde09e30e_photo_1781711037175.png	\N	2026-06-17 15:43:57.708551+00	2026-06-17 15:43:57.708551+00	2026-06-17 15:43:57.708551+00	{"eTag": "\\"5979bba171dc84e3edbefae7a6a86b36\\"", "size": 22191, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-17T15:43:58.000Z", "contentLength": 22191, "httpStatusCode": 200}	804302e2-4832-44d1-bc46-b686425c7dad	\N	{}	\N	f	f
8172d60d-5741-4090-8934-31d0cd5d6b0d	preinscriptions	e12df60e-1d76-4a72-8eb1-4fbb3c7097df/e12df60e-1d76-4a72-8eb1-4fbb3c7097df_acte_1787492725991.jpg	\N	2026-08-23 13:45:26.200334+00	2026-08-23 13:45:26.200334+00	2026-08-23 13:45:26.200334+00	{"eTag": "\\"ba3e76a625937b691dd1dfcb639b06e2\\"", "size": 29823, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-08-23T13:45:27.000Z", "contentLength": 29823, "httpStatusCode": 200}	4043f2f3-5623-4846-9590-cde5f9812290	\N	{}	\N	f	f
886d725e-3ab5-41b9-935c-9003262f4365	preinscriptions	annonces/annonce_1781881881602_6065.jfif	\N	2026-06-19 15:11:23.596212+00	2026-06-19 15:11:23.596212+00	2026-06-19 15:11:23.596212+00	{"eTag": "\\"3cbfdf7d82dc39bb827b471be5de5af5\\"", "size": 8928, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-19T15:11:24.000Z", "contentLength": 8928, "httpStatusCode": 200}	59c4146a-62c3-4eb1-9ad7-5e592092432c	\N	{}	\N	f	f
c8db8478-f752-4e0c-9ff5-f8d15f4037ec	preinscriptions	librairie/librairie_1781891201575_6492.jpg	\N	2026-06-19 17:46:44.939333+00	2026-06-19 17:46:44.939333+00	2026-06-19 17:46:44.939333+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-19T17:46:45.000Z", "contentLength": 414566, "httpStatusCode": 200}	9ec6bac0-19ae-45b4-9bcd-84ecbe39b7c7	\N	{}	\N	f	f
91ab4fcb-4f28-48a1-a9e7-5b235a0513d7	preinscriptions	dfe38068-fde0-4e1f-a893-00bd5cfc2fec/dfe38068-fde0-4e1f-a893-00bd5cfc2fec_acte_1781891680415.jpeg	\N	2026-06-19 17:54:45.399726+00	2026-06-19 17:54:45.399726+00	2026-06-19 17:54:45.399726+00	{"eTag": "\\"afc3ada8c5164210a2e31d3729733085\\"", "size": 104345, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-19T17:54:46.000Z", "contentLength": 104345, "httpStatusCode": 200}	9da9d6c8-9e92-4b10-90e2-f24d09f455d0	\N	{}	\N	f	f
dccd2cef-cedb-4f99-9b18-6159c0f34336	preinscriptions	dfe38068-fde0-4e1f-a893-00bd5cfc2fec/dfe38068-fde0-4e1f-a893-00bd5cfc2fec_photo_1781891684946.jpg	\N	2026-06-19 17:54:46.340384+00	2026-06-19 17:54:46.340384+00	2026-06-19 17:54:46.340384+00	{"eTag": "\\"4a2aebf7e802f88e20b4bf7a16a3f78e\\"", "size": 110734, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-19T17:54:47.000Z", "contentLength": 110734, "httpStatusCode": 200}	aa338fc4-0d7b-4bd9-b43b-1c1f4234f3a4	\N	{}	\N	f	f
66be32d7-c68f-4fbf-abd6-b7f454b8110e	preinscriptions	7abbed53-70a0-46f0-a623-17d1b539f62c/7abbed53-70a0-46f0-a623-17d1b539f62c_bulletin_1782399248407.pdf	\N	2026-06-25 14:54:21.093528+00	2026-06-25 14:54:21.093528+00	2026-06-25 14:54:21.093528+00	{"eTag": "\\"793b027b0dc3249cdc1faa44083e6397\\"", "size": 1419276, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T14:54:22.000Z", "contentLength": 1419276, "httpStatusCode": 200}	df10020e-f353-4f8a-aff9-4da61d2794ef	\N	{}	\N	f	f
33ee7ac7-d078-4cdf-b72d-996746d1362d	preinscriptions	dfe38068-fde0-4e1f-a893-00bd5cfc2fec/dfe38068-fde0-4e1f-a893-00bd5cfc2fec_acte_1781891910478.jpeg	\N	2026-06-19 17:58:32.696422+00	2026-06-19 17:58:32.696422+00	2026-06-19 17:58:32.696422+00	{"eTag": "\\"afc3ada8c5164210a2e31d3729733085\\"", "size": 104345, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-19T17:58:33.000Z", "contentLength": 104345, "httpStatusCode": 200}	9f7384af-2517-46bc-8310-a5e281556e2b	\N	{}	\N	f	f
113d56d9-2584-4d5e-9cb8-e8ac125da43b	preinscriptions	31dc10c6-fa26-4ab1-8a4f-9f0aa0aaec5a/31dc10c6-fa26-4ab1-8a4f-9f0aa0aaec5a_photo_1782659587176.jpeg	\N	2026-06-28 15:13:09.020525+00	2026-06-28 15:13:09.020525+00	2026-06-28 15:13:09.020525+00	{"eTag": "\\"3b7ba4e67b45ac22b5cc687cda2ff39c\\"", "size": 104543, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T15:13:09.000Z", "contentLength": 104543, "httpStatusCode": 200}	8d4d149f-8f4e-41f2-b5f2-44d89aa874d2	\N	{}	\N	f	f
0fdb65d0-1987-462b-ba8a-ecd267eaa57f	preinscriptions	dfe38068-fde0-4e1f-a893-00bd5cfc2fec/dfe38068-fde0-4e1f-a893-00bd5cfc2fec_photo_1781891912063.jpg	\N	2026-06-19 17:58:33.275317+00	2026-06-19 17:58:33.275317+00	2026-06-19 17:58:33.275317+00	{"eTag": "\\"4a2aebf7e802f88e20b4bf7a16a3f78e\\"", "size": 110734, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-19T17:58:34.000Z", "contentLength": 110734, "httpStatusCode": 200}	7d40ade0-b75a-4bd8-932c-0d884534230a	\N	{}	\N	f	f
8154a4d1-8756-4319-a413-eb515787186b	preinscriptions	3af0f722-98b9-4cbf-9d16-07ead3ab3f98/3af0f722-98b9-4cbf-9d16-07ead3ab3f98_acte_1782399476742.jpeg	\N	2026-06-25 14:58:00.089215+00	2026-06-25 14:58:00.089215+00	2026-06-25 14:58:00.089215+00	{"eTag": "\\"afc3ada8c5164210a2e31d3729733085\\"", "size": 104345, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T14:58:01.000Z", "contentLength": 104345, "httpStatusCode": 200}	746ae5fb-c439-4726-92f0-16f502b5ea30	\N	{}	\N	f	f
4fd42af8-3fc0-409c-b70d-071373f0b212	preinscriptions	2bb983be-594c-4e58-9db6-7aa3c091722e/2bb983be-594c-4e58-9db6-7aa3c091722e_acte_1781914936329.jpg	\N	2026-06-20 00:22:18.921513+00	2026-06-20 00:22:18.921513+00	2026-06-20 00:22:18.921513+00	{"eTag": "\\"4a2aebf7e802f88e20b4bf7a16a3f78e\\"", "size": 110734, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-20T00:22:19.000Z", "contentLength": 110734, "httpStatusCode": 200}	c8f6606e-03f4-41bd-a73a-972642c7e4f7	\N	{}	\N	f	f
c7ea9924-9ee9-464c-a6c1-83e19f1fb4a7	preinscriptions	2bb983be-594c-4e58-9db6-7aa3c091722e/2bb983be-594c-4e58-9db6-7aa3c091722e_photo_1781914938135.jpg	\N	2026-06-20 00:22:19.624097+00	2026-06-20 00:22:19.624097+00	2026-06-20 00:22:19.624097+00	{"eTag": "\\"4a2aebf7e802f88e20b4bf7a16a3f78e\\"", "size": 110734, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-20T00:22:20.000Z", "contentLength": 110734, "httpStatusCode": 200}	14e978e2-816e-4b57-a746-e79a3c57ae86	\N	{}	\N	f	f
a07533d9-7c70-4447-86ff-149f708d6fb0	preinscriptions	3af0f722-98b9-4cbf-9d16-07ead3ab3f98/3af0f722-98b9-4cbf-9d16-07ead3ab3f98_photo_1782399479315.jpeg	\N	2026-06-25 14:58:00.872736+00	2026-06-25 14:58:00.872736+00	2026-06-25 14:58:00.872736+00	{"eTag": "\\"5899d5dc86c2406937cc9c3a2cffc41d\\"", "size": 75203, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T14:58:01.000Z", "contentLength": 75203, "httpStatusCode": 200}	07f2ea9f-fe0e-41c9-8545-39dbec7dbe9f	\N	{}	\N	f	f
81399aae-000f-4b25-b711-a77ba743d1db	preinscriptions	37e99766-41c8-4ae7-886d-f31cfbc89e8d/37e99766-41c8-4ae7-886d-f31cfbc89e8d_acte_1781917929430.jpg	\N	2026-06-20 01:12:11.732255+00	2026-06-20 01:12:11.732255+00	2026-06-20 01:12:11.732255+00	{"eTag": "\\"a9e25a5017d3193f6b8e84506d304ebf\\"", "size": 105874, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-20T01:12:12.000Z", "contentLength": 105874, "httpStatusCode": 200}	5b38880c-a8c3-4442-9fba-4713e0e0c5d2	\N	{}	\N	f	f
e778652e-4f8c-4673-b33d-d991c3232f16	preinscriptions	37e99766-41c8-4ae7-886d-f31cfbc89e8d/37e99766-41c8-4ae7-886d-f31cfbc89e8d_photo_1781917930671.jpg	\N	2026-06-20 01:12:12.187086+00	2026-06-20 01:12:12.187086+00	2026-06-20 01:12:12.187086+00	{"eTag": "\\"4a2aebf7e802f88e20b4bf7a16a3f78e\\"", "size": 110734, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-20T01:12:13.000Z", "contentLength": 110734, "httpStatusCode": 200}	c31e4943-8442-478c-aac3-da0a09357467	\N	{}	\N	f	f
4d20d85e-810d-4460-a991-835ca7a9e12f	preinscriptions	952e49b8-4d83-4964-a9bc-25ef5b0642f9/952e49b8-4d83-4964-a9bc-25ef5b0642f9_acte_1781923859300.jpg	\N	2026-06-20 02:51:09.989642+00	2026-06-20 02:51:09.989642+00	2026-06-20 02:51:09.989642+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-20T02:51:10.000Z", "contentLength": 414566, "httpStatusCode": 200}	0069a230-49d7-419c-860b-a8aa6fb9ec0f	\N	{}	\N	f	f
39b7e0b0-ac32-4316-8eaa-9444f634a54d	preinscriptions	952e49b8-4d83-4964-a9bc-25ef5b0642f9/952e49b8-4d83-4964-a9bc-25ef5b0642f9_photo_1781923868864.jpg	\N	2026-06-20 02:51:10.747394+00	2026-06-20 02:51:10.747394+00	2026-06-20 02:51:10.747394+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-20T02:51:11.000Z", "contentLength": 414566, "httpStatusCode": 200}	9281dcbb-086e-4939-934e-d2b671a3086b	\N	{}	\N	f	f
0cf5e5b2-0f89-48cf-9256-86dd5889bbf1	preinscriptions	3af0f722-98b9-4cbf-9d16-07ead3ab3f98/3af0f722-98b9-4cbf-9d16-07ead3ab3f98_bulletin_1782399480049.pdf	\N	2026-06-25 14:58:11.934559+00	2026-06-25 14:58:11.934559+00	2026-06-25 14:58:11.934559+00	{"eTag": "\\"793b027b0dc3249cdc1faa44083e6397\\"", "size": 1419276, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T14:58:12.000Z", "contentLength": 1419276, "httpStatusCode": 200}	e37cbc96-fff7-49dc-85ab-4998a9adae83	\N	{}	\N	f	f
24f3e23b-5da1-45e3-9720-5c6c2fc798a3	preinscriptions	766bd5af-91de-4f2d-824f-b09dc0950d4e/766bd5af-91de-4f2d-824f-b09dc0950d4e_acte_1781924483831.jpg	\N	2026-06-20 03:01:26.457081+00	2026-06-20 03:01:26.457081+00	2026-06-20 03:01:26.457081+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-20T03:01:27.000Z", "contentLength": 414566, "httpStatusCode": 200}	693d2c9c-2030-4083-bf58-bfc2a28e9cbe	\N	{}	\N	f	f
12de39be-dc61-4f65-8d13-d409169cf0d5	preinscriptions	31dc10c6-fa26-4ab1-8a4f-9f0aa0aaec5a/31dc10c6-fa26-4ab1-8a4f-9f0aa0aaec5a_acte_1782659589473.jpeg	\N	2026-06-28 15:13:11.17642+00	2026-06-28 15:13:11.17642+00	2026-06-28 15:13:11.17642+00	{"eTag": "\\"3b7ba4e67b45ac22b5cc687cda2ff39c\\"", "size": 104543, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T15:13:12.000Z", "contentLength": 104543, "httpStatusCode": 200}	66ef171c-3733-49d1-8946-2617c0969b70	\N	{}	\N	f	f
8e206b98-1764-4705-b49f-eb0735242361	preinscriptions	766bd5af-91de-4f2d-824f-b09dc0950d4e/766bd5af-91de-4f2d-824f-b09dc0950d4e_photo_1781924485332.jpg	\N	2026-06-20 03:01:26.991564+00	2026-06-20 03:01:26.991564+00	2026-06-20 03:01:26.991564+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-20T03:01:27.000Z", "contentLength": 414566, "httpStatusCode": 200}	52334f88-1552-459a-a84e-69f79f7a0bb4	\N	{}	\N	f	f
f0c4dd11-3a67-44ef-864e-cbfbfa13c2b3	preinscriptions	273a9505-f9af-4bb7-8dc0-5c29426dae0a/273a9505-f9af-4bb7-8dc0-5c29426dae0a_acte_1782399626004.jpeg	\N	2026-06-25 15:00:29.54596+00	2026-06-25 15:00:29.54596+00	2026-06-25 15:00:29.54596+00	{"eTag": "\\"afc3ada8c5164210a2e31d3729733085\\"", "size": 104345, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T15:00:30.000Z", "contentLength": 104345, "httpStatusCode": 200}	05c3b4f5-b00b-485d-91ca-4dfeca27e168	\N	{}	\N	f	f
931c9f2c-da56-4389-b6fc-64e0cd657b8c	preinscriptions	c987bf84-3214-472f-b7b1-ab08af993dee/c987bf84-3214-472f-b7b1-ab08af993dee_acte_1781943543521.jpg	\N	2026-06-20 08:19:06.615537+00	2026-06-20 08:19:06.615537+00	2026-06-20 08:19:06.615537+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-20T08:19:07.000Z", "contentLength": 414566, "httpStatusCode": 200}	7f1e637c-85a8-4d39-861e-12f2b682dbf8	\N	{}	\N	f	f
4f92236d-9861-442d-a753-dd41462d3b73	preinscriptions	c987bf84-3214-472f-b7b1-ab08af993dee/c987bf84-3214-472f-b7b1-ab08af993dee_photo_1781943545253.jpg	\N	2026-06-20 08:19:07.382477+00	2026-06-20 08:19:07.382477+00	2026-06-20 08:19:07.382477+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-20T08:19:08.000Z", "contentLength": 414566, "httpStatusCode": 200}	543eed06-667d-4876-af90-a76f91852020	\N	{}	\N	f	f
6228c638-4e02-4084-b9ea-d5c662587497	preinscriptions	273a9505-f9af-4bb7-8dc0-5c29426dae0a/273a9505-f9af-4bb7-8dc0-5c29426dae0a_photo_1782399628810.jpg	\N	2026-06-25 15:00:31.504806+00	2026-06-25 15:00:31.504806+00	2026-06-25 15:00:31.504806+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T15:00:32.000Z", "contentLength": 414566, "httpStatusCode": 200}	4f66d4b3-4918-40dc-814a-141032bd4ac6	\N	{}	\N	f	f
48238b8c-89ea-4b19-91dc-1a6829176cc4	preinscriptions	c987bf84-3214-472f-b7b1-ab08af993dee/c987bf84-3214-472f-b7b1-ab08af993dee_acte_1781943715874.jpg	\N	2026-06-20 08:21:59.186968+00	2026-06-20 08:21:59.186968+00	2026-06-20 08:21:59.186968+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-20T08:22:00.000Z", "contentLength": 414566, "httpStatusCode": 200}	b34d943d-560e-4231-b505-0cdd2417f7f0	\N	{}	\N	f	f
aadf71f6-f0aa-4226-b8e0-fa6197fa322e	preinscriptions	c987bf84-3214-472f-b7b1-ab08af993dee/c987bf84-3214-472f-b7b1-ab08af993dee_photo_1781943717803.jpg	\N	2026-06-20 08:21:59.800497+00	2026-06-20 08:21:59.800497+00	2026-06-20 08:21:59.800497+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-20T08:22:00.000Z", "contentLength": 414566, "httpStatusCode": 200}	3a2842e5-5b82-4bb6-83b4-d131ad03e495	\N	{}	\N	f	f
a0f6fa6a-8ca0-471d-bea5-4f9b30338945	preinscriptions	7c2ff1bb-6419-46ac-9058-3b9267eeecbb/7c2ff1bb-6419-46ac-9058-3b9267eeecbb_acte_1782077732900.jpg	\N	2026-06-21 21:35:34.783165+00	2026-06-21 21:35:34.783165+00	2026-06-21 21:35:34.783165+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-21T21:35:35.000Z", "contentLength": 414566, "httpStatusCode": 200}	b5c3f267-65d3-42d4-8bf0-910ceaec66bd	\N	{}	\N	f	f
521e26bf-cc58-4816-8ac2-a8eb3a6a32bc	preinscriptions	7c2ff1bb-6419-46ac-9058-3b9267eeecbb/7c2ff1bb-6419-46ac-9058-3b9267eeecbb_photo_1782077734859.jpg	\N	2026-06-21 21:35:35.669817+00	2026-06-21 21:35:35.669817+00	2026-06-21 21:35:35.669817+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-21T21:35:36.000Z", "contentLength": 414566, "httpStatusCode": 200}	8272d508-d75b-43dd-9762-17b02bfa04cd	\N	{}	\N	f	f
161ed3da-d146-4f2b-98cb-75fb3065b9da	preinscriptions	dfcc2af1-e96e-425b-bd59-86be3ae31942/dfcc2af1-e96e-425b-bd59-86be3ae31942_acte_1782399710084.jpg	\N	2026-06-25 15:01:53.950105+00	2026-06-25 15:01:53.950105+00	2026-06-25 15:01:53.950105+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T15:01:54.000Z", "contentLength": 414566, "httpStatusCode": 200}	19f823e6-0eba-4afd-b545-b694995121f6	\N	{}	\N	f	f
f9f28fd2-0aec-4342-b46b-847f78d9b02d	preinscriptions	76d51a03-9b5b-4877-86f5-d51f9f7a3482/76d51a03-9b5b-4877-86f5-d51f9f7a3482_acte_1782124714615.png	\N	2026-06-22 10:38:38.003597+00	2026-06-22 10:38:38.003597+00	2026-06-22 10:38:38.003597+00	{"eTag": "\\"f0b8df8a2a802f6674803b5a0633778e\\"", "size": 509674, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-22T10:38:38.000Z", "contentLength": 509674, "httpStatusCode": 200}	0aed1daa-dee2-4979-879c-a93a15082e16	\N	{}	\N	f	f
c6928384-f7c7-4b7f-a13f-a2856e95ddd4	preinscriptions	31dc10c6-fa26-4ab1-8a4f-9f0aa0aaec5a/31dc10c6-fa26-4ab1-8a4f-9f0aa0aaec5a_photo_1782659589810.jpeg	\N	2026-06-28 15:13:11.577975+00	2026-06-28 15:13:11.577975+00	2026-06-28 15:13:11.577975+00	{"eTag": "\\"3b7ba4e67b45ac22b5cc687cda2ff39c\\"", "size": 104543, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T15:13:12.000Z", "contentLength": 104543, "httpStatusCode": 200}	4a4e9d53-cd54-4d30-bf65-c39042a9170e	\N	{}	\N	f	f
5fc42ba1-5825-401f-83e8-70963f08ab0e	preinscriptions	76d51a03-9b5b-4877-86f5-d51f9f7a3482/76d51a03-9b5b-4877-86f5-d51f9f7a3482_photo_1782124717885.png	\N	2026-06-22 10:38:39.494395+00	2026-06-22 10:38:39.494395+00	2026-06-22 10:38:39.494395+00	{"eTag": "\\"f0b8df8a2a802f6674803b5a0633778e\\"", "size": 509674, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-22T10:38:40.000Z", "contentLength": 509674, "httpStatusCode": 200}	955ca70e-b268-41d2-9a46-18f1492a452d	\N	{}	\N	f	f
74daf75d-4982-4e80-8107-4bbd600775fa	preinscriptions	dfcc2af1-e96e-425b-bd59-86be3ae31942/dfcc2af1-e96e-425b-bd59-86be3ae31942_photo_1782399713121.jpg	\N	2026-06-25 15:01:54.688441+00	2026-06-25 15:01:54.688441+00	2026-06-25 15:01:54.688441+00	{"eTag": "\\"a9e25a5017d3193f6b8e84506d304ebf\\"", "size": 105874, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T15:01:55.000Z", "contentLength": 105874, "httpStatusCode": 200}	a8211d6c-348d-44ca-9b46-fd10760cc3f9	\N	{}	\N	f	f
b3cc9c6b-4b74-4140-aa12-c55db7db9e8d	preinscriptions	f19e8168-f4bb-4601-ae33-0b45c2c2686c/f19e8168-f4bb-4601-ae33-0b45c2c2686c_acte_1782131671209.jpg	\N	2026-06-22 12:34:33.474255+00	2026-06-22 12:34:33.474255+00	2026-06-22 12:34:33.474255+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-22T12:34:34.000Z", "contentLength": 414566, "httpStatusCode": 200}	ab5a4900-ebb9-43e6-8083-7c1b763c5b8f	\N	{}	\N	f	f
e1a44294-5c07-40f0-9e94-aa3aa41ea327	preinscriptions	b2c40a87-59a8-4e1e-ba51-3a1bde41a8cd/b2c40a87-59a8-4e1e-ba51-3a1bde41a8cd_acte_1783773252030.png	\N	2026-07-11 12:34:13.128787+00	2026-07-11 12:34:13.128787+00	2026-07-11 12:34:13.128787+00	{"eTag": "\\"0175edf869ac80cff7b9775dbf3fb44f\\"", "size": 880465, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-07-11T12:34:14.000Z", "contentLength": 880465, "httpStatusCode": 200}	4e422f04-93e5-42c4-bc92-8782bc90fa75	\N	{}	\N	f	f
591fdc22-8850-4bf6-bfee-718366150b74	preinscriptions	f19e8168-f4bb-4601-ae33-0b45c2c2686c/f19e8168-f4bb-4601-ae33-0b45c2c2686c_photo_1782131673235.jpg	\N	2026-06-22 12:34:34.985405+00	2026-06-22 12:34:34.985405+00	2026-06-22 12:34:34.985405+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-22T12:34:35.000Z", "contentLength": 414566, "httpStatusCode": 200}	94cd99f4-f508-42e3-874a-5821594bd00d	\N	{}	\N	f	f
2127cb98-903e-4ac5-a906-37df206265a7	preinscriptions	28ed72de-5245-455b-a64f-3278924c32a6/28ed72de-5245-455b-a64f-3278924c32a6_acte_1782400420345.jpg	\N	2026-06-25 15:13:43.420615+00	2026-06-25 15:13:43.420615+00	2026-06-25 15:13:43.420615+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T15:13:44.000Z", "contentLength": 414566, "httpStatusCode": 200}	95ce13e9-8f2d-4d57-b7ee-91e321f51b04	\N	{}	\N	f	f
a6e50f46-3d5c-435a-8c06-2e3db6778114	preinscriptions	b94f4884-4a3f-4d0d-9350-6d25602d7761/b94f4884-4a3f-4d0d-9350-6d25602d7761_acte_1782208551226.jpg	\N	2026-06-23 09:55:56.857563+00	2026-06-23 09:55:56.857563+00	2026-06-23 09:55:56.857563+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-23T09:55:57.000Z", "contentLength": 414566, "httpStatusCode": 200}	52a57337-3a1d-41d3-90d3-b0ad42cb2d0e	\N	{}	\N	f	f
c4b1a214-e70a-4e10-81e0-2d0898995d31	preinscriptions	b94f4884-4a3f-4d0d-9350-6d25602d7761/b94f4884-4a3f-4d0d-9350-6d25602d7761_photo_1782208555867.jpg	\N	2026-06-23 09:55:59.480539+00	2026-06-23 09:55:59.480539+00	2026-06-23 09:55:59.480539+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-23T09:56:00.000Z", "contentLength": 414566, "httpStatusCode": 200}	50ff0e90-01fb-4074-bed8-80113f85dfd6	\N	{}	\N	f	f
351cf7c4-be12-46c0-bce9-3d233b8836ac	preinscriptions	fec2d60e-e585-45ce-afb0-8e8015b00329/fec2d60e-e585-45ce-afb0-8e8015b00329_acte_1782208881212.jpg	\N	2026-06-23 10:01:24.951499+00	2026-06-23 10:01:24.951499+00	2026-06-23 10:01:24.951499+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-23T10:01:25.000Z", "contentLength": 414566, "httpStatusCode": 200}	1799defa-a768-4883-949a-98b1bca3a42c	\N	{}	\N	f	f
defde915-4aa6-4620-9c57-b325e131513b	preinscriptions	fec2d60e-e585-45ce-afb0-8e8015b00329/fec2d60e-e585-45ce-afb0-8e8015b00329_photo_1782208884129.jpg	\N	2026-06-23 10:01:26.940534+00	2026-06-23 10:01:26.940534+00	2026-06-23 10:01:26.940534+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-23T10:01:27.000Z", "contentLength": 414566, "httpStatusCode": 200}	eb6e7ee0-79e9-488f-8173-66e7f4224d9a	\N	{}	\N	f	f
076bf30d-cee7-4b80-8189-2cb420fa2eb8	preinscriptions	28ed72de-5245-455b-a64f-3278924c32a6/28ed72de-5245-455b-a64f-3278924c32a6_photo_1782400422412.jpg	\N	2026-06-25 15:13:43.971493+00	2026-06-25 15:13:43.971493+00	2026-06-25 15:13:43.971493+00	{"eTag": "\\"4a2aebf7e802f88e20b4bf7a16a3f78e\\"", "size": 110734, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T15:13:44.000Z", "contentLength": 110734, "httpStatusCode": 200}	bf5524e4-614f-43bd-a7ac-cb6df628473d	\N	{}	\N	f	f
98b35c0f-df8b-4aee-93f2-db53a424ca19	preinscriptions	f031e93a-8ab3-4de8-b9c4-82dc3fbb98df/f031e93a-8ab3-4de8-b9c4-82dc3fbb98df_acte_1782210393418.jpg	\N	2026-06-23 10:26:36.449767+00	2026-06-23 10:26:36.449767+00	2026-06-23 10:26:36.449767+00	{"eTag": "\\"a9e25a5017d3193f6b8e84506d304ebf\\"", "size": 105874, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-23T10:26:37.000Z", "contentLength": 105874, "httpStatusCode": 200}	decc90a0-dfc2-49d2-b5d5-1e08cdd3cee9	\N	{}	\N	f	f
74bfa5a9-60be-4df1-b501-f517afff195f	preinscriptions	869bbe00-5fb1-43a6-827e-d8197b37175e/869bbe00-5fb1-43a6-827e-d8197b37175e_photo_1787492726847.jpg	\N	2026-08-23 13:45:27.014177+00	2026-08-23 13:45:27.014177+00	2026-08-23 13:45:27.014177+00	{"eTag": "\\"51a2f5941b67393ad2aa1f7727f4598d\\"", "size": 21249, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-08-23T13:45:27.000Z", "contentLength": 21249, "httpStatusCode": 200}	4f13ab11-34de-4223-92fb-a77cf6955402	\N	{}	\N	f	f
3ea62552-3480-432c-8465-4efa97afa42a	preinscriptions	f031e93a-8ab3-4de8-b9c4-82dc3fbb98df/f031e93a-8ab3-4de8-b9c4-82dc3fbb98df_photo_1782210395484.jpg	\N	2026-06-23 10:26:37.855974+00	2026-06-23 10:26:37.855974+00	2026-06-23 10:26:37.855974+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-23T10:26:38.000Z", "contentLength": 414566, "httpStatusCode": 200}	2304584a-36fb-438f-823c-ec0d14a5d887	\N	{}	\N	f	f
14a68187-f5b7-48de-bb72-32ac966be084	preinscriptions	b5d7fef4-8317-4f80-bb96-112466ecf528/b5d7fef4-8317-4f80-bb96-112466ecf528_acte_1782400595980.jpeg	\N	2026-06-25 15:16:38.712955+00	2026-06-25 15:16:38.712955+00	2026-06-25 15:16:38.712955+00	{"eTag": "\\"afc3ada8c5164210a2e31d3729733085\\"", "size": 104345, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T15:16:39.000Z", "contentLength": 104345, "httpStatusCode": 200}	f10d9b83-317e-4ba5-8348-1af4f38b262f	\N	{}	\N	f	f
22efc647-8881-4abc-bbdb-28e86b2faf66	preinscriptions	1640854c-2d8c-46ec-84a3-4a41ff638f03/1640854c-2d8c-46ec-84a3-4a41ff638f03_acte_1782219676242.jpg	\N	2026-06-23 13:01:19.441491+00	2026-06-23 13:01:19.441491+00	2026-06-23 13:01:19.441491+00	{"eTag": "\\"a9e25a5017d3193f6b8e84506d304ebf\\"", "size": 105874, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-23T13:01:20.000Z", "contentLength": 105874, "httpStatusCode": 200}	c87e17f3-a4c3-4054-811e-baa50ff0e62c	\N	{}	\N	f	f
bafe9817-7e80-4fb9-b3df-a0d3c62e17b3	preinscriptions	1640854c-2d8c-46ec-84a3-4a41ff638f03/1640854c-2d8c-46ec-84a3-4a41ff638f03_photo_1782219680190.jpg	\N	2026-06-23 13:01:21.711158+00	2026-06-23 13:01:21.711158+00	2026-06-23 13:01:21.711158+00	{"eTag": "\\"a9e25a5017d3193f6b8e84506d304ebf\\"", "size": 105874, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-23T13:01:22.000Z", "contentLength": 105874, "httpStatusCode": 200}	dacf8ca0-2fa1-4841-b499-2ac90d105cdd	\N	{}	\N	f	f
cfda60ee-2c3b-4faf-abaf-ca6c2f190ade	preinscriptions	b5d7fef4-8317-4f80-bb96-112466ecf528/b5d7fef4-8317-4f80-bb96-112466ecf528_photo_1782400597712.png	\N	2026-06-25 15:16:39.117359+00	2026-06-25 15:16:39.117359+00	2026-06-25 15:16:39.117359+00	{"eTag": "\\"4f190178f9025efedbe9f5c2c51b8070\\"", "size": 10582, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T15:16:40.000Z", "contentLength": 10582, "httpStatusCode": 200}	ae2f24e5-97bd-4d94-a1f2-3fd37e79d829	\N	{}	\N	f	f
016305f0-afca-4d26-8409-723d1d498b81	preinscriptions	11a355a4-c3f1-4043-8460-c7b8ec63ab53/11a355a4-c3f1-4043-8460-c7b8ec63ab53_acte_1782220886523.jpg	\N	2026-06-23 13:21:30.914803+00	2026-06-23 13:21:30.914803+00	2026-06-23 13:21:30.914803+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-23T13:21:31.000Z", "contentLength": 414566, "httpStatusCode": 200}	c99854e6-616a-4f77-a595-f830f09da795	\N	{}	\N	f	f
16cd93b2-6fab-45fb-90fd-386feb14a028	preinscriptions	34322304-6d08-4a93-8497-87477bf186e5/34322304-6d08-4a93-8497-87477bf186e5_acte_1782404737924.jpg	\N	2026-06-25 16:25:41.889457+00	2026-06-25 16:25:41.889457+00	2026-06-25 16:25:41.889457+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T16:25:42.000Z", "contentLength": 414566, "httpStatusCode": 200}	4f76bd5e-f6f2-4727-82f5-2d4cb433f3cc	\N	{}	\N	f	f
1819341c-2d5b-48aa-82d7-d52a6f489624	preinscriptions	11a355a4-c3f1-4043-8460-c7b8ec63ab53/11a355a4-c3f1-4043-8460-c7b8ec63ab53_photo_1782220889962.jpg	\N	2026-06-23 13:21:33.007207+00	2026-06-23 13:21:33.007207+00	2026-06-23 13:21:33.007207+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-23T13:21:33.000Z", "contentLength": 414566, "httpStatusCode": 200}	bdef701f-279e-4b62-943d-55c88588f25a	\N	{}	\N	f	f
1a68c328-6a42-45b5-a612-57b54d9bfe08	preinscriptions	87ffe44e-0367-4827-a85b-02cd40fce118/87ffe44e-0367-4827-a85b-02cd40fce118_acte_1782221917513.jpg	\N	2026-06-23 13:38:40.716065+00	2026-06-23 13:38:40.716065+00	2026-06-23 13:38:40.716065+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-23T13:38:41.000Z", "contentLength": 414566, "httpStatusCode": 200}	321c2408-49d2-4d6f-a872-ad4f1266cceb	\N	{}	\N	f	f
da6926ab-bd9a-4ad4-9a47-3af45e0471dc	preinscriptions	87ffe44e-0367-4827-a85b-02cd40fce118/87ffe44e-0367-4827-a85b-02cd40fce118_photo_1782221919721.jpg	\N	2026-06-23 13:38:42.31931+00	2026-06-23 13:38:42.31931+00	2026-06-23 13:38:42.31931+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-23T13:38:43.000Z", "contentLength": 414566, "httpStatusCode": 200}	29d227dd-4a79-479a-9545-d2964f407db7	\N	{}	\N	f	f
1b4db58a-30b8-4e6f-a468-26b9f3b9f2cd	preinscriptions	17f42397-2ba3-472d-b605-9694d92ce7f8/17f42397-2ba3-472d-b605-9694d92ce7f8_acte_1782662369850.jpeg	\N	2026-06-28 15:59:32.924231+00	2026-06-28 15:59:32.924231+00	2026-06-28 15:59:32.924231+00	{"eTag": "\\"3b7ba4e67b45ac22b5cc687cda2ff39c\\"", "size": 104543, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T15:59:33.000Z", "contentLength": 104543, "httpStatusCode": 200}	e87fd657-e7af-4f87-81d6-96c962f2a93a	\N	{}	\N	f	f
3f996300-fc62-4717-89c8-bdadbfe820f2	preinscriptions	f31e64c2-936b-4c69-b663-11d6124bf18c/f31e64c2-936b-4c69-b663-11d6124bf18c_acte_1782223212033.jpg	\N	2026-06-23 14:00:15.894187+00	2026-06-23 14:00:15.894187+00	2026-06-23 14:00:15.894187+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-23T14:00:16.000Z", "contentLength": 414566, "httpStatusCode": 200}	cf7e69d4-175e-4be9-8dda-45c24e0910f4	\N	{}	\N	f	f
a72eb0f9-6eb4-4cb2-9d26-327f24df6304	preinscriptions	65dcb64c-9e27-476f-a6b2-d7dddee372bd/65dcb64c-9e27-476f-a6b2-d7dddee372bd_acte_1782401579121.jpeg	\N	2026-06-25 15:33:01.888103+00	2026-06-25 15:33:01.888103+00	2026-06-25 15:33:01.888103+00	{"eTag": "\\"afc3ada8c5164210a2e31d3729733085\\"", "size": 104345, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T15:33:02.000Z", "contentLength": 104345, "httpStatusCode": 200}	644829cd-048f-4156-8af8-6e8f3f3fbab3	\N	{}	\N	f	f
a26a32b2-20ba-4152-9224-045c32b3976b	preinscriptions	f31e64c2-936b-4c69-b663-11d6124bf18c/f31e64c2-936b-4c69-b663-11d6124bf18c_photo_1782223214999.jpg	\N	2026-06-23 14:00:17.733096+00	2026-06-23 14:00:17.733096+00	2026-06-23 14:00:17.733096+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-23T14:00:18.000Z", "contentLength": 414566, "httpStatusCode": 200}	5ac11b94-ab98-432d-88cb-cecd17883d77	\N	{}	\N	f	f
babe320f-5297-4a3d-8b44-5854c93f2e68	preinscriptions	65dcb64c-9e27-476f-a6b2-d7dddee372bd/65dcb64c-9e27-476f-a6b2-d7dddee372bd_photo_1782401580913.JPG	\N	2026-06-25 15:33:03.367244+00	2026-06-25 15:33:03.367244+00	2026-06-25 15:33:03.367244+00	{"eTag": "\\"d029bfd362567eb8e1714d2da82f4634\\"", "size": 20246, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T15:33:04.000Z", "contentLength": 20246, "httpStatusCode": 200}	c7c7e753-0972-4081-bd61-47366f2bc16a	\N	{}	\N	f	f
93ad3668-526c-411c-b70b-9dcef496db6f	preinscriptions	17f42397-2ba3-472d-b605-9694d92ce7f8/17f42397-2ba3-472d-b605-9694d92ce7f8_photo_1782662371594.jpeg	\N	2026-06-28 15:59:33.351129+00	2026-06-28 15:59:33.351129+00	2026-06-28 15:59:33.351129+00	{"eTag": "\\"3b7ba4e67b45ac22b5cc687cda2ff39c\\"", "size": 104543, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T15:59:34.000Z", "contentLength": 104543, "httpStatusCode": 200}	c9a2bf2a-68fd-41c9-8a1d-18b1c7d3e0af	\N	{}	\N	f	f
e4b9e42d-88e7-487d-96aa-c523221b5003	preinscriptions	389df535-6d8f-4bc6-9447-eaaed711b0f6/389df535-6d8f-4bc6-9447-eaaed711b0f6_acte_1782401797258.jpg	\N	2026-06-25 15:36:40.748202+00	2026-06-25 15:36:40.748202+00	2026-06-25 15:36:40.748202+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T15:36:41.000Z", "contentLength": 414566, "httpStatusCode": 200}	e30d3d98-8eb7-4836-9c41-3c415664b992	\N	{}	\N	f	f
5cda937f-029f-4773-b254-c2061fd3d94a	preinscriptions	b2c40a87-59a8-4e1e-ba51-3a1bde41a8cd/b2c40a87-59a8-4e1e-ba51-3a1bde41a8cd_photo_1783773259118.png	\N	2026-07-11 12:34:19.413556+00	2026-07-11 12:34:19.413556+00	2026-07-11 12:34:19.413556+00	{"eTag": "\\"6fc087cd79ef40992f2c2abcf8e4075b\\"", "size": 828452, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-07-11T12:34:20.000Z", "contentLength": 828452, "httpStatusCode": 200}	351f8cd5-3ce8-48e2-aa4a-5ca744c37960	\N	{}	\N	f	f
9bab2fb6-717d-4881-9e9e-ce115f57e7db	preinscriptions	389df535-6d8f-4bc6-9447-eaaed711b0f6/389df535-6d8f-4bc6-9447-eaaed711b0f6_photo_1782401799756.png	\N	2026-06-25 15:36:42.733068+00	2026-06-25 15:36:42.733068+00	2026-06-25 15:36:42.733068+00	{"eTag": "\\"f0b8df8a2a802f6674803b5a0633778e\\"", "size": 509674, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T15:36:43.000Z", "contentLength": 509674, "httpStatusCode": 200}	4c8fb38e-037c-4904-9896-69c2207985dd	\N	{}	\N	f	f
857ff991-2d3c-4a46-9415-0c970ed931ec	preinscriptions	389df535-6d8f-4bc6-9447-eaaed711b0f6/389df535-6d8f-4bc6-9447-eaaed711b0f6_bulletin_1782401801763.pdf	\N	2026-06-25 15:36:52.757401+00	2026-06-25 15:36:52.757401+00	2026-06-25 15:36:52.757401+00	{"eTag": "\\"793b027b0dc3249cdc1faa44083e6397\\"", "size": 1419276, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T15:36:53.000Z", "contentLength": 1419276, "httpStatusCode": 200}	9e94fcd3-f143-4025-a1fc-9ea402da44a9	\N	{}	\N	f	f
141b3252-1e18-45be-8a2b-2f9a43a43607	preinscriptions	b2c40a87-59a8-4e1e-ba51-3a1bde41a8cd/b2c40a87-59a8-4e1e-ba51-3a1bde41a8cd_acte_1783773409072.png	\N	2026-07-11 12:36:50.070391+00	2026-07-11 12:36:50.070391+00	2026-07-11 12:36:50.070391+00	{"eTag": "\\"0175edf869ac80cff7b9775dbf3fb44f\\"", "size": 880465, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-07-11T12:36:51.000Z", "contentLength": 880465, "httpStatusCode": 200}	55a197e6-da89-4965-8113-cebe0b61047f	\N	{}	\N	f	f
668dc7bd-0f4d-4920-a409-e76069f0e06f	preinscriptions	34322304-6d08-4a93-8497-87477bf186e5/34322304-6d08-4a93-8497-87477bf186e5_photo_1782404740923.jpg	\N	2026-06-25 16:25:43.437416+00	2026-06-25 16:25:43.437416+00	2026-06-25 16:25:43.437416+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T16:25:44.000Z", "contentLength": 414566, "httpStatusCode": 200}	9449cf2b-3e98-42bd-9b0f-69a7792000e6	\N	{}	\N	f	f
94fee4cb-f94c-4ef2-9bc6-0a57d878ca0c	preinscriptions	9d0c09d9-36f5-4feb-bb5a-1af511b84c39/9d0c09d9-36f5-4feb-bb5a-1af511b84c39_photo_1782405691201.jpeg	\N	2026-06-25 16:41:32.994961+00	2026-06-25 16:41:32.994961+00	2026-06-25 16:41:32.994961+00	{"eTag": "\\"e266bb14220d66fbeaa4644dda2a2afa\\"", "size": 169898, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T16:41:33.000Z", "contentLength": 169898, "httpStatusCode": 200}	359dcd9c-8a41-4b06-8a6f-d9db36743cb8	\N	{}	\N	f	f
d28e4741-4477-4540-ad6e-18dcc4575b89	preinscriptions	342f5796-8656-464d-a3d4-b75819b57639/342f5796-8656-464d-a3d4-b75819b57639_photo_1787492726684.png	\N	2026-08-23 13:45:27.014786+00	2026-08-23 13:45:27.014786+00	2026-08-23 13:45:27.014786+00	{"eTag": "\\"5284b4bb449e83f6fb6e31b681f76671\\"", "size": 13274, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-08-23T13:45:27.000Z", "contentLength": 13274, "httpStatusCode": 200}	54548673-dffd-4e45-9732-28ece259a504	\N	{}	\N	f	f
a8882cbe-6cc7-4f83-94bd-861f88d82c61	preinscriptions	9d0c09d9-36f5-4feb-bb5a-1af511b84c39/9d0c09d9-36f5-4feb-bb5a-1af511b84c39_bulletin_1782405692171.pdf	\N	2026-06-25 16:41:44.588884+00	2026-06-25 16:41:44.588884+00	2026-06-25 16:41:44.588884+00	{"eTag": "\\"793b027b0dc3249cdc1faa44083e6397\\"", "size": 1419276, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T16:41:45.000Z", "contentLength": 1419276, "httpStatusCode": 200}	ab4e89d7-6724-43a8-8426-f70b7aab8d8b	\N	{}	\N	f	f
b924e489-0e86-499f-94ef-b3c398ffebd3	preinscriptions	48f04329-5901-4045-86b1-c007a67a9471/48f04329-5901-4045-86b1-c007a67a9471_acte_1782663331589.png	\N	2026-06-28 16:15:35.757623+00	2026-06-28 16:15:35.757623+00	2026-06-28 16:15:35.757623+00	{"eTag": "\\"19fc0acb0ef5b22de10152dccde68b0f\\"", "size": 1818598, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T16:15:36.000Z", "contentLength": 1818598, "httpStatusCode": 200}	ad805d0f-974f-47c1-b3fa-bedf789221e5	\N	{}	\N	f	f
5e96d7da-7892-4753-91db-740a966d944d	preinscriptions	48f04329-5901-4045-86b1-c007a67a9471/48f04329-5901-4045-86b1-c007a67a9471_photo_1782663334464.jpeg	\N	2026-06-28 16:15:36.23553+00	2026-06-28 16:15:36.23553+00	2026-06-28 16:15:36.23553+00	{"eTag": "\\"3b7ba4e67b45ac22b5cc687cda2ff39c\\"", "size": 104543, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T16:15:37.000Z", "contentLength": 104543, "httpStatusCode": 200}	74f108fa-5081-4d41-870e-75235c275c13	\N	{}	\N	f	f
5018ca7d-3a06-448c-9507-4ae8a3acf96c	preinscriptions	1f20be6d-6446-4396-a097-c0c2d8b3272a/1f20be6d-6446-4396-a097-c0c2d8b3272a_photo_1787492726804.jpg	\N	2026-08-23 13:45:27.192195+00	2026-08-23 13:45:27.192195+00	2026-08-23 13:45:27.192195+00	{"eTag": "\\"51a2f5941b67393ad2aa1f7727f4598d\\"", "size": 21249, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-08-23T13:45:28.000Z", "contentLength": 21249, "httpStatusCode": 200}	1a65712f-468e-442a-879e-6c7948b46265	\N	{}	\N	f	f
b0547a8e-6818-47b0-b7a8-7a44812b57c6	preinscriptions	8d98a1d9-a1b9-4f96-b82a-2b9c3a7eb09f/8d98a1d9-a1b9-4f96-b82a-2b9c3a7eb09f_acte_1782663749028.png	\N	2026-06-28 16:22:33.391742+00	2026-06-28 16:22:33.391742+00	2026-06-28 16:22:33.391742+00	{"eTag": "\\"19fc0acb0ef5b22de10152dccde68b0f\\"", "size": 1818598, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T16:22:34.000Z", "contentLength": 1818598, "httpStatusCode": 200}	79412c9d-f168-40d3-b3cc-6c58ff30562e	\N	{}	\N	f	f
e3918234-fb7a-4ade-94fe-91d47d0838e3	preinscriptions	8d98a1d9-a1b9-4f96-b82a-2b9c3a7eb09f/8d98a1d9-a1b9-4f96-b82a-2b9c3a7eb09f_photo_1782663752089.png	\N	2026-06-28 16:22:36.045475+00	2026-06-28 16:22:36.045475+00	2026-06-28 16:22:36.045475+00	{"eTag": "\\"19fc0acb0ef5b22de10152dccde68b0f\\"", "size": 1818598, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T16:22:36.000Z", "contentLength": 1818598, "httpStatusCode": 200}	822928d8-f0e5-4471-b55f-628a134f60c9	\N	{}	\N	f	f
1c4f6182-3578-43b9-9461-5d9f40eff962	preinscriptions	e12df60e-1d76-4a72-8eb1-4fbb3c7097df/e12df60e-1d76-4a72-8eb1-4fbb3c7097df_photo_1787492727834.jpg	\N	2026-08-23 13:45:28.228342+00	2026-08-23 13:45:28.228342+00	2026-08-23 13:45:28.228342+00	{"eTag": "\\"ba3e76a625937b691dd1dfcb639b06e2\\"", "size": 29823, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-08-23T13:45:29.000Z", "contentLength": 29823, "httpStatusCode": 200}	c0e9e632-da24-49b3-a46a-6fa6348990ec	\N	{}	\N	f	f
0501570a-0977-4fa6-ad04-e5c0384e822d	preinscriptions	b2c40a87-59a8-4e1e-ba51-3a1bde41a8cd/b2c40a87-59a8-4e1e-ba51-3a1bde41a8cd_photo_1783773414247.png	\N	2026-07-11 12:36:54.524802+00	2026-07-11 12:36:54.524802+00	2026-07-11 12:36:54.524802+00	{"eTag": "\\"6fc087cd79ef40992f2c2abcf8e4075b\\"", "size": 828452, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-07-11T12:36:55.000Z", "contentLength": 828452, "httpStatusCode": 200}	158311a8-1da2-44d5-83a4-8a82b83fde09	\N	{}	\N	f	f
4d012782-5c9a-452a-89a4-87a66742873f	preinscriptions	6ded3244-1d5c-4fbe-a28a-af5bfa27df77/6ded3244-1d5c-4fbe-a28a-af5bfa27df77_acte_1783876840395.jpg	\N	2026-07-12 17:20:43.552605+00	2026-07-12 17:20:43.552605+00	2026-07-12 17:20:43.552605+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-07-12T17:20:44.000Z", "contentLength": 414566, "httpStatusCode": 200}	266ab4f3-ec59-4f00-8cdb-34cebb5e69d5	\N	{}	\N	f	f
50bcf6ba-8e08-472d-a980-b328d7d37dae	preinscriptions	6ded3244-1d5c-4fbe-a28a-af5bfa27df77/6ded3244-1d5c-4fbe-a28a-af5bfa27df77_photo_1783876843916.jpg	\N	2026-07-12 17:20:44.70893+00	2026-07-12 17:20:44.70893+00	2026-07-12 17:20:44.70893+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-07-12T17:20:45.000Z", "contentLength": 414566, "httpStatusCode": 200}	ed639a16-fb94-4def-87cc-5999ffcd1363	\N	{}	\N	f	f
f5fb4f20-c1a6-4a5c-b444-760e1459124f	preinscriptions	72605f34-78b3-4133-b9de-4485ca472878/72605f34-78b3-4133-b9de-4485ca472878_acte_1782422657910.jpg	\N	2026-06-25 21:24:21.271831+00	2026-06-25 21:24:21.271831+00	2026-06-25 21:24:21.271831+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T21:24:22.000Z", "contentLength": 414566, "httpStatusCode": 200}	cb150387-ff05-4e0d-b0d6-6c21b402bd58	\N	{}	\N	f	f
a19e4e3f-c0ac-4185-b84d-373e144542b6	preinscriptions	17c0acfd-6fb6-4fb4-86fd-e1e17656bc10/17c0acfd-6fb6-4fb4-86fd-e1e17656bc10_photo_1787492726912.jpg	\N	2026-08-23 13:45:27.063345+00	2026-08-23 13:45:27.063345+00	2026-08-23 13:45:27.063345+00	{"eTag": "\\"51a2f5941b67393ad2aa1f7727f4598d\\"", "size": 21249, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-08-23T13:45:28.000Z", "contentLength": 21249, "httpStatusCode": 200}	c1377dbc-df11-422c-a847-e190e7cb0b88	\N	{}	\N	f	f
ec60c9b7-24b1-4ebc-b149-6af3c26a564e	preinscriptions	72605f34-78b3-4133-b9de-4485ca472878/72605f34-78b3-4133-b9de-4485ca472878_photo_1782422660121.png	\N	2026-06-25 21:24:21.800711+00	2026-06-25 21:24:21.800711+00	2026-06-25 21:24:21.800711+00	{"eTag": "\\"4f190178f9025efedbe9f5c2c51b8070\\"", "size": 10582, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-25T21:24:22.000Z", "contentLength": 10582, "httpStatusCode": 200}	19c38c6e-a668-4519-b764-8aa12c0a7c81	\N	{}	\N	f	f
2aa6718d-d31c-40bc-9f9e-3d7002528dae	preinscriptions	4d9b5a7f-b53a-49c1-85a1-37f8c11b09ed/4d9b5a7f-b53a-49c1-85a1-37f8c11b09ed_acte_1782664553422.jpeg	\N	2026-06-28 16:35:56.134756+00	2026-06-28 16:35:56.134756+00	2026-06-28 16:35:56.134756+00	{"eTag": "\\"3b7ba4e67b45ac22b5cc687cda2ff39c\\"", "size": 104543, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T16:35:57.000Z", "contentLength": 104543, "httpStatusCode": 200}	280fb0dd-65ca-4f4e-a550-40b5acfeb015	\N	{}	\N	f	f
c2fc8c1b-a534-43a2-b6b5-ba104f08e732	preinscriptions	4d9b5a7f-b53a-49c1-85a1-37f8c11b09ed/4d9b5a7f-b53a-49c1-85a1-37f8c11b09ed_photo_1782664555089.png	\N	2026-06-28 16:35:59.921674+00	2026-06-28 16:35:59.921674+00	2026-06-28 16:35:59.921674+00	{"eTag": "\\"6a410410e797829599d9e30b2540b171\\"", "size": 2662850, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T16:36:00.000Z", "contentLength": 2662850, "httpStatusCode": 200}	fa6f624a-d930-4326-8160-375de7047538	\N	{}	\N	f	f
ad015c3f-532b-4927-a7e1-d0a3d888ce99	preinscriptions	librairie/librairie_1783776236197_6015.jpg	\N	2026-07-11 13:23:56.786216+00	2026-07-11 13:23:56.786216+00	2026-07-11 13:23:56.786216+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-07-11T13:23:57.000Z", "contentLength": 414566, "httpStatusCode": 200}	20b52bb7-441f-46e9-a856-2091975eb9a6	\N	{}	\N	f	f
9b2e31d1-8cbc-4248-9adb-45f249287974	preinscriptions	98175953-8800-4578-a033-0e323602adb0/98175953-8800-4578-a033-0e323602adb0_acte_1783776532882.jpg	\N	2026-07-11 13:28:53.262687+00	2026-07-11 13:28:53.262687+00	2026-07-11 13:28:53.262687+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-07-11T13:28:54.000Z", "contentLength": 414566, "httpStatusCode": 200}	18655bb0-cda8-496f-b8d3-36519bb672a0	\N	{}	\N	f	f
c05bc924-5206-40f5-954c-c4b56cc4b1bd	preinscriptions	98175953-8800-4578-a033-0e323602adb0/98175953-8800-4578-a033-0e323602adb0_photo_1783776535727.jpg	\N	2026-07-11 13:28:56.453828+00	2026-07-11 13:28:56.453828+00	2026-07-11 13:28:56.453828+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-07-11T13:28:57.000Z", "contentLength": 414566, "httpStatusCode": 200}	042021ef-a945-4f7d-820c-8ea5bc162710	\N	{}	\N	f	f
9497598b-6312-49d8-8f42-78ea89ff6c38	preinscriptions	98175953-8800-4578-a033-0e323602adb0/98175953-8800-4578-a033-0e323602adb0_acte_1783776547918.jpg	\N	2026-07-11 13:29:08.192119+00	2026-07-11 13:29:08.192119+00	2026-07-11 13:29:08.192119+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-07-11T13:29:09.000Z", "contentLength": 414566, "httpStatusCode": 200}	dd31bdea-217d-4a10-bfde-a34776e0ce06	\N	{}	\N	f	f
113bef92-1627-4ff3-9acb-55b2c2b0dfc5	preinscriptions	98175953-8800-4578-a033-0e323602adb0/98175953-8800-4578-a033-0e323602adb0_photo_1783776550478.jpg	\N	2026-07-11 13:29:10.733898+00	2026-07-11 13:29:10.733898+00	2026-07-11 13:29:10.733898+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-07-11T13:29:11.000Z", "contentLength": 414566, "httpStatusCode": 200}	1b937b67-6fb2-44e4-8d70-df591c45b1a4	\N	{}	\N	f	f
c869365e-6e6a-413e-924f-42fb8fa63934	preinscriptions	e9a130f9-aa90-48a8-961a-8f855c86efb9/e9a130f9-aa90-48a8-961a-8f855c86efb9_acte_1782471145316.jpeg	\N	2026-06-26 10:52:27.03293+00	2026-06-26 10:52:27.03293+00	2026-06-26 10:52:27.03293+00	{"eTag": "\\"afc3ada8c5164210a2e31d3729733085\\"", "size": 104345, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-26T10:52:27.000Z", "contentLength": 104345, "httpStatusCode": 200}	e710722a-5c95-4129-9536-0af8fa66d15a	\N	{}	\N	f	f
516621f7-c2d5-4de5-bb1f-fda564823457	preinscriptions	70a8132a-15db-42b2-b965-a2c9dc6bab62/70a8132a-15db-42b2-b965-a2c9dc6bab62_acte_1782471145367.jpg	\N	2026-06-26 10:52:28.110282+00	2026-06-26 10:52:28.110282+00	2026-06-26 10:52:28.110282+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-26T10:52:29.000Z", "contentLength": 414566, "httpStatusCode": 200}	060c2f04-06ac-4845-8b09-79a4f509b74f	\N	{}	\N	f	f
24b40e17-1167-427d-8b37-4632f0420f0e	preinscriptions	devoir/devoir_devoir_1783120866470.jpeg	\N	2026-07-03 23:21:09.842696+00	2026-07-03 23:21:09.842696+00	2026-07-03 23:21:09.842696+00	{"eTag": "\\"afc3ada8c5164210a2e31d3729733085\\"", "size": 104345, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-07-03T23:21:10.000Z", "contentLength": 104345, "httpStatusCode": 200}	7e51c4b4-c913-4cc2-a6e2-e0d0319ef747	\N	{}	\N	f	f
b18dca85-4fd0-435a-a745-969810a7f575	preinscriptions	3c7be2ea-ee6e-464d-a2dc-44d5ed4eca5b/3c7be2ea-ee6e-464d-a2dc-44d5ed4eca5b_bulletin_1787673669659.jpg	\N	2026-08-25 16:01:14.339184+00	2026-08-25 16:01:14.339184+00	2026-08-25 16:01:14.339184+00	{"eTag": "\\"5a52d07f03f40a4fe2b8a1def3b8a074\\"", "size": 2420458, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-08-25T16:01:15.000Z", "contentLength": 2420458, "httpStatusCode": 200}	a1d7d778-7494-4484-8439-8a5e79092186	\N	{}	\N	f	f
fa9b974c-9ed5-4660-949a-233ca291256b	preinscriptions	e9a130f9-aa90-48a8-961a-8f855c86efb9/e9a130f9-aa90-48a8-961a-8f855c86efb9_photo_1782471147196.jpg	\N	2026-06-26 10:52:31.596239+00	2026-06-26 10:52:31.596239+00	2026-06-26 10:52:31.596239+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-26T10:52:32.000Z", "contentLength": 414566, "httpStatusCode": 200}	9ef1c62d-017e-406f-9ab6-52fc649c20fc	\N	{}	\N	f	f
d627e811-9043-4a04-a392-fc85ca9169f5	preinscriptions	70a8132a-15db-42b2-b965-a2c9dc6bab62/70a8132a-15db-42b2-b965-a2c9dc6bab62_photo_1782471148449.jpg	\N	2026-06-26 10:52:31.618068+00	2026-06-26 10:52:31.618068+00	2026-06-26 10:52:31.618068+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-26T10:52:32.000Z", "contentLength": 414566, "httpStatusCode": 200}	5013844b-3374-471c-97de-60f8737d502a	\N	{}	\N	f	f
d9f13bc9-7863-4b71-b969-4afef4f9d094	preinscriptions	devoir/devoir_devoir_1783121129813.jpg	\N	2026-07-03 23:25:33.581268+00	2026-07-03 23:25:33.581268+00	2026-07-03 23:25:33.581268+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-07-03T23:25:34.000Z", "contentLength": 414566, "httpStatusCode": 200}	707e98d3-9332-4624-8d13-4b3a2d07ad96	\N	{}	\N	f	f
967fdfb7-6993-4b93-a187-f930a52efee3	preinscriptions	f5a91307-a093-4cf5-b3d9-b1cbd8cbcbb5/f5a91307-a093-4cf5-b3d9-b1cbd8cbcbb5_acte_1782484062283.png	\N	2026-06-26 14:27:55.376332+00	2026-06-26 14:27:55.376332+00	2026-06-26 14:27:55.376332+00	{"eTag": "\\"35c3e1a93f218a1840573d668ac974c7\\"", "size": 2178348, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-26T14:27:56.000Z", "contentLength": 2178348, "httpStatusCode": 200}	a8900ce6-3935-4a02-a07f-38fb0c636bb9	\N	{}	\N	f	f
413ed8e4-4782-4bd1-85a6-52fbd3adbbfa	preinscriptions	f5a91307-a093-4cf5-b3d9-b1cbd8cbcbb5/f5a91307-a093-4cf5-b3d9-b1cbd8cbcbb5_photo_1782484075540.jpg	\N	2026-06-26 14:27:58.166121+00	2026-06-26 14:27:58.166121+00	2026-06-26 14:27:58.166121+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-26T14:27:59.000Z", "contentLength": 414566, "httpStatusCode": 200}	390fa98b-f3a4-456b-b460-8861525b3597	\N	{}	\N	f	f
4ff9f86b-fc67-43e4-8676-e8823d2febe4	preinscriptions	devoir/devoir_devoir_1783121414615.jpg	\N	2026-07-03 23:30:18.525111+00	2026-07-03 23:30:18.525111+00	2026-07-03 23:30:18.525111+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-07-03T23:30:19.000Z", "contentLength": 414566, "httpStatusCode": 200}	12efb185-1d22-4807-a090-89275bbc04db	\N	{}	\N	f	f
698cadb9-0a0f-4003-b39d-bfe91bfc9444	preinscriptions	0d765b3b-3fda-4f5a-a2d3-0f7cdce737e9/0d765b3b-3fda-4f5a-a2d3-0f7cdce737e9_acte_1782484175629.png	\N	2026-06-26 14:29:50.163184+00	2026-06-26 14:29:50.163184+00	2026-06-26 14:29:50.163184+00	{"eTag": "\\"6a410410e797829599d9e30b2540b171\\"", "size": 2662850, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-26T14:29:51.000Z", "contentLength": 2662850, "httpStatusCode": 200}	32c6249f-a027-41c2-a5d7-75806c4b6911	\N	{}	\N	f	f
45593b50-e405-456a-9c17-7e2400b2eb0d	preinscriptions	0d765b3b-3fda-4f5a-a2d3-0f7cdce737e9/0d765b3b-3fda-4f5a-a2d3-0f7cdce737e9_photo_1782484190244.jpg	\N	2026-06-26 14:29:51.65218+00	2026-06-26 14:29:51.65218+00	2026-06-26 14:29:51.65218+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-26T14:29:52.000Z", "contentLength": 414566, "httpStatusCode": 200}	f7a878de-be59-40af-b176-df8ef24df199	\N	{}	\N	f	f
1f26d305-721b-491a-aa17-1e3a128c4657	preinscriptions	c0451628-7322-469d-80f5-be02232062c6/c0451628-7322-469d-80f5-be02232062c6_acte_1782583325869.jpeg	\N	2026-06-27 18:02:07.513654+00	2026-06-27 18:02:07.513654+00	2026-06-27 18:02:07.513654+00	{"eTag": "\\"afc3ada8c5164210a2e31d3729733085\\"", "size": 104345, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-27T18:02:08.000Z", "contentLength": 104345, "httpStatusCode": 200}	f6516fa2-b47a-417a-8bef-52158e646ff2	\N	{}	\N	f	f
fd138fa0-4aad-4185-9f9f-0556f28a54df	preinscriptions	c0451628-7322-469d-80f5-be02232062c6/c0451628-7322-469d-80f5-be02232062c6_photo_1782583327774.jpg	\N	2026-06-27 18:02:08.752945+00	2026-06-27 18:02:08.752945+00	2026-06-27 18:02:08.752945+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-27T18:02:09.000Z", "contentLength": 414566, "httpStatusCode": 200}	487e7cab-9800-4e9f-bb13-2f57d0bf540d	\N	{}	\N	f	f
623b4dc8-d0ec-40d2-965e-4c8d91f04626	preinscriptions	devoir/devoir_devoir_1783122245208.jpg	\N	2026-07-03 23:44:08.541633+00	2026-07-03 23:44:08.541633+00	2026-07-03 23:44:08.541633+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-07-03T23:44:09.000Z", "contentLength": 414566, "httpStatusCode": 200}	fafbbfa9-12a3-4a8a-a337-d09ad6407fc6	\N	{}	\N	f	f
96ffd253-648a-4bb3-af74-28a49812138a	preinscriptions	5ee92754-d6fb-4f27-81de-5fc762144598/5ee92754-d6fb-4f27-81de-5fc762144598_acte_1782584015026.png	\N	2026-06-27 18:13:37.739232+00	2026-06-27 18:13:37.739232+00	2026-06-27 18:13:37.739232+00	{"eTag": "\\"35c3e1a93f218a1840573d668ac974c7\\"", "size": 2178348, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-27T18:13:38.000Z", "contentLength": 2178348, "httpStatusCode": 200}	8a4898a4-6488-427c-aa8b-6b13d34a9095	\N	{}	\N	f	f
badd9a95-dae1-423a-9c8a-b4e199943254	preinscriptions	12c32ffc-acee-4c78-b250-b4479b71d4e5/12c32ffc-acee-4c78-b250-b4479b71d4e5_acte_1783776877545.jpg	\N	2026-07-11 13:34:38.605821+00	2026-07-11 13:34:38.605821+00	2026-07-11 13:34:38.605821+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-07-11T13:34:39.000Z", "contentLength": 414566, "httpStatusCode": 200}	4fbe319e-8e20-4472-95bf-3dbd3bef0997	\N	{}	\N	f	f
3a69f915-1c63-4c09-8625-47fab6a7b519	preinscriptions	5ee92754-d6fb-4f27-81de-5fc762144598/5ee92754-d6fb-4f27-81de-5fc762144598_photo_1782584018517.jpg	\N	2026-06-27 18:13:38.817555+00	2026-06-27 18:13:38.817555+00	2026-06-27 18:13:38.817555+00	{"eTag": "\\"a9e25a5017d3193f6b8e84506d304ebf\\"", "size": 105874, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-27T18:13:39.000Z", "contentLength": 105874, "httpStatusCode": 200}	9571f23b-ba51-4358-9e5c-8f4b939c366b	\N	{}	\N	f	f
fbd84a73-bc3d-456c-bf91-9b01f1d20110	preinscriptions	1d3f29a0-8fb9-4d89-9298-efbdadcca4af/1d3f29a0-8fb9-4d89-9298-efbdadcca4af_acte_1782600193736.png	\N	2026-06-27 22:43:16.236807+00	2026-06-27 22:43:16.236807+00	2026-06-27 22:43:16.236807+00	{"eTag": "\\"1503fb13aa0f3ee3f6dc1a1b0eebd619\\"", "size": 1860455, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-27T22:43:17.000Z", "contentLength": 1860455, "httpStatusCode": 200}	4eafb8ad-8754-4c4d-97d7-c2ccc7f7c5b1	\N	{}	\N	f	f
0698293c-7ed2-446a-870b-4ac8b43316fa	preinscriptions	12c32ffc-acee-4c78-b250-b4479b71d4e5/12c32ffc-acee-4c78-b250-b4479b71d4e5_photo_1783776880872.jpg	\N	2026-07-11 13:34:41.543938+00	2026-07-11 13:34:41.543938+00	2026-07-11 13:34:41.543938+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-07-11T13:34:42.000Z", "contentLength": 414566, "httpStatusCode": 200}	d0d89cce-119d-4cac-baf5-b79004c1c7d6	\N	{}	\N	f	f
03d9d171-140c-43cd-a1c1-125fb856fadc	preinscriptions	1d3f29a0-8fb9-4d89-9298-efbdadcca4af/1d3f29a0-8fb9-4d89-9298-efbdadcca4af_photo_1782600196023.jpeg	\N	2026-06-27 22:43:16.595197+00	2026-06-27 22:43:16.595197+00	2026-06-27 22:43:16.595197+00	{"eTag": "\\"3b7ba4e67b45ac22b5cc687cda2ff39c\\"", "size": 104543, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-27T22:43:17.000Z", "contentLength": 104543, "httpStatusCode": 200}	aa941d58-44df-4957-a43f-be74301af65a	\N	{}	\N	f	f
ca76f387-fc7e-4183-a761-350b7fa53f6a	preinscriptions	4f49e70d-7c9b-4826-8797-ce06eca37ad6/4f49e70d-7c9b-4826-8797-ce06eca37ad6_acte_1784044025582.pdf	\N	2026-07-14 15:47:08.761472+00	2026-07-14 15:47:08.761472+00	2026-07-14 15:47:08.761472+00	{"eTag": "\\"0973664ae97f231060d376c0e5048af1\\"", "size": 225984, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-07-14T15:47:09.000Z", "contentLength": 225984, "httpStatusCode": 200}	c1420f2e-41bb-4a7a-9c34-75c54edf3c03	\N	{}	\N	f	f
c09a6ea9-9654-4003-8b2b-f25b131c2a55	preinscriptions	6ab17c00-d9b4-41e8-b38a-33f5555189dc/6ab17c00-d9b4-41e8-b38a-33f5555189dc_acte_1782600393159.png	\N	2026-06-27 22:46:35.865086+00	2026-06-27 22:46:35.865086+00	2026-06-27 22:46:35.865086+00	{"eTag": "\\"ebd7742d32d05b851baa9484df7f62ca\\"", "size": 2249030, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-27T22:46:36.000Z", "contentLength": 2249030, "httpStatusCode": 200}	a108cd1c-c641-46bb-8549-81749ada616c	\N	{}	\N	f	f
48c8b8e6-7ecd-485f-9c18-5937be8728b7	preinscriptions	6ab17c00-d9b4-41e8-b38a-33f5555189dc/6ab17c00-d9b4-41e8-b38a-33f5555189dc_photo_1782600395640.jpeg	\N	2026-06-27 22:46:36.233855+00	2026-06-27 22:46:36.233855+00	2026-06-27 22:46:36.233855+00	{"eTag": "\\"3b7ba4e67b45ac22b5cc687cda2ff39c\\"", "size": 104543, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-27T22:46:37.000Z", "contentLength": 104543, "httpStatusCode": 200}	e740e743-3c6a-475e-ace1-69cc55e066cf	\N	{}	\N	f	f
e23fd0b0-9ee1-4b30-a8ae-a6d2fa85b86c	preinscriptions	d6e412ed-7127-43c1-9019-f1791c89cc8a/d6e412ed-7127-43c1-9019-f1791c89cc8a_acte_1782605827058.png	\N	2026-06-28 00:17:11.240661+00	2026-06-28 00:17:11.240661+00	2026-06-28 00:17:11.240661+00	{"eTag": "\\"35c3e1a93f218a1840573d668ac974c7\\"", "size": 2178348, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T00:17:12.000Z", "contentLength": 2178348, "httpStatusCode": 200}	cc0ff167-baa2-4cf6-9c09-95f2fdb9dfd3	\N	{}	\N	f	f
8605acc6-5076-42f2-b4ee-312975941918	preinscriptions	0442cb11-1347-414a-9a8d-51b4eb97f773/0442cb11-1347-414a-9a8d-51b4eb97f773_photo_1788102258972.jpg	\N	2026-08-30 15:04:19.662387+00	2026-08-30 15:04:19.662387+00	2026-08-30 15:04:19.662387+00	{"eTag": "\\"f2d45f2b362ab8d6b63956456e40ebcb\\"", "size": 72022, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-08-30T15:04:20.000Z", "contentLength": 72022, "httpStatusCode": 200}	3d75e75c-808c-4bcb-adf2-bb1ae099786b	\N	{}	\N	f	f
6b71df84-e637-4a34-a580-d8b69659a6e9	preinscriptions	d6e412ed-7127-43c1-9019-f1791c89cc8a/d6e412ed-7127-43c1-9019-f1791c89cc8a_photo_1782605831130.png	\N	2026-06-28 00:17:14.459365+00	2026-06-28 00:17:14.459365+00	2026-06-28 00:17:14.459365+00	{"eTag": "\\"6a410410e797829599d9e30b2540b171\\"", "size": 2662850, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T00:17:15.000Z", "contentLength": 2662850, "httpStatusCode": 200}	39b33c6c-657b-4eda-a73a-360af18c4a0e	\N	{}	\N	f	f
16b2110d-a1f3-4ca7-b15f-bba1b6ce7513	preinscriptions	soumission_1/soumission_1_soumission_1783124059877.jpeg	\N	2026-07-04 00:14:23.450541+00	2026-07-04 00:14:23.450541+00	2026-07-04 00:14:23.450541+00	{"eTag": "\\"afc3ada8c5164210a2e31d3729733085\\"", "size": 104345, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-07-04T00:14:24.000Z", "contentLength": 104345, "httpStatusCode": 200}	ffeec679-cf58-491e-adaa-9a63ffad2171	\N	{}	\N	f	f
ceae949d-e815-4c3b-852c-e44cb5f9c538	preinscriptions	2df3747e-1c75-4962-9e12-9d4f0d7e62c5/2df3747e-1c75-4962-9e12-9d4f0d7e62c5_acte_1782607516228.jpeg	\N	2026-06-28 00:45:17.869061+00	2026-06-28 00:45:17.869061+00	2026-06-28 00:45:17.869061+00	{"eTag": "\\"3b7ba4e67b45ac22b5cc687cda2ff39c\\"", "size": 104543, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T00:45:18.000Z", "contentLength": 104543, "httpStatusCode": 200}	c4ca01c3-ea8b-4c06-943a-c3b6ff3a4b86	\N	{}	\N	f	f
8a5cb0ec-174a-470b-a11c-fb5089feb473	preinscriptions	2df3747e-1c75-4962-9e12-9d4f0d7e62c5/2df3747e-1c75-4962-9e12-9d4f0d7e62c5_photo_1782607517739.png	\N	2026-06-28 00:45:21.894493+00	2026-06-28 00:45:21.894493+00	2026-06-28 00:45:21.894493+00	{"eTag": "\\"6a410410e797829599d9e30b2540b171\\"", "size": 2662850, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T00:45:22.000Z", "contentLength": 2662850, "httpStatusCode": 200}	231adb6a-b212-4626-9bdf-4fa10faf8395	\N	{}	\N	f	f
a4a78255-3506-4fb2-85bb-b401857998a9	preinscriptions	soumission_1/soumission_1_soumission_1783124634138.jpeg	\N	2026-07-04 00:23:57.228358+00	2026-07-04 00:23:57.228358+00	2026-07-04 00:23:57.228358+00	{"eTag": "\\"afc3ada8c5164210a2e31d3729733085\\"", "size": 104345, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-07-04T00:23:58.000Z", "contentLength": 104345, "httpStatusCode": 200}	98028e24-a26a-476c-8c7f-7f417586b1de	\N	{}	\N	f	f
b747cf65-ea71-43ee-acdb-317259adafdc	preinscriptions	2df3747e-1c75-4962-9e12-9d4f0d7e62c5/2df3747e-1c75-4962-9e12-9d4f0d7e62c5_acte_1782607906443.jpeg	\N	2026-06-28 00:51:47.992809+00	2026-06-28 00:51:47.992809+00	2026-06-28 00:51:47.992809+00	{"eTag": "\\"3b7ba4e67b45ac22b5cc687cda2ff39c\\"", "size": 104543, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T00:51:48.000Z", "contentLength": 104543, "httpStatusCode": 200}	3db681c7-71f9-42f9-9c90-126b9870ca70	\N	{}	\N	f	f
72eca425-d8d7-4348-a3f9-1c639bfeebb4	preinscriptions	2df3747e-1c75-4962-9e12-9d4f0d7e62c5/2df3747e-1c75-4962-9e12-9d4f0d7e62c5_photo_1782607907892.png	\N	2026-06-28 00:51:49.737501+00	2026-06-28 00:51:49.737501+00	2026-06-28 00:51:49.737501+00	{"eTag": "\\"6a410410e797829599d9e30b2540b171\\"", "size": 2662850, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T00:51:50.000Z", "contentLength": 2662850, "httpStatusCode": 200}	1f56c42a-f458-4ed6-b603-eb6d7878b2d2	\N	{}	\N	f	f
64243454-f27c-43dc-85a1-b5e4c2876f1a	preinscriptions	2fc30823-933c-41bd-bd68-9edb9db7c239/2fc30823-933c-41bd-bd68-9edb9db7c239_acte_1783794522978.jpg	\N	2026-07-11 18:28:46.254452+00	2026-07-11 18:28:46.254452+00	2026-07-11 18:28:46.254452+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-07-11T18:28:47.000Z", "contentLength": 414566, "httpStatusCode": 200}	d1adbfa4-6d4c-4037-ad3e-81d6c5717594	\N	{}	\N	f	f
382e70dd-b8ac-4cce-b04c-2ee5a21477b3	preinscriptions	02950e18-3e88-4b35-9522-a7ec0898be62/02950e18-3e88-4b35-9522-a7ec0898be62_acte_1782643909957.jpeg	\N	2026-06-28 10:51:52.414004+00	2026-06-28 10:51:52.414004+00	2026-06-28 10:51:52.414004+00	{"eTag": "\\"3b7ba4e67b45ac22b5cc687cda2ff39c\\"", "size": 104543, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T10:51:53.000Z", "contentLength": 104543, "httpStatusCode": 200}	7185654a-6fb1-4675-b3b1-9710136d9e72	\N	{}	\N	f	f
9f44f0dd-6354-417b-a52d-2bde5433b861	preinscriptions	02950e18-3e88-4b35-9522-a7ec0898be62/02950e18-3e88-4b35-9522-a7ec0898be62_photo_1782643911831.jpeg	\N	2026-06-28 10:51:52.89361+00	2026-06-28 10:51:52.89361+00	2026-06-28 10:51:52.89361+00	{"eTag": "\\"3b7ba4e67b45ac22b5cc687cda2ff39c\\"", "size": 104543, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T10:51:53.000Z", "contentLength": 104543, "httpStatusCode": 200}	7b7a38a9-a110-4858-aed7-78a87a2ccf05	\N	{}	\N	f	f
a1cadfab-8d27-41e5-9a54-bff309570907	preinscriptions	b99c5da0-aa5f-4fc5-8c1a-f7cdae2f22f4/b99c5da0-aa5f-4fc5-8c1a-f7cdae2f22f4_acte_1782647311299.png	\N	2026-06-28 11:48:36.518572+00	2026-06-28 11:48:36.518572+00	2026-06-28 11:48:36.518572+00	{"eTag": "\\"35c3e1a93f218a1840573d668ac974c7\\"", "size": 2178348, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T11:48:37.000Z", "contentLength": 2178348, "httpStatusCode": 200}	bc0125f9-d610-46b8-b81d-d58cce5b123b	\N	{}	\N	f	f
eb8bde2b-89e4-4dfb-80df-be317da4bf4b	preinscriptions	b99c5da0-aa5f-4fc5-8c1a-f7cdae2f22f4/b99c5da0-aa5f-4fc5-8c1a-f7cdae2f22f4_photo_1782647315922.jpeg	\N	2026-06-28 11:48:37.183727+00	2026-06-28 11:48:37.183727+00	2026-06-28 11:48:37.183727+00	{"eTag": "\\"3b7ba4e67b45ac22b5cc687cda2ff39c\\"", "size": 104543, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T11:48:38.000Z", "contentLength": 104543, "httpStatusCode": 200}	3de9d4c2-41a6-4e9f-a666-f5b638f2e389	\N	{}	\N	f	f
ac398be1-81aa-4952-92f9-83fd53c41c24	preinscriptions	examens/examen_1783135556263_hl19vq.jpeg	\N	2026-07-04 03:25:57.492726+00	2026-07-04 03:25:57.492726+00	2026-07-04 03:25:57.492726+00	{"eTag": "\\"afc3ada8c5164210a2e31d3729733085\\"", "size": 104345, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-07-04T03:25:58.000Z", "contentLength": 104345, "httpStatusCode": 200}	79aac206-679b-4d16-8490-3c721963484e	\N	{}	\N	f	f
d8b5a916-6cd5-4b74-8e33-a01967202d19	preinscriptions	b2a3213f-758b-478b-be4e-9ec170b74ab1/b2a3213f-758b-478b-be4e-9ec170b74ab1_acte_1782647761342.png	\N	2026-06-28 11:56:04.944176+00	2026-06-28 11:56:04.944176+00	2026-06-28 11:56:04.944176+00	{"eTag": "\\"1af940b8b2a22e0bd78bd7b188a420b9\\"", "size": 1696262, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T11:56:05.000Z", "contentLength": 1696262, "httpStatusCode": 200}	9070ac48-a434-4fdf-890c-ee4c6ab9d320	\N	{}	\N	f	f
c88a2865-3d66-4044-bd7e-aed9fa2cf656	preinscriptions	2fc30823-933c-41bd-bd68-9edb9db7c239/2fc30823-933c-41bd-bd68-9edb9db7c239_photo_1783794525716.jpg	\N	2026-07-11 18:28:47.276149+00	2026-07-11 18:28:47.276149+00	2026-07-11 18:28:47.276149+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-07-11T18:28:48.000Z", "contentLength": 414566, "httpStatusCode": 200}	5a257fbe-b6c0-41e9-9c11-eb740f84a68e	\N	{}	\N	f	f
8719e649-e2e1-4a8a-902e-25d39b9341dd	preinscriptions	b2a3213f-758b-478b-be4e-9ec170b74ab1/b2a3213f-758b-478b-be4e-9ec170b74ab1_photo_1782647764356.jpeg	\N	2026-06-28 11:56:05.51461+00	2026-06-28 11:56:05.51461+00	2026-06-28 11:56:05.51461+00	{"eTag": "\\"3b7ba4e67b45ac22b5cc687cda2ff39c\\"", "size": 104543, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T11:56:06.000Z", "contentLength": 104543, "httpStatusCode": 200}	b843ac37-bc07-476f-96a5-2e177790cd0d	\N	{}	\N	f	f
50cf7a8b-92f4-444f-a4d1-00d0ba4fcf67	preinscriptions	4db3ca2b-a4f0-4a1a-8f8f-3bc134b5ee0e/4db3ca2b-a4f0-4a1a-8f8f-3bc134b5ee0e_acte_1782650543702.png	\N	2026-06-28 12:42:36.798088+00	2026-06-28 12:42:36.798088+00	2026-06-28 12:42:36.798088+00	{"eTag": "\\"19fc0acb0ef5b22de10152dccde68b0f\\"", "size": 1818598, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T12:42:37.000Z", "contentLength": 1818598, "httpStatusCode": 200}	39aaad1a-9020-4d84-99fe-7690ada999cf	\N	{}	\N	f	f
bac14091-545e-482d-99ee-6a1b346af5f3	preinscriptions	4f49e70d-7c9b-4826-8797-ce06eca37ad6/4f49e70d-7c9b-4826-8797-ce06eca37ad6_photo_1784044028061.jpg	\N	2026-07-14 15:47:10.160667+00	2026-07-14 15:47:10.160667+00	2026-07-14 15:47:10.160667+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-07-14T15:47:11.000Z", "contentLength": 414566, "httpStatusCode": 200}	0e43ec60-6fc7-4ea1-a765-11f01abed2f0	\N	{}	\N	f	f
c696011d-5a42-4c52-afe6-81558822daa4	preinscriptions	4db3ca2b-a4f0-4a1a-8f8f-3bc134b5ee0e/4db3ca2b-a4f0-4a1a-8f8f-3bc134b5ee0e_photo_1782650556309.png	\N	2026-06-28 12:42:40.875477+00	2026-06-28 12:42:40.875477+00	2026-06-28 12:42:40.875477+00	{"eTag": "\\"6a410410e797829599d9e30b2540b171\\"", "size": 2662850, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T12:42:41.000Z", "contentLength": 2662850, "httpStatusCode": 200}	12da7283-4f6a-4722-9004-ebba69d952a8	\N	{}	\N	f	f
79f513de-1397-4847-9551-1229467bec92	preinscriptions	41543b85-3c36-4aa1-be0d-dcbddcd060d5/41543b85-3c36-4aa1-be0d-dcbddcd060d5_acte_1782652420897.png	\N	2026-06-28 13:13:45.467892+00	2026-06-28 13:13:45.467892+00	2026-06-28 13:13:45.467892+00	{"eTag": "\\"19fc0acb0ef5b22de10152dccde68b0f\\"", "size": 1818598, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T13:13:46.000Z", "contentLength": 1818598, "httpStatusCode": 200}	e59bdbba-cd51-4b21-bddd-b0cac3334c2c	\N	{}	\N	f	f
0d9022d4-97e8-43b4-9ef9-d1c47521e10c	preinscriptions	41543b85-3c36-4aa1-be0d-dcbddcd060d5/41543b85-3c36-4aa1-be0d-dcbddcd060d5_photo_1782652424279.png	\N	2026-06-28 13:13:46.781093+00	2026-06-28 13:13:46.781093+00	2026-06-28 13:13:46.781093+00	{"eTag": "\\"19fc0acb0ef5b22de10152dccde68b0f\\"", "size": 1818598, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T13:13:47.000Z", "contentLength": 1818598, "httpStatusCode": 200}	2ae058e1-7424-41fc-9e47-01f958ea6c57	\N	{}	\N	f	f
3f99cacd-1ac1-44bb-a52a-e7d367ef9808	preinscriptions	b095c811-45c2-4b85-9c9d-42a4fd83d9b7/b095c811-45c2-4b85-9c9d-42a4fd83d9b7_acte_1782654460517.png	\N	2026-06-28 13:47:43.950186+00	2026-06-28 13:47:43.950186+00	2026-06-28 13:47:43.950186+00	{"eTag": "\\"19fc0acb0ef5b22de10152dccde68b0f\\"", "size": 1818598, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T13:47:44.000Z", "contentLength": 1818598, "httpStatusCode": 200}	927a8973-922c-43eb-b4f4-969402ff8a3c	\N	{}	\N	f	f
c744398a-d906-4757-a50c-9dcece8f3564	preinscriptions	b095c811-45c2-4b85-9c9d-42a4fd83d9b7/b095c811-45c2-4b85-9c9d-42a4fd83d9b7_photo_1782654462706.jpeg	\N	2026-06-28 13:47:44.332717+00	2026-06-28 13:47:44.332717+00	2026-06-28 13:47:44.332717+00	{"eTag": "\\"3b7ba4e67b45ac22b5cc687cda2ff39c\\"", "size": 104543, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T13:47:45.000Z", "contentLength": 104543, "httpStatusCode": 200}	b4acd905-923d-46f8-b6de-be4050a014c8	\N	{}	\N	f	f
2a81166a-3619-4a97-9d06-386065d5f6f7	preinscriptions	b2c40a87-59a8-4e1e-ba51-3a1bde41a8cd/b2c40a87-59a8-4e1e-ba51-3a1bde41a8cd_acte_1783773129419.png	\N	2026-07-11 12:32:10.61309+00	2026-07-11 12:32:10.61309+00	2026-07-11 12:32:10.61309+00	{"eTag": "\\"0175edf869ac80cff7b9775dbf3fb44f\\"", "size": 880465, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-07-11T12:32:11.000Z", "contentLength": 880465, "httpStatusCode": 200}	4f2599f2-559f-4e30-8cbf-33dac9c800be	\N	{}	\N	f	f
03a66882-938f-4d6c-850e-f9705a012e80	preinscriptions	11f6bce8-cd50-49fc-b916-ef4b7b7e41cd/11f6bce8-cd50-49fc-b916-ef4b7b7e41cd_acte_1782655246520.jpeg	\N	2026-06-28 14:00:49.147472+00	2026-06-28 14:00:49.147472+00	2026-06-28 14:00:49.147472+00	{"eTag": "\\"3b7ba4e67b45ac22b5cc687cda2ff39c\\"", "size": 104543, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T14:00:50.000Z", "contentLength": 104543, "httpStatusCode": 200}	3874c880-168b-4198-b128-95de3b902c50	\N	{}	\N	f	f
4a36b494-2950-4ceb-8e3f-41b7d8accf78	preinscriptions	11f6bce8-cd50-49fc-b916-ef4b7b7e41cd/11f6bce8-cd50-49fc-b916-ef4b7b7e41cd_photo_1782655247904.jpeg	\N	2026-06-28 14:00:49.537347+00	2026-06-28 14:00:49.537347+00	2026-06-28 14:00:49.537347+00	{"eTag": "\\"3b7ba4e67b45ac22b5cc687cda2ff39c\\"", "size": 104543, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-06-28T14:00:50.000Z", "contentLength": 104543, "httpStatusCode": 200}	09132d70-57b7-4d7f-b5c1-e093185d8ebb	\N	{}	\N	f	f
e77c5538-f50a-454e-b5db-39134cf230c9	preinscriptions	b2c40a87-59a8-4e1e-ba51-3a1bde41a8cd/b2c40a87-59a8-4e1e-ba51-3a1bde41a8cd_photo_1783773136168.png	\N	2026-07-11 12:32:17.09834+00	2026-07-11 12:32:17.09834+00	2026-07-11 12:32:17.09834+00	{"eTag": "\\"6fc087cd79ef40992f2c2abcf8e4075b\\"", "size": 828452, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-07-11T12:32:18.000Z", "contentLength": 828452, "httpStatusCode": 200}	ccbf4131-0e95-4ef1-af1a-43862206775e	\N	{}	\N	f	f
caa5dc87-1158-45d0-ad7c-84041211308b	preinscriptions	b2c40a87-59a8-4e1e-ba51-3a1bde41a8cd/b2c40a87-59a8-4e1e-ba51-3a1bde41a8cd_acte_1783773147759.png	\N	2026-07-11 12:32:28.611104+00	2026-07-11 12:32:28.611104+00	2026-07-11 12:32:28.611104+00	{"eTag": "\\"0175edf869ac80cff7b9775dbf3fb44f\\"", "size": 880465, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-07-11T12:32:29.000Z", "contentLength": 880465, "httpStatusCode": 200}	9e59e515-3f81-44e6-822e-ff88da472246	\N	{}	\N	f	f
0d3f9c4c-156d-46f9-8278-3c112eb33c85	preinscriptions	b2c40a87-59a8-4e1e-ba51-3a1bde41a8cd/b2c40a87-59a8-4e1e-ba51-3a1bde41a8cd_photo_1783773154597.png	\N	2026-07-11 12:32:35.452759+00	2026-07-11 12:32:35.452759+00	2026-07-11 12:32:35.452759+00	{"eTag": "\\"6fc087cd79ef40992f2c2abcf8e4075b\\"", "size": 828452, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-07-11T12:32:36.000Z", "contentLength": 828452, "httpStatusCode": 200}	72ef66fb-b873-431f-ab06-1b8eb5c750ac	\N	{}	\N	f	f
97817b0d-1415-47b6-b941-a5c7a62c47bf	preinscriptions	b2c40a87-59a8-4e1e-ba51-3a1bde41a8cd/b2c40a87-59a8-4e1e-ba51-3a1bde41a8cd_acte_1783773195939.png	\N	2026-07-11 12:33:16.875556+00	2026-07-11 12:33:16.875556+00	2026-07-11 12:33:16.875556+00	{"eTag": "\\"0175edf869ac80cff7b9775dbf3fb44f\\"", "size": 880465, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-07-11T12:33:17.000Z", "contentLength": 880465, "httpStatusCode": 200}	c5a46488-e46d-4c74-b131-12a0f0a967e5	\N	{}	\N	f	f
cc019855-4461-41b4-b52d-b552987a639a	preinscriptions	d6229172-6757-4cf0-8cf2-8ecdd2a5fc32/d6229172-6757-4cf0-8cf2-8ecdd2a5fc32_acte_1784044412636.pdf	\N	2026-07-14 15:53:36.382534+00	2026-07-14 15:53:36.382534+00	2026-07-14 15:53:36.382534+00	{"eTag": "\\"0973664ae97f231060d376c0e5048af1\\"", "size": 225984, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-07-14T15:53:37.000Z", "contentLength": 225984, "httpStatusCode": 200}	9af92643-e1e3-4bb3-9a7a-29ed3a9ecddc	\N	{}	\N	f	f
63e748c2-e369-42cf-b6fa-16950292c3aa	preinscriptions	d6229172-6757-4cf0-8cf2-8ecdd2a5fc32/d6229172-6757-4cf0-8cf2-8ecdd2a5fc32_photo_1784044415714.jpg	\N	2026-07-14 15:53:37.507674+00	2026-07-14 15:53:37.507674+00	2026-07-14 15:53:37.507674+00	{"eTag": "\\"4a2aebf7e802f88e20b4bf7a16a3f78e\\"", "size": 110734, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-07-14T15:53:38.000Z", "contentLength": 110734, "httpStatusCode": 200}	0c6e3a3b-f808-42ad-9232-a6c64424f524	\N	{}	\N	f	f
1eb6b922-ee8c-457b-9acd-dc13934d9a61	preinscriptions	48516d91-3c71-403d-bea1-949a6183aa34/48516d91-3c71-403d-bea1-949a6183aa34_photo_1784202250670.jpg	\N	2026-07-16 11:44:15.845724+00	2026-07-16 11:44:15.845724+00	2026-07-16 11:44:15.845724+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-07-16T11:44:16.000Z", "contentLength": 414566, "httpStatusCode": 200}	1397af07-5a5d-4a78-894e-fda6ad6d6409	\N	{}	\N	f	f
ee8908fb-e8fb-4308-b94a-1da14055b2bc	preinscriptions	b5929718-c004-446e-bdd1-febded1d2c23/b5929718-c004-446e-bdd1-febded1d2c23_acte_1784205013883.pdf	\N	2026-07-16 12:30:17.019771+00	2026-07-16 12:30:17.019771+00	2026-07-16 12:30:17.019771+00	{"eTag": "\\"0973664ae97f231060d376c0e5048af1\\"", "size": 225984, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-07-16T12:30:17.000Z", "contentLength": 225984, "httpStatusCode": 200}	db97fb66-ebcf-4640-9562-3ecfdfc4c729	\N	{}	\N	f	f
8cd58ee2-093b-4195-b5f2-885b1da6803f	preinscriptions	b5929718-c004-446e-bdd1-febded1d2c23/b5929718-c004-446e-bdd1-febded1d2c23_photo_1784205017270.png	\N	2026-07-16 12:30:19.653765+00	2026-07-16 12:30:19.653765+00	2026-07-16 12:30:19.653765+00	{"eTag": "\\"f0b8df8a2a802f6674803b5a0633778e\\"", "size": 509674, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-07-16T12:30:20.000Z", "contentLength": 509674, "httpStatusCode": 200}	d04ae7c3-4ec3-4d74-b8e2-4e7d4663174f	\N	{}	\N	f	f
d01fbfad-fcbc-4807-b500-0cdc3c063101	preinscriptions	a77e85de-2009-49a8-b1e6-3b292c810f26/a77e85de-2009-49a8-b1e6-3b292c810f26_acte_1784217266271.pdf	\N	2026-07-16 15:54:29.614207+00	2026-07-16 15:54:29.614207+00	2026-07-16 15:54:29.614207+00	{"eTag": "\\"0973664ae97f231060d376c0e5048af1\\"", "size": 225984, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-07-16T15:54:30.000Z", "contentLength": 225984, "httpStatusCode": 200}	1e72cd7c-f58e-46e9-a60d-0342533bc85e	\N	{}	\N	f	f
914b487c-0a67-45e1-b490-7b3385c50204	preinscriptions	a77e85de-2009-49a8-b1e6-3b292c810f26/a77e85de-2009-49a8-b1e6-3b292c810f26_photo_1784217269837.jpg	\N	2026-07-16 15:54:30.74923+00	2026-07-16 15:54:30.74923+00	2026-07-16 15:54:30.74923+00	{"eTag": "\\"a9e25a5017d3193f6b8e84506d304ebf\\"", "size": 105874, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-07-16T15:54:31.000Z", "contentLength": 105874, "httpStatusCode": 200}	4306ad55-6d05-4915-8f3d-93f83f3f05c4	\N	{}	\N	f	f
fc870b70-491d-45da-be00-04e9310dadf9	preinscriptions	e9d9aa62-0c6e-477d-9a80-97a98312e61c/e9d9aa62-0c6e-477d-9a80-97a98312e61c_acte_1784281045828.pdf	\N	2026-07-17 09:37:29.832889+00	2026-07-17 09:37:29.832889+00	2026-07-17 09:37:29.832889+00	{"eTag": "\\"0973664ae97f231060d376c0e5048af1\\"", "size": 225984, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-07-17T09:37:30.000Z", "contentLength": 225984, "httpStatusCode": 200}	a27a2d2d-fe3c-4f41-87c8-b412f99f11ce	\N	{}	\N	f	f
98654d47-99f9-4f74-9fea-abeb9b3b3d76	preinscriptions	e9d9aa62-0c6e-477d-9a80-97a98312e61c/e9d9aa62-0c6e-477d-9a80-97a98312e61c_photo_1784281049632.png	\N	2026-07-17 09:37:30.863417+00	2026-07-17 09:37:30.863417+00	2026-07-17 09:37:30.863417+00	{"eTag": "\\"29e79bebdbde8427f74e8ff50d9cbe64\\"", "size": 216570, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-07-17T09:37:31.000Z", "contentLength": 216570, "httpStatusCode": 200}	7ddadd9d-a84a-477f-b0ae-d21b79a0387f	\N	{}	\N	f	f
6c508c23-59e1-469a-8e27-9fc0661621bc	preinscriptions	personnel_DIALLO/personnel_DIALLO_photo_url_1784555985125.png	\N	2026-07-20 13:59:51.213231+00	2026-07-20 13:59:51.213231+00	2026-07-20 13:59:51.213231+00	{"eTag": "\\"6fc087cd79ef40992f2c2abcf8e4075b\\"", "size": 828452, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-07-20T13:59:52.000Z", "contentLength": 828452, "httpStatusCode": 200}	7c3b3f87-9cbd-4c6f-8c9d-91fee2830717	\N	{}	\N	f	f
40acd5ad-ffef-4af6-8221-235da81b3a73	preinscriptions	personnel_DIALLO/personnel_DIALLO_carte_id_url_1784555990537.png	\N	2026-07-20 13:59:55.997583+00	2026-07-20 13:59:55.997583+00	2026-07-20 13:59:55.997583+00	{"eTag": "\\"0175edf869ac80cff7b9775dbf3fb44f\\"", "size": 880465, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-07-20T13:59:56.000Z", "contentLength": 880465, "httpStatusCode": 200}	85255225-9111-440c-89a9-5faa64b065aa	\N	{}	\N	f	f
cee9e5dd-b02c-4171-966d-eadf51c08628	preinscriptions	personnel_DIALLO/personnel_DIALLO_photo_url_1784555987093.png	\N	2026-07-20 13:59:58.423209+00	2026-07-20 13:59:58.423209+00	2026-07-20 13:59:58.423209+00	{"eTag": "\\"0175edf869ac80cff7b9775dbf3fb44f\\"", "size": 880465, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-07-20T13:59:59.000Z", "contentLength": 880465, "httpStatusCode": 200}	048ff68f-3f5e-4997-8470-688af720c0fe	\N	{}	\N	f	f
49e3a923-acb4-460c-acac-880d1ca36868	preinscriptions	personnel_DIALLO/personnel_DIALLO_cv_url_1784555997545.pdf	\N	2026-07-20 13:59:58.608513+00	2026-07-20 13:59:58.608513+00	2026-07-20 13:59:58.608513+00	{"eTag": "\\"0973664ae97f231060d376c0e5048af1\\"", "size": 225984, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-07-20T13:59:59.000Z", "contentLength": 225984, "httpStatusCode": 200}	863d0db6-d71a-4904-b9e9-1a5258c5d72c	\N	{}	\N	f	f
9b799dcc-8d49-40a1-9d76-5b94dda06b29	preinscriptions	personnel_DIALLO/personnel_DIALLO_certificat_residence_url_1784556012329.pdf	\N	2026-07-20 14:00:13.563535+00	2026-07-20 14:00:13.563535+00	2026-07-20 14:00:13.563535+00	{"eTag": "\\"0973664ae97f231060d376c0e5048af1\\"", "size": 225984, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-07-20T14:00:14.000Z", "contentLength": 225984, "httpStatusCode": 200}	0e0b17b4-74a5-4613-96fc-30cdf6037f77	\N	{}	\N	f	f
a32f6f27-e1de-43d3-a650-93b60eda6fc9	preinscriptions	personnel_Diallo/personnel_Diallo_photo_url_1784824120894.png	\N	2026-07-23 16:28:47.592434+00	2026-07-23 16:28:47.592434+00	2026-07-23 16:28:47.592434+00	{"eTag": "\\"0175edf869ac80cff7b9775dbf3fb44f\\"", "size": 880465, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-07-23T16:28:48.000Z", "contentLength": 880465, "httpStatusCode": 200}	952d0110-3483-4dc6-921f-ae1bd0d60645	\N	{}	\N	f	f
4d4ac7c8-bd7f-425c-b6a4-185938451967	preinscriptions	personnel_Diallo/personnel_Diallo_carte_id_url_1784824129283.png	\N	2026-07-23 16:28:57.634853+00	2026-07-23 16:28:57.634853+00	2026-07-23 16:28:57.634853+00	{"eTag": "\\"93ff83d86b0aca4e1e628baaa230ee8f\\"", "size": 1269209, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-07-23T16:28:58.000Z", "contentLength": 1269209, "httpStatusCode": 200}	e5e51565-b009-4058-b11e-838b88810713	\N	{}	\N	f	f
47f7b30f-6b28-43a1-a6aa-525a82498dcb	preinscriptions	personnel_Diallo/personnel_Diallo_cv_url_1784824142904.pdf	\N	2026-07-23 16:29:05.696016+00	2026-07-23 16:29:05.696016+00	2026-07-23 16:29:05.696016+00	{"eTag": "\\"0973664ae97f231060d376c0e5048af1\\"", "size": 225984, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-07-23T16:29:06.000Z", "contentLength": 225984, "httpStatusCode": 200}	f098ddd0-047a-4e4c-b163-cbdf74cc8fcf	\N	{}	\N	f	f
64d29caa-9ffa-4aa4-96c9-f5399152c2c7	preinscriptions	personnel_Diallo/personnel_Diallo_certificat_residence_url_1784824151222.pdf	\N	2026-07-23 16:29:13.739578+00	2026-07-23 16:29:13.739578+00	2026-07-23 16:29:13.739578+00	{"eTag": "\\"b19241a91fced1689c1b8779e703db87\\"", "size": 195084, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-07-23T16:29:14.000Z", "contentLength": 195084, "httpStatusCode": 200}	96190d0d-6e83-42eb-9188-12cce7ecbe57	\N	{}	\N	f	f
ef0e2c98-eed6-4ca8-8afe-cc92f5c4ca6f	preinscriptions	4ccd727d-4dfa-42b3-957d-aba88d89c7d3/4ccd727d-4dfa-42b3-957d-aba88d89c7d3_acte_1785347261873.pdf	\N	2026-07-29 17:47:47.266335+00	2026-07-29 17:47:47.266335+00	2026-07-29 17:47:47.266335+00	{"eTag": "\\"0973664ae97f231060d376c0e5048af1\\"", "size": 225984, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-07-29T17:47:48.000Z", "contentLength": 225984, "httpStatusCode": 200}	cf2d13be-0a98-4b91-bbc2-bfa414daeb36	\N	{}	\N	f	f
1ce722a7-d4cd-4d4b-9e38-75dcc44ac637	preinscriptions	4ccd727d-4dfa-42b3-957d-aba88d89c7d3/4ccd727d-4dfa-42b3-957d-aba88d89c7d3_photo_1785347266632.jpg	\N	2026-07-29 17:47:49.502581+00	2026-07-29 17:47:49.502581+00	2026-07-29 17:47:49.502581+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-07-29T17:47:50.000Z", "contentLength": 414566, "httpStatusCode": 200}	5f5a8077-86c3-4afb-8147-72be9e7c31d7	\N	{}	\N	f	f
629a3a03-9e29-425d-a8ad-1ece8c505f5b	preinscriptions	personnel_DIALLO/personnel_DIALLO_cv_url_1785348049728.pdf	\N	2026-07-29 18:01:00.240845+00	2026-07-29 18:01:00.240845+00	2026-07-29 18:01:00.240845+00	{"eTag": "\\"b19241a91fced1689c1b8779e703db87\\"", "size": 195084, "mimetype": "application/pdf", "cacheControl": "max-age=3600", "lastModified": "2026-07-29T18:01:01.000Z", "contentLength": 195084, "httpStatusCode": 200}	066d5400-61a9-4772-bc49-37217902a057	\N	{}	\N	f	f
0cc33aad-84f2-4b07-ae65-630054b09c27	preinscriptions	personnel_DIALLO/personnel_DIALLO_photo_url_1785348049823.jpg	\N	2026-07-29 18:01:00.357445+00	2026-07-29 18:01:00.357445+00	2026-07-29 18:01:00.357445+00	{"eTag": "\\"ab98054d6beec1e96963ea0f9fa08986\\"", "size": 414566, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-07-29T18:01:01.000Z", "contentLength": 414566, "httpStatusCode": 200}	06e9f0f8-6499-4c1b-b109-a6f704bc77a8	\N	{}	\N	f	f
c2e59e0c-8505-4dc0-8fc7-36844270d27c	preinscriptions	personnel_DIALLO/personnel_DIALLO_carte_id_url_1785348049912.png	\N	2026-07-29 18:01:01.434993+00	2026-07-29 18:01:01.434993+00	2026-07-29 18:01:01.434993+00	{"eTag": "\\"ad3369582f5299c57bab78e59f91a3ff\\"", "size": 1545523, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-07-29T18:01:02.000Z", "contentLength": 1545523, "httpStatusCode": 200}	e73d6055-43cf-47dc-b2c5-86c730a059d6	\N	{}	\N	f	f
c7fbcde5-3754-48e2-8309-c9fb8e60496d	preinscriptions	bibliotheque/bibliotheque_1785515362132_2264.png	\N	2026-07-31 16:29:24.740465+00	2026-07-31 16:29:24.740465+00	2026-07-31 16:29:24.740465+00	{"eTag": "\\"0175edf869ac80cff7b9775dbf3fb44f\\"", "size": 880465, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-07-31T16:29:25.000Z", "contentLength": 880465, "httpStatusCode": 200}	abf7ebb4-be50-4b3a-bdba-46f3341f77f1	\N	{}	\N	f	f
2da6c594-644b-4c0f-bd0d-513079bcb9cf	preinscriptions	annonces/annonce_1787273891735_4032.jpg	\N	2026-08-21 00:58:12.68848+00	2026-08-21 00:58:12.68848+00	2026-08-21 00:58:12.68848+00	{"eTag": "\\"a8645c8216f05c9bde427552fe2b72e6\\"", "size": 313916, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-08-21T00:58:13.000Z", "contentLength": 313916, "httpStatusCode": 200}	b5f82974-32fc-4ef8-9076-bf5b3a72c36f	\N	{}	\N	f	f
9b03df38-44fe-42d7-b346-d522a17fe678	preinscriptions	5cf67d2d-8875-446e-b500-164feeaaf7e5/5cf67d2d-8875-446e-b500-164feeaaf7e5_acte_1787408113251.jpg	\N	2026-08-22 14:15:14.241987+00	2026-08-22 14:15:14.241987+00	2026-08-22 14:15:14.241987+00	{"eTag": "\\"f32a791b9cd28b330187a867181eeeab\\"", "size": 257928, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-08-22T14:15:15.000Z", "contentLength": 257928, "httpStatusCode": 200}	2d516c0d-dab8-4c71-be2b-fa8590a507ef	\N	{}	\N	f	f
3af7ec04-48f7-401c-a722-2bfb99214930	preinscriptions	5cf67d2d-8875-446e-b500-164feeaaf7e5/5cf67d2d-8875-446e-b500-164feeaaf7e5_photo_1787408115895.jpg	\N	2026-08-22 14:15:16.599469+00	2026-08-22 14:15:16.599469+00	2026-08-22 14:15:16.599469+00	{"eTag": "\\"f32a791b9cd28b330187a867181eeeab\\"", "size": 257928, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-08-22T14:15:17.000Z", "contentLength": 257928, "httpStatusCode": 200}	5670cd52-3db4-49e9-a5d3-79d0c031b4bb	\N	{}	\N	f	f
f60329aa-c1c6-4c7b-825f-f34e146508a5	preinscriptions	devoir/devoir_devoir_1787409317545.jpg	\N	2026-08-22 14:35:18.342463+00	2026-08-22 14:35:18.342463+00	2026-08-22 14:35:18.342463+00	{"eTag": "\\"f32a791b9cd28b330187a867181eeeab\\"", "size": 257928, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-08-22T14:35:19.000Z", "contentLength": 257928, "httpStatusCode": 200}	f98ec54a-6340-43c8-aeec-5b59af856446	\N	{}	\N	f	f
f94510cd-348d-46ce-b046-3f73a38d4a91	preinscriptions	devoir/devoir_devoir_1787409326108.jpg	\N	2026-08-22 14:35:26.283071+00	2026-08-22 14:35:26.283071+00	2026-08-22 14:35:26.283071+00	{"eTag": "\\"1ffcd84cd403e12985ba1c8d91cc28a0\\"", "size": 31850, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-08-22T14:35:27.000Z", "contentLength": 31850, "httpStatusCode": 200}	249cf489-4f42-4440-9ee0-c2f5a6482c45	\N	{}	\N	f	f
cbc05730-0cfa-46d1-9db2-67d37cceb263	preinscriptions	soumission_1/soumission_1_soumission_1787409765467.jpg	\N	2026-08-22 14:42:46.243949+00	2026-08-22 14:42:46.243949+00	2026-08-22 14:42:46.243949+00	{"eTag": "\\"f32a791b9cd28b330187a867181eeeab\\"", "size": 257928, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-08-22T14:42:47.000Z", "contentLength": 257928, "httpStatusCode": 200}	bc619124-90fc-4c46-b68d-fca86108f3e4	\N	{}	\N	f	f
c6f52521-6cba-4821-8115-5b25c073e8c8	preinscriptions	examens/examen_1787409967967_0c9b3a.jpg	\N	2026-08-22 14:46:08.738225+00	2026-08-22 14:46:08.738225+00	2026-08-22 14:46:08.738225+00	{"eTag": "\\"f32a791b9cd28b330187a867181eeeab\\"", "size": 257928, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-08-22T14:46:09.000Z", "contentLength": 257928, "httpStatusCode": 200}	5dcdaffe-3530-41f9-a42f-6e8551f59e0c	\N	{}	\N	f	f
dffc9cd1-b28a-49b6-903c-b291daefccca	preinscriptions	examens/examen_1787410059845_eoc3kg.jpg	\N	2026-08-22 14:47:40.444863+00	2026-08-22 14:47:40.444863+00	2026-08-22 14:47:40.444863+00	{"eTag": "\\"f32a791b9cd28b330187a867181eeeab\\"", "size": 257928, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-08-22T14:47:41.000Z", "contentLength": 257928, "httpStatusCode": 200}	2a7f69f1-4267-453d-b401-5c892c367c97	\N	{}	\N	f	f
f02cf855-80ce-48d9-809d-a8699a52fb6d	preinscriptions	annonces/annonce_1787415599541_8664.jpg	\N	2026-08-22 16:20:00.256518+00	2026-08-22 16:20:00.256518+00	2026-08-22 16:20:00.256518+00	{"eTag": "\\"e0fc15291f3077577073fce3fe3a65fa\\"", "size": 99423, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-08-22T16:20:01.000Z", "contentLength": 99423, "httpStatusCode": 200}	294d340c-78f4-4ebd-8f43-9e1bbdcc354c	\N	{}	\N	f	f
de0fb9b9-d987-4447-aac5-0b8565161261	preinscriptions	8b602885-89ab-4643-8fe6-d46926e0fc55/8b602885-89ab-4643-8fe6-d46926e0fc55_acte_1787443586178.jpg	\N	2026-08-23 00:06:29.261271+00	2026-08-23 00:06:29.261271+00	2026-08-23 00:06:29.261271+00	{"eTag": "\\"f32a791b9cd28b330187a867181eeeab\\"", "size": 257928, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-08-23T00:06:30.000Z", "contentLength": 257928, "httpStatusCode": 200}	429f0c6f-da89-47b8-9526-b27c9f290806	\N	{}	\N	f	f
9e82b483-4735-417d-8fe5-fce98c3514cf	preinscriptions	8b602885-89ab-4643-8fe6-d46926e0fc55/8b602885-89ab-4643-8fe6-d46926e0fc55_photo_1787443588693.png	\N	2026-08-23 00:06:32.524974+00	2026-08-23 00:06:32.524974+00	2026-08-23 00:06:32.524974+00	{"eTag": "\\"1acd30ee863e7a4bc59c963a705a8979\\"", "size": 1353644, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-08-23T00:06:33.000Z", "contentLength": 1353644, "httpStatusCode": 200}	eb1bb7b5-f2d9-4d14-89db-4e8c73c8d3c4	\N	{}	\N	f	f
9db08051-d0ee-453f-97e2-bd2d6809d1bf	preinscriptions	8b602885-89ab-4643-8fe6-d46926e0fc55/8b602885-89ab-4643-8fe6-d46926e0fc55_acte_1787443676302.jpg	\N	2026-08-23 00:07:58.99833+00	2026-08-23 00:07:58.99833+00	2026-08-23 00:07:58.99833+00	{"eTag": "\\"f32a791b9cd28b330187a867181eeeab\\"", "size": 257928, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-08-23T00:07:59.000Z", "contentLength": 257928, "httpStatusCode": 200}	d623267c-de85-4b23-b12d-c55abd5c5fb0	\N	{}	\N	f	f
7e3fca68-cb8e-4a03-8192-50ae01fbf6d5	preinscriptions	8b602885-89ab-4643-8fe6-d46926e0fc55/8b602885-89ab-4643-8fe6-d46926e0fc55_photo_1787443678381.png	\N	2026-08-23 00:08:01.585903+00	2026-08-23 00:08:01.585903+00	2026-08-23 00:08:01.585903+00	{"eTag": "\\"1acd30ee863e7a4bc59c963a705a8979\\"", "size": 1353644, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-08-23T00:08:02.000Z", "contentLength": 1353644, "httpStatusCode": 200}	00976df6-b713-4699-b3f2-85c937a1a55d	\N	{}	\N	f	f
3f453d95-4995-4def-a169-b7ce3844774b	preinscriptions	8b602885-89ab-4643-8fe6-d46926e0fc55/8b602885-89ab-4643-8fe6-d46926e0fc55_acte_1787443735984.jpg	\N	2026-08-23 00:08:58.248519+00	2026-08-23 00:08:58.248519+00	2026-08-23 00:08:58.248519+00	{"eTag": "\\"f32a791b9cd28b330187a867181eeeab\\"", "size": 257928, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-08-23T00:08:59.000Z", "contentLength": 257928, "httpStatusCode": 200}	7a094e22-428e-4936-9975-f7aa0098be23	\N	{}	\N	f	f
4b3cf016-9feb-4b47-9717-45e5731436ab	preinscriptions	8b602885-89ab-4643-8fe6-d46926e0fc55/8b602885-89ab-4643-8fe6-d46926e0fc55_photo_1787443737662.png	\N	2026-08-23 00:09:00.893293+00	2026-08-23 00:09:00.893293+00	2026-08-23 00:09:00.893293+00	{"eTag": "\\"1acd30ee863e7a4bc59c963a705a8979\\"", "size": 1353644, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-08-23T00:09:01.000Z", "contentLength": 1353644, "httpStatusCode": 200}	57ead49c-03d4-4230-ae6d-0bc14372a13e	\N	{}	\N	f	f
3e9ad90b-30a3-4d65-8173-bba6c451f08b	preinscriptions	c4ac6c62-f92d-4d84-a041-9ed1afe2f9fb/c4ac6c62-f92d-4d84-a041-9ed1afe2f9fb_acte_1787444417885.jpg	\N	2026-08-23 00:20:20.160083+00	2026-08-23 00:20:20.160083+00	2026-08-23 00:20:20.160083+00	{"eTag": "\\"f32a791b9cd28b330187a867181eeeab\\"", "size": 257928, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-08-23T00:20:21.000Z", "contentLength": 257928, "httpStatusCode": 200}	a6497d65-f2a9-423d-9d7f-049ebb650f09	\N	{}	\N	f	f
f298a894-d810-432c-90f3-72db4b1bb5af	preinscriptions	c4ac6c62-f92d-4d84-a041-9ed1afe2f9fb/c4ac6c62-f92d-4d84-a041-9ed1afe2f9fb_photo_1787444419561.png	\N	2026-08-23 00:20:21.182715+00	2026-08-23 00:20:21.182715+00	2026-08-23 00:20:21.182715+00	{"eTag": "\\"3dfb8e1426199201d735558a689db8d0\\"", "size": 552807, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-08-23T00:20:22.000Z", "contentLength": 552807, "httpStatusCode": 200}	14eb84b1-e702-4ad8-98c7-075780c1d801	\N	{}	\N	f	f
011f06df-60f4-4627-a3be-5315d502af45	preinscriptions	0671d24a-74b6-4f66-8911-6edba9d5452b/0671d24a-74b6-4f66-8911-6edba9d5452b_acte_1787444910001.jpg	\N	2026-08-23 00:28:32.381581+00	2026-08-23 00:28:32.381581+00	2026-08-23 00:28:32.381581+00	{"eTag": "\\"f32a791b9cd28b330187a867181eeeab\\"", "size": 257928, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-08-23T00:28:33.000Z", "contentLength": 257928, "httpStatusCode": 200}	8a7b0fea-3b05-415d-be34-d089de6ac87b	\N	{}	\N	f	f
59ab1e3c-5e9c-40cd-8c7d-682c4a0f04ba	preinscriptions	0671d24a-74b6-4f66-8911-6edba9d5452b/0671d24a-74b6-4f66-8911-6edba9d5452b_photo_1787444911614.png	\N	2026-08-23 00:28:33.709354+00	2026-08-23 00:28:33.709354+00	2026-08-23 00:28:33.709354+00	{"eTag": "\\"a61edfba09a8d792ce12d3383bf5fb69\\"", "size": 219353, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-08-23T00:28:34.000Z", "contentLength": 219353, "httpStatusCode": 200}	6cf960a7-6c5f-4206-bef3-11c30f4ea534	\N	{}	\N	f	f
fed56cdd-522b-4f6b-85cb-8ad42da376e7	preinscriptions	321195fb-c9ca-4186-8dec-89cc6fe0457b/321195fb-c9ca-4186-8dec-89cc6fe0457b_acte_1787445191194.jpg	\N	2026-08-23 00:33:13.710567+00	2026-08-23 00:33:13.710567+00	2026-08-23 00:33:13.710567+00	{"eTag": "\\"f32a791b9cd28b330187a867181eeeab\\"", "size": 257928, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-08-23T00:33:14.000Z", "contentLength": 257928, "httpStatusCode": 200}	b12eda9e-a100-4e3d-99cb-acdfc56d4831	\N	{}	\N	f	f
826c9b63-71b7-4994-8820-dcc9d1709551	preinscriptions	321195fb-c9ca-4186-8dec-89cc6fe0457b/321195fb-c9ca-4186-8dec-89cc6fe0457b_photo_1787445192983.png	\N	2026-08-23 00:33:14.649792+00	2026-08-23 00:33:14.649792+00	2026-08-23 00:33:14.649792+00	{"eTag": "\\"a61edfba09a8d792ce12d3383bf5fb69\\"", "size": 219353, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-08-23T00:33:15.000Z", "contentLength": 219353, "httpStatusCode": 200}	651091f5-f768-4f0a-a845-9fc1dc4081f8	\N	{}	\N	f	f
8ee163b3-96f0-4299-bd11-6300689430fe	preinscriptions	1b18fef0-8ffb-44c1-9b24-8b4fbb51518c/1b18fef0-8ffb-44c1-9b24-8b4fbb51518c_acte_1787485634467.jpg	\N	2026-08-23 11:47:20.940215+00	2026-08-23 11:47:20.940215+00	2026-08-23 11:47:20.940215+00	{"eTag": "\\"f32a791b9cd28b330187a867181eeeab\\"", "size": 257928, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-08-23T11:47:21.000Z", "contentLength": 257928, "httpStatusCode": 200}	7fba82f0-c634-483b-a641-b32e74744c6e	\N	{}	\N	f	f
1aa306d0-f537-403b-a732-4784c53e80db	preinscriptions	1b18fef0-8ffb-44c1-9b24-8b4fbb51518c/1b18fef0-8ffb-44c1-9b24-8b4fbb51518c_photo_1787485641264.png	\N	2026-08-23 11:47:54.356211+00	2026-08-23 11:47:54.356211+00	2026-08-23 11:47:54.356211+00	{"eTag": "\\"80cb3a3e7691698ef5f5ecc992d12275\\"", "size": 857017, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-08-23T11:47:55.000Z", "contentLength": 857017, "httpStatusCode": 200}	7760fef8-f365-4e6f-8f4b-5fd194d87e52	\N	{}	\N	f	f
9feda9f9-ba1f-4f73-b769-7bb6090b0473	preinscriptions	1b18fef0-8ffb-44c1-9b24-8b4fbb51518c/1b18fef0-8ffb-44c1-9b24-8b4fbb51518c_acte_1787485753603.jpg	\N	2026-08-23 11:49:21.372279+00	2026-08-23 11:49:21.372279+00	2026-08-23 11:49:21.372279+00	{"eTag": "\\"f32a791b9cd28b330187a867181eeeab\\"", "size": 257928, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-08-23T11:49:22.000Z", "contentLength": 257928, "httpStatusCode": 200}	334c3e00-a7c1-4188-b18f-88432feb8f7b	\N	{}	\N	f	f
b2683cbf-26ae-47e0-8622-a2836cf68991	preinscriptions	1b18fef0-8ffb-44c1-9b24-8b4fbb51518c/1b18fef0-8ffb-44c1-9b24-8b4fbb51518c_photo_1787485761575.png	\N	2026-08-23 11:49:50.634841+00	2026-08-23 11:49:50.634841+00	2026-08-23 11:49:50.634841+00	{"eTag": "\\"80cb3a3e7691698ef5f5ecc992d12275\\"", "size": 857017, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-08-23T11:49:51.000Z", "contentLength": 857017, "httpStatusCode": 200}	6b81d70c-f7d8-4e38-aee8-4bc0e2337575	\N	{}	\N	f	f
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.s3_multipart_uploads (id, in_progress_size, upload_signature, bucket_id, key, version, owner_id, created_at, user_metadata, metadata) FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.s3_multipart_uploads_parts (id, upload_id, size, part_number, bucket_id, key, etag, owner_id, version, created_at) FROM stdin;
\.


--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: -
--

COPY storage.vector_indexes (id, name, bucket_id, data_type, dimension, distance_metric, metadata_configuration, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: secrets; Type: TABLE DATA; Schema: vault; Owner: -
--

COPY vault.secrets (id, name, description, secret, key_id, nonce, created_at, updated_at) FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: -
--

SELECT pg_catalog.setval('auth.refresh_tokens_id_seq', 1, false);


--
-- Name: annees_scolaires_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.annees_scolaires_id_seq', 3, true);


--
-- Name: annonces_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.annonces_id_seq', 2, true);


--
-- Name: articles_librairie_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.articles_librairie_id_seq', 34, true);


--
-- Name: avances_salaires_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.avances_salaires_id_seq', 1, false);


--
-- Name: budget_previsionnel_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.budget_previsionnel_id_seq', 1, false);


--
-- Name: bus_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.bus_id_seq', 20, true);


--
-- Name: cantine_menus_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.cantine_menus_id_seq', 3, true);


--
-- Name: categories_depenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categories_depenses_id_seq', 1, false);


--
-- Name: categories_quiz_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.categories_quiz_id_seq', 1, false);


--
-- Name: classes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.classes_id_seq', 47, true);


--
-- Name: commandes_fournitures_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.commandes_fournitures_id_seq', 162, true);


--
-- Name: commandes_librairie_articles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.commandes_librairie_articles_id_seq', 4, true);


--
-- Name: commandes_librairie_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.commandes_librairie_id_seq', 2, true);


--
-- Name: conges_personnel_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.conges_personnel_id_seq', 1, false);


--
-- Name: contrats_personnel_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.contrats_personnel_id_seq', 1, false);


--
-- Name: depenses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.depenses_id_seq', 1, false);


--
-- Name: devoirs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.devoirs_id_seq', 1, true);


--
-- Name: echeances_paiement_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.echeances_paiement_id_seq', 330, true);


--
-- Name: eleves_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.eleves_id_seq', 52, true);


--
-- Name: emprunts_bibliotheque_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.emprunts_bibliotheque_id_seq', 2, true);


--
-- Name: enseignements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.enseignements_id_seq', 22, true);


--
-- Name: examens_eleves_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.examens_eleves_id_seq', 2, true);


--
-- Name: examens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.examens_id_seq', 2, true);


--
-- Name: frais_scolaires_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.frais_scolaires_id_seq', 1, false);


--
-- Name: inscriptions_cantine_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inscriptions_cantine_id_seq', 3, true);


--
-- Name: inscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inscriptions_id_seq', 17, true);


--
-- Name: inscriptions_transport_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.inscriptions_transport_id_seq', 2, true);


--
-- Name: lecons_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lecons_id_seq', 2, true);


--
-- Name: lignes_transport_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.lignes_transport_id_seq', 10, true);


--
-- Name: livres_bibliotheque_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.livres_bibliotheque_id_seq', 1, true);


--
-- Name: logs_activites_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.logs_activites_id_seq', 1, false);


--
-- Name: matieres_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.matieres_id_seq', 1, true);


--
-- Name: menus_cantine_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.menus_cantine_id_seq', 1, false);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.messages_id_seq', 1, false);


--
-- Name: mouvements_caisse_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.mouvements_caisse_id_seq', 1, false);


--
-- Name: notes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.notes_id_seq', 2, true);


--
-- Name: options_qcm_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.options_qcm_id_seq', 5, true);


--
-- Name: options_quiz_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.options_quiz_id_seq', 1, false);


--
-- Name: paiements_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.paiements_id_seq', 90, true);


--
-- Name: paiements_salaires_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.paiements_salaires_id_seq', 7, true);


--
-- Name: parents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.parents_id_seq', 5, true);


--
-- Name: participations_quiz_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.participations_quiz_id_seq', 1, false);


--
-- Name: personnels_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.personnels_id_seq', 19, true);


--
-- Name: preinscription_cantine_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.preinscription_cantine_id_seq', 7, true);


--
-- Name: preinscription_transport_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.preinscription_transport_id_seq', 13, true);


--
-- Name: preinscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.preinscriptions_id_seq', 50, true);


--
-- Name: presences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.presences_id_seq', 1, false);


--
-- Name: presences_transport_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.presences_transport_id_seq', 1, false);


--
-- Name: questions_qcm_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.questions_qcm_id_seq', 2, true);


--
-- Name: questions_quiz_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.questions_quiz_id_seq', 1, false);


--
-- Name: quiz_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.quiz_id_seq', 1, false);


--
-- Name: quiz_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.quiz_questions_id_seq', 1, false);


--
-- Name: recus_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.recus_id_seq', 7, true);


--
-- Name: reinscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reinscriptions_id_seq', 35, true);


--
-- Name: remises_familles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.remises_familles_id_seq', 6, true);


--
-- Name: reponses_eleves_qcm_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reponses_eleves_qcm_id_seq', 1, false);


--
-- Name: reponses_quiz_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reponses_quiz_id_seq', 1, false);


--
-- Name: reservations_cantine_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reservations_cantine_id_seq', 1, false);


--
-- Name: reserves_cantine_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reserves_cantine_id_seq', 3, true);


--
-- Name: reset_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reset_tokens_id_seq', 1, false);


--
-- Name: services_annexes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.services_annexes_id_seq', 1, false);


--
-- Name: sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.sessions_id_seq', 1, false);


--
-- Name: soumissions_devoirs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.soumissions_devoirs_id_seq', 1, true);


--
-- Name: transactions_cantine_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.transactions_cantine_id_seq', 1, false);


--
-- Name: utilisateurs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.utilisateurs_id_seq', 135, true);


--
-- Name: ventes_librairie_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.ventes_librairie_id_seq', 2, true);


--
-- Name: subscription_id_seq; Type: SEQUENCE SET; Schema: realtime; Owner: -
--

SELECT pg_catalog.setval('realtime.subscription_id_seq', 1, false);


--
-- Name: mfa_amr_claims amr_id_pk; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT amr_id_pk PRIMARY KEY (id);


--
-- Name: audit_log_entries audit_log_entries_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.audit_log_entries
    ADD CONSTRAINT audit_log_entries_pkey PRIMARY KEY (id);


--
-- Name: custom_oauth_providers custom_oauth_providers_identifier_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_identifier_key UNIQUE (identifier);


--
-- Name: custom_oauth_providers custom_oauth_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.custom_oauth_providers
    ADD CONSTRAINT custom_oauth_providers_pkey PRIMARY KEY (id);


--
-- Name: flow_state flow_state_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.flow_state
    ADD CONSTRAINT flow_state_pkey PRIMARY KEY (id);


--
-- Name: identities identities_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_pkey PRIMARY KEY (id);


--
-- Name: identities identities_provider_id_provider_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_provider_id_provider_unique UNIQUE (provider_id, provider);


--
-- Name: instances instances_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.instances
    ADD CONSTRAINT instances_pkey PRIMARY KEY (id);


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_authentication_method_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_authentication_method_pkey UNIQUE (session_id, authentication_method);


--
-- Name: mfa_challenges mfa_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_pkey PRIMARY KEY (id);


--
-- Name: mfa_factors mfa_factors_last_challenged_at_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_last_challenged_at_key UNIQUE (last_challenged_at);


--
-- Name: mfa_factors mfa_factors_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_pkey PRIMARY KEY (id);


--
-- Name: mfa_recovery_code_sets mfa_recovery_code_sets_mfa_factor_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_recovery_code_sets
    ADD CONSTRAINT mfa_recovery_code_sets_mfa_factor_id_key UNIQUE (mfa_factor_id);


--
-- Name: mfa_recovery_code_sets mfa_recovery_code_sets_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_recovery_code_sets
    ADD CONSTRAINT mfa_recovery_code_sets_pkey PRIMARY KEY (id);


--
-- Name: mfa_recovery_code_sets mfa_recovery_code_sets_user_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_recovery_code_sets
    ADD CONSTRAINT mfa_recovery_code_sets_user_id_key UNIQUE (user_id);


--
-- Name: mfa_recovery_codes mfa_recovery_codes_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_recovery_codes
    ADD CONSTRAINT mfa_recovery_codes_pkey PRIMARY KEY (id);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_code_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_code_key UNIQUE (authorization_code);


--
-- Name: oauth_authorizations oauth_authorizations_authorization_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_authorization_id_key UNIQUE (authorization_id);


--
-- Name: oauth_authorizations oauth_authorizations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_pkey PRIMARY KEY (id);


--
-- Name: oauth_client_states oauth_client_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_client_states
    ADD CONSTRAINT oauth_client_states_pkey PRIMARY KEY (id);


--
-- Name: oauth_clients oauth_clients_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_clients
    ADD CONSTRAINT oauth_clients_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_pkey PRIMARY KEY (id);


--
-- Name: oauth_consents oauth_consents_user_client_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_client_unique UNIQUE (user_id, client_id);


--
-- Name: one_time_tokens one_time_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_unique; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_unique UNIQUE (token);


--
-- Name: saml_providers saml_providers_entity_id_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_entity_id_key UNIQUE (entity_id);


--
-- Name: saml_providers saml_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_pkey PRIMARY KEY (id);


--
-- Name: saml_relay_states saml_relay_states_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: scim_tokens scim_tokens_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.scim_tokens
    ADD CONSTRAINT scim_tokens_pkey PRIMARY KEY (id);


--
-- Name: scim_users scim_users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.scim_users
    ADD CONSTRAINT scim_users_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: sso_domains sso_domains_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_pkey PRIMARY KEY (id);


--
-- Name: sso_providers sso_providers_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_providers
    ADD CONSTRAINT sso_providers_pkey PRIMARY KEY (id);


--
-- Name: users users_phone_key; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_phone_key UNIQUE (phone);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: webauthn_challenges webauthn_challenges_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_pkey PRIMARY KEY (id);


--
-- Name: webauthn_credentials webauthn_credentials_pkey; Type: CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_pkey PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: annees_scolaires annees_scolaires_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annees_scolaires
    ADD CONSTRAINT annees_scolaires_pkey PRIMARY KEY (id);


--
-- Name: annonces annonces_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annonces
    ADD CONSTRAINT annonces_pkey PRIMARY KEY (id);


--
-- Name: articles_librairie articles_librairie_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.articles_librairie
    ADD CONSTRAINT articles_librairie_pkey PRIMARY KEY (id);


--
-- Name: avances_salaires avances_salaires_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avances_salaires
    ADD CONSTRAINT avances_salaires_pkey PRIMARY KEY (id);


--
-- Name: budget_previsionnel budget_previsionnel_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budget_previsionnel
    ADD CONSTRAINT budget_previsionnel_pkey PRIMARY KEY (id);


--
-- Name: bus bus_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bus
    ADD CONSTRAINT bus_pkey PRIMARY KEY (id);


--
-- Name: cantine_menus cantine_menus_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cantine_menus
    ADD CONSTRAINT cantine_menus_pkey PRIMARY KEY (id);


--
-- Name: categories_depenses categories_depenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories_depenses
    ADD CONSTRAINT categories_depenses_pkey PRIMARY KEY (id);


--
-- Name: categories_quiz categories_quiz_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.categories_quiz
    ADD CONSTRAINT categories_quiz_pkey PRIMARY KEY (id);


--
-- Name: classes classes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_pkey PRIMARY KEY (id);


--
-- Name: commandes_fournitures commandes_fournitures_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commandes_fournitures
    ADD CONSTRAINT commandes_fournitures_pkey PRIMARY KEY (id);


--
-- Name: commandes_librairie_articles commandes_librairie_articles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commandes_librairie_articles
    ADD CONSTRAINT commandes_librairie_articles_pkey PRIMARY KEY (id);


--
-- Name: commandes_librairie commandes_librairie_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commandes_librairie
    ADD CONSTRAINT commandes_librairie_pkey PRIMARY KEY (id);


--
-- Name: conges_personnel conges_personnel_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conges_personnel
    ADD CONSTRAINT conges_personnel_pkey PRIMARY KEY (id);


--
-- Name: contrats_personnel contrats_personnel_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contrats_personnel
    ADD CONSTRAINT contrats_personnel_pkey PRIMARY KEY (id);


--
-- Name: depenses depenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.depenses
    ADD CONSTRAINT depenses_pkey PRIMARY KEY (id);


--
-- Name: devoirs devoirs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.devoirs
    ADD CONSTRAINT devoirs_pkey PRIMARY KEY (id);


--
-- Name: echeances_paiement echeances_paiement_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echeances_paiement
    ADD CONSTRAINT echeances_paiement_pkey PRIMARY KEY (id);


--
-- Name: eleves eleves_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eleves
    ADD CONSTRAINT eleves_pkey PRIMARY KEY (id);


--
-- Name: emprunts_bibliotheque emprunts_bibliotheque_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emprunts_bibliotheque
    ADD CONSTRAINT emprunts_bibliotheque_pkey PRIMARY KEY (id);


--
-- Name: enseignements enseignements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enseignements
    ADD CONSTRAINT enseignements_pkey PRIMARY KEY (id);


--
-- Name: examens_eleves examens_eleves_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examens_eleves
    ADD CONSTRAINT examens_eleves_pkey PRIMARY KEY (id);


--
-- Name: examens examens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examens
    ADD CONSTRAINT examens_pkey PRIMARY KEY (id);


--
-- Name: frais_scolaires frais_scolaires_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frais_scolaires
    ADD CONSTRAINT frais_scolaires_pkey PRIMARY KEY (id);


--
-- Name: inscriptions_cantine inscriptions_cantine_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions_cantine
    ADD CONSTRAINT inscriptions_cantine_pkey PRIMARY KEY (id);


--
-- Name: inscriptions inscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions
    ADD CONSTRAINT inscriptions_pkey PRIMARY KEY (id);


--
-- Name: inscriptions_transport inscriptions_transport_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions_transport
    ADD CONSTRAINT inscriptions_transport_pkey PRIMARY KEY (id);


--
-- Name: lecons lecons_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lecons
    ADD CONSTRAINT lecons_pkey PRIMARY KEY (id);


--
-- Name: lien_parent_eleve lien_parent_eleve_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lien_parent_eleve
    ADD CONSTRAINT lien_parent_eleve_pkey PRIMARY KEY (parent_id, eleve_id);


--
-- Name: lignes_transport lignes_transport_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lignes_transport
    ADD CONSTRAINT lignes_transport_pkey PRIMARY KEY (id);


--
-- Name: livres_bibliotheque livres_bibliotheque_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.livres_bibliotheque
    ADD CONSTRAINT livres_bibliotheque_pkey PRIMARY KEY (id);


--
-- Name: logs_activites logs_activites_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.logs_activites
    ADD CONSTRAINT logs_activites_pkey PRIMARY KEY (id);


--
-- Name: matieres matieres_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.matieres
    ADD CONSTRAINT matieres_pkey PRIMARY KEY (id);


--
-- Name: menus_cantine menus_cantine_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.menus_cantine
    ADD CONSTRAINT menus_cantine_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: mouvements_caisse mouvements_caisse_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mouvements_caisse
    ADD CONSTRAINT mouvements_caisse_pkey PRIMARY KEY (id);


--
-- Name: notes notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_pkey PRIMARY KEY (id);


--
-- Name: options_qcm options_qcm_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.options_qcm
    ADD CONSTRAINT options_qcm_pkey PRIMARY KEY (id);


--
-- Name: options_quiz options_quiz_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.options_quiz
    ADD CONSTRAINT options_quiz_pkey PRIMARY KEY (id);


--
-- Name: paiements paiements_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paiements
    ADD CONSTRAINT paiements_pkey PRIMARY KEY (id);


--
-- Name: paiements_salaires paiements_salaires_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paiements_salaires
    ADD CONSTRAINT paiements_salaires_pkey PRIMARY KEY (id);


--
-- Name: parents parents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parents
    ADD CONSTRAINT parents_pkey PRIMARY KEY (id);


--
-- Name: participations_quiz participations_quiz_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participations_quiz
    ADD CONSTRAINT participations_quiz_pkey PRIMARY KEY (id);


--
-- Name: personnels personnels_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personnels
    ADD CONSTRAINT personnels_pkey PRIMARY KEY (id);


--
-- Name: preinscription_cantine preinscription_cantine_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preinscription_cantine
    ADD CONSTRAINT preinscription_cantine_pkey PRIMARY KEY (id);


--
-- Name: preinscription_transport preinscription_transport_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preinscription_transport
    ADD CONSTRAINT preinscription_transport_pkey PRIMARY KEY (id);


--
-- Name: preinscriptions preinscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preinscriptions
    ADD CONSTRAINT preinscriptions_pkey PRIMARY KEY (id);


--
-- Name: presences presences_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presences
    ADD CONSTRAINT presences_pkey PRIMARY KEY (id);


--
-- Name: presences_transport presences_transport_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presences_transport
    ADD CONSTRAINT presences_transport_pkey PRIMARY KEY (id);


--
-- Name: questions_qcm questions_qcm_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions_qcm
    ADD CONSTRAINT questions_qcm_pkey PRIMARY KEY (id);


--
-- Name: questions_quiz questions_quiz_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions_quiz
    ADD CONSTRAINT questions_quiz_pkey PRIMARY KEY (id);


--
-- Name: quiz quiz_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz
    ADD CONSTRAINT quiz_pkey PRIMARY KEY (id);


--
-- Name: quiz_questions quiz_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT quiz_questions_pkey PRIMARY KEY (id);


--
-- Name: recus recus_numero_recu_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recus
    ADD CONSTRAINT recus_numero_recu_key UNIQUE (numero_recu);


--
-- Name: recus recus_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recus
    ADD CONSTRAINT recus_pkey PRIMARY KEY (id);


--
-- Name: reinscriptions reinscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reinscriptions
    ADD CONSTRAINT reinscriptions_pkey PRIMARY KEY (id);


--
-- Name: remises_familles remises_familles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remises_familles
    ADD CONSTRAINT remises_familles_pkey PRIMARY KEY (id);


--
-- Name: reponses_eleves_qcm reponses_eleves_qcm_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reponses_eleves_qcm
    ADD CONSTRAINT reponses_eleves_qcm_pkey PRIMARY KEY (id);


--
-- Name: reponses_quiz reponses_quiz_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reponses_quiz
    ADD CONSTRAINT reponses_quiz_pkey PRIMARY KEY (id);


--
-- Name: reservations_cantine reservations_cantine_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservations_cantine
    ADD CONSTRAINT reservations_cantine_pkey PRIMARY KEY (id);


--
-- Name: reserves_cantine reserves_cantine_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reserves_cantine
    ADD CONSTRAINT reserves_cantine_pkey PRIMARY KEY (id);


--
-- Name: reset_tokens reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reset_tokens
    ADD CONSTRAINT reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: services_annexes services_annexes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.services_annexes
    ADD CONSTRAINT services_annexes_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: soumissions_devoirs soumissions_devoirs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.soumissions_devoirs
    ADD CONSTRAINT soumissions_devoirs_pkey PRIMARY KEY (id);


--
-- Name: transactions_cantine transactions_cantine_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_cantine
    ADD CONSTRAINT transactions_cantine_pkey PRIMARY KEY (id);


--
-- Name: utilisateurs utilisateurs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.utilisateurs
    ADD CONSTRAINT utilisateurs_pkey PRIMARY KEY (id);


--
-- Name: ventes_librairie ventes_librairie_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ventes_librairie
    ADD CONSTRAINT ventes_librairie_pkey PRIMARY KEY (id);


--
-- Name: messages messages_payload_exclusive; Type: CHECK CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages
    ADD CONSTRAINT messages_payload_exclusive CHECK (((payload IS NULL) OR (binary_payload IS NULL))) NOT VALID;


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id, inserted_at);


--
-- Name: subscription pk_subscription; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.subscription
    ADD CONSTRAINT pk_subscription PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: realtime; Owner: -
--

ALTER TABLE ONLY realtime.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: bucket_lifecycle_states bucket_lifecycle_states_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.bucket_lifecycle_states
    ADD CONSTRAINT bucket_lifecycle_states_pkey PRIMARY KEY (bucket_id);


--
-- Name: buckets_analytics buckets_analytics_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_analytics
    ADD CONSTRAINT buckets_analytics_pkey PRIMARY KEY (id);


--
-- Name: buckets buckets_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets
    ADD CONSTRAINT buckets_pkey PRIMARY KEY (id);


--
-- Name: buckets_vectors buckets_vectors_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.buckets_vectors
    ADD CONSTRAINT buckets_vectors_pkey PRIMARY KEY (id);


--
-- Name: lifecycle_abandoned_artifacts lifecycle_abandoned_artifacts_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.lifecycle_abandoned_artifacts
    ADD CONSTRAINT lifecycle_abandoned_artifacts_pkey PRIMARY KEY (bucket_id, key);


--
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: objects objects_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT objects_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_pkey PRIMARY KEY (id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_pkey PRIMARY KEY (id);


--
-- Name: vector_indexes vector_indexes_pkey; Type: CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_pkey PRIMARY KEY (id);


--
-- Name: audit_logs_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX audit_logs_instance_id_idx ON auth.audit_log_entries USING btree (instance_id);


--
-- Name: confirmation_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX confirmation_token_idx ON auth.users USING btree (confirmation_token) WHERE ((confirmation_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: custom_oauth_providers_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_created_at_idx ON auth.custom_oauth_providers USING btree (created_at);


--
-- Name: custom_oauth_providers_enabled_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_enabled_idx ON auth.custom_oauth_providers USING btree (enabled);


--
-- Name: custom_oauth_providers_identifier_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_identifier_idx ON auth.custom_oauth_providers USING btree (identifier);


--
-- Name: custom_oauth_providers_provider_type_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX custom_oauth_providers_provider_type_idx ON auth.custom_oauth_providers USING btree (provider_type);


--
-- Name: email_change_token_current_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_current_idx ON auth.users USING btree (email_change_token_current) WHERE ((email_change_token_current)::text !~ '^[0-9 ]*$'::text);


--
-- Name: email_change_token_new_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX email_change_token_new_idx ON auth.users USING btree (email_change_token_new) WHERE ((email_change_token_new)::text !~ '^[0-9 ]*$'::text);


--
-- Name: factor_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX factor_id_created_at_idx ON auth.mfa_factors USING btree (user_id, created_at);


--
-- Name: flow_state_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX flow_state_created_at_idx ON auth.flow_state USING btree (created_at DESC);


--
-- Name: identities_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_email_idx ON auth.identities USING btree (email text_pattern_ops);


--
-- Name: INDEX identities_email_idx; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.identities_email_idx IS 'Auth: Ensures indexed queries on the email column';


--
-- Name: identities_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX identities_user_id_idx ON auth.identities USING btree (user_id);


--
-- Name: idx_auth_code; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_auth_code ON auth.flow_state USING btree (auth_code);


--
-- Name: idx_oauth_client_states_created_at; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_oauth_client_states_created_at ON auth.oauth_client_states USING btree (created_at);


--
-- Name: idx_user_id_auth_method; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_user_id_auth_method ON auth.flow_state USING btree (user_id, authentication_method);


--
-- Name: idx_users_created_at_desc; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_users_created_at_desc ON auth.users USING btree (created_at DESC);


--
-- Name: idx_users_email; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_users_email ON auth.users USING btree (email);


--
-- Name: idx_users_last_sign_in_at_desc; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_users_last_sign_in_at_desc ON auth.users USING btree (last_sign_in_at DESC);


--
-- Name: idx_users_name; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX idx_users_name ON auth.users USING btree (((raw_user_meta_data ->> 'name'::text))) WHERE ((raw_user_meta_data ->> 'name'::text) IS NOT NULL);


--
-- Name: mfa_challenge_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_challenge_created_at_idx ON auth.mfa_challenges USING btree (created_at DESC);


--
-- Name: mfa_factors_user_friendly_name_unique; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX mfa_factors_user_friendly_name_unique ON auth.mfa_factors USING btree (friendly_name, user_id) WHERE (TRIM(BOTH FROM friendly_name) <> ''::text);


--
-- Name: mfa_factors_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_factors_user_id_idx ON auth.mfa_factors USING btree (user_id);


--
-- Name: mfa_recovery_codes_set_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX mfa_recovery_codes_set_id_idx ON auth.mfa_recovery_codes USING btree (mfa_recovery_code_set_id);


--
-- Name: oauth_auth_pending_exp_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_auth_pending_exp_idx ON auth.oauth_authorizations USING btree (expires_at) WHERE (status = 'pending'::auth.oauth_authorization_status);


--
-- Name: oauth_clients_deleted_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_clients_deleted_at_idx ON auth.oauth_clients USING btree (deleted_at);


--
-- Name: oauth_consents_active_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_client_idx ON auth.oauth_consents USING btree (client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_active_user_client_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_active_user_client_idx ON auth.oauth_consents USING btree (user_id, client_id) WHERE (revoked_at IS NULL);


--
-- Name: oauth_consents_user_order_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX oauth_consents_user_order_idx ON auth.oauth_consents USING btree (user_id, granted_at DESC);


--
-- Name: one_time_tokens_link_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_link_token_hash_hash_idx ON auth.one_time_tokens USING hash (link_token_hash);


--
-- Name: one_time_tokens_relates_to_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_relates_to_hash_idx ON auth.one_time_tokens USING hash (relates_to);


--
-- Name: one_time_tokens_token_hash_hash_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX one_time_tokens_token_hash_hash_idx ON auth.one_time_tokens USING hash (token_hash);


--
-- Name: one_time_tokens_user_id_token_type_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX one_time_tokens_user_id_token_type_key ON auth.one_time_tokens USING btree (user_id, token_type);


--
-- Name: reauthentication_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX reauthentication_token_idx ON auth.users USING btree (reauthentication_token) WHERE ((reauthentication_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: recovery_token_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX recovery_token_idx ON auth.users USING btree (recovery_token) WHERE ((recovery_token)::text !~ '^[0-9 ]*$'::text);


--
-- Name: refresh_tokens_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_idx ON auth.refresh_tokens USING btree (instance_id);


--
-- Name: refresh_tokens_instance_id_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_instance_id_user_id_idx ON auth.refresh_tokens USING btree (instance_id, user_id);


--
-- Name: refresh_tokens_parent_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_parent_idx ON auth.refresh_tokens USING btree (parent);


--
-- Name: refresh_tokens_session_id_revoked_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_session_id_revoked_idx ON auth.refresh_tokens USING btree (session_id, revoked);


--
-- Name: refresh_tokens_updated_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX refresh_tokens_updated_at_idx ON auth.refresh_tokens USING btree (updated_at DESC);


--
-- Name: saml_providers_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_providers_sso_provider_id_idx ON auth.saml_providers USING btree (sso_provider_id);


--
-- Name: saml_relay_states_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_created_at_idx ON auth.saml_relay_states USING btree (created_at DESC);


--
-- Name: saml_relay_states_for_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_for_email_idx ON auth.saml_relay_states USING btree (for_email);


--
-- Name: saml_relay_states_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX saml_relay_states_sso_provider_id_idx ON auth.saml_relay_states USING btree (sso_provider_id);


--
-- Name: scim_tokens_expires_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX scim_tokens_expires_at_idx ON auth.scim_tokens USING btree (expires_at);


--
-- Name: scim_tokens_revoked_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX scim_tokens_revoked_at_idx ON auth.scim_tokens USING btree (revoked_at);


--
-- Name: scim_tokens_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX scim_tokens_sso_provider_id_idx ON auth.scim_tokens USING btree (sso_provider_id);


--
-- Name: scim_tokens_token_hash_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX scim_tokens_token_hash_key ON auth.scim_tokens USING btree (token_hash);


--
-- Name: scim_users_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX scim_users_created_at_idx ON auth.scim_users USING btree (sso_provider_id, created_at, id) WHERE (deleted_at IS NULL);


--
-- Name: scim_users_deleted_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX scim_users_deleted_at_idx ON auth.scim_users USING btree (deleted_at);


--
-- Name: scim_users_external_id_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX scim_users_external_id_key ON auth.scim_users USING btree (sso_provider_id, external_id) WHERE ((external_id IS NOT NULL) AND (deleted_at IS NULL));


--
-- Name: scim_users_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX scim_users_id_idx ON auth.scim_users USING btree (sso_provider_id, id) WHERE (deleted_at IS NULL);


--
-- Name: scim_users_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX scim_users_sso_provider_id_idx ON auth.scim_users USING btree (sso_provider_id);


--
-- Name: scim_users_updated_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX scim_users_updated_at_idx ON auth.scim_users USING btree (sso_provider_id, updated_at, id) WHERE (deleted_at IS NULL);


--
-- Name: scim_users_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX scim_users_user_id_idx ON auth.scim_users USING btree (user_id);


--
-- Name: scim_users_user_name_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX scim_users_user_name_idx ON auth.scim_users USING btree (sso_provider_id, user_name COLLATE "C", id) WHERE (deleted_at IS NULL);


--
-- Name: scim_users_user_name_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX scim_users_user_name_key ON auth.scim_users USING btree (sso_provider_id, user_name) WHERE (deleted_at IS NULL);


--
-- Name: sessions_not_after_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_not_after_idx ON auth.sessions USING btree (not_after DESC);


--
-- Name: sessions_oauth_client_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_oauth_client_id_idx ON auth.sessions USING btree (oauth_client_id);


--
-- Name: sessions_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sessions_user_id_idx ON auth.sessions USING btree (user_id);


--
-- Name: sso_domains_domain_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_domains_domain_idx ON auth.sso_domains USING btree (lower(domain));


--
-- Name: sso_domains_sso_provider_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_domains_sso_provider_id_idx ON auth.sso_domains USING btree (sso_provider_id);


--
-- Name: sso_providers_resource_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX sso_providers_resource_id_idx ON auth.sso_providers USING btree (lower(resource_id));


--
-- Name: sso_providers_resource_id_pattern_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX sso_providers_resource_id_pattern_idx ON auth.sso_providers USING btree (resource_id text_pattern_ops);


--
-- Name: unique_phone_factor_per_user; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX unique_phone_factor_per_user ON auth.mfa_factors USING btree (user_id, phone);


--
-- Name: user_id_created_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX user_id_created_at_idx ON auth.sessions USING btree (user_id, created_at);


--
-- Name: users_email_partial_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX users_email_partial_key ON auth.users USING btree (email) WHERE (is_sso_user = false);


--
-- Name: INDEX users_email_partial_key; Type: COMMENT; Schema: auth; Owner: -
--

COMMENT ON INDEX auth.users_email_partial_key IS 'Auth: A partial unique index that applies only when is_sso_user is false';


--
-- Name: users_instance_id_email_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_email_idx ON auth.users USING btree (instance_id, lower((email)::text));


--
-- Name: users_instance_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_instance_id_idx ON auth.users USING btree (instance_id);


--
-- Name: users_is_anonymous_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX users_is_anonymous_idx ON auth.users USING btree (is_anonymous);


--
-- Name: webauthn_challenges_expires_at_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_challenges_expires_at_idx ON auth.webauthn_challenges USING btree (expires_at);


--
-- Name: webauthn_challenges_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_challenges_user_id_idx ON auth.webauthn_challenges USING btree (user_id);


--
-- Name: webauthn_credentials_credential_id_key; Type: INDEX; Schema: auth; Owner: -
--

CREATE UNIQUE INDEX webauthn_credentials_credential_id_key ON auth.webauthn_credentials USING btree (credential_id);


--
-- Name: webauthn_credentials_user_id_idx; Type: INDEX; Schema: auth; Owner: -
--

CREATE INDEX webauthn_credentials_user_id_idx ON auth.webauthn_credentials USING btree (user_id);


--
-- Name: budget_previsionnel_annee_categorie_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX budget_previsionnel_annee_categorie_code_key ON public.budget_previsionnel USING btree (annee, categorie_code);


--
-- Name: bus_immatriculation_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX bus_immatriculation_key ON public.bus USING btree (immatriculation);


--
-- Name: categories_depenses_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX categories_depenses_code_key ON public.categories_depenses USING btree (code);


--
-- Name: categories_quiz_nom_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX categories_quiz_nom_key ON public.categories_quiz USING btree (nom);


--
-- Name: commandes_librairie_numero_commande_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX commandes_librairie_numero_commande_key ON public.commandes_librairie USING btree (numero_commande);


--
-- Name: eleves_matricule_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX eleves_matricule_key ON public.eleves USING btree (matricule);


--
-- Name: eleves_utilisateur_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX eleves_utilisateur_id_key ON public.eleves USING btree (utilisateur_id);


--
-- Name: examens_eleves_examen_id_eleve_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX examens_eleves_examen_id_eleve_id_key ON public.examens_eleves USING btree (examen_id, eleve_id);


--
-- Name: idx_depenses_annee_mois; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_depenses_annee_mois ON public.depenses USING btree (exercice_annee, exercice_mois);


--
-- Name: idx_depenses_categorie; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_depenses_categorie ON public.depenses USING btree (categorie);


--
-- Name: idx_depenses_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_depenses_date ON public.depenses USING btree (date_depense);


--
-- Name: idx_echeances_paiement_reinscription_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_echeances_paiement_reinscription_id ON public.echeances_paiement USING btree (reinscription_id);


--
-- Name: idx_eleves_classe; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_eleves_classe ON public.eleves USING btree (classe_id);


--
-- Name: idx_eleves_classe_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_eleves_classe_id ON public.eleves USING btree (classe_id);


--
-- Name: idx_eleves_matricule; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_eleves_matricule ON public.eleves USING btree (matricule);


--
-- Name: idx_eleves_utilisateur_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_eleves_utilisateur_id ON public.eleves USING btree (utilisateur_id);


--
-- Name: idx_emprunts_bibliotheque_eleve_id_statut; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_emprunts_bibliotheque_eleve_id_statut ON public.emprunts_bibliotheque USING btree (eleve_id, statut);


--
-- Name: idx_enseignements_classe; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enseignements_classe ON public.enseignements USING btree (classe_id);


--
-- Name: idx_enseignements_enseignant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_enseignements_enseignant ON public.enseignements USING btree (enseignant_id);


--
-- Name: idx_examens_eleves_eleve_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_examens_eleves_eleve_id ON public.examens_eleves USING btree (eleve_id);


--
-- Name: idx_examens_eleves_examen_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_examens_eleves_examen_id ON public.examens_eleves USING btree (examen_id);


--
-- Name: idx_inscriptions_cantine_eleve_id_est_actif; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inscriptions_cantine_eleve_id_est_actif ON public.inscriptions_cantine USING btree (eleve_id, est_actif);


--
-- Name: idx_inscriptions_eleve; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inscriptions_eleve ON public.inscriptions USING btree (eleve_id);


--
-- Name: idx_inscriptions_parent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inscriptions_parent ON public.inscriptions USING btree (parent_id);


--
-- Name: idx_inscriptions_transport_eleve_id_est_actif; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_inscriptions_transport_eleve_id_est_actif ON public.inscriptions_transport USING btree (eleve_id, est_actif);


--
-- Name: idx_lien_parent_eleve_eleve_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lien_parent_eleve_eleve_id ON public.lien_parent_eleve USING btree (eleve_id);


--
-- Name: idx_lien_parent_eleve_parent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_lien_parent_eleve_parent_id ON public.lien_parent_eleve USING btree (parent_id);


--
-- Name: idx_messages_destinataire; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_messages_destinataire ON public.messages USING btree (destinataire_id, est_lu);


--
-- Name: idx_mouvements_caisse_annee_mois; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mouvements_caisse_annee_mois ON public.mouvements_caisse USING btree (exercice_annee, exercice_mois);


--
-- Name: idx_mouvements_caisse_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mouvements_caisse_date ON public.mouvements_caisse USING btree (date_mouvement);


--
-- Name: idx_mouvements_caisse_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mouvements_caisse_type ON public.mouvements_caisse USING btree (type);


--
-- Name: idx_notes_eleve; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notes_eleve ON public.notes USING btree (eleve_id);


--
-- Name: idx_paiements_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_paiements_date ON public.paiements USING btree (date_paiement);


--
-- Name: idx_paiements_eleve; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_paiements_eleve ON public.paiements USING btree (eleve_id);


--
-- Name: idx_paiements_eleve_id_type_frais_statut; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_paiements_eleve_id_type_frais_statut ON public.paiements USING btree (eleve_id, type_frais, statut);


--
-- Name: idx_paiements_preinscription_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_paiements_preinscription_id ON public.paiements USING btree (preinscription_id);


--
-- Name: idx_paiements_salaires_mois_annee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_paiements_salaires_mois_annee ON public.paiements_salaires USING btree (mois, annee);


--
-- Name: idx_parents_utilisateur_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_parents_utilisateur_id ON public.parents USING btree (utilisateur_id);


--
-- Name: idx_preinscriptions_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_preinscriptions_date ON public.preinscriptions USING btree (date_preinscription);


--
-- Name: idx_preinscriptions_nom_enfant; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_preinscriptions_nom_enfant ON public.preinscriptions USING btree (enfant_nom, enfant_prenom);


--
-- Name: idx_preinscriptions_numero_dossier; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_preinscriptions_numero_dossier ON public.preinscriptions USING btree (numero_dossier);


--
-- Name: idx_preinscriptions_parent_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_preinscriptions_parent_id ON public.preinscriptions USING btree (parent_id);


--
-- Name: idx_preinscriptions_statut; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_preinscriptions_statut ON public.preinscriptions USING btree (statut);


--
-- Name: idx_presences_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_presences_date ON public.presences USING btree (date);


--
-- Name: idx_presences_transport_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_presences_transport_date ON public.presences_transport USING btree (date);


--
-- Name: idx_presences_transport_eleve; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_presences_transport_eleve ON public.presences_transport USING btree (eleve_id);


--
-- Name: idx_recus_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recus_date ON public.recus USING btree (date_paiement);


--
-- Name: idx_recus_eleve; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recus_eleve ON public.recus USING btree (eleve_id);


--
-- Name: idx_recus_numero; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recus_numero ON public.recus USING btree (numero_recu);


--
-- Name: idx_recus_paiement; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_recus_paiement ON public.recus USING btree (paiement_id);


--
-- Name: idx_reinscriptions_annee; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reinscriptions_annee ON public.reinscriptions USING btree (annee_scolaire_id);


--
-- Name: idx_reinscriptions_eleve; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reinscriptions_eleve ON public.reinscriptions USING btree (eleve_id);


--
-- Name: idx_reinscriptions_statut; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reinscriptions_statut ON public.reinscriptions USING btree (statut);


--
-- Name: idx_reset_tokens_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reset_tokens_email ON public.reset_tokens USING btree (email);


--
-- Name: idx_reset_tokens_token; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_reset_tokens_token ON public.reset_tokens USING btree (token);


--
-- Name: inscriptions_numero_matricule_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX inscriptions_numero_matricule_key ON public.inscriptions USING btree (numero_matricule);


--
-- Name: paiements_salaires_personnel_id_mois_annee_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX paiements_salaires_personnel_id_mois_annee_key ON public.paiements_salaires USING btree (personnel_id, mois, annee);


--
-- Name: parents_utilisateur_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX parents_utilisateur_id_key ON public.parents USING btree (utilisateur_id);


--
-- Name: participations_quiz_quiz_id_eleve_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX participations_quiz_quiz_id_eleve_id_key ON public.participations_quiz USING btree (quiz_id, eleve_id);


--
-- Name: personnels_matricule_personnel_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX personnels_matricule_personnel_key ON public.personnels USING btree (matricule_personnel);


--
-- Name: personnels_utilisateur_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX personnels_utilisateur_id_key ON public.personnels USING btree (utilisateur_id);


--
-- Name: preinscriptions_numero_dossier_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX preinscriptions_numero_dossier_key ON public.preinscriptions USING btree (numero_dossier);


--
-- Name: presences_transport_eleve_id_date_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX presences_transport_eleve_id_date_key ON public.presences_transport USING btree (eleve_id, date);


--
-- Name: quiz_questions_quiz_id_question_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX quiz_questions_quiz_id_question_id_key ON public.quiz_questions USING btree (quiz_id, question_id);


--
-- Name: reinscriptions_numero_dossier_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX reinscriptions_numero_dossier_key ON public.reinscriptions USING btree (numero_dossier);


--
-- Name: services_annexes_nom_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX services_annexes_nom_key ON public.services_annexes USING btree (nom);


--
-- Name: sessions_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX sessions_token_key ON public.sessions USING btree (token);


--
-- Name: unique_email_token; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX unique_email_token ON public.reset_tokens USING btree (email);


--
-- Name: utilisateurs_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX utilisateurs_email_key ON public.utilisateurs USING btree (email);


--
-- Name: ix_realtime_subscription_entity; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX ix_realtime_subscription_entity ON realtime.subscription USING btree (entity);


--
-- Name: messages_replay_index; Type: INDEX; Schema: realtime; Owner: -
--

CREATE INDEX messages_replay_index ON ONLY realtime.messages USING btree (topic, inserted_at DESC, COALESCE(expires_at, 'infinity'::timestamp without time zone)) WHERE ((extension = 'broadcast'::text) AND (private = true));


--
-- Name: subscription_subscription_id_entity_filters_hash_key; Type: INDEX; Schema: realtime; Owner: -
--

CREATE UNIQUE INDEX subscription_subscription_id_entity_filters_hash_key ON realtime.subscription USING btree (subscription_id, entity, realtime.filters_hash(filters), action_filter, COALESCE(selected_columns, '{}'::text[]));


--
-- Name: bname; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX bname ON storage.buckets USING btree (name);


--
-- Name: bucket_lifecycle_states_due_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX bucket_lifecycle_states_due_idx ON storage.bucket_lifecycle_states USING btree (next_run_at, bucket_id) WHERE (next_run_at IS NOT NULL);


--
-- Name: buckets_analytics_unique_name_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX buckets_analytics_unique_name_idx ON storage.buckets_analytics USING btree (name) WHERE (deleted_at IS NULL);


--
-- Name: idx_multipart_uploads_list; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_multipart_uploads_list ON storage.s3_multipart_uploads USING btree (bucket_id, key, created_at);


--
-- Name: idx_objects_bucket_id_name; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name ON storage.objects USING btree (bucket_id, name COLLATE "C");


--
-- Name: idx_objects_bucket_id_name_lower; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_bucket_id_name_lower ON storage.objects USING btree (bucket_id, lower(name) COLLATE "C");


--
-- Name: idx_objects_current_version; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX idx_objects_current_version ON storage.objects USING btree (bucket_id, name COLLATE "C") WHERE (archived_at IS NULL);


--
-- Name: idx_objects_delete_markers; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX idx_objects_delete_markers ON storage.objects USING btree (bucket_id, name COLLATE "C") WHERE is_delete_marker;


--
-- Name: idx_objects_null_version; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX idx_objects_null_version ON storage.objects USING btree (bucket_id, name COLLATE "C") WHERE (NOT is_versioned);


--
-- Name: lifecycle_abandoned_artifacts_attempted_at_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX lifecycle_abandoned_artifacts_attempted_at_idx ON storage.lifecycle_abandoned_artifacts USING btree (attempted_at);


--
-- Name: name_prefix_search; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX name_prefix_search ON storage.objects USING btree (name text_pattern_ops);


--
-- Name: objects_archived_due_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE INDEX objects_archived_due_idx ON storage.objects USING btree (bucket_id, archived_at, name COLLATE "C") INCLUDE (id, version, is_delete_marker) WHERE (archived_at IS NOT NULL);


--
-- Name: objects_archived_order_uq; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX objects_archived_order_uq ON storage.objects USING btree (bucket_id, name COLLATE "C", archived_at) WHERE (archived_at IS NOT NULL);


--
-- Name: objects_bucket_id_name_version_key; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX objects_bucket_id_name_version_key ON storage.objects USING btree (bucket_id, name COLLATE "C", version) NULLS NOT DISTINCT;


--
-- Name: vector_indexes_name_bucket_id_idx; Type: INDEX; Schema: storage; Owner: -
--

CREATE UNIQUE INDEX vector_indexes_name_bucket_id_idx ON storage.vector_indexes USING btree (name, bucket_id);


--
-- Name: subscription tr_check_filters; Type: TRIGGER; Schema: realtime; Owner: -
--

CREATE TRIGGER tr_check_filters BEFORE INSERT OR UPDATE ON realtime.subscription FOR EACH ROW EXECUTE FUNCTION realtime.subscription_check_filters();


--
-- Name: buckets enforce_bucket_name_length_trigger; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER enforce_bucket_name_length_trigger BEFORE INSERT OR UPDATE OF name ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_name_length();


--
-- Name: buckets enforce_versioning_status_transition; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER enforce_versioning_status_transition BEFORE UPDATE OF versioning_status ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_versioning_status_transition();


--
-- Name: buckets protect_active_lifecycle_states; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_active_lifecycle_states BEFORE DELETE ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.protect_active_lifecycle_states();


--
-- Name: buckets protect_bucket_control_insert; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_bucket_control_insert BEFORE INSERT ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.protect_bucket_control_columns('service_role');


--
-- Name: buckets protect_bucket_control_update; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_bucket_control_update BEFORE UPDATE OF lifecycle_configuration, lifecycle_configuration_generation ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.protect_bucket_control_columns();


--
-- Name: buckets protect_bucket_control_update_role; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_bucket_control_update_role AFTER UPDATE OF lifecycle_configuration, lifecycle_configuration_generation ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.enforce_bucket_lifecycle_service_role('service_role');


--
-- Name: buckets protect_buckets_delete; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_buckets_delete BEFORE DELETE ON storage.buckets FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects protect_objects_delete; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER protect_objects_delete BEFORE DELETE ON storage.objects FOR EACH STATEMENT EXECUTE FUNCTION storage.protect_delete();


--
-- Name: objects update_objects_updated_at; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER update_objects_updated_at BEFORE UPDATE ON storage.objects FOR EACH ROW EXECUTE FUNCTION storage.update_updated_at_column();


--
-- Name: buckets wake_lifecycle_on_policy_write; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER wake_lifecycle_on_policy_write AFTER INSERT OR UPDATE OF lifecycle_configuration_generation ON storage.buckets FOR EACH ROW EXECUTE FUNCTION storage.wake_lifecycle_state();


--
-- Name: buckets wake_lifecycle_on_versioning_enable; Type: TRIGGER; Schema: storage; Owner: -
--

CREATE TRIGGER wake_lifecycle_on_versioning_enable AFTER UPDATE OF versioning_status ON storage.buckets FOR EACH ROW WHEN ((new.lifecycle_configuration IS NOT NULL)) EXECUTE FUNCTION storage.wake_lifecycle_state();


--
-- Name: identities identities_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.identities
    ADD CONSTRAINT identities_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_amr_claims mfa_amr_claims_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_amr_claims
    ADD CONSTRAINT mfa_amr_claims_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: mfa_challenges mfa_challenges_auth_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_challenges
    ADD CONSTRAINT mfa_challenges_auth_factor_id_fkey FOREIGN KEY (factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_factors mfa_factors_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_factors
    ADD CONSTRAINT mfa_factors_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_recovery_code_sets mfa_recovery_code_sets_mfa_factor_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_recovery_code_sets
    ADD CONSTRAINT mfa_recovery_code_sets_mfa_factor_id_fkey FOREIGN KEY (mfa_factor_id) REFERENCES auth.mfa_factors(id) ON DELETE CASCADE;


--
-- Name: mfa_recovery_code_sets mfa_recovery_code_sets_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_recovery_code_sets
    ADD CONSTRAINT mfa_recovery_code_sets_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mfa_recovery_codes mfa_recovery_codes_mfa_recovery_code_set_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.mfa_recovery_codes
    ADD CONSTRAINT mfa_recovery_codes_mfa_recovery_code_set_id_fkey FOREIGN KEY (mfa_recovery_code_set_id) REFERENCES auth.mfa_recovery_code_sets(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_authorizations oauth_authorizations_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_authorizations
    ADD CONSTRAINT oauth_authorizations_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_client_id_fkey FOREIGN KEY (client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: oauth_consents oauth_consents_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.oauth_consents
    ADD CONSTRAINT oauth_consents_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: one_time_tokens one_time_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.one_time_tokens
    ADD CONSTRAINT one_time_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: refresh_tokens refresh_tokens_session_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.refresh_tokens
    ADD CONSTRAINT refresh_tokens_session_id_fkey FOREIGN KEY (session_id) REFERENCES auth.sessions(id) ON DELETE CASCADE;


--
-- Name: saml_providers saml_providers_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_providers
    ADD CONSTRAINT saml_providers_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_flow_state_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_flow_state_id_fkey FOREIGN KEY (flow_state_id) REFERENCES auth.flow_state(id) ON DELETE CASCADE;


--
-- Name: saml_relay_states saml_relay_states_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.saml_relay_states
    ADD CONSTRAINT saml_relay_states_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: scim_tokens scim_tokens_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.scim_tokens
    ADD CONSTRAINT scim_tokens_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: scim_users scim_users_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.scim_users
    ADD CONSTRAINT scim_users_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: scim_users scim_users_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.scim_users
    ADD CONSTRAINT scim_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE SET NULL;


--
-- Name: sessions sessions_oauth_client_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_oauth_client_id_fkey FOREIGN KEY (oauth_client_id) REFERENCES auth.oauth_clients(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sessions
    ADD CONSTRAINT sessions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: sso_domains sso_domains_sso_provider_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.sso_domains
    ADD CONSTRAINT sso_domains_sso_provider_id_fkey FOREIGN KEY (sso_provider_id) REFERENCES auth.sso_providers(id) ON DELETE CASCADE;


--
-- Name: webauthn_challenges webauthn_challenges_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_challenges
    ADD CONSTRAINT webauthn_challenges_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: webauthn_credentials webauthn_credentials_user_id_fkey; Type: FK CONSTRAINT; Schema: auth; Owner: -
--

ALTER TABLE ONLY auth.webauthn_credentials
    ADD CONSTRAINT webauthn_credentials_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: annonces annonces_classe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annonces
    ADD CONSTRAINT annonces_classe_id_fkey FOREIGN KEY (classe_id) REFERENCES public.classes(id);


--
-- Name: annonces annonces_publie_par_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.annonces
    ADD CONSTRAINT annonces_publie_par_fkey FOREIGN KEY (publie_par) REFERENCES public.utilisateurs(id);


--
-- Name: avances_salaires avances_salaires_accorde_par_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avances_salaires
    ADD CONSTRAINT avances_salaires_accorde_par_fkey FOREIGN KEY (accorde_par) REFERENCES public.utilisateurs(id) ON DELETE SET NULL;


--
-- Name: avances_salaires avances_salaires_personnel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.avances_salaires
    ADD CONSTRAINT avances_salaires_personnel_id_fkey FOREIGN KEY (personnel_id) REFERENCES public.personnels(id) ON DELETE CASCADE;


--
-- Name: budget_previsionnel budget_previsionnel_categorie_code_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.budget_previsionnel
    ADD CONSTRAINT budget_previsionnel_categorie_code_fkey FOREIGN KEY (categorie_code) REFERENCES public.categories_depenses(code);


--
-- Name: classes classes_annee_scolaire_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_annee_scolaire_id_fkey FOREIGN KEY (annee_scolaire_id) REFERENCES public.annees_scolaires(id);


--
-- Name: classes classes_titulaire_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.classes
    ADD CONSTRAINT classes_titulaire_id_fkey FOREIGN KEY (titulaire_id) REFERENCES public.personnels(id);


--
-- Name: commandes_fournitures commandes_fournitures_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commandes_fournitures
    ADD CONSTRAINT commandes_fournitures_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles_librairie(id);


--
-- Name: commandes_fournitures commandes_fournitures_preinscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commandes_fournitures
    ADD CONSTRAINT commandes_fournitures_preinscription_id_fkey FOREIGN KEY (preinscription_id) REFERENCES public.preinscriptions(id) ON DELETE CASCADE;


--
-- Name: commandes_librairie_articles commandes_librairie_articles_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commandes_librairie_articles
    ADD CONSTRAINT commandes_librairie_articles_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles_librairie(id);


--
-- Name: commandes_librairie_articles commandes_librairie_articles_commande_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commandes_librairie_articles
    ADD CONSTRAINT commandes_librairie_articles_commande_id_fkey FOREIGN KEY (commande_id) REFERENCES public.commandes_librairie(id) ON DELETE CASCADE;


--
-- Name: commandes_librairie commandes_librairie_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.commandes_librairie
    ADD CONSTRAINT commandes_librairie_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.parents(id) ON DELETE CASCADE;


--
-- Name: conges_personnel conges_personnel_approuve_par_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conges_personnel
    ADD CONSTRAINT conges_personnel_approuve_par_fkey FOREIGN KEY (approuve_par) REFERENCES public.utilisateurs(id) ON DELETE SET NULL;


--
-- Name: conges_personnel conges_personnel_personnel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.conges_personnel
    ADD CONSTRAINT conges_personnel_personnel_id_fkey FOREIGN KEY (personnel_id) REFERENCES public.personnels(id) ON DELETE CASCADE;


--
-- Name: contrats_personnel contrats_personnel_personnel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.contrats_personnel
    ADD CONSTRAINT contrats_personnel_personnel_id_fkey FOREIGN KEY (personnel_id) REFERENCES public.personnels(id) ON DELETE CASCADE;


--
-- Name: depenses depenses_saisi_par_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.depenses
    ADD CONSTRAINT depenses_saisi_par_fkey FOREIGN KEY (saisi_par) REFERENCES public.utilisateurs(id) ON DELETE SET NULL;


--
-- Name: depenses depenses_valide_par_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.depenses
    ADD CONSTRAINT depenses_valide_par_fkey FOREIGN KEY (valide_par) REFERENCES public.utilisateurs(id) ON DELETE SET NULL;


--
-- Name: devoirs devoirs_enseignement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.devoirs
    ADD CONSTRAINT devoirs_enseignement_id_fkey FOREIGN KEY (enseignement_id) REFERENCES public.enseignements(id);


--
-- Name: echeances_paiement echeances_paiement_preinscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echeances_paiement
    ADD CONSTRAINT echeances_paiement_preinscription_id_fkey FOREIGN KEY (preinscription_id) REFERENCES public.preinscriptions(id) ON DELETE CASCADE;


--
-- Name: echeances_paiement echeances_paiement_reinscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.echeances_paiement
    ADD CONSTRAINT echeances_paiement_reinscription_id_fkey FOREIGN KEY (reinscription_id) REFERENCES public.reinscriptions(id);


--
-- Name: eleves eleves_classe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eleves
    ADD CONSTRAINT eleves_classe_id_fkey FOREIGN KEY (classe_id) REFERENCES public.classes(id);


--
-- Name: eleves eleves_utilisateur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.eleves
    ADD CONSTRAINT eleves_utilisateur_id_fkey FOREIGN KEY (utilisateur_id) REFERENCES public.utilisateurs(id) ON DELETE CASCADE;


--
-- Name: emprunts_bibliotheque emprunts_bibliotheque_eleve_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emprunts_bibliotheque
    ADD CONSTRAINT emprunts_bibliotheque_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES public.eleves(id) ON DELETE CASCADE;


--
-- Name: emprunts_bibliotheque emprunts_bibliotheque_livre_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.emprunts_bibliotheque
    ADD CONSTRAINT emprunts_bibliotheque_livre_id_fkey FOREIGN KEY (livre_id) REFERENCES public.livres_bibliotheque(id) ON DELETE CASCADE;


--
-- Name: enseignements enseignements_annee_scolaire_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enseignements
    ADD CONSTRAINT enseignements_annee_scolaire_id_fkey FOREIGN KEY (annee_scolaire_id) REFERENCES public.annees_scolaires(id);


--
-- Name: enseignements enseignements_classe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enseignements
    ADD CONSTRAINT enseignements_classe_id_fkey FOREIGN KEY (classe_id) REFERENCES public.classes(id);


--
-- Name: enseignements enseignements_enseignant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enseignements
    ADD CONSTRAINT enseignements_enseignant_id_fkey FOREIGN KEY (enseignant_id) REFERENCES public.personnels(id);


--
-- Name: enseignements enseignements_matiere_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.enseignements
    ADD CONSTRAINT enseignements_matiere_id_fkey FOREIGN KEY (matiere_id) REFERENCES public.matieres(id);


--
-- Name: examens_eleves examens_eleves_eleve_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examens_eleves
    ADD CONSTRAINT examens_eleves_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES public.eleves(id) ON DELETE CASCADE;


--
-- Name: examens_eleves examens_eleves_examen_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examens_eleves
    ADD CONSTRAINT examens_eleves_examen_id_fkey FOREIGN KEY (examen_id) REFERENCES public.examens(id) ON DELETE CASCADE;


--
-- Name: examens examens_enseignement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.examens
    ADD CONSTRAINT examens_enseignement_id_fkey FOREIGN KEY (enseignement_id) REFERENCES public.enseignements(id);


--
-- Name: frais_scolaires frais_scolaires_annee_scolaire_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.frais_scolaires
    ADD CONSTRAINT frais_scolaires_annee_scolaire_id_fkey FOREIGN KEY (annee_scolaire_id) REFERENCES public.annees_scolaires(id);


--
-- Name: inscriptions inscriptions_annee_scolaire_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions
    ADD CONSTRAINT inscriptions_annee_scolaire_id_fkey FOREIGN KEY (annee_scolaire_id) REFERENCES public.annees_scolaires(id);


--
-- Name: inscriptions_cantine inscriptions_cantine_eleve_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions_cantine
    ADD CONSTRAINT inscriptions_cantine_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES public.eleves(id) ON DELETE CASCADE;


--
-- Name: inscriptions inscriptions_eleve_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions
    ADD CONSTRAINT inscriptions_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES public.eleves(id) ON DELETE CASCADE;


--
-- Name: inscriptions inscriptions_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions
    ADD CONSTRAINT inscriptions_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.parents(id) ON DELETE CASCADE;


--
-- Name: inscriptions inscriptions_preinscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions
    ADD CONSTRAINT inscriptions_preinscription_id_fkey FOREIGN KEY (preinscription_id) REFERENCES public.preinscriptions(id) ON DELETE CASCADE;


--
-- Name: inscriptions_transport inscriptions_transport_eleve_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions_transport
    ADD CONSTRAINT inscriptions_transport_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES public.eleves(id) ON DELETE CASCADE;


--
-- Name: inscriptions_transport inscriptions_transport_ligne_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inscriptions_transport
    ADD CONSTRAINT inscriptions_transport_ligne_id_fkey FOREIGN KEY (ligne_id) REFERENCES public.lignes_transport(id);


--
-- Name: lecons lecons_enseignement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lecons
    ADD CONSTRAINT lecons_enseignement_id_fkey FOREIGN KEY (enseignement_id) REFERENCES public.enseignements(id);


--
-- Name: lien_parent_eleve lien_parent_eleve_eleve_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lien_parent_eleve
    ADD CONSTRAINT lien_parent_eleve_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES public.eleves(id) ON DELETE CASCADE;


--
-- Name: lien_parent_eleve lien_parent_eleve_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lien_parent_eleve
    ADD CONSTRAINT lien_parent_eleve_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.parents(id) ON DELETE CASCADE;


--
-- Name: lignes_transport lignes_transport_bus_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.lignes_transport
    ADD CONSTRAINT lignes_transport_bus_id_fkey FOREIGN KEY (bus_id) REFERENCES public.bus(id);


--
-- Name: logs_activites logs_activites_utilisateur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.logs_activites
    ADD CONSTRAINT logs_activites_utilisateur_id_fkey FOREIGN KEY (utilisateur_id) REFERENCES public.utilisateurs(id);


--
-- Name: messages messages_destinataire_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_destinataire_id_fkey FOREIGN KEY (destinataire_id) REFERENCES public.utilisateurs(id) ON DELETE CASCADE;


--
-- Name: messages messages_expediteur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_expediteur_id_fkey FOREIGN KEY (expediteur_id) REFERENCES public.utilisateurs(id) ON DELETE CASCADE;


--
-- Name: mouvements_caisse mouvements_caisse_saisi_par_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mouvements_caisse
    ADD CONSTRAINT mouvements_caisse_saisi_par_fkey FOREIGN KEY (saisi_par) REFERENCES public.utilisateurs(id) ON DELETE SET NULL;


--
-- Name: mouvements_caisse mouvements_caisse_valide_par_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mouvements_caisse
    ADD CONSTRAINT mouvements_caisse_valide_par_fkey FOREIGN KEY (valide_par) REFERENCES public.utilisateurs(id) ON DELETE SET NULL;


--
-- Name: notes notes_eleve_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES public.eleves(id) ON DELETE CASCADE;


--
-- Name: notes notes_enseignant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_enseignant_id_fkey FOREIGN KEY (enseignant_id) REFERENCES public.personnels(id);


--
-- Name: notes notes_enseignement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notes
    ADD CONSTRAINT notes_enseignement_id_fkey FOREIGN KEY (enseignement_id) REFERENCES public.enseignements(id);


--
-- Name: options_qcm options_qcm_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.options_qcm
    ADD CONSTRAINT options_qcm_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions_qcm(id) ON DELETE CASCADE;


--
-- Name: options_quiz options_quiz_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.options_quiz
    ADD CONSTRAINT options_quiz_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions_quiz(id) ON DELETE CASCADE;


--
-- Name: paiements paiements_eleve_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paiements
    ADD CONSTRAINT paiements_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES public.eleves(id) ON DELETE CASCADE;


--
-- Name: paiements paiements_preinscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paiements
    ADD CONSTRAINT paiements_preinscription_id_fkey FOREIGN KEY (preinscription_id) REFERENCES public.preinscriptions(id);


--
-- Name: paiements paiements_reinscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paiements
    ADD CONSTRAINT paiements_reinscription_id_fkey FOREIGN KEY (reinscription_id) REFERENCES public.reinscriptions(id) ON DELETE CASCADE;


--
-- Name: paiements paiements_saisie_par_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paiements
    ADD CONSTRAINT paiements_saisie_par_fkey FOREIGN KEY (saisie_par) REFERENCES public.utilisateurs(id);


--
-- Name: paiements_salaires paiements_salaires_personnel_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paiements_salaires
    ADD CONSTRAINT paiements_salaires_personnel_id_fkey FOREIGN KEY (personnel_id) REFERENCES public.personnels(id) ON DELETE CASCADE;


--
-- Name: paiements_salaires paiements_salaires_saisie_par_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.paiements_salaires
    ADD CONSTRAINT paiements_salaires_saisie_par_fkey FOREIGN KEY (saisie_par) REFERENCES public.utilisateurs(id);


--
-- Name: parents parents_utilisateur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.parents
    ADD CONSTRAINT parents_utilisateur_id_fkey FOREIGN KEY (utilisateur_id) REFERENCES public.utilisateurs(id) ON DELETE CASCADE;


--
-- Name: participations_quiz participations_quiz_eleve_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participations_quiz
    ADD CONSTRAINT participations_quiz_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES public.eleves(id) ON DELETE CASCADE;


--
-- Name: participations_quiz participations_quiz_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participations_quiz
    ADD CONSTRAINT participations_quiz_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quiz(id) ON DELETE CASCADE;


--
-- Name: personnels personnels_utilisateur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personnels
    ADD CONSTRAINT personnels_utilisateur_id_fkey FOREIGN KEY (utilisateur_id) REFERENCES public.utilisateurs(id) ON DELETE CASCADE;


--
-- Name: preinscription_cantine preinscription_cantine_menu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preinscription_cantine
    ADD CONSTRAINT preinscription_cantine_menu_id_fkey FOREIGN KEY (menu_id) REFERENCES public.cantine_menus(id);


--
-- Name: preinscription_cantine preinscription_cantine_preinscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preinscription_cantine
    ADD CONSTRAINT preinscription_cantine_preinscription_id_fkey FOREIGN KEY (preinscription_id) REFERENCES public.preinscriptions(id) ON DELETE CASCADE;


--
-- Name: preinscription_transport preinscription_transport_ligne_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preinscription_transport
    ADD CONSTRAINT preinscription_transport_ligne_id_fkey FOREIGN KEY (ligne_id) REFERENCES public.lignes_transport(id);


--
-- Name: preinscription_transport preinscription_transport_preinscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preinscription_transport
    ADD CONSTRAINT preinscription_transport_preinscription_id_fkey FOREIGN KEY (preinscription_id) REFERENCES public.preinscriptions(id) ON DELETE CASCADE;


--
-- Name: preinscriptions preinscriptions_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preinscriptions
    ADD CONSTRAINT preinscriptions_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.parents(id) ON DELETE CASCADE;


--
-- Name: preinscriptions preinscriptions_traite_par_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.preinscriptions
    ADD CONSTRAINT preinscriptions_traite_par_fkey FOREIGN KEY (traite_par) REFERENCES public.utilisateurs(id);


--
-- Name: presences presences_classe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presences
    ADD CONSTRAINT presences_classe_id_fkey FOREIGN KEY (classe_id) REFERENCES public.classes(id);


--
-- Name: presences presences_eleve_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presences
    ADD CONSTRAINT presences_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES public.eleves(id) ON DELETE CASCADE;


--
-- Name: presences presences_enseignant_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presences
    ADD CONSTRAINT presences_enseignant_id_fkey FOREIGN KEY (enseignant_id) REFERENCES public.personnels(id);


--
-- Name: presences_transport presences_transport_eleve_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.presences_transport
    ADD CONSTRAINT presences_transport_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES public.eleves(id) ON DELETE CASCADE;


--
-- Name: questions_qcm questions_qcm_examen_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions_qcm
    ADD CONSTRAINT questions_qcm_examen_id_fkey FOREIGN KEY (examen_id) REFERENCES public.examens(id) ON DELETE CASCADE;


--
-- Name: questions_quiz questions_quiz_categorie_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions_quiz
    ADD CONSTRAINT questions_quiz_categorie_id_fkey FOREIGN KEY (categorie_id) REFERENCES public.categories_quiz(id) ON DELETE CASCADE;


--
-- Name: questions_quiz questions_quiz_created_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions_quiz
    ADD CONSTRAINT questions_quiz_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.utilisateurs(id);


--
-- Name: questions_quiz questions_quiz_enseignement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.questions_quiz
    ADD CONSTRAINT questions_quiz_enseignement_id_fkey FOREIGN KEY (enseignement_id) REFERENCES public.enseignements(id) ON DELETE CASCADE;


--
-- Name: quiz quiz_enseignement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz
    ADD CONSTRAINT quiz_enseignement_id_fkey FOREIGN KEY (enseignement_id) REFERENCES public.enseignements(id) ON DELETE CASCADE;


--
-- Name: quiz_questions quiz_questions_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT quiz_questions_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions_quiz(id) ON DELETE CASCADE;


--
-- Name: quiz_questions quiz_questions_quiz_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.quiz_questions
    ADD CONSTRAINT quiz_questions_quiz_id_fkey FOREIGN KEY (quiz_id) REFERENCES public.quiz(id) ON DELETE CASCADE;


--
-- Name: recus recus_eleve_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recus
    ADD CONSTRAINT recus_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES public.eleves(id) ON DELETE CASCADE;


--
-- Name: recus recus_paiement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recus
    ADD CONSTRAINT recus_paiement_id_fkey FOREIGN KEY (paiement_id) REFERENCES public.paiements(id) ON DELETE CASCADE;


--
-- Name: recus recus_preinscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recus
    ADD CONSTRAINT recus_preinscription_id_fkey FOREIGN KEY (preinscription_id) REFERENCES public.preinscriptions(id) ON DELETE SET NULL;


--
-- Name: recus recus_reinscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.recus
    ADD CONSTRAINT recus_reinscription_id_fkey FOREIGN KEY (reinscription_id) REFERENCES public.reinscriptions(id) ON DELETE SET NULL;


--
-- Name: reinscriptions reinscriptions_annee_scolaire_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reinscriptions
    ADD CONSTRAINT reinscriptions_annee_scolaire_id_fkey FOREIGN KEY (annee_scolaire_id) REFERENCES public.annees_scolaires(id);


--
-- Name: reinscriptions reinscriptions_classe_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reinscriptions
    ADD CONSTRAINT reinscriptions_classe_id_fkey FOREIGN KEY (classe_id) REFERENCES public.classes(id);


--
-- Name: reinscriptions reinscriptions_eleve_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reinscriptions
    ADD CONSTRAINT reinscriptions_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES public.eleves(id) ON DELETE CASCADE;


--
-- Name: reinscriptions reinscriptions_inscription_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reinscriptions
    ADD CONSTRAINT reinscriptions_inscription_id_fkey FOREIGN KEY (inscription_id) REFERENCES public.inscriptions(id) ON DELETE CASCADE;


--
-- Name: reinscriptions reinscriptions_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reinscriptions
    ADD CONSTRAINT reinscriptions_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.parents(id) ON DELETE CASCADE;


--
-- Name: remises_familles remises_familles_parent_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.remises_familles
    ADD CONSTRAINT remises_familles_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.parents(id) ON DELETE CASCADE;


--
-- Name: reponses_eleves_qcm reponses_eleves_qcm_eleve_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reponses_eleves_qcm
    ADD CONSTRAINT reponses_eleves_qcm_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES public.eleves(id) ON DELETE CASCADE;


--
-- Name: reponses_eleves_qcm reponses_eleves_qcm_examen_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reponses_eleves_qcm
    ADD CONSTRAINT reponses_eleves_qcm_examen_id_fkey FOREIGN KEY (examen_id) REFERENCES public.examens(id) ON DELETE CASCADE;


--
-- Name: reponses_eleves_qcm reponses_eleves_qcm_option_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reponses_eleves_qcm
    ADD CONSTRAINT reponses_eleves_qcm_option_id_fkey FOREIGN KEY (option_id) REFERENCES public.options_qcm(id);


--
-- Name: reponses_eleves_qcm reponses_eleves_qcm_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reponses_eleves_qcm
    ADD CONSTRAINT reponses_eleves_qcm_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions_qcm(id);


--
-- Name: reponses_quiz reponses_quiz_option_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reponses_quiz
    ADD CONSTRAINT reponses_quiz_option_id_fkey FOREIGN KEY (option_id) REFERENCES public.options_quiz(id) ON DELETE CASCADE;


--
-- Name: reponses_quiz reponses_quiz_participation_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reponses_quiz
    ADD CONSTRAINT reponses_quiz_participation_id_fkey FOREIGN KEY (participation_id) REFERENCES public.participations_quiz(id) ON DELETE CASCADE;


--
-- Name: reponses_quiz reponses_quiz_question_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reponses_quiz
    ADD CONSTRAINT reponses_quiz_question_id_fkey FOREIGN KEY (question_id) REFERENCES public.questions_quiz(id) ON DELETE CASCADE;


--
-- Name: reservations_cantine reservations_cantine_eleve_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservations_cantine
    ADD CONSTRAINT reservations_cantine_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES public.eleves(id) ON DELETE CASCADE;


--
-- Name: reservations_cantine reservations_cantine_menu_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reservations_cantine
    ADD CONSTRAINT reservations_cantine_menu_id_fkey FOREIGN KEY (menu_id) REFERENCES public.menus_cantine(id);


--
-- Name: reserves_cantine reserves_cantine_eleve_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reserves_cantine
    ADD CONSTRAINT reserves_cantine_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES public.eleves(id) ON DELETE CASCADE;


--
-- Name: sessions sessions_utilisateur_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_utilisateur_id_fkey FOREIGN KEY (utilisateur_id) REFERENCES public.utilisateurs(id) ON DELETE CASCADE;


--
-- Name: soumissions_devoirs soumissions_devoirs_devoir_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.soumissions_devoirs
    ADD CONSTRAINT soumissions_devoirs_devoir_id_fkey FOREIGN KEY (devoir_id) REFERENCES public.devoirs(id) ON DELETE CASCADE;


--
-- Name: soumissions_devoirs soumissions_devoirs_eleve_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.soumissions_devoirs
    ADD CONSTRAINT soumissions_devoirs_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES public.eleves(id) ON DELETE CASCADE;


--
-- Name: transactions_cantine transactions_cantine_eleve_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.transactions_cantine
    ADD CONSTRAINT transactions_cantine_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES public.eleves(id) ON DELETE CASCADE;


--
-- Name: ventes_librairie ventes_librairie_article_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ventes_librairie
    ADD CONSTRAINT ventes_librairie_article_id_fkey FOREIGN KEY (article_id) REFERENCES public.articles_librairie(id) ON DELETE CASCADE;


--
-- Name: ventes_librairie ventes_librairie_eleve_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ventes_librairie
    ADD CONSTRAINT ventes_librairie_eleve_id_fkey FOREIGN KEY (eleve_id) REFERENCES public.eleves(id);


--
-- Name: ventes_librairie ventes_librairie_vendu_par_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ventes_librairie
    ADD CONSTRAINT ventes_librairie_vendu_par_fkey FOREIGN KEY (vendu_par) REFERENCES public.utilisateurs(id);


--
-- Name: bucket_lifecycle_states bucket_lifecycle_states_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.bucket_lifecycle_states
    ADD CONSTRAINT bucket_lifecycle_states_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id) ON DELETE CASCADE;


--
-- Name: objects objects_bucketId_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.objects
    ADD CONSTRAINT "objects_bucketId_fkey" FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads s3_multipart_uploads_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads
    ADD CONSTRAINT s3_multipart_uploads_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets(id);


--
-- Name: s3_multipart_uploads_parts s3_multipart_uploads_parts_upload_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.s3_multipart_uploads_parts
    ADD CONSTRAINT s3_multipart_uploads_parts_upload_id_fkey FOREIGN KEY (upload_id) REFERENCES storage.s3_multipart_uploads(id) ON DELETE CASCADE;


--
-- Name: vector_indexes vector_indexes_bucket_id_fkey; Type: FK CONSTRAINT; Schema: storage; Owner: -
--

ALTER TABLE ONLY storage.vector_indexes
    ADD CONSTRAINT vector_indexes_bucket_id_fkey FOREIGN KEY (bucket_id) REFERENCES storage.buckets_vectors(id);


--
-- Name: audit_log_entries; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.audit_log_entries ENABLE ROW LEVEL SECURITY;

--
-- Name: flow_state; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.flow_state ENABLE ROW LEVEL SECURITY;

--
-- Name: identities; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.identities ENABLE ROW LEVEL SECURITY;

--
-- Name: instances; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.instances ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_amr_claims; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_amr_claims ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_challenges; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_challenges ENABLE ROW LEVEL SECURITY;

--
-- Name: mfa_factors; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.mfa_factors ENABLE ROW LEVEL SECURITY;

--
-- Name: one_time_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.one_time_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: refresh_tokens; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: saml_relay_states; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.saml_relay_states ENABLE ROW LEVEL SECURITY;

--
-- Name: schema_migrations; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.schema_migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: sessions; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_domains; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_domains ENABLE ROW LEVEL SECURITY;

--
-- Name: sso_providers; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.sso_providers ENABLE ROW LEVEL SECURITY;

--
-- Name: users; Type: ROW SECURITY; Schema: auth; Owner: -
--

ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;

--
-- Name: recus; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.recus ENABLE ROW LEVEL SECURITY;

--
-- Name: messages; Type: ROW SECURITY; Schema: realtime; Owner: -
--

ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

--
-- Name: objects Permettre l'upload des fichiers; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Permettre l'upload des fichiers" ON storage.objects FOR INSERT TO authenticated, anon WITH CHECK ((bucket_id = 'preinscriptions'::text));


--
-- Name: objects Permettre la lecture des fichiers; Type: POLICY; Schema: storage; Owner: -
--

CREATE POLICY "Permettre la lecture des fichiers" ON storage.objects FOR SELECT TO authenticated, anon USING ((bucket_id = 'preinscriptions'::text));


--
-- Name: bucket_lifecycle_states; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.bucket_lifecycle_states ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_analytics; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_analytics ENABLE ROW LEVEL SECURITY;

--
-- Name: buckets_vectors; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.buckets_vectors ENABLE ROW LEVEL SECURITY;

--
-- Name: lifecycle_abandoned_artifacts; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.lifecycle_abandoned_artifacts ENABLE ROW LEVEL SECURITY;

--
-- Name: migrations; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.migrations ENABLE ROW LEVEL SECURITY;

--
-- Name: objects; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads ENABLE ROW LEVEL SECURITY;

--
-- Name: s3_multipart_uploads_parts; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.s3_multipart_uploads_parts ENABLE ROW LEVEL SECURITY;

--
-- Name: vector_indexes; Type: ROW SECURITY; Schema: storage; Owner: -
--

ALTER TABLE storage.vector_indexes ENABLE ROW LEVEL SECURITY;

--
-- Name: supabase_realtime; Type: PUBLICATION; Schema: -; Owner: -
--

CREATE PUBLICATION supabase_realtime WITH (publish = 'insert, update, delete, truncate');


--
-- Name: issue_graphql_placeholder; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_graphql_placeholder ON sql_drop
         WHEN TAG IN ('DROP EXTENSION')
   EXECUTE FUNCTION extensions.set_graphql_placeholder();


--
-- Name: issue_pg_cron_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_cron_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_cron_access();


--
-- Name: issue_pg_graphql_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_graphql_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_graphql_access();


--
-- Name: issue_pg_net_access; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER issue_pg_net_access ON ddl_command_end
         WHEN TAG IN ('CREATE EXTENSION')
   EXECUTE FUNCTION extensions.grant_pg_net_access();


--
-- Name: pgrst_ddl_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_ddl_watch ON ddl_command_end
   EXECUTE FUNCTION extensions.pgrst_ddl_watch();


--
-- Name: pgrst_drop_watch; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER pgrst_drop_watch ON sql_drop
   EXECUTE FUNCTION extensions.pgrst_drop_watch();


--
-- PostgreSQL database dump complete
--

\unrestrict wRmLr9R6GSaHcZhTkVB7M5ELLh6IRneTtDvpKDFdAGErOzKOSsqbIwXZxhoXDf0

