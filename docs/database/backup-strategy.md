# Backup Strategy

**Last updated:** 2026-07-04

## Backup Philosophy

| Principle | Policy |
|-----------|--------|
| **RPO (Recovery Point Objective)** | Maximum 1 hour of data loss |
| **RTO (Recovery Time Objective)** | Full system recovery within 4 hours |
| **3-2-1 Rule** | 3 copies, 2 different media, 1 offsite |
| **Testing** | Recovery drill quarterly |

---

## Backup Types

### 1. Full Database Backup

| Attribute | Detail |
|-----------|--------|
| **Frequency** | Daily |
| **Time** | 2:00 AM local (lowest traffic) |
| **Tool** | `mysqldump` or Percona XtraBackup |
| **Type** | Physical backup (XtraBackup) for faster restore |
| **Retention** | 30 daily backups |

**Command (conceptual):**
```pseudo
xtrabackup --backup --target-dir=/backups/daily/$(date +%Y-%m-%d) --user=backup --password=***
```

### 2. Binary Log Backup (Point-in-Time Recovery)

| Attribute | Detail |
|-----------|--------|
| **Frequency** | Continuous (every 60 seconds) |
| **Tool** | MySQL binary log |
| **Retention** | 48 hours of binary logs |
| **Storage** | Separate from database server |

**Purpose:** Enables recovery to any point within the last 48 hours.

### 3. Transaction Log Backup (Prisma Migrations)

| Attribute | Detail |
|-----------|--------|
| **Frequency** | After every schema migration |
| **Tool** | `prisma migrate diff` |
| **Retention** | Permanent (version controlled) |
| **Storage** | GitHub repository |

**Purpose:** Enables schema recovery to any migration point.

---

## Backup Storage

| Backup Type | Primary Location | Secondary (Offsite) | Tertiary |
|-------------|-----------------|--------------------|----------|
| Daily full | Local disk `/backups/daily/` | S3/GCS (encrypted) | — |
| Binary logs | Local disk `/backups/binlog/` | S3/GCS (encrypted) | — |
| Schema migrations | GitHub | — | — |

### Encryption

All backups stored offsite must be encrypted:

```
Backup → gzip → AES-256 encrypt → Upload to S3
```

### Retention Schedule

| Backup Age | Action |
|------------|--------|
| 0-7 days | Daily backups retained |
| 7-30 days | Weekly backups retained |
| 30-365 days | Monthly backups retained |
| > 1 year | Annual backup retained for compliance |

---

## Recovery Procedures

### Scenario 1: Accidental Data Deletion

```
1. Identify the approximate time of deletion
2. Restore full backup from before deletion time
3. Apply binary logs up to (but not including) the deletion event
4. Export the lost data
5. Import into production
```

**Estimated time:** 30-60 minutes

### Scenario 2: Database Corruption

```
1. Stop application
2. Restore latest full backup to a clean instance
3. Apply binary logs to the point just before corruption
4. Verify data integrity
5. Point application to restored database
6. Resume application
```

**Estimated time:** 1-2 hours

### Scenario 3: Complete Server Failure

```
1. Provision new database server
2. Restore latest full backup
3. Restore binary logs to current point
4. Update application connection string
5. Verify and resume
```

**Estimated time:** 2-4 hours

### Scenario 4: Schema Migration Failure

```
1. Identify the failed migration
2. Run prisma migrate diff to revert schema
3. Restore data from backup if rollback affected data
4. Apply corrected migration
```

**Estimated time:** 15-30 minutes

---

## Backup Automation

### Daily Backup Script (Conceptual)

```pseudo
#!/bin/bash
DATE=$(date +%Y-%m-%d)
BACKUP_DIR="/backups/daily/$DATE"

# Full backup
xtrabackup --backup --target-dir="$BACKUP_DIR" --user=backup --password=***

# Compress and encrypt
tar -czf - "$BACKUP_DIR" | openssl enc -aes-256-cbc -salt -pass pass:$ENCRYPTION_KEY > "$BACKUP_DIR.tar.gz.enc"

# Upload to S3
aws s3 cp "$BACKUP_DIR.tar.gz.enc" "s3://tableflow-backups/daily/$DATE.tar.gz.enc"

# Verify backup
xtrabackup --verify --target-dir="$BACKUP_DIR"

# Cleanup old backups
find /backups/daily/ -mtime +30 -delete
```

### Binary Log Backup Script

```pseudo
#!/bin/bash
# Run every 60 seconds via cron
mysqlbinlog --read-from-remote-server --host=db --user=backup --password=*** \
  --raw --result-file=/backups/binlog/ --stop-never
```

---

## Backup Monitoring

| Metric | Alert Threshold | Action |
|--------|-----------------|--------|
| Last backup age | > 25 hours | Alert — backup failed |
| Backup size anomaly | > 50% deviation | Investigate data growth |
| S3 upload failure | Any failure | Retry, alert if 3 consecutive failures |
| Binary log gap | > 5 minutes | Alert — possible data loss window |

---

## Recovery Testing

| Frequency | Test | Success Criteria |
|-----------|------|-----------------|
| Monthly | Restore to staging environment | Database operational, data verified |
| Quarterly | Full recovery drill | Complete recovery within RTO |
| Annually | Disaster recovery exercise | Recovery from offsite backup in different region |

---

## Related Documents

- [soft-delete-strategy.md](./soft-delete-strategy.md) — Accidental deletion mitigation
- [performance.md](./performance.md) — Backup impact on performance
- [future-scalability.md](./future-scalability.md) — Backup at scale
