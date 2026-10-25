
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "body_entries": {
                  Row: {
                    "body_fat": number | null,"deleted_at": string | null,"id": string,"local_date": string,"measured_at": string,"measurements": NonNullable<Json>,"notes": string,"owner_id": string,"revision": number,"timezone": string,"weight_kg": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "body_fat"?: number | null,"deleted_at"?: string | null,"id": string,"local_date": string,"measured_at": string,"measurements"?: NonNullable<Json>,"notes"?: string,"owner_id": string,"revision"?: number,"timezone": string,"weight_kg"?: number | null
                  }
                  Update: {
                    "body_fat"?: number | null,"deleted_at"?: string | null,"id"?: string,"local_date"?: string,"measured_at"?: string,"measurements"?: NonNullable<Json>,"notes"?: string,"owner_id"?: string,"revision"?: number,"timezone"?: string,"weight_kg"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "body_entries_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"exercises": {
                  Row: {
                    "aliases": (string)[],"archived": boolean,"created_at": string,"equipment": string,"id": string,"instructions": string,"load_basis": string,"logging_type": string,"multiplier": number,"name": string,"owner_id": string | null,"primary_muscles": (string)[],"secondary_muscles": (string)[],"source": string,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "aliases"?: (string)[],"archived"?: boolean,"created_at"?: string,"equipment": string,"id": string,"instructions": string,"load_basis": string,"logging_type": string,"multiplier": number,"name": string,"owner_id"?: string | null,"primary_muscles": (string)[],"secondary_muscles"?: (string)[],"source"?: string,"version": number
                  }
                  Update: {
                    "aliases"?: (string)[],"archived"?: boolean,"created_at"?: string,"equipment"?: string,"id"?: string,"instructions"?: string,"load_basis"?: string,"logging_type"?: string,"multiplier"?: number,"name"?: string,"owner_id"?: string | null,"primary_muscles"?: (string)[],"secondary_muscles"?: (string)[],"source"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "exercises_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"foods": {
                  Row: {
                    "aliases": (string)[],"archived": boolean,"brand": string,"created_at": string,"id": string,"name": string,"nutrients": NonNullable<Json>,"owner_id": string | null,"reference_quantity": number,"reference_unit": string,"servings": NonNullable<Json>,"source": string,"source_version": string
                  }
                  ComputedFields: never
                  Insert: {
                    "aliases"?: (string)[],"archived"?: boolean,"brand"?: string,"created_at"?: string,"id": string,"name": string,"nutrients": NonNullable<Json>,"owner_id"?: string | null,"reference_quantity": number,"reference_unit": string,"servings"?: NonNullable<Json>,"source": string,"source_version": string
                  }
                  Update: {
                    "aliases"?: (string)[],"archived"?: boolean,"brand"?: string,"created_at"?: string,"id"?: string,"name"?: string,"nutrients"?: NonNullable<Json>,"owner_id"?: string | null,"reference_quantity"?: number,"reference_unit"?: string,"servings"?: NonNullable<Json>,"source"?: string,"source_version"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "foods_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"goals": {
                  Row: {
                    "baseline": number,"baseline_cutoff": string,"deadline": string | null,"exercise_id": string | null,"exercise_version": number | null,"fixed_load_kg": number | null,"goal_type": string,"id": string,"load_basis": string | null,"metric": string,"name": string,"notes": string,"owner_id": string,"range_max": number | null,"range_min": number | null,"revision": number,"start_date": string,"status": string,"target": number
                  }
                  ComputedFields: never
                  Insert: {
                    "baseline": number,"baseline_cutoff": string,"deadline"?: string | null,"exercise_id"?: string | null,"exercise_version"?: number | null,"fixed_load_kg"?: number | null,"goal_type": string,"id": string,"load_basis"?: string | null,"metric": string,"name": string,"notes"?: string,"owner_id": string,"range_max"?: number | null,"range_min"?: number | null,"revision"?: number,"start_date": string,"status"?: string,"target": number
                  }
                  Update: {
                    "baseline"?: number,"baseline_cutoff"?: string,"deadline"?: string | null,"exercise_id"?: string | null,"exercise_version"?: number | null,"fixed_load_kg"?: number | null,"goal_type"?: string,"id"?: string,"load_basis"?: string | null,"metric"?: string,"name"?: string,"notes"?: string,"owner_id"?: string,"range_max"?: number | null,"range_min"?: number | null,"revision"?: number,"start_date"?: string,"status"?: string,"target"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "goals_exercise_id_exercise_version_fkey"
      columns: ["exercise_id","exercise_version"]
isOneToOne: false
      referencedRelation: "exercises"
      referencedColumns: ["id","version"]
    },{
      foreignKeyName: "goals_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"gym_allocations": {
                  Row: {
                    "actor_id": string,"charge_id": string,"created_at": string,"delta_paise": number,"gym_id": string,"id": string,"member_id": string,"operation_id": string,"payment_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id": string,"charge_id": string,"created_at"?: string,"delta_paise": number,"gym_id": string,"id"?: string,"member_id": string,"operation_id": string,"payment_id": string
                  }
                  Update: {
                    "actor_id"?: string,"charge_id"?: string,"created_at"?: string,"delta_paise"?: number,"gym_id"?: string,"id"?: string,"member_id"?: string,"operation_id"?: string,"payment_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "gym_allocations_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "gym_allocations_gym_id_member_id_charge_id_fkey"
      columns: ["gym_id","member_id","charge_id"]
isOneToOne: false
      referencedRelation: "gym_charges"
      referencedColumns: ["gym_id","member_id","id"]
    },{
      foreignKeyName: "gym_allocations_gym_id_member_id_payment_id_fkey"
      columns: ["gym_id","member_id","payment_id"]
isOneToOne: false
      referencedRelation: "gym_payments"
      referencedColumns: ["gym_id","member_id","id"]
    }
                  ]
                },"gym_audit": {
                  Row: {
                    "actor_id": string,"created_at": string,"detail": NonNullable<Json>,"gym_id": string,"id": string,"kind": string,"operation_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id": string,"created_at"?: string,"detail": NonNullable<Json>,"gym_id": string,"id"?: string,"kind": string,"operation_id": string
                  }
                  Update: {
                    "actor_id"?: string,"created_at"?: string,"detail"?: NonNullable<Json>,"gym_id"?: string,"id"?: string,"kind"?: string,"operation_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "gym_audit_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "gym_audit_gym_id_fkey"
      columns: ["gym_id"]
isOneToOne: false
      referencedRelation: "gyms"
      referencedColumns: ["id"]
    }
                  ]
                },"gym_charge_adjustments": {
                  Row: {
                    "actor_id": string,"charge_id": string,"created_at": string,"delta_paise": number,"gym_id": string,"id": string,"member_id": string,"reason": string
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id": string,"charge_id": string,"created_at"?: string,"delta_paise": number,"gym_id": string,"id": string,"member_id": string,"reason": string
                  }
                  Update: {
                    "actor_id"?: string,"charge_id"?: string,"created_at"?: string,"delta_paise"?: number,"gym_id"?: string,"id"?: string,"member_id"?: string,"reason"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "gym_charge_adjustments_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "gym_charge_adjustments_gym_id_member_id_charge_id_fkey"
      columns: ["gym_id","member_id","charge_id"]
isOneToOne: false
      referencedRelation: "gym_charges"
      referencedColumns: ["gym_id","member_id","id"]
    }
                  ]
                },"gym_charges": {
                  Row: {
                    "actor_id": string,"amount_paise": number,"created_at": string,"due_on": string,"gym_id": string,"id": string,"label": string,"member_id": string,"membership_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id": string,"amount_paise": number,"created_at"?: string,"due_on": string,"gym_id": string,"id": string,"label": string,"member_id": string,"membership_id"?: string | null
                  }
                  Update: {
                    "actor_id"?: string,"amount_paise"?: number,"created_at"?: string,"due_on"?: string,"gym_id"?: string,"id"?: string,"label"?: string,"member_id"?: string,"membership_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "gym_charges_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "gym_charges_gym_id_member_id_fkey"
      columns: ["gym_id","member_id"]
isOneToOne: false
      referencedRelation: "gym_members"
      referencedColumns: ["gym_id","id"]
    },{
      foreignKeyName: "gym_charges_gym_id_member_id_membership_id_fkey"
      columns: ["gym_id","member_id","membership_id"]
isOneToOne: false
      referencedRelation: "gym_memberships"
      referencedColumns: ["gym_id","member_id","id"]
    }
                  ]
                },"gym_commands": {
                  Row: {
                    "actor_id": string,"created_at": string,"gym_id": string,"id": string,"input_hash": string,"kind": string,"result": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id": string,"created_at"?: string,"gym_id": string,"id": string,"input_hash": string,"kind": string,"result": NonNullable<Json>
                  }
                  Update: {
                    "actor_id"?: string,"created_at"?: string,"gym_id"?: string,"id"?: string,"input_hash"?: string,"kind"?: string,"result"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "gym_commands_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "gym_commands_gym_id_fkey"
      columns: ["gym_id"]
isOneToOne: false
      referencedRelation: "gyms"
      referencedColumns: ["id"]
    }
                  ]
                },"gym_freezes": {
                  Row: {
                    "actor_id": string,"created_at": string,"decided_by": string | null,"decision_reason": string | null,"ended_early_on": string | null,"ends_on": string,"gym_id": string,"id": string,"member_id": string,"membership_id": string,"reason": string,"requested_ends_on": string | null,"revision": number,"starts_on": string,"status": string
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id": string,"created_at"?: string,"decided_by"?: string | null,"decision_reason"?: string | null,"ended_early_on"?: string | null,"ends_on": string,"gym_id": string,"id": string,"member_id": string,"membership_id": string,"reason": string,"requested_ends_on"?: string | null,"revision"?: number,"starts_on": string,"status": string
                  }
                  Update: {
                    "actor_id"?: string,"created_at"?: string,"decided_by"?: string | null,"decision_reason"?: string | null,"ended_early_on"?: string | null,"ends_on"?: string,"gym_id"?: string,"id"?: string,"member_id"?: string,"membership_id"?: string,"reason"?: string,"requested_ends_on"?: string | null,"revision"?: number,"starts_on"?: string,"status"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "gym_freezes_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "gym_freezes_decided_by_fkey"
      columns: ["decided_by"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "gym_freezes_gym_id_member_id_membership_id_fkey"
      columns: ["gym_id","member_id","membership_id"]
isOneToOne: false
      referencedRelation: "gym_memberships"
      referencedColumns: ["gym_id","member_id","id"]
    }
                  ]
                },"gym_members": {
                  Row: {
                    "age_status": string,"archived": boolean,"created_at": string,"email": string | null,"gym_id": string,"id": string,"joined_on": string,"linked_user_id": string | null,"name": string,"notes": string,"notice_version": string,"number": number,"phone": string | null,"revision": number,"tags": (string)[]
                  }
                  ComputedFields: never
                  Insert: {
                    "age_status": string,"archived"?: boolean,"created_at"?: string,"email"?: string | null,"gym_id": string,"id": string,"joined_on": string,"linked_user_id"?: string | null,"name": string,"notes"?: string,"notice_version": string,"number": number,"phone"?: string | null,"revision"?: number,"tags"?: (string)[]
                  }
                  Update: {
                    "age_status"?: string,"archived"?: boolean,"created_at"?: string,"email"?: string | null,"gym_id"?: string,"id"?: string,"joined_on"?: string,"linked_user_id"?: string | null,"name"?: string,"notes"?: string,"notice_version"?: string,"number"?: number,"phone"?: string | null,"revision"?: number,"tags"?: (string)[]
                  }
                  Relationships: [
                    {
      foreignKeyName: "gym_members_gym_id_fkey"
      columns: ["gym_id"]
isOneToOne: false
      referencedRelation: "gyms"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "gym_members_linked_user_id_fkey"
      columns: ["linked_user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"gym_memberships": {
                  Row: {
                    "actor_id": string,"cancel_reason": string | null,"cancelled_on": string | null,"created_at": string,"ends_on": string,"gym_id": string,"id": string,"member_id": string,"original_ends_on": string,"plan_id": string,"plan_version": number,"renewal_of": string | null,"revision": number,"snapshot": NonNullable<Json>,"starts_on": string
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id": string,"cancel_reason"?: string | null,"cancelled_on"?: string | null,"created_at"?: string,"ends_on": string,"gym_id": string,"id": string,"member_id": string,"original_ends_on": string,"plan_id": string,"plan_version": number,"renewal_of"?: string | null,"revision"?: number,"snapshot": NonNullable<Json>,"starts_on": string
                  }
                  Update: {
                    "actor_id"?: string,"cancel_reason"?: string | null,"cancelled_on"?: string | null,"created_at"?: string,"ends_on"?: string,"gym_id"?: string,"id"?: string,"member_id"?: string,"original_ends_on"?: string,"plan_id"?: string,"plan_version"?: number,"renewal_of"?: string | null,"revision"?: number,"snapshot"?: NonNullable<Json>,"starts_on"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "gym_memberships_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "gym_memberships_gym_id_member_id_fkey"
      columns: ["gym_id","member_id"]
isOneToOne: false
      referencedRelation: "gym_members"
      referencedColumns: ["gym_id","id"]
    },{
      foreignKeyName: "gym_memberships_gym_id_plan_id_plan_version_fkey"
      columns: ["gym_id","plan_id","plan_version"]
isOneToOne: false
      referencedRelation: "gym_plans"
      referencedColumns: ["gym_id","id","version"]
    }
                  ]
                },"gym_payments": {
                  Row: {
                    "actor_id": string,"amount_paise": number,"created_at": string,"gym_id": string,"id": string,"member_id": string,"method": string,"note": string,"received_at": string,"reference": string
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id": string,"amount_paise": number,"created_at"?: string,"gym_id": string,"id": string,"member_id": string,"method": string,"note"?: string,"received_at": string,"reference"?: string
                  }
                  Update: {
                    "actor_id"?: string,"amount_paise"?: number,"created_at"?: string,"gym_id"?: string,"id"?: string,"member_id"?: string,"method"?: string,"note"?: string,"received_at"?: string,"reference"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "gym_payments_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "gym_payments_gym_id_member_id_fkey"
      columns: ["gym_id","member_id"]
isOneToOne: false
      referencedRelation: "gym_members"
      referencedColumns: ["gym_id","id"]
    }
                  ]
                },"gym_plans": {
                  Row: {
                    "archived": boolean,"code": string,"created_at": string,"duration_unit": string,"duration_value": number,"fee_paise": number,"freeze_days": number,"gym_id": string,"id": string,"name": string,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "archived"?: boolean,"code": string,"created_at"?: string,"duration_unit": string,"duration_value": number,"fee_paise": number,"freeze_days"?: number,"gym_id": string,"id": string,"name": string,"version": number
                  }
                  Update: {
                    "archived"?: boolean,"code"?: string,"created_at"?: string,"duration_unit"?: string,"duration_value"?: number,"fee_paise"?: number,"freeze_days"?: number,"gym_id"?: string,"id"?: string,"name"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "gym_plans_gym_id_fkey"
      columns: ["gym_id"]
isOneToOne: false
      referencedRelation: "gyms"
      referencedColumns: ["id"]
    }
                  ]
                },"gym_principal_events": {
                  Row: {
                    "actor_id": string,"amount_paise": number,"created_at": string,"event_type": string,"gym_id": string,"id": string,"member_id": string,"method": string,"occurred_at": string,"payment_id": string,"reason": string,"reference": string,"start_paise": number
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id": string,"amount_paise": number,"created_at"?: string,"event_type": string,"gym_id": string,"id": string,"member_id": string,"method": string,"occurred_at": string,"payment_id": string,"reason": string,"reference": string,"start_paise": number
                  }
                  Update: {
                    "actor_id"?: string,"amount_paise"?: number,"created_at"?: string,"event_type"?: string,"gym_id"?: string,"id"?: string,"member_id"?: string,"method"?: string,"occurred_at"?: string,"payment_id"?: string,"reason"?: string,"reference"?: string,"start_paise"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "gym_principal_events_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "gym_principal_events_gym_id_member_id_payment_id_fkey"
      columns: ["gym_id","member_id","payment_id"]
isOneToOne: false
      referencedRelation: "gym_payments"
      referencedColumns: ["gym_id","member_id","id"]
    }
                  ]
                },"gym_receipt_counters": {
                  Row: {
                    "gym_id": string,"kind": string,"last": number,"year": number
                  }
                  ComputedFields: never
                  Insert: {
                    "gym_id": string,"kind": string,"last": number,"year": number
                  }
                  Update: {
                    "gym_id"?: string,"kind"?: string,"last"?: number,"year"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "gym_receipt_counters_gym_id_fkey"
      columns: ["gym_id"]
isOneToOne: false
      referencedRelation: "gyms"
      referencedColumns: ["id"]
    }
                  ]
                },"gym_receipts": {
                  Row: {
                    "gym_id": string,"id": string,"issued_at": string,"kind": string,"member_id": string,"number": string,"payment_id": string,"snapshot": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "gym_id": string,"id": string,"issued_at"?: string,"kind": string,"member_id": string,"number": string,"payment_id": string,"snapshot": NonNullable<Json>
                  }
                  Update: {
                    "gym_id"?: string,"id"?: string,"issued_at"?: string,"kind"?: string,"member_id"?: string,"number"?: string,"payment_id"?: string,"snapshot"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "gym_receipts_gym_id_member_id_payment_id_fkey"
      columns: ["gym_id","member_id","payment_id"]
isOneToOne: false
      referencedRelation: "gym_payments"
      referencedColumns: ["gym_id","member_id","id"]
    }
                  ]
                },"gym_roles": {
                  Row: {
                    "created_at": string,"gym_id": string,"revoked_at": string | null,"role": string,"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"gym_id": string,"revoked_at"?: string | null,"role": string,"user_id": string
                  }
                  Update: {
                    "created_at"?: string,"gym_id"?: string,"revoked_at"?: string | null,"role"?: string,"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "gym_roles_gym_id_fkey"
      columns: ["gym_id"]
isOneToOne: false
      referencedRelation: "gyms"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "gym_roles_user_id_fkey"
      columns: ["user_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"gym_visits": {
                  Row: {
                    "actor_id": string,"eligible": boolean,"gym_id": string,"id": string,"local_date": string,"member_id": string,"occurred_at": string,"reason": string,"received_at": string,"source": string,"verification": string
                  }
                  ComputedFields: never
                  Insert: {
                    "actor_id": string,"eligible": boolean,"gym_id": string,"id": string,"local_date": string,"member_id": string,"occurred_at": string,"reason": string,"received_at"?: string,"source": string,"verification": string
                  }
                  Update: {
                    "actor_id"?: string,"eligible"?: boolean,"gym_id"?: string,"id"?: string,"local_date"?: string,"member_id"?: string,"occurred_at"?: string,"reason"?: string,"received_at"?: string,"source"?: string,"verification"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "gym_visits_actor_id_fkey"
      columns: ["actor_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "gym_visits_gym_id_member_id_fkey"
      columns: ["gym_id","member_id"]
isOneToOne: false
      referencedRelation: "gym_members"
      referencedColumns: ["gym_id","id"]
    }
                  ]
                },"gyms": {
                  Row: {
                    "address": string,"closed_at": string | null,"code": string,"contact": string,"coverage_mode": string,"created_at": string,"currency": string,"id": string,"member_sequence": number,"name": string,"opening_days": (number)[],"revision": number,"timezone": string
                  }
                  ComputedFields: never
                  Insert: {
                    "address"?: string,"closed_at"?: string | null,"code": string,"contact"?: string,"coverage_mode"?: string,"created_at"?: string,"currency"?: string,"id": string,"member_sequence"?: number,"name": string,"opening_days"?: (number)[],"revision"?: number,"timezone"?: string
                  }
                  Update: {
                    "address"?: string,"closed_at"?: string | null,"code"?: string,"contact"?: string,"coverage_mode"?: string,"created_at"?: string,"currency"?: string,"id"?: string,"member_sequence"?: number,"name"?: string,"opening_days"?: (number)[],"revision"?: number,"timezone"?: string
                  }
                  Relationships: [
                    
                  ]
                },"meal_items": {
                  Row: {
                    "carbs": number | null,"category": string,"confirmed": boolean,"consumed_at": string,"deleted_at": string | null,"estimate": boolean,"fat": number | null,"fibre": number | null,"food_id": string | null,"id": string,"kcal": number | null,"label": string,"local_date": string,"owner_id": string,"protein": number | null,"quantity": number,"revision": number,"source": string,"timezone": string,"unit": string
                  }
                  ComputedFields: never
                  Insert: {
                    "carbs"?: number | null,"category": string,"confirmed"?: boolean,"consumed_at": string,"deleted_at"?: string | null,"estimate"?: boolean,"fat"?: number | null,"fibre"?: number | null,"food_id"?: string | null,"id": string,"kcal"?: number | null,"label": string,"local_date": string,"owner_id": string,"protein"?: number | null,"quantity": number,"revision"?: number,"source": string,"timezone": string,"unit": string
                  }
                  Update: {
                    "carbs"?: number | null,"category"?: string,"confirmed"?: boolean,"consumed_at"?: string,"deleted_at"?: string | null,"estimate"?: boolean,"fat"?: number | null,"fibre"?: number | null,"food_id"?: string | null,"id"?: string,"kcal"?: number | null,"label"?: string,"local_date"?: string,"owner_id"?: string,"protein"?: number | null,"quantity"?: number,"revision"?: number,"source"?: string,"timezone"?: string,"unit"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "meal_items_food_id_fkey"
      columns: ["food_id"]
isOneToOne: false
      referencedRelation: "foods"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "meal_items_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"mutation_outcomes": {
                  Row: {
                    "created_at": string,"entity_id": string,"id": string,"kind": string,"owner_id": string,"request_hash": string,"result": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"entity_id": string,"id": string,"kind": string,"owner_id": string,"request_hash"?: string,"result": NonNullable<Json>
                  }
                  Update: {
                    "created_at"?: string,"entity_id"?: string,"id"?: string,"kind"?: string,"owner_id"?: string,"request_hash"?: string,"result"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "mutation_outcomes_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"nutrition_targets": {
                  Row: {
                    "carbs": number | null,"effective_date": string,"fat": number | null,"fibre": number | null,"id": string,"kcal": number | null,"owner_id": string,"protein": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "carbs"?: number | null,"effective_date": string,"fat"?: number | null,"fibre"?: number | null,"id": string,"kcal"?: number | null,"owner_id": string,"protein"?: number | null
                  }
                  Update: {
                    "carbs"?: number | null,"effective_date"?: string,"fat"?: number | null,"fibre"?: number | null,"id"?: string,"kcal"?: number | null,"owner_id"?: string,"protein"?: number | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "nutrition_targets_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"performed_sets": {
                  Row: {
                    "deleted_at": string | null,"distance_metres": number | null,"duration_seconds": number | null,"id": string,"instance_id": string,"load_kg": number | null,"mutation_id": string,"notes": string,"owner_id": string,"performed_at": string,"reps": number | null,"revision": number,"rir": number | null,"rpe": number | null,"session_id": string,"set_type": string
                  }
                  ComputedFields: never
                  Insert: {
                    "deleted_at"?: string | null,"distance_metres"?: number | null,"duration_seconds"?: number | null,"id": string,"instance_id": string,"load_kg"?: number | null,"mutation_id": string,"notes"?: string,"owner_id": string,"performed_at": string,"reps"?: number | null,"revision"?: number,"rir"?: number | null,"rpe"?: number | null,"session_id": string,"set_type": string
                  }
                  Update: {
                    "deleted_at"?: string | null,"distance_metres"?: number | null,"duration_seconds"?: number | null,"id"?: string,"instance_id"?: string,"load_kg"?: number | null,"mutation_id"?: string,"notes"?: string,"owner_id"?: string,"performed_at"?: string,"reps"?: number | null,"revision"?: number,"rir"?: number | null,"rpe"?: number | null,"session_id"?: string,"set_type"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "performed_sets_owner_id_session_id_fkey"
      columns: ["owner_id","session_id"]
isOneToOne: false
      referencedRelation: "workout_sessions"
      referencedColumns: ["owner_id","id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "accepted_at": string,"created_at": string,"date_of_birth": string,"display_name": string,"id": string,"length_unit": string,"locale": string,"onboarding_complete": boolean,"privacy_version": string,"status": string,"terms_version": string,"timezone": string,"updated_at": string,"weekly_goal": number,"weight_unit": string
                  }
                  ComputedFields: never
                  Insert: {
                    "accepted_at"?: string,"created_at"?: string,"date_of_birth": string,"display_name": string,"id": string,"length_unit"?: string,"locale"?: string,"onboarding_complete"?: boolean,"privacy_version": string,"status"?: string,"terms_version": string,"timezone"?: string,"updated_at"?: string,"weekly_goal"?: number,"weight_unit"?: string
                  }
                  Update: {
                    "accepted_at"?: string,"created_at"?: string,"date_of_birth"?: string,"display_name"?: string,"id"?: string,"length_unit"?: string,"locale"?: string,"onboarding_complete"?: boolean,"privacy_version"?: string,"status"?: string,"terms_version"?: string,"timezone"?: string,"updated_at"?: string,"weekly_goal"?: number,"weight_unit"?: string
                  }
                  Relationships: [
                    
                  ]
                },"programme_schedules": {
                  Row: {
                    "effective_date": string,"owner_id": string,"programme_id": string,"programme_version": number,"revision": number,"timezone": string
                  }
                  ComputedFields: never
                  Insert: {
                    "effective_date": string,"owner_id": string,"programme_id": string,"programme_version": number,"revision"?: number,"timezone": string
                  }
                  Update: {
                    "effective_date"?: string,"owner_id"?: string,"programme_id"?: string,"programme_version"?: number,"revision"?: number,"timezone"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "programme_schedules_owner_id_programme_id_fkey"
      columns: ["owner_id","programme_id"]
isOneToOne: false
      referencedRelation: "programmes"
      referencedColumns: ["owner_id","id"]
    }
                  ]
                },"programmes": {
                  Row: {
                    "archived": boolean,"created_at": string,"current": boolean,"days": NonNullable<Json>,"description": string,"id": string,"name": string,"owner_id": string,"updated_at": string,"version": number
                  }
                  ComputedFields: never
                  Insert: {
                    "archived"?: boolean,"created_at"?: string,"current"?: boolean,"days"?: NonNullable<Json>,"description"?: string,"id": string,"name": string,"owner_id": string,"updated_at"?: string,"version"?: number
                  }
                  Update: {
                    "archived"?: boolean,"created_at"?: string,"current"?: boolean,"days"?: NonNullable<Json>,"description"?: string,"id"?: string,"name"?: string,"owner_id"?: string,"updated_at"?: string,"version"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "programmes_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    }
                  ]
                },"schedule_occurrences": {
                  Row: {
                    "day_id": string,"id": string,"local_date": string,"owner_id": string,"programme_id": string,"revision": number,"session_id": string | null,"status": string,"timezone": string
                  }
                  ComputedFields: never
                  Insert: {
                    "day_id": string,"id": string,"local_date": string,"owner_id": string,"programme_id": string,"revision"?: number,"session_id"?: string | null,"status"?: string,"timezone": string
                  }
                  Update: {
                    "day_id"?: string,"id"?: string,"local_date"?: string,"owner_id"?: string,"programme_id"?: string,"revision"?: number,"session_id"?: string | null,"status"?: string,"timezone"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "schedule_occurrences_owner_id_programme_id_fkey"
      columns: ["owner_id","programme_id"]
isOneToOne: false
      referencedRelation: "programmes"
      referencedColumns: ["owner_id","id"]
    },{
      foreignKeyName: "schedule_occurrences_owner_id_session_id_fkey"
      columns: ["owner_id","session_id"]
isOneToOne: false
      referencedRelation: "workout_sessions"
      referencedColumns: ["owner_id","id"]
    }
                  ]
                },"workout_revisions": {
                  Row: {
                    "created_at": string,"id": string,"operation_id": string,"owner_id": string,"revision": number,"session_id": string,"snapshot": NonNullable<Json>
                  }
                  ComputedFields: never
                  Insert: {
                    "created_at"?: string,"id"?: string,"operation_id": string,"owner_id": string,"revision": number,"session_id": string,"snapshot": NonNullable<Json>
                  }
                  Update: {
                    "created_at"?: string,"id"?: string,"operation_id"?: string,"owner_id"?: string,"revision"?: number,"session_id"?: string,"snapshot"?: NonNullable<Json>
                  }
                  Relationships: [
                    {
      foreignKeyName: "workout_revisions_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "workout_revisions_owner_id_session_id_fkey"
      columns: ["owner_id","session_id"]
isOneToOne: false
      referencedRelation: "workout_sessions"
      referencedColumns: ["owner_id","id"]
    }
                  ]
                },"workout_sessions": {
                  Row: {
                    "day_id": string | null,"deleted_at": string | null,"ended_at": string | null,"id": string,"instances": NonNullable<Json>,"local_date": string,"name": string,"notes": string,"occurrence_id": string | null,"owner_id": string,"pauses": NonNullable<Json>,"programme_id": string | null,"revision": number,"started_at": string,"status": string,"timezone": string
                  }
                  ComputedFields: never
                  Insert: {
                    "day_id"?: string | null,"deleted_at"?: string | null,"ended_at"?: string | null,"id": string,"instances": NonNullable<Json>,"local_date": string,"name": string,"notes"?: string,"occurrence_id"?: string | null,"owner_id": string,"pauses"?: NonNullable<Json>,"programme_id"?: string | null,"revision"?: number,"started_at": string,"status": string,"timezone": string
                  }
                  Update: {
                    "day_id"?: string | null,"deleted_at"?: string | null,"ended_at"?: string | null,"id"?: string,"instances"?: NonNullable<Json>,"local_date"?: string,"name"?: string,"notes"?: string,"occurrence_id"?: string | null,"owner_id"?: string,"pauses"?: NonNullable<Json>,"programme_id"?: string | null,"revision"?: number,"started_at"?: string,"status"?: string,"timezone"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "workout_sessions_owner_id_fkey"
      columns: ["owner_id"]
isOneToOne: false
      referencedRelation: "profiles"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "workout_sessions_owner_id_occurrence_id_fkey"
      columns: ["owner_id","occurrence_id"]
isOneToOne: false
      referencedRelation: "schedule_occurrences"
      referencedColumns: ["owner_id","id"]
    },{
      foreignKeyName: "workout_sessions_owner_id_programme_id_fkey"
      columns: ["owner_id","programme_id"]
isOneToOne: false
      referencedRelation: "programmes"
      referencedColumns: ["owner_id","id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "apply_operation_v1":
{ Args: { "p_operation": Json }; Returns: Json
                           },
"complete_onboarding":
{ Args: { "p_dob": string,"p_locale": string,"p_name": string,"p_privacy": string,"p_terms": string,"p_timezone": string }; Returns: {
              "accepted_at": string,
"created_at": string,
"date_of_birth": string,
"display_name": string,
"id": string,
"length_unit": string,
"locale": string,
"onboarding_complete": boolean,
"privacy_version": string,
"status": string,
"terms_version": string,
"timezone": string,
"updated_at": string,
"weekly_goal": number,
"weight_unit": string
            }
                          SetofOptions: {
        from: "*"
        to: "profiles"
        isOneToOne: true
        isSetofReturn: false
      } },
"freeze_command_v1":
{ Args: { "p_command": Json }; Returns: Json
                           },
"freeze_preview_v1":
{ Args: { "p_command": Json }; Returns: Json
                           },
"gym_account_v1":
{ Args: { "p_gym": string,"p_member": string }; Returns: Json
                           },
"gym_command_v1":
{ Args: { "p_command": Json }; Returns: Json
                           },
"gym_dashboard_v1":
{ Args: { "p_gym": string }; Returns: Json
                           },
"refresh_schedules_v1":
{ Args: Record<PropertyKey, never>; Returns: undefined
                           },
"schedule_programme_v1":
{ Args: { "p_effective": string,"p_id": string,"p_timezone": string,"p_version": number }; Returns: undefined
                           }
          }
          Enums: {
            [_ in never]: never
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
    ? R
    : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Insert: infer I
    }
    ? I
    : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
      Update: infer U
    }
    ? U
    : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            
          }
        }
} as const
