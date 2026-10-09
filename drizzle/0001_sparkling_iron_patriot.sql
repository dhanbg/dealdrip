ALTER TABLE "product_media" ADD COLUMN "file_key" text;--> statement-breakpoint
ALTER TABLE "product_media" ADD COLUMN "mime_type" text;--> statement-breakpoint
ALTER TABLE "product_media" ADD COLUMN "size_bytes" integer;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "order_confirmation_email_sent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "orders" ADD COLUMN "payment_confirmation_email_sent" boolean DEFAULT false NOT NULL;