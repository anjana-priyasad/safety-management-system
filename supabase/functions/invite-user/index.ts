import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        // 1. Init Client with Auth Header (to identify inviter)
        const supabaseClient = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
        )

        // 2. Get Inviter Info
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
        if (userError || !user) throw new Error('Not authenticated')

        // 3. Init Admin Client (to bypass RLS and invite user)
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        // 4. Fetch Inviter's Profile to check Role & Company
        const { data: inviterProfile, error: profileError } = await supabaseAdmin
            .from('profiles')
            .select('role, company_id')
            .eq('id', user.id)
            .single()

        if (profileError || !inviterProfile) throw new Error('Profile not found')

        if (inviterProfile.role !== 'admin') {
            throw new Error('Unauthorized: Only admins can invite users.')
        }

        if (!inviterProfile.company_id) {
            // Fallback: If current admin has no company_id, maybe generate one or require one?
            // For now, we error out to ensure data integrity, OR we could create one.
            // Let's assume the first admin sets it up manually or we generate it here for the first time?
            // Safer: Throw error.
            console.warn("Inviting admin has no company_id")
            // throw new Error('Your account is not associated with a company.')
        }

        // 5. Parse Request
        const { email, role } = await req.json()
        if (!email) throw new Error('Email is required')

        // 6. Invite User via Admin API
        // IMPORTANT: Pass company_id in metadata so the trigger picks it up!
        const { data, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email, {
            data: {
                role: role || 'employee',
                company_id: inviterProfile.company_id
            }
        })

        if (error) throw error

        return new Response(
            JSON.stringify({ message: 'User invited successfully', data }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
