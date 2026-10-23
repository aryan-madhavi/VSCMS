FROM docker.io/library/mysql:8.0

# Copy SQL initialization scripts into the container's init directory.
# Files in /docker-entrypoint-initdb.d/ execute in alphabetical order upon initial startup.
COPY init/01_schema.sql /docker-entrypoint-initdb.d/01_schema.sql
COPY init/02_constraints.sql /docker-entrypoint-initdb.d/02_constraints.sql
COPY init/03_triggers.sql /docker-entrypoint-initdb.d/03_triggers.sql
COPY init/04_views.sql /docker-entrypoint-initdb.d/04_views.sql
COPY init/05_seed_data.sql /docker-entrypoint-initdb.d/05_seed_data.sql

EXPOSE 3306

HEALTHCHECK --interval=10s --timeout=5s --retries=5 \
  CMD ["mysqladmin", "ping", "-h", "localhost"]
