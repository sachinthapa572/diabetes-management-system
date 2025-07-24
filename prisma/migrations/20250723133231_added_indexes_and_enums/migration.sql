-- CreateIndex
CREATE INDEX "AuditLog_user_id_timestamp_idx" ON "AuditLog"("user_id", "timestamp");

-- CreateIndex
CREATE INDEX "Medication_user_id_idx" ON "Medication"("user_id");
