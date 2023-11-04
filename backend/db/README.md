# Migration system

This folder contains the migration system for the database. It uses [dbmate](https://github.com/amacneil/dbmate)

The usage is simple:

```bash
# Create a new migration
dbmate new <migration_name>

# Run migrations
dbmate up

# Rollback migrations
dbmate rollback
```

It needs a environment variable `DATABASE_URL` to be set. You can set it in a `.env` file in the root of the project.