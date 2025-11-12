-- Migration: allow_members_to_leave_organization
-- Description: Permet aux membres de quitter une organisation en mettant à jour leur propre statut à 'removed'
-- CRITICAL: Sans cette politique, les utilisateurs ne peuvent pas quitter une organisation
-- car ils n'ont pas la permission RLS de mettre à jour leur propre enregistrement

-- Policy: Les membres peuvent mettre à jour leur propre statut à 'removed' pour quitter l'organisation
-- Ils peuvent également mettre à jour les champs liés à la restauration de leur abonnement
CREATE POLICY "Members can leave organization"
  ON organization_members FOR UPDATE
  USING (
    auth.uid() = user_id
    AND status = 'active'  -- Peut seulement quitter si actuellement actif
  )
  WITH CHECK (
    auth.uid() = user_id
    AND status = 'removed'  -- Ne peut changer le statut qu'à 'removed'
  );

-- Commentaire explicatif
COMMENT ON POLICY "Members can leave organization" ON organization_members IS
  'Permet aux membres actifs de quitter une organisation en changeant leur statut à removed. '
  'Cette politique est essentielle pour la fonctionnalité de départ volontaire.';
