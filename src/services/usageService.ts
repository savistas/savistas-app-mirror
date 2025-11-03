import { supabase } from '@/integrations/supabase/client';

export type ResourceType = 'course' | 'exercise' | 'fiche' | 'ai_minutes';

/**
 * Increment usage counter for a resource type
 * This should be called AFTER successfully creating a resource
 */
export async function incrementUsage(
  userId: string,
  resourceType: ResourceType,
  amount: number = 1
): Promise<void> {
  try {
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
  } catch (error) {
    console.error('Error in incrementUsage:', error);
    throw error;
  }
}

/**
 * Check if user can create a resource
 * Returns detailed information about current usage and limits
 */
export async function checkResourceLimit(
  userId: string,
  resourceType: ResourceType
): Promise<{
  allowed: boolean;
  current: number;
  limit: number;
  remaining: number;
}> {
  try {
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
  } catch (error) {
    console.error('Error in checkResourceLimit:', error);
    throw error;
  }
}
