-- Migration: add_previous_subscription_tracking
-- Description: Ajoute des champs pour sauvegarder l'abonnement B2C précédent quand un utilisateur rejoint une organisation B2B

-- Ajouter les colonnes pour sauvegarder l'état de l'abonnement précédent
ALTER TABLE organization_members
ADD COLUMN previous_subscription_plan text,
ADD COLUMN previous_stripe_subscription_id text,
ADD COLUMN subscription_paused_at timestamp with time zone,
ADD COLUMN subscription_restored_at timestamp with time zone;

-- Commentaires pour documenter les colonnes
COMMENT ON COLUMN organization_members.previous_subscription_plan IS 'Plan d''abonnement B2C (basic/premium/pro) avant de rejoindre l''organisation';
COMMENT ON COLUMN organization_members.previous_stripe_subscription_id IS 'ID de l''abonnement Stripe à restaurer si l''utilisateur quitte l''organisation';
COMMENT ON COLUMN organization_members.subscription_paused_at IS 'Date à laquelle l''abonnement B2C a été mis en pause lors de l''adhésion';
COMMENT ON COLUMN organization_members.subscription_restored_at IS 'Date à laquelle l''abonnement B2C a été restauré après avoir quitté l''organisation';
