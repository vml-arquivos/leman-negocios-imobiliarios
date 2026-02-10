CREATE TABLE "ai_property_matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer NOT NULL,
	"property_id" integer NOT NULL,
	"match_score" numeric(5, 2),
	"match_reasons" jsonb,
	"status" varchar(50) DEFAULT 'pending',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "conversations" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer,
	"user_id" integer,
	"channel" varchar(50) DEFAULT 'whatsapp',
	"status" varchar(50) DEFAULT 'open',
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "financing_simulations" (
	"id" serial PRIMARY KEY NOT NULL,
	"lead_id" integer,
	"property_value" bigint,
	"down_payment" bigint,
	"term_months" integer,
	"interest_rate" numeric(5, 2),
	"simulation_result" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "landlords" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"cpf_cnpj" varchar(20),
	"email" varchar,
	"phone" varchar,
	"bank_info" jsonb,
	"commission_rate" numeric(5, 2) DEFAULT '10.00',
	"status" varchar DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "landlords_cpf_cnpj_unique" UNIQUE("cpf_cnpj")
);
--> statement-breakpoint
CREATE TABLE "leads" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(20) NOT NULL,
	"whatsapp" varchar(20),
	"source" varchar(100),
	"stage" varchar(50) DEFAULT 'new',
	"interest_type" varchar(50),
	"budget_min" bigint,
	"budget_max" bigint,
	"preferred_neighborhoods" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"assigned_to" integer,
	"ai_profile" jsonb,
	"ai_score" integer DEFAULT 0,
	"ai_insights" text,
	"last_interaction_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "messages" (
	"id" serial PRIMARY KEY NOT NULL,
	"conversation_id" integer,
	"sender_type" varchar(20),
	"content" text,
	"metadata" jsonb,
	"is_read" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"property_type" varchar(50) NOT NULL,
	"transaction_type" varchar(50) NOT NULL,
	"price" bigint,
	"rental_price" bigint,
	"condo_fee" bigint,
	"iptu" bigint,
	"area" numeric(10, 2),
	"bedrooms" integer,
	"bathrooms" integer,
	"suites" integer,
	"parking_spaces" integer,
	"address" varchar(255),
	"neighborhood" varchar(100),
	"city" varchar(100) DEFAULT 'Brasília',
	"state" varchar(2) DEFAULT 'DF',
	"zip_code" varchar(10),
	"latitude" numeric(10, 8),
	"longitude" numeric(11, 8),
	"features" jsonb DEFAULT '[]'::jsonb,
	"images" jsonb DEFAULT '[]'::jsonb,
	"video_url" text,
	"virtual_tour_url" text,
	"status" varchar(50) DEFAULT 'disponivel',
	"is_featured" boolean DEFAULT false,
	"views_count" integer DEFAULT 0,
	"owner_id" integer,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "property_images" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer NOT NULL,
	"url" text NOT NULL,
	"title" varchar,
	"display_order" integer DEFAULT 0,
	"is_cover" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rental_contracts" (
	"id" serial PRIMARY KEY NOT NULL,
	"property_id" integer,
	"landlord_id" integer,
	"tenant_id" integer,
	"start_date" timestamp NOT NULL,
	"end_date" timestamp NOT NULL,
	"rent_amount" bigint NOT NULL,
	"payment_day" integer DEFAULT 5,
	"status" varchar DEFAULT 'active',
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "rental_payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"contract_id" integer,
	"reference_month" varchar(7),
	"amount_total" bigint,
	"amount_net" bigint,
	"status" varchar DEFAULT 'pending',
	"due_date" timestamp,
	"paid_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"cpf" varchar(20),
	"email" varchar,
	"phone" varchar,
	"status" varchar DEFAULT 'active',
	"created_at" timestamp DEFAULT now(),
	CONSTRAINT "tenants_cpf_unique" UNIQUE("cpf")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"open_id" varchar(255),
	"email" varchar(255) NOT NULL,
	"password" varchar(255),
	"name" varchar(255) NOT NULL,
	"role" varchar(50) DEFAULT 'user',
	"avatar_url" text,
	"phone" varchar(20),
	"last_sign_in_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "users_open_id_unique" UNIQUE("open_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "ai_property_matches" ADD CONSTRAINT "ai_property_matches_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_property_matches" ADD CONSTRAINT "ai_property_matches_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "financing_simulations" ADD CONSTRAINT "financing_simulations_lead_id_leads_id_fk" FOREIGN KEY ("lead_id") REFERENCES "public"."leads"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_to_users_id_fk" FOREIGN KEY ("assigned_to") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_conversations_id_fk" FOREIGN KEY ("conversation_id") REFERENCES "public"."conversations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_images" ADD CONSTRAINT "property_images_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_contracts" ADD CONSTRAINT "rental_contracts_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_contracts" ADD CONSTRAINT "rental_contracts_landlord_id_landlords_id_fk" FOREIGN KEY ("landlord_id") REFERENCES "public"."landlords"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_contracts" ADD CONSTRAINT "rental_contracts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rental_payments" ADD CONSTRAINT "rental_payments_contract_id_rental_contracts_id_fk" FOREIGN KEY ("contract_id") REFERENCES "public"."rental_contracts"("id") ON DELETE no action ON UPDATE no action;