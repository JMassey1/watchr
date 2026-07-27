# Deploying watch3r

This directory holds the deploy artifacts for running watch3r on your
homeserver. The `test` region is the first environment; the setup is
parameterized so a `prod` region can be added later without changing files.

## Architecture

```
push to `test` branch
        │
        ▼
Forgejo Actions runner  ──build──►  watch3r-server:test , watch3r-web:test
(.forgejo/workflows/                (Forgejo container registry:
 deploy-test.yml)                    orbiter.taild7aa61.ts.net/jordan/…)
        │                                        ▲
        │ POST webhook                           │ pull
        ▼                                        │
Portainer stack "watch3r-test"  ─────────────────┘
 (Git stack -> deploy/docker-compose.yml)
        │
        ▼  runs on orbiter.taild7aa61.ts.net
   migrate (drizzle-kit push) ─► server ─► web
   + postgres + minio + minio-setup
```

- **Images**: built by CI, stored in the Forgejo registry. Portainer only pulls.
- **`web` image is region-specific**: `VITE_SERVER_URL` is baked in at build time
  (`http://orbiter.taild7aa61.ts.net:13000`). Changing the server URL requires a rebuild.
- **Schema**: a one-shot `migrate` service runs `drizzle-kit push` before the
  server starts (reuses the server image, which contains drizzle-kit). This is
  fine for a throwaway test DB; move to generated migration files before prod.

## Test region facts

| Thing | Value |
|---|---|
| Host | `orbiter.taild7aa61.ts.net` (Tailscale) |
| Web (app) | `http://orbiter.taild7aa61.ts.net:13001` |
| Server (API) | `http://orbiter.taild7aa61.ts.net:13000` |
| MinIO API | `http://orbiter.taild7aa61.ts.net:19000` |
| MinIO console | `http://orbiter.taild7aa61.ts.net:19001` |
| Postgres | `orbiter.taild7aa61.ts.net:15432` |
| Image tag | `test` (moving) + `test-<sha>` (immutable) |

---

## One-time setup

Everything below runs on the server / in the Forgejo & Portainer UIs.

### 1. Forgejo — enable the container registry
Confirm the built-in registry is enabled and you can log in:

```sh
docker login orbiter.taild7aa61.ts.net -u <your-user>
# password = a Forgejo access token (or personal token) with package read+write
```

### 2. Forgejo — repo Actions secrets
Repo → Settings → Actions → Secrets. Add:

| Secret | Value |
|---|---|
| `REGISTRY_USER` | Forgejo username (used for registry push **and** the git clone) |
| `REGISTRY_TOKEN` | access token with `write:package` + `read:repository` |
| `PORTAINER_WEBHOOK_TEST` | the Portainer stack webhook URL (from step 5) |

The workflow uses `runs-on: docker` and runs the job inside
`ghcr.io/catthehacker/ubuntu:act-22.04` (docker CLI + node + git), talking to
the dind daemon via `DOCKER_HOST`. No changes to `runner-config.yml` are needed.

### 3. Forgejo runner — let dind resolve the registry host
The image push is performed by the **dind daemon**, which uses Docker's default
DNS and cannot resolve the `*.ts.net` name. Add an `extra_hosts` entry to the
`docker-in-docker` service in your Forgejo compose, mapping the registry host to
this machine's Tailscale IP:

```yaml
  docker-in-docker:
    image: docker:dind
    # ...existing config...
    extra_hosts:
      - "orbiter.taild7aa61.ts.net:100.97.177.60"
```

Then recreate it: `docker compose up -d docker-in-docker`.

No `insecure-registries` config is needed anywhere — Forgejo is fronted by
`tailscale serve`, so the registry has a valid (Let's Encrypt) TLS cert that the
dind daemon and the Portainer host already trust. (The job container and dind
daemon reach the registry via the `--add-host` entries baked into the workflow.)

### 4. Portainer — add the registry
Registries → Add registry → Custom registry.
- URL: `orbiter.taild7aa61.ts.net`
- Authentication: on, username + token from step 1.

This lets Portainer pull the private images.

### 5. Portainer — create the Git stack
Stacks → Add stack → **Repository**:
- Name: `watch3r-test`
- Repository URL: your Forgejo repo URL
- Reference: `refs/heads/test`
- Compose path: `deploy/docker-compose.yml`
- Authentication: on, Forgejo username + token (private repo)
- Enable **"Re-pull image and redeploy"** / GitOps updates
- Enable **Webhook** → copy the generated URL into the
  `PORTAINER_WEBHOOK_TEST` Forgejo secret (step 2)

Then paste the environment variables from `deploy/test.env.example` into the
stack's **Environment variables** section, filling in real secret values
(`BETTER_AUTH_SECRET`, `TMDB_API_READ_ACCESS_TOKEN`, `POSTGRES_PASSWORD`,
`MINIO_ROOT_PASSWORD`). Deploy the stack.

---

## Deploying

```sh
git checkout -b test        # first time
git push -u origin test     # subsequent: git push origin test
```

CI builds + pushes images, then hits the webhook. Portainer re-pulls `test` and
redeploys: `migrate` syncs the schema, then `server`, then `web`.

App: **http://orbiter.taild7aa61.ts.net:13001**

You can also redeploy without a code change from the Portainer stack page
("Pull and redeploy"), or re-run the workflow via `workflow_dispatch`.

---

## Adding a prod region later

`deploy/docker-compose.yml` is environment-agnostic. To add prod:
1. Add a `deploy-prod` workflow (trigger on `prod` branch or a tag) that builds
   with `VITE_SERVER_URL` = the prod URL and pushes `:prod` tags.
2. Create a second Portainer stack (`watch3r-prod`) pointing at the same compose
   path with its own env vars (`DEPLOY_ENV=prod`, `IMAGE_TAG=prod`, prod URLs,
   non-`1`-prefixed ports). Volumes/containers are namespaced by `DEPLOY_ENV`, so
   both stacks coexist on one host.
3. Before prod: replace `drizzle-kit push` with generated migration files
   (`drizzle-kit generate`) + a programmatic migrator, to avoid destructive
   auto-sync.

## Known caveats
- **Secrets currently committed** in `apps/server/.env`, `apps/web/.env`, and root
  `.env` (incl. `BETTER_AUTH_SECRET`, TMDB token, `FORGEJO_TOKEN`). Rotate them and
  keep secrets only in Portainer. These files are not used by this deploy.
- **`drizzle-kit push`** can prompt on destructive schema changes; on a fresh test
  DB it applies cleanly. Watch the `migrate` container logs on first deploy.
- **MinIO avatar/cover buckets are public-read** by design — acceptable over Tailscale.
