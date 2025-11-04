import { supabase } from '@/integrations/supabase/client';
import {
  incrementOrganizationUsage as incrementOrgUsage,
  canCreateResourceInOrg,
} from './organizationSubscriptionService';

export type ResourceType = 'course' | 'exercise' | 'fiche' | 'ai_minutes';

/**
 * Check if user is a member of an organization
 */
async function getUserOrganization(userId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from('organization_members')
    .select('organization_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .single();

  if (error || !data) {
    return null;
  }

  return data.organization_id;
}

/**
 * Increment usage counter for a resource type
 * This should be called AFTER successfully creating a resource
 * Automatically detects if user is in an organization and uses appropriate tracking
 */
export async function incrementUsage(
  userId: string,
  resourceType: ResourceType,
  amount: number = 1
): Promise<void> {
  try {
    // Check if user is in an organization
    const organizationId = await getUserOrganization(userId);

    if (organizationId) {
      // Use organization usage tracking
      await incrementOrgUsage(organizationId, userId, resourceType, amount);
      console.log(`✅ Organization usage incremented: ${resourceType} +${amount}`);
    } else {
      // Use individual user tracking
      const { error } = await supabase.rpc('increment_usage', {
        p_user_id: userId,
        p_resource_type: resourceType,
        p_amount: amount,
      });

      if (error) {
        console.error(`Error incrementing ${resourceType} usage:`, error);
        throw error;
      }

      console.log(`✅ Usage incremented: ${resourceType} +${amount}`);
    }
  } catch (error) {
    console.error('Error in incrementUsage:', error);
    throw error;
  }
}

/**
 * Check if user can create a resource
 * Returns detailed information about current usage and limits
 * Automatically detects if user is in an organization and uses appropriate limits
 */
export async function checkResourceLimit(
  userId: string,
  resourceType: ResourceType
): Promise<{
  allowed: boolean;
  current: number;
  limit: number | null;
  remaining: number | null;
}> {
  try {
    // Check if user is in an organization
    const organizationId = await getUserOrganization(userId);

    if (organizationId) {
      // Use organization limits (per-student)
      const result = await canCreateResourceInOrg(organizationId, userId, resourceType);

      return {
        allowed: result.allowed,
        current: result.current_usage,
        limit: result.limit_value,
        remaining: result.remaining,
      };
    } else {
      // Use individual user limits
      const { data, error } = await supabase.rpc('can_create_resource', {
        p_user_id: userId,
        p_resource_type: resourceType,
      });

      if (error) {
        console.error(`Error checking ${resourceType} limit:`, error);
        throw error;
      }

      const result = data[0];

      return {
        allowed: result.allowed,
        current: result.current_usage,
        limit: result.limit_value,
        remaining: result.remaining,
      };
    }
  } catch (error) {
    console.error('Error in checkResourceLimit:', error);
    throw error;
  }
}
